/* baikurazov.com — "Empty sky"
   Each clip is a soft blue poster until it is played; only one plays at a time.
   Without this script each clip is still a plain <video controls> over its poster. */
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
    button.className = 'clip__play';
    button.innerHTML = '<span>' + PLAY_ICON + '<b data-label></b></span>';
    button.querySelector('[data-label]').textContent = label;
    return button;
  }

  function titleOf(clip) {
    var work = clip.closest('.work');
    var h = work && work.querySelector('.work__title');
    return h ? h.textContent : 'clip';
  }

  var feeds = [];

  function Feed(clip) {
    var self = this;
    this.clip = clip;
    this.video = clip.querySelector('video');
    this.time = clip.querySelector('[data-time]');
    this.total = this.time.textContent;
    this.name = titleOf(clip);
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
      if (!self.resetting && !self.video.ended && self.clip.dataset.state === 'live') self.set('paused');
    });
    this.video.addEventListener('timeupdate', function () {
      var state = self.clip.dataset.state;
      if (state === 'live' || state === 'paused') {
        self.time.textContent = clock(self.video.currentTime) + ' / ' + self.total;
      }
    });
    this.video.addEventListener('ended', function () { self.reset(); });
    this.video.addEventListener('error', function () { self.fail(); }, true);
  }

  Feed.prototype.set = function (state) { this.clip.dataset.state = state; };

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

  /* back to the poster: unload the clip so the soft blue frame shows again */
  Feed.prototype.reset = function () {
    if (this.clip.dataset.state === 'idle') return;
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
  function Loop(clip) {
    var self = this;
    this.clip = clip;
    this.video = clip.querySelector('video');
    this.name = titleOf(clip);
    this.wanted = true;
    this.visible = false;
    this.video.controls = false;
    this.video.muted = true;
    this.video.tabIndex = -1;
    this.button = makeButton('Pause');
    this.video.after(this.button);
    clip.classList.add('clip--loop');
    clip.dataset.state = 'idle';

    this.button.addEventListener('click', function () {
      self.wanted = !self.wanted;
      self.sync();
    });
    this.video.addEventListener('playing', function () { clip.dataset.state = 'live'; });

    new IntersectionObserver(function (entries) {
      self.visible = entries[entries.length - 1].isIntersecting;
      self.sync();
    }, { threshold: 0.4 }).observe(clip);
    this.sync();
  }

  Loop.prototype.sync = function () {
    var span = this.button.querySelector('span');
    span.innerHTML = (this.wanted ? PAUSE_ICON : PLAY_ICON) + '<b>' + (this.wanted ? 'Pause' : 'Play') + '</b>';
    this.button.setAttribute('aria-label', (this.wanted ? 'Pause the ' : 'Play the ') + this.name + ' loop');
    if (this.wanted && this.visible) {
      var started = this.video.play();
      if (started && started.catch) started.catch(function () {});
    } else {
      this.video.pause();
      if (!this.wanted) this.clip.dataset.state = 'paused';
    }
  };

  document.querySelectorAll('[data-feed]').forEach(function (clip) {
    if (clip.hasAttribute('data-loop') && !reducedMotion && 'IntersectionObserver' in window) {
      new Loop(clip);
    } else {
      feeds.push(new Feed(clip));
    }
  });
})();
