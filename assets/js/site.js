/* baikurazov.com
   Each recording rests as a dark frame. Pressing play lights it up; only one
   plays at a time. Without this script every clip is a plain <video controls>
   over its dark poster. */
(function () {
  'use strict';

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function clock(seconds) {
    var s = Math.max(0, Math.floor(seconds));
    return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  }

  function makeButton(text) {
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'film__play';
    button.innerHTML = '<span class="film__mark" aria-hidden="true"></span><span data-label></span>';
    button.querySelector('[data-label]').textContent = text;
    return button;
  }

  var feeds = [];

  function Feed(work) {
    var self = this;
    this.work = work;
    this.video = work.querySelector('video');
    this.time = work.querySelector('[data-time]');
    this.total = this.time.textContent;
    this.name = work.querySelector('.work__title').textContent;
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
      if (!self.resetting && !self.video.ended && self.work.dataset.state === 'live') self.set('paused');
    });
    this.video.addEventListener('timeupdate', function () {
      var state = self.work.dataset.state;
      if (state === 'live' || state === 'paused') {
        self.time.textContent = clock(self.video.currentTime) + ' / ' + self.total;
      }
    });
    this.video.addEventListener('ended', function () { self.reset(); });
    this.video.addEventListener('error', function () { self.fail(); }, true);
  }

  Feed.prototype.set = function (state) { this.work.dataset.state = state; };

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

  /* back to darkness: unload the clip so the dark poster shows again */
  Feed.prototype.reset = function () {
    if (this.work.dataset.state === 'idle') return;
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
  function Loop(work) {
    var self = this;
    this.work = work;
    this.video = work.querySelector('video');
    this.name = work.querySelector('.work__title').textContent;
    this.wanted = true;
    this.visible = false;
    this.video.controls = false;
    this.video.muted = true;
    this.video.tabIndex = -1;
    this.button = makeButton('Pause');
    this.video.after(this.button);
    work.dataset.state = 'idle';
    this.label();

    this.button.addEventListener('click', function () {
      self.wanted = !self.wanted;
      self.sync();
    });
    this.video.addEventListener('playing', function () { work.dataset.state = 'live'; });

    new IntersectionObserver(function (entries) {
      self.visible = entries[entries.length - 1].isIntersecting;
      self.sync();
    }, { threshold: 0.4 }).observe(work.querySelector('.film'));
  }

  Loop.prototype.label = function () {
    this.button.querySelector('[data-label]').textContent = this.wanted ? 'Pause' : 'Play';
    this.button.classList.toggle('is-pause', this.wanted);
    this.button.setAttribute('aria-label', (this.wanted ? 'Pause the ' : 'Play the ') + this.name + ' loop');
  };

  Loop.prototype.sync = function () {
    this.label();
    if (this.wanted && this.visible) {
      var started = this.video.play();
      if (started && started.catch) started.catch(function () {});
    } else {
      this.video.pause();
      if (!this.wanted) this.work.dataset.state = 'paused';
    }
  };

  /* a loop also counts as "playing" for the one-at-a-time rule only in the
     sense that it never steals sound: it is muted, so it is left alone */
  document.querySelectorAll('[data-feed]').forEach(function (work) {
    if (work.hasAttribute('data-loop') && !reducedMotion && 'IntersectionObserver' in window) {
      new Loop(work);
    } else {
      feeds.push(new Feed(work));
    }
  });
})();
