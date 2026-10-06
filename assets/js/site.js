/* baikurazov.com
   Each recording shows its stone-grey poster until play is pressed; one plays at a time.
   Without this script each one is still a plain <video controls> with its poster. */
(function () {
  'use strict';

  var PLAY = '<svg viewBox="0 0 10 12" aria-hidden="true" focusable="false"><path d="M0 0l10 6-10 6z"/></svg>';
  var PAUSE = '<svg viewBox="0 0 10 12" aria-hidden="true" focusable="false"><path d="M0 0h3.5v12H0zM6.5 0H10v12H6.5z"/></svg>';
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var feeds = [];

  function clock(seconds) {
    var s = Math.max(0, Math.floor(seconds));
    return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  }

  function makeButton(label, pause) {
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'feed__play';
    button.setAttribute('aria-label', label);
    button.innerHTML = '<span class="feed__mark' + (pause ? ' feed__mark--pause' : '') + '">' + (pause ? PAUSE : PLAY) + '</span>';
    return button;
  }

  function Feed(box) {
    var self = this;
    this.box = box;
    this.video = box.querySelector('video');
    this.time = box.querySelector('[data-time]');
    this.total = this.time.textContent;
    this.button = makeButton('Play ' + box.dataset.name + ', ' + this.total);
    this.video.after(this.button);
    this.resetting = false;
    this.idle();

    this.button.addEventListener('click', function () { self.start(); });
    this.video.addEventListener('play', function () {
      feeds.forEach(function (other) { if (other !== self) other.reset(); });
    });
    this.video.addEventListener('playing', function () { self.set('live'); });
    this.video.addEventListener('pause', function () {
      if (!self.resetting && !self.video.ended && self.box.dataset.state === 'live') self.set('paused');
    });
    this.video.addEventListener('timeupdate', function () {
      var state = self.box.dataset.state;
      if (state === 'live' || state === 'paused') {
        self.time.textContent = clock(self.video.currentTime) + ' / ' + self.total;
      }
    });
    this.video.addEventListener('ended', function () { self.reset(); });
    this.video.addEventListener('error', function () { self.fail(); }, true);
  }

  Feed.prototype.set = function (state) { this.box.dataset.state = state; };

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

  /* back to the poster: unload the clip */
  Feed.prototype.reset = function () {
    if (this.box.dataset.state === 'idle') return;
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

  /* The 5 second silent loop plays by itself while it is on screen. */
  function Loop(box) {
    var self = this;
    this.box = box;
    this.video = box.querySelector('video');
    this.wanted = true;
    this.visible = false;
    this.video.controls = false;
    this.video.muted = true;
    this.video.tabIndex = -1;
    this.button = makeButton('', true);
    this.video.after(this.button);
    box.dataset.state = 'idle';

    this.button.addEventListener('click', function () {
      self.wanted = !self.wanted;
      self.sync();
    });
    this.video.addEventListener('playing', function () { box.dataset.state = 'live'; });

    new IntersectionObserver(function (entries) {
      self.visible = entries[entries.length - 1].isIntersecting;
      self.sync();
    }, { threshold: 0.4 }).observe(box);
    this.sync();
  }

  Loop.prototype.sync = function () {
    var mark = this.button.querySelector('.feed__mark');
    mark.innerHTML = this.wanted ? PAUSE : PLAY;
    mark.classList.toggle('feed__mark--pause', this.wanted);
    this.button.setAttribute('aria-label', (this.wanted ? 'Pause the ' : 'Play the ') + this.box.dataset.name + ' loop');
    if (this.wanted && this.visible) {
      var started = this.video.play();
      if (started && started.catch) started.catch(function () {});
    } else {
      this.video.pause();
      if (!this.wanted) this.box.dataset.state = 'paused';
    }
  };

  document.querySelectorAll('[data-feed]').forEach(function (box) {
    if (box.hasAttribute('data-loop') && !reducedMotion && 'IntersectionObserver' in window) {
      new Loop(box);
    } else {
      feeds.push(new Feed(box));
    }
  });
})();
