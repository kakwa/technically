/* TOC scrollspy using TOC anchors + scroll position */
(function () {
  if (typeof document === 'undefined') return;
  var toc = document.querySelector('#TableOfContents');
  if (!toc) return;

  function normalizeHash(id) { try { return decodeURIComponent(id); } catch (e) { return id; } }

  var anchorLinks = Array.prototype.slice.call(toc.querySelectorAll('a[href^="#"]'));
  if (!anchorLinks.length) return;

  var linkById = {};
  var targets = anchorLinks.map(function (a) {
    var id = (a.getAttribute('href') || '').slice(1);
    id = normalizeHash(id);
    if (!id) return null;
    var el = document.getElementById(id);
    if (!el) return null;
    linkById[id] = a;
    return { id: id, el: el };
  }).filter(Boolean);
  if (!targets.length) return;

  function setActive(id) {
    Array.prototype.forEach.call(toc.querySelectorAll('a.active'), function (el) { el.classList.remove('active'); });
    Array.prototype.forEach.call(toc.querySelectorAll('li.active'), function (el) { el.classList.remove('active'); });
    var link = linkById[id];
    if (link) {
      link.classList.add('active');
      var parent = link.parentElement;
      while (parent && parent !== toc) {
        if (parent.tagName === 'LI') parent.classList.add('active');
        parent = parent.parentElement;
      }
    }
  }

  function getOffsetTop(el) {
    var rect = el.getBoundingClientRect();
    return rect.top + (window.pageYOffset || document.documentElement.scrollTop);
  }

  var navbar = document.querySelector('.navbar-fixed-top');
  function navHeight() { return navbar ? navbar.getBoundingClientRect().height : 70; }

  var positions = [];
  function recalc() {
    var offset = navHeight() + 12; // small extra spacing
    positions = targets.map(function (t) { return { id: t.id, top: Math.floor(getOffsetTop(t.el) - offset) }; });
  }
  recalc();
  window.addEventListener('resize', recalc);
  window.addEventListener('load', recalc);

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var y = window.pageYOffset || document.documentElement.scrollTop || 0;
      var activeId = positions[0] && positions[0].id;
      for (var i = 0; i < positions.length; i++) {
        if (y >= positions[i].top) activeId = positions[i].id; else break;
      }
      setActive(activeId);
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();


