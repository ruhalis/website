/* baikurazov.com
   Feed windows: a blue halftone poster while idle, the real footage while playing.
   Every halftone also has a true-colour partner that shows under the pointer.
   Without this script each window is still a plain <video controls> over its poster. */
(function () {
  'use strict';

  var PLAY_ICON = '<svg viewBox="0 0 10 12" aria-hidden="true" focusable="false"><path d="M0 0l10 6-10 6z"/></svg>';
  var PAUSE_ICON = '<svg viewBox="0 0 10 12" aria-hidden="true" focusable="false"><path d="M0 0h3.5v12H0zM6.5 0H10v12H6.5z"/></svg>';
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function clock(seconds) {
    var s = Math.max(0, Math.floor(seconds));
    return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  }

  function makeButton(label) {
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'win__play';
    button.innerHTML = '<span class="win__chip">' + PLAY_ICON + '<span data-label></span></span>';
    button.querySelector('[data-label]').textContent = label;
    return button;
  }

  var feeds = [];

  function Feed(win) {
    var self = this;
    this.win = win;
    this.video = win.querySelector('video');
    this.time = win.querySelector('[data-time]');
    this.total = this.time.textContent;
    this.name = win.querySelector('.win__name').textContent;
    this.button = makeButton('Play');
    this.button.setAttribute('aria-label', 'Play ' + this.name + ', ' + this.total);
    this.video.after(this.button);
    this.resetting = false;
    this.idle();

    this.button.addEventListener('click', function () { self.start(); });
    this.video.addEventListener('play', function () {
      feeds.forEach(function (other) { if (other !== self) other.reset(); });
    });
    this.video.addEventListener('playing', function () { self.set('live'); });
    this.video.addEventListener('pause', function () {
      if (!self.resetting && !self.video.ended && self.win.dataset.state === 'live') self.set('paused');
    });
    this.video.addEventListener('timeupdate', function () {
      var state = self.win.dataset.state;
      if (state === 'live' || state === 'paused') {
        self.time.textContent = clock(self.video.currentTime) + ' / ' + self.total;
      }
    });
    this.video.addEventListener('ended', function () { self.reset(); });
    this.video.addEventListener('error', function () { self.fail(); }, true);
  }

  Feed.prototype.set = function (state) { this.win.dataset.state = state; };

  Feed.prototype.idle = function () {
    this.set('idle');
    this.video.controls = false;
    this.video.tabIndex = -1;
    this.button.hidden = false;
    this.time.textContent = this.total;
  };

  Feed.prototype.start = function () {
    var self = this;
    this.set('loading');
    this.time.textContent = 'Loading';
    this.button.hidden = true;
    this.video.controls = true;
    this.video.tabIndex = 0;
    this.video.focus({ preventScroll: true });
    var started = this.video.play();
    if (started && started.catch) {
      started.catch(function (error) {
        if (error && error.name === 'AbortError') return;
        self.fail();
      });
    }
  };

  /* back to the poster: unload the clip so the blue frame shows again */
  Feed.prototype.reset = function () {
    if (this.win.dataset.state === 'idle') return;
    var hadFocus = document.activeElement === this.video;
    this.resetting = true;
    this.video.pause();
    this.video.load();
    this.resetting = false;
    this.idle();
    if (hadFocus) this.button.focus({ preventScroll: true });
  };

  Feed.prototype.fail = function () {
    if (this.resetting) return;
    this.idle();
    this.time.textContent = 'Could not load';
  };

  /* The 5 second silent clip plays by itself while it is on screen. */
  function Loop(win) {
    var self = this;
    this.win = win;
    this.video = win.querySelector('video');
    this.wanted = true;
    this.visible = false;
    this.video.controls = false;
    this.video.muted = true;
    this.video.tabIndex = -1;
    this.button = makeButton('Pause');
    this.button.setAttribute('aria-label', 'Pause the ' + win.querySelector('.win__name').textContent + ' loop');
    this.video.after(this.button);
    win.dataset.state = 'idle';

    this.button.addEventListener('click', function () {
      self.wanted = !self.wanted;
      self.sync();
    });
    this.video.addEventListener('playing', function () { win.dataset.state = 'live'; });

    new IntersectionObserver(function (entries) {
      self.visible = entries[entries.length - 1].isIntersecting;
      self.sync();
    }, { threshold: 0.4 }).observe(win);
  }

  Loop.prototype.sync = function () {
    var name = this.win.querySelector('.win__name').textContent;
    var chip = this.button.querySelector('.win__chip');
    chip.innerHTML = (this.wanted ? PAUSE_ICON : PLAY_ICON) + '<span>' + (this.wanted ? 'Pause' : 'Play') + '</span>';
    this.button.setAttribute('aria-label', (this.wanted ? 'Pause the ' : 'Play the ') + name + ' loop');
    if (this.wanted && this.visible) {
      var started = this.video.play();
      if (started && started.catch) started.catch(function () {});
    } else {
      this.video.pause();
      if (!this.wanted) this.win.dataset.state = 'paused';
    }
  };

  document.querySelectorAll('[data-feed]').forEach(function (win) {
    if (win.hasAttribute('data-loop') && !reducedMotion && 'IntersectionObserver' in window) {
      new Loop(win);
    } else {
      feeds.push(new Feed(win));
    }
  });

  /* ---------- the live picture ----------
     Each holder names its true-colour partner (data-colour on a window's
     picture, data-live on the hero plate). The partner is stacked over the
     halftone, same box and same crop, and the stylesheet reveals it while
     the pointer is on it. This script decides when, from which point the
     reveal spreads, and moves the one number (--p, 0 to 1) the mask in the
     stylesheet is drawn from. It is moved here and not by a CSS transition
     because Safari does not redraw a mask while a custom property animates.

     Nothing here delays first paint: the partners are created after the
     page has loaded, lazily, and only where a pointer can hover. Phones
     never download them. */
  var canHover = window.matchMedia('(hover: hover)').matches;
  if (window.CSS && CSS.supports && CSS.supports('mask-composite', 'intersect')) {
    document.documentElement.classList.add('dots');
  }

  function whenLoaded(run) {
    if (document.readyState === 'complete') run();
    else window.addEventListener('load', run);
  }

  /* -- the reveal itself -- */
  var IN = 680;    /* ms for a whole reveal */
  var OUT = 420;   /* ms to go back to the halftone */

  function paint(holder, p) {
    var img = holder.querySelector('.live');
    if (!img) return;
    img.style.setProperty('--p', p.toFixed(4));
    img.classList.toggle('is-on', p > 0);
  }

  function stateOf(holder) {
    return holder.liveState || (holder.liveState = { p: 0, to: 0, frame: 0 });
  }

  /* move the holder's picture towards shown (1) or hidden (0) */
  function run(holder, to) {
    var state = stateOf(holder);
    var img = holder.querySelector('.live');
    state.to = to;
    /* not loaded yet: markReady starts the reveal when it is, so nothing pops */
    if (to === 1 && !(img && img.classList.contains('is-ready'))) return;
    cancelAnimationFrame(state.frame);
    if (reducedMotion) {
      state.p = to;
      paint(holder, to);
      return;
    }
    var from = state.p;
    var began = performance.now();
    var length = Math.max(120, (to ? holder.liveIn || IN : OUT) * Math.abs(to - from));
    (function step(now) {
      var t = Math.min(1, Math.max(0, (now - began) / length));
      var eased = to ? 1 - Math.pow(1 - t, 1.6) : Math.pow(t, 1.3);
      state.p = from + (to - from) * eased;
      paint(holder, state.p);
      if (t < 1) state.frame = requestAnimationFrame(step);
    })(began);
  }

  /* show a partner only once it can be drawn without a hitch */
  function markReady(img, holder) {
    function ready() {
      if (img.classList.contains('is-ready')) return;
      img.classList.add('is-ready');
      if (stateOf(holder).to === 1) run(holder, 1);
    }
    function decoded() {
      if (img.decode) img.decode().then(ready, ready);
      else ready();
    }
    if (img.complete && img.naturalWidth) decoded();
    img.addEventListener('load', decoded);
  }

  /* where the reveal starts (or, on the way out, ends): a point in the
     holder, and the distance from it to the farthest part of the picture
     (the farthest corner, unless the holder knows its picture is smaller) */
  function setOrigin(holder, clientX, clientY) {
    var r = holder.getBoundingClientRect();
    var x = Math.min(Math.max(clientX - r.left, 0), r.width);
    var y = Math.min(Math.max(clientY - r.top, 0), r.height);
    var d = holder.reach ? holder.reach(x, y, r) : Math.hypot(Math.max(x, r.width - x), Math.max(y, r.height - y));
    holder.style.setProperty('--x', x.toFixed(1) + 'px');
    holder.style.setProperty('--y', y.toFixed(1) + 'px');
    holder.style.setProperty('--d', Math.ceil(d) + 'px');
  }

  function show(holder, target, clientX, clientY) {
    if (target.classList.contains('is-live')) return;
    /* a reveal already under way keeps its origin, so it cannot jump */
    if (stateOf(holder).p < 0.02) setOrigin(holder, clientX, clientY);
    target.classList.add('is-live');
    run(holder, 1);
  }

  function hide(holder, target, clientX, clientY) {
    if (!target.classList.contains('is-live')) return;
    /* fully revealed: let it close towards where the pointer left */
    if (clientX !== undefined && stateOf(holder).p > 0.98) setOrigin(holder, clientX, clientY);
    target.classList.remove('is-live');
    run(holder, 0);
  }

  /* -- windows: clips, portrait, detail crops -- */
  function addColour(holder, eager) {
    var img = holder.querySelector('.live');
    if (!img) {
      var blue = holder.querySelector('img');
      img = document.createElement('img');
      img.className = 'live';
      img.alt = '';
      img.setAttribute('aria-hidden', 'true');
      img.decoding = 'async';
      img.loading = eager ? 'eager' : 'lazy';
      img.width = blue.width;
      img.height = blue.height;
      markReady(img, holder);
      img.src = holder.dataset.colour;
      blue.after(img);
    } else if (eager && img.loading === 'lazy') {
      img.loading = 'eager';
    }
  }

  /* Focus counts as "looking at" a window only when it arrived by keyboard:
     a clip that ends hands focus back to its play button, and after a mouse
     click that must not leave the window in colour. */
  var byKeyboard = false;
  document.addEventListener('keydown', function () { byKeyboard = true; }, true);
  document.addEventListener('pointerdown', function () { byKeyboard = false; }, true);

  var holders = document.querySelectorAll('[data-colour]');
  if (canHover) whenLoaded(function () { holders.forEach(function (h) { addColour(h, false); }); });

  holders.forEach(function (holder) {
    var win = holder.closest('.win');
    var hovered = false;
    var focused = false;
    win.addEventListener('pointerenter', function (event) {
      if (event.pointerType === 'touch') return;
      hovered = true;
      addColour(holder, true);
      show(holder, win, event.clientX, event.clientY);
    });
    win.addEventListener('pointerleave', function (event) {
      if (!hovered) return;
      hovered = false;
      if (!focused) hide(holder, win, event.clientX, event.clientY);
    });
    win.addEventListener('focusin', function (event) {
      if (!byKeyboard || !event.target.classList.contains('win__play')) return;
      focused = true;
      addColour(holder, true);
      var chip = (event.target.querySelector('.win__chip') || event.target).getBoundingClientRect();
      show(holder, win, chip.left + chip.width / 2, chip.top + chip.height / 2);
    });
    win.addEventListener('focusout', function () {
      if (!focused) return;
      focused = false;
      if (!hovered) hide(holder, win);
    });

    /* A clip that starts takes over its window at once. When it ends or is
       replaced by another, the window resolves again if the pointer is still on it. */
    if (win.hasAttribute('data-feed') && window.MutationObserver) {
      new MutationObserver(function () {
        var state = win.dataset.state;
        if (state === 'live') {
          cancelAnimationFrame(stateOf(holder).frame);
          stateOf(holder).p = 0;
          paint(holder, 0);
        } else if (state === 'idle' && (hovered || focused)) {
          cancelAnimationFrame(stateOf(holder).frame);
          stateOf(holder).p = 0;
          run(holder, 1);
        }
      }).observe(win, { attributes: true, attributeFilter: ['data-state'] });
    }
  });

  /* moving into a section starts fetching its pictures before the pointer reaches them */
  document.querySelectorAll('main > section').forEach(function (section) {
    section.addEventListener('pointerenter', function (event) {
      if (event.pointerType === 'touch') return;
      section.querySelectorAll('[data-colour]').forEach(function (h) { addColour(h, true); });
    }, { once: true });
  });

  /* -- the hero plate --
     The plate is a wide rectangle that is mostly flat blue, so "on the
     picture" is decided from the colour plate's own transparency: a small
     copy of its alpha channel says whether the pointer is over the horse
     and rider. */
  var art = document.querySelector('[data-live]');
  if (art) {
    var plate = art.querySelector('picture');
    art.liveIn = 800;
    var liveImg = null;
    var map = null;
    var last = null;
    var queued = false;

    function addPlate() {
      if (liveImg) return;
      var copy = plate.cloneNode(true);
      copy.querySelectorAll('source, img').forEach(function (node) {
        ['src', 'srcset'].forEach(function (name) {
          var value = node.getAttribute(name);
          if (value) node.setAttribute(name, value.replace(/-(wide|tall)-/g, '-$1-colour-'));
        });
      });
      liveImg = copy.querySelector('img');
      liveImg.className = 'live';
      liveImg.alt = '';
      liveImg.setAttribute('aria-hidden', 'true');
      liveImg.removeAttribute('fetchpriority');
      liveImg.addEventListener('load', readMap);
      markReady(liveImg, art);
      art.appendChild(copy);
      if (liveImg.complete && liveImg.naturalWidth) readMap();
    }

    function readMap() {
      var w = 96;
      var h = Math.max(1, Math.round(w * liveImg.naturalHeight / liveImg.naturalWidth));
      try {
        var canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        var context = canvas.getContext('2d', { willReadFrequently: true });
        context.drawImage(liveImg, 0, 0, w, h);
        map = { w: w, h: h, a: context.getImageData(0, 0, w, h).data };
      } catch (error) {
        map = null;
      }
      if (last) check();
    }

    /* how solid the figure is under a point of the viewport, 0 to 255 */
    function figureAt(clientX, clientY) {
      var r = art.getBoundingClientRect();
      var u = (clientX - r.left) / r.width;
      var v = (clientY - r.top) / r.height;
      if (!map || u < 0 || v < 0 || u >= 1 || v >= 1) return 0;
      return map.a[(Math.floor(v * map.h) * map.w + Math.floor(u * map.w)) * 4 + 3];
    }

    /* the reveal only has to travel as far as the figure reaches */
    art.reach = function (x, y, r) {
      var far = Math.hypot(Math.max(x, r.width - x), Math.max(y, r.height - y));
      if (!map) return far;
      var cw = r.width / map.w;
      var ch = r.height / map.h;
      var most = 0;
      for (var j = 0; j < map.h; j++) {
        for (var i = 0; i < map.w; i++) {
          if (map.a[(j * map.w + i) * 4 + 3] > 8) {
            most = Math.max(most, Math.hypot((i + 0.5) * cw - x, (j + 0.5) * ch - y));
          }
        }
      }
      return Math.min(far, most + Math.max(cw, ch));
    };

    function check() {
      queued = false;
      if (!last) return;
      var on = art.classList.contains('is-live');
      var alpha = last.blocked ? 0 : figureAt(last.x, last.y);
      /* come on well inside the figure, go off only once clearly outside it */
      if (!on && alpha > 110) show(art, art, last.x, last.y);
      else if (on && alpha < 24) hide(art, art, last.x, last.y);
    }

    function queue() {
      if (!queued) {
        queued = true;
        requestAnimationFrame(check);
      }
    }

    document.addEventListener('pointermove', function (event) {
      if (event.pointerType === 'touch') return;
      addPlate();
      /* the headline, the buttons and the navigation are not the picture */
      var over = event.target.closest ? event.target.closest('.hero__text > *, .top a, .skip') : null;
      last = { x: event.clientX, y: event.clientY, blocked: !!over };
      queue();
    }, { passive: true });
    document.documentElement.addEventListener('pointerleave', function () {
      if (last) { last.blocked = true; queue(); }
    });
    window.addEventListener('scroll', function () { if (last) queue(); }, { passive: true });

    if (canHover) {
      whenLoaded(function () {
        if (window.requestIdleCallback) requestIdleCallback(addPlate, { timeout: 2000 });
        else setTimeout(addPlate, 600);
      });
    }
  }
})();
