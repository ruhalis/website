/* baikurazov.com
   Each film shows a burgundy engraved poster until it plays, in colour.
   One plays at a time. Without this script each film is a plain
   <video controls> over its poster. */
(function () {
  'use strict';

  var RING = '<svg class="ring" viewBox="0 0 64 64" aria-hidden="true" focusable="false">' +
    '<circle cx="32" cy="32" r="31.5" fill="none" stroke="currentColor" stroke-width="1" vector-effect="non-scaling-stroke"/>' +
    '<path class="ring__play" d="M27 23l12 9-12 9z" fill="currentColor"/>' +
    '<path class="ring__pause" d="M26 23h3.5v18H26zM34.5 23H38v18h-3.5z" fill="currentColor"/></svg>';
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function clock(seconds) {
    var s = Math.max(0, Math.floor(seconds));
    return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  }

  function makeButton(label) {
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'film__play';
    button.innerHTML = RING + '<span class="film__label" data-label></span>';
    button.querySelector('[data-label]').textContent = label;
    return button;
  }

  var feeds = [];

  function Feed(film) {
    var self = this;
    this.film = film;
    this.video = film.querySelector('video');
    this.time = film.querySelector('[data-time]');
    this.total = this.time.textContent;
    this.name = film.querySelector('.film__title').textContent;
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
      if (!self.resetting && !self.video.ended && self.film.dataset.state === 'live') self.set('paused');
    });
    this.video.addEventListener('timeupdate', function () {
      var state = self.film.dataset.state;
      if (state === 'live' || state === 'paused') {
        self.time.textContent = clock(self.video.currentTime) + ' / ' + self.total;
      }
    });
    this.video.addEventListener('ended', function () { self.reset(); });
    this.video.addEventListener('error', function () { self.fail(); }, true);
  }

  Feed.prototype.set = function (state) { this.film.dataset.state = state; };

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

  /* back to the engraved poster: unload the clip */
  Feed.prototype.reset = function () {
    if (this.film.dataset.state === 'idle') return;
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
    this.video.pause();
    this.idle();
    this.time.textContent = 'Could not load';
  };

  /* The 5 second silent clip plays by itself while it is on screen. */
  function Loop(film) {
    var self = this;
    this.film = film;
    this.video = film.querySelector('video');
    this.name = film.querySelector('.film__title').textContent;
    this.wanted = true;
    this.visible = false;
    this.video.controls = false;
    this.video.muted = true;
    this.video.tabIndex = -1;
    this.button = makeButton('Pause');
    this.button.classList.add('film__play--corner');
    this.video.after(this.button);
    film.dataset.state = 'idle';

    this.button.addEventListener('click', function () {
      self.wanted = !self.wanted;
      self.sync();
    });
    this.video.addEventListener('playing', function () { film.dataset.state = 'live'; });
    new IntersectionObserver(function (entries) {
      self.visible = entries[entries.length - 1].isIntersecting;
      self.sync();
    }, { threshold: 0.4 }).observe(film);
    this.sync();
  }

  Loop.prototype.sync = function () {
    this.button.querySelector('[data-label]').textContent = this.wanted ? 'Pause' : 'Play';
    this.button.classList.toggle('is-playing', this.wanted);
    this.button.setAttribute('aria-label', (this.wanted ? 'Pause the ' : 'Play the ') + this.name + ' loop');
    if (this.wanted && this.visible) {
      var started = this.video.play();
      if (started && started.catch) started.catch(function () {});
    } else {
      this.video.pause();
      if (!this.wanted) this.film.dataset.state = 'paused';
    }
  };

  document.querySelectorAll('[data-feed]').forEach(function (film) {
    if (film.hasAttribute('data-loop') && !reducedMotion && 'IntersectionObserver' in window) {
      new Loop(film);
    } else {
      feeds.push(new Feed(film));
    }
  });
})();
