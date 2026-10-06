/* baikurazov.com
   Without this script every project is a plain <video controls> over its pale poster.
   With it, the native controls stay hidden behind one quiet play medallion until the
   visitor starts a clip, and only one clip plays at a time. */
(function () {
  'use strict';
  var videos = Array.prototype.slice.call(document.querySelectorAll('.work__frame video'));

  videos.forEach(function (video) {
    var frame = video.parentNode;
    var title = frame.parentNode.querySelector('.work__title');
    var meta = frame.parentNode.querySelector('.work__meta span');
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'play';
    button.setAttribute('aria-label', 'Play ' + (title ? title.textContent : 'the clip') + (meta ? ', ' + meta.textContent : ''));
    button.innerHTML = '<span class="play__disc" aria-hidden="true"><svg viewBox="0 0 10 12" focusable="false"><path d="M1 0l9 6-9 6z"/></svg></span>';

    video.controls = false;
    video.tabIndex = -1;
    frame.appendChild(button);

    button.addEventListener('click', function () {
      button.hidden = true;
      video.controls = true;
      video.tabIndex = 0;
      video.focus({ preventScroll: true });
      var started = video.play();
      if (started && started.catch) started.catch(function () {});
    });

    video.addEventListener('play', function () {
      button.hidden = true;
      video.controls = true;
      videos.forEach(function (other) {
        if (other !== video && !other.paused) other.pause();
      });
    });
  });
})();
