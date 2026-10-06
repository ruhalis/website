/* baikurazov.com
   Plates: a burgundy duotone poster while idle, the real footage while playing.
   Only one clip plays at a time. Without this script each plate is still a
   plain <video controls> over its poster. */
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
    button.className = 'plate__play';
    button.innerHTML = '<span class="plate__chip">' + PLAY_ICON + '<span data-label></span></span>';
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
    this.name = win.querySelector('.plate__title').textContent;
    this.button = makeButton('Play');
    this.button.setAttribute('aria-label', 'Play ' + this.name + ', ' + this.total);
    this.video.parentNode.appendChild(this.button);
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

  /* back to the poster: unload the clip so the duotone frame shows again */
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
    this.button.setAttribute('aria-label', 'Pause the ' + win.querySelector('.plate__title').textContent + ' loop');
    this.video.parentNode.appendChild(this.button);
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
    var name = this.win.querySelector('.plate__title').textContent;
    var chip = this.button.querySelector('.plate__chip');
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
})();
