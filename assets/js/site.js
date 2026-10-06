/* baikurazov.com — "Blue burin"
   Each plate shows its dark grey poster until play is
   pressed; then the real footage. One clip plays at a time.
   Without this script each plate is a plain <video controls> with its poster. */
(function () {
  'use strict';

  var PLAY = '<svg viewBox="0 0 10 12" aria-hidden="true" focusable="false"><path d="M0 0l10 6-10 6z"/></svg>';
  var PAUSE = '<svg viewBox="0 0 10 12" aria-hidden="true" focusable="false"><path d="M0 0h3.5v12H0zM6.5 0H10v12H6.5z"/></svg>';
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function clock(seconds) {
    var s = Math.max(0, Math.floor(seconds));
    return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  }

  function makeButton(screen, icon, text) {
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'plate__play';
    button.innerHTML = '<span class="plate__label"></span>';
    setLabel(button, icon, text);
    screen.appendChild(button);
    return button;
  }

  function setLabel(button, icon, text) {
    var label = button.querySelector('.plate__label');
    label.innerHTML = icon + '<span></span>';
    label.lastChild.textContent = text;
  }

  function nameOf(plate) {
    return plate.closest('.story').querySelector('.story__head').textContent;
  }

  var feeds = [];

  function Feed(plate) {
    var self = this;
    this.plate = plate;
    this.video = plate.querySelector('video');
    this.time = plate.querySelector('[data-time]');
    this.total = this.time.textContent;
    this.button = makeButton(plate.querySelector('.plate__screen'), PLAY, 'Play');
    this.button.setAttribute('aria-label', 'Play ' + nameOf(plate) + ', ' + this.total);
    this.resetting = false;
    this.idle();

    this.button.addEventListener('click', function () { self.start(); });
    this.video.addEventListener('play', function () {
      feeds.forEach(function (other) { if (other !== self) other.reset(); });
    });
    this.video.addEventListener('playing', function () { self.set('live'); });
    this.video.addEventListener('pause', function () {
      if (!self.resetting && !self.video.ended && self.plate.dataset.state === 'live') self.set('paused');
    });
    this.video.addEventListener('timeupdate', function () {
      var state = self.plate.dataset.state;
      if (state === 'live' || state === 'paused') {
        self.time.textContent = clock(self.video.currentTime) + ' / ' + self.total;
      }
    });
    this.video.addEventListener('ended', function () { self.reset(); });
    this.video.addEventListener('error', function () { self.fail(); }, true);
  }

  Feed.prototype.set = function (state) { this.plate.dataset.state = state; };

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
    this.time.textContent = 'loading';
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

  /* back to the printed poster: unload the clip */
  Feed.prototype.reset = function () {
    if (this.plate.dataset.state === 'idle') return;
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
    this.time.textContent = 'could not load';
  };

  /* The 5 second silent clip plays by itself while it is on screen. */
  function Loop(plate) {
    var self = this;
    this.plate = plate;
    this.video = plate.querySelector('video');
    this.name = nameOf(plate);
    this.wanted = true;
    this.visible = false;
    this.video.controls = false;
    this.video.muted = true;
    this.video.tabIndex = -1;
    this.button = makeButton(plate.querySelector('.plate__screen'), PAUSE, 'Pause');
    plate.dataset.state = 'idle';

    this.button.addEventListener('click', function () {
      self.wanted = !self.wanted;
      self.sync();
    });
    this.video.addEventListener('playing', function () { plate.dataset.state = 'live'; });

    new IntersectionObserver(function (entries) {
      self.visible = entries[entries.length - 1].isIntersecting;
      self.sync();
    }, { threshold: 0.4 }).observe(plate);
    this.sync();
  }

  Loop.prototype.sync = function () {
    setLabel(this.button, this.wanted ? PAUSE : PLAY, this.wanted ? 'Pause' : 'Play');
    this.button.setAttribute('aria-label', (this.wanted ? 'Pause the ' : 'Play the ') + this.name + ' loop');
    if (this.wanted && this.visible) {
      var started = this.video.play();
      if (started && started.catch) started.catch(function () {});
    } else {
      this.video.pause();
      if (!this.wanted && this.plate.dataset.state === 'live') this.plate.dataset.state = 'paused';
    }
  };

  document.querySelectorAll('[data-feed]').forEach(function (plate) {
    if (plate.hasAttribute('data-loop') && !reducedMotion && 'IntersectionObserver' in window) {
      new Loop(plate);
    } else {
      feeds.push(new Feed(plate));
    }
  });
})();
