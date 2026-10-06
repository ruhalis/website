/* baikurazov.com — "Saxe halo"
   Each clip waits as a dark still with a small Saxe-blue ring over it; pressing the
   ring lifts the still and the footage comes up out of the black. One clip
   plays at a time. Without this script every clip is a plain <video controls>. */
(function () {
  'use strict';

  var RING = '<svg viewBox="0 0 60 60" aria-hidden="true" focusable="false">' +
    '<circle cx="30" cy="30" r="27"/><path d="M26 23.5l9 6.5-9 6.5z"/></svg>';
  var feeds = [];

  function clock(seconds) {
    var s = Math.max(0, Math.floor(seconds));
    return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  }

  function Feed(work) {
    var self = this;
    this.work = work;
    this.video = work.querySelector('video');
    this.time = work.querySelector('[data-time]');
    this.total = this.time.textContent;
    this.name = work.closest('.work').querySelector('.work__title').textContent;
    this.button = document.createElement('button');
    this.button.type = 'button';
    this.button.className = 'play';
    this.button.innerHTML = RING;
    this.button.setAttribute('aria-label', 'Play ' + this.name + ', ' + this.total);
    work.querySelector('.plate__screen').appendChild(this.button);
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

  /* back to the dark still */
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

  document.querySelectorAll('[data-feed]').forEach(function (work) {
    feeds.push(new Feed(work));
  });
})();
