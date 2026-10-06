/* baikurazov.com
   Screens: a burgundy poster with one square Play button while idle, the real
   footage with native controls while playing. Only one clip plays at a time.
   Without this script each screen is a plain <video controls> over its poster. */
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
    button.className = 'play';
    setLabel(button, label);
    return button;
  }

  function setLabel(button, label) {
    button.innerHTML = (label === 'Pause' ? PAUSE_ICON : PLAY_ICON) + '<span></span>';
    button.querySelector('span').textContent = label;
  }

  function titleOf(screen) {
    return screen.closest('.proj').querySelector('.proj__title').textContent;
  }

  var feeds = [];

  function Feed(screen) {
    var self = this;
    this.screen = screen;
    this.video = screen.querySelector('video');
    this.time = screen.closest('.proj').querySelector('[data-time]');
    this.total = this.time.textContent;
    this.button = makeButton('Play');
    this.button.setAttribute('aria-label', 'Play ' + titleOf(screen) + ', ' + this.total);
    this.video.after(this.button);
    this.resetting = false;
    this.idle();

    this.button.addEventListener('click', function () { self.start(); });
    this.video.addEventListener('play', function () {
      feeds.forEach(function (other) { if (other !== self) other.reset(); });
    });
    this.video.addEventListener('playing', function () { self.set('live'); });
    this.video.addEventListener('pause', function () {
      if (!self.resetting && !self.video.ended && self.screen.dataset.state === 'live') self.set('paused');
    });
    this.video.addEventListener('timeupdate', function () {
      var state = self.screen.dataset.state;
      if (state === 'live' || state === 'paused') {
        self.time.textContent = clock(self.video.currentTime) + ' / ' + self.total;
      }
    });
    this.video.addEventListener('ended', function () { self.reset(); });
    this.video.addEventListener('error', function () { self.fail(); }, true);
  }

  Feed.prototype.set = function (state) { this.screen.dataset.state = state; };

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

  /* back to the poster: unload the clip so the still shows again */
  Feed.prototype.reset = function () {
    if (this.screen.dataset.state === 'idle') return;
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

  /* The five-second silent loop plays by itself while it is on screen. */
  function Loop(screen) {
    var self = this;
    this.screen = screen;
    this.video = screen.querySelector('video');
    this.name = titleOf(screen);
    this.wanted = true;
    this.visible = false;
    this.video.controls = false;
    this.video.muted = true;
    this.video.tabIndex = -1;
    this.button = makeButton('Pause');
    this.video.after(this.button);
    screen.dataset.state = 'idle';

    this.button.addEventListener('click', function () {
      self.wanted = !self.wanted;
      self.sync();
    });
    this.video.addEventListener('playing', function () { screen.dataset.state = 'live'; });

    new IntersectionObserver(function (entries) {
      self.visible = entries[entries.length - 1].isIntersecting;
      self.sync();
    }, { threshold: 0.4 }).observe(screen);
    this.sync();
  }

  Loop.prototype.sync = function () {
    setLabel(this.button, this.wanted ? 'Pause' : 'Play');
    this.button.setAttribute('aria-label', (this.wanted ? 'Pause the ' : 'Play the ') + this.name + ' loop');
    if (this.wanted && this.visible) {
      var started = this.video.play();
      if (started && started.catch) started.catch(function () {});
    } else {
      this.video.pause();
      if (!this.wanted) this.screen.dataset.state = 'paused';
    }
  };

  document.querySelectorAll('[data-feed]').forEach(function (screen) {
    if (screen.hasAttribute('data-loop') && !reducedMotion && 'IntersectionObserver' in window) {
      new Loop(screen);
    } else {
      feeds.push(new Feed(screen));
    }
  });

  /* The index in the blue column marks the section in view. */
  var links = document.querySelectorAll('.index a[href^="#"]');
  if ('IntersectionObserver' in window && links.length) {
    var byId = {};
    links.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });
    var seen = {};
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { seen[e.target.id] = e.isIntersecting; });
      var current = null;
      ['projects', 'about'].forEach(function (id) { if (seen[id] && !current) current = id; });
      links.forEach(function (a) { a.removeAttribute('aria-current'); });
      if (current && byId[current]) byId[current].setAttribute('aria-current', 'location');
    }, { rootMargin: '-40% 0px -55% 0px' });
    ['projects', 'about'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) observer.observe(el);
    });
  }
})();
