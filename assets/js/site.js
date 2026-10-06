/* baikurazov.com — campaign map
   1. Footage frames: an ink-printed poster while idle, the real clip while
      playing, and only one clip plays at a time. Without this script each
      frame is still a plain <video controls> over its poster.
   2. The line of march: a dotted path from engagement to engagement,
      drawn down the marker gutter and across the open paper between them. */
(function () {
  'use strict';

  var PLAY_ICON = '<svg viewBox="0 0 10 12" aria-hidden="true" focusable="false"><path d="M0 0l10 6-10 6z"/></svg>';
  var PAUSE_ICON = '<svg viewBox="0 0 10 12" aria-hidden="true" focusable="false"><path d="M0 0h3.5v12H0zM6.5 0H10v12H6.5z"/></svg>';
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function clock(seconds) {
    var s = Math.max(0, Math.floor(seconds));
    return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  }

  function makeButton() {
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'frame__play';
    button.innerHTML = '<span class="frame__chip"></span>';
    return button;
  }

  function setChip(button, playing) {
    button.querySelector('.frame__chip').innerHTML =
      (playing ? PAUSE_ICON : PLAY_ICON) + '<span>' + (playing ? 'Pause' : 'Play') + '</span>';
  }

  var feeds = [];

  function Feed(win) {
    var self = this;
    this.win = win;
    this.video = win.querySelector('video');
    this.time = win.querySelector('[data-time]');
    this.total = this.time.textContent;
    this.name = win.dataset.name;
    this.button = makeButton();
    setChip(this.button, false);
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

  /* back to the poster: unload the clip so the printed frame shows again */
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
    this.name = win.dataset.name;
    this.wanted = true;
    this.visible = false;
    this.video.controls = false;
    this.video.muted = true;
    this.video.tabIndex = -1;
    this.button = makeButton();
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
    this.sync();
  }

  Loop.prototype.sync = function () {
    setChip(this.button, this.wanted);
    this.button.setAttribute('aria-label', (this.wanted ? 'Pause the ' : 'Play the ') + this.name + ' loop');
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

  /* ---------- the line of march ---------- */
  var map = document.querySelector('[data-map]');
  if (!map) return;
  var path = map.querySelector('.map__march path');
  var ops = Array.prototype.slice.call(map.querySelectorAll('.op'));
  var queued = false;

  function draw() {
    queued = false;
    var box = map.getBoundingClientRect();
    var points = ops.map(function (op) {
      var mark = op.querySelector('.op__mark').getBoundingClientRect();
      var r = op.getBoundingClientRect();
      return {
        x: mark.left + mark.width / 2 - box.left,
        top: mark.top - box.top,
        bottom: mark.bottom - box.top,
        end: r.bottom - box.top
      };
    });
    var d = '';
    for (var i = 0; i < points.length - 1; i++) {
      var a = points[i];
      var b = points[i + 1];
      var y0 = a.bottom + 6;
      var y1 = a.end + 8;                 /* down the gutter, past the engagement */
      var y2 = b.top - 6;
      var g = Math.max(0, y2 - y1);
      d += 'M' + a.x.toFixed(1) + ' ' + y0.toFixed(1) +
           'V' + y1.toFixed(1) +
           'C' + a.x.toFixed(1) + ' ' + (y1 + g * .6).toFixed(1) + ' ' +
                 b.x.toFixed(1) + ' ' + (y2 - g * .6).toFixed(1) + ' ' +
                 b.x.toFixed(1) + ' ' + y2.toFixed(1);
    }
    path.setAttribute('d', d);
  }

  function queue() {
    if (!queued) {
      queued = true;
      requestAnimationFrame(draw);
    }
  }

  draw();
  if ('ResizeObserver' in window) new ResizeObserver(queue).observe(map);
  else window.addEventListener('resize', queue);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(queue);
  window.addEventListener('load', queue);
})();
