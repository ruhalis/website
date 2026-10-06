/* baikurazov.com
   The project log: each line has a play command. Playing opens the footage
   under the line; only one line is open (and playing) at a time.
   Without this script every clip is a plain <video controls> over its poster. */
(function () {
  'use strict';

  function clock(seconds) {
    var s = Math.max(0, Math.floor(seconds));
    return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  }

  var entries = [];

  function Entry(el) {
    var self = this;
    this.el = el;
    this.video = el.querySelector('video');
    this.screen = el.querySelector('.entry__screen');
    this.time = el.querySelector('[data-time]');
    this.total = this.time.textContent;
    this.name = el.querySelector('.entry__title').textContent;
    this.resetting = false;

    this.button = document.createElement('button');
    this.button.type = 'button';
    this.button.className = 'entry__cmd';
    this.button.setAttribute('aria-controls', this.screen.id = 'screen-' + (entries.length + 1));
    el.querySelector('.entry__row').appendChild(this.button);

    this.live = document.createElement('span');
    this.live.className = 'entry__live';
    this.live.textContent = 'Live';
    this.time.before(this.live);

    this.idle();

    this.button.addEventListener('click', function () {
      if (self.el.dataset.state === 'idle') self.start();
      else self.reset(true);
    });
    this.video.addEventListener('play', function () {
      entries.forEach(function (other) { if (other !== self) other.reset(false); });
    });
    this.video.addEventListener('playing', function () { self.set('live'); });
    this.video.addEventListener('pause', function () {
      if (!self.resetting && !self.video.ended && self.el.dataset.state === 'live') self.set('paused');
    });
    this.video.addEventListener('timeupdate', function () {
      var state = self.el.dataset.state;
      if (state === 'live' || state === 'paused') {
        self.time.textContent = clock(self.video.currentTime) + ' / ' + self.total;
      }
    });
    this.video.addEventListener('ended', function () { self.reset(false); });
    this.video.addEventListener('error', function () { self.fail(); }, true);
  }

  Entry.prototype.set = function (state) { this.el.dataset.state = state; };

  Entry.prototype.label = function (open) {
    this.button.innerHTML = '';
    var mark = document.createElement('span');
    mark.className = 'entry__cmd-mark';
    mark.setAttribute('aria-hidden', 'true');
    mark.textContent = open ? '×' : '▸';
    this.button.appendChild(mark);
    this.button.appendChild(document.createTextNode(open ? ' Close' : ' Play'));
    this.button.setAttribute('aria-expanded', open ? 'true' : 'false');
    this.button.setAttribute('aria-label', (open ? 'Close ' : 'Play ') + this.name + ', ' + this.total);
  };

  Entry.prototype.idle = function () {
    this.set('idle');
    this.screen.hidden = true;
    this.video.controls = false;
    this.time.textContent = this.total;
    this.label(false);
  };

  Entry.prototype.start = function () {
    var self = this;
    this.set('loading');
    this.screen.hidden = false;
    this.video.controls = true;
    this.time.textContent = 'Loading';
    this.label(true);
    var started = this.video.play();
    if (started && started.catch) {
      started.catch(function (error) {
        if (error && error.name === 'AbortError') return;
        self.fail();
      });
    }
  };

  /* close the line: unload the clip so the poster shows next time */
  Entry.prototype.reset = function (keepFocus) {
    if (this.el.dataset.state === 'idle') return;
    var hadFocus = this.el.contains(document.activeElement);
    this.resetting = true;
    this.video.pause();
    this.video.load();
    this.resetting = false;
    this.idle();
    if (keepFocus || hadFocus) this.button.focus({ preventScroll: true });
  };

  Entry.prototype.fail = function () {
    if (this.resetting) return;
    this.idle();
    this.time.textContent = 'Could not load';
  };

  document.querySelectorAll('[data-feed]').forEach(function (el) {
    entries.push(new Entry(el));
  });
})();
