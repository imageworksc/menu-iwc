/* ==========================================================================
   ImageWorks Creative — Navigation Comp
   Three behaviours, kept apart: the desktop menu, the mobile drawer, and the
   review chrome. Nothing here depends on a library.
   ========================================================================== */
(function () {
  'use strict';

  var DRAWER_AT = '(max-width: 1000px)';
  var mq = window.matchMedia(DRAWER_AT);

  var nav = document.getElementById('nav');
  var menu = document.getElementById('menu');
  var hamburger = document.querySelector('.hamburger');
  var backdrop = document.querySelector('.nav-backdrop');
  var items = Array.prototype.slice.call(
    document.querySelectorAll('.menu__item[data-menu]')
  );
  /* every top-level control on the bar, in the order it is read */
  var bar = Array.prototype.slice.call(
    document.querySelectorAll('.menu > .menu__item > .menu__link, .menu > .menu__item > .btn')
  );

  var closeTimer = null;

  /* ------------------------------------------------------------------------
     PANELS
     ------------------------------------------------------------------------ */
  function triggerOf(item) { return item.querySelector('.menu__link'); }

  function closeItem(item) {
    item.classList.remove('is-open');
    triggerOf(item).setAttribute('aria-expanded', 'false');
  }

  function closeAll(except) {
    items.forEach(function (i) { if (i !== except) closeItem(i); });
  }

  function openItem(item) {
    window.clearTimeout(closeTimer);
    closeAll(item);
    item.classList.add('is-open');
    triggerOf(item).setAttribute('aria-expanded', 'true');
  }

  function isOpen(item) { return item.classList.contains('is-open'); }

  function toggleItem(item) {
    if (isOpen(item)) closeItem(item); else openItem(item);
  }

  function linksIn(item) {
    return Array.prototype.slice.call(item.querySelectorAll('.dropdown__link'));
  }

  items.forEach(function (item) {
    var trigger = triggerOf(item);

    /* ---- pointer: open on enter, close on a short delay so the diagonal
       trip from the label to the panel does not lose it ---- */
    item.addEventListener('mouseenter', function () {
      if (!mq.matches) openItem(item);
    });
    item.addEventListener('mouseleave', function () {
      if (mq.matches) return;
      closeTimer = window.setTimeout(function () { closeItem(item); }, 140);
    });

    /* ---- click: works as a toggle on both sides of the breakpoint ---- */
    trigger.addEventListener('click', function (e) {
      e.preventDefault();
      toggleItem(item);
    });

    /* ---- keyboard on the trigger: down into the panel it owns ---- */
    trigger.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        openItem(item);
        var first = linksIn(item)[0];
        if (first) first.focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        openItem(item);
        var all = linksIn(item);
        if (all.length) all[all.length - 1].focus();
      }
    });

    /* ---- keyboard inside the panel ---- */
    item.querySelector('.dropdown').addEventListener('keydown', function (e) {
      var all = linksIn(item);
      var i = all.indexOf(document.activeElement);
      if (i === -1) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        all[(i + 1) % all.length].focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (i === 0) trigger.focus(); else all[i - 1].focus();
      } else if (e.key === 'Home') {
        e.preventDefault();
        all[0].focus();
      } else if (e.key === 'End') {
        e.preventDefault();
        all[all.length - 1].focus();
      } else if (e.key === 'Tab' && !e.shiftKey && i === all.length - 1) {
        /* tabbing off the end closes the panel rather than leaving it hanging
           open behind the next section */
        closeItem(item);
      }
    });

    /* focus leaving the item entirely closes it */
    item.addEventListener('focusout', function (e) {
      if (mq.matches) return;
      if (!item.contains(e.relatedTarget)) closeItem(item);
    });
  });

  /* Left and right move along the whole bar, including the entries that own no
     panel — otherwise the arrow keys would stall on Branding and Portfolio. */
  bar.forEach(function (el, i) {
    el.addEventListener('keydown', function (e) {
      if (mq.matches) return;

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        bar[(i + 1) % bar.length].focus();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        bar[(i - 1 + bar.length) % bar.length].focus();
      } else if (e.key === 'Home') {
        e.preventDefault();
        bar[0].focus();
      } else if (e.key === 'End') {
        e.preventDefault();
        bar[bar.length - 1].focus();
      }
    });
  });

  /* Escape closes whatever is open and hands focus back to its trigger. */
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;

    if (menu.classList.contains('is-open')) { closeDrawer(); return; }

    var open = items.filter(isOpen)[0];
    if (open) {
      closeItem(open);
      triggerOf(open).focus();
    }
  });

  /* A click anywhere else closes the panels. */
  document.addEventListener('click', function (e) {
    if (mq.matches) return;
    if (!e.target.closest('.menu__item')) closeAll(null);
  });

  /* ------------------------------------------------------------------------
     DRAWER
     ------------------------------------------------------------------------ */
  var lastFocus = null;

  function focusables() {
    return Array.prototype.slice.call(
      menu.querySelectorAll('a[href], button:not([disabled])')
    ).filter(function (el) { return el.offsetParent !== null; });
  }

  function openDrawer() {
    lastFocus = document.activeElement;
    menu.classList.add('is-open');
    backdrop.classList.add('is-open');
    hamburger.classList.add('is-active');
    hamburger.setAttribute('aria-expanded', 'true');
    hamburger.setAttribute('aria-label', 'Close menu');
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer() {
    menu.classList.remove('is-open');
    backdrop.classList.remove('is-open');
    hamburger.classList.remove('is-active');
    hamburger.setAttribute('aria-expanded', 'false');
    hamburger.setAttribute('aria-label', 'Open menu');
    document.body.style.overflow = '';
    closeAll(null);

    if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
    lastFocus = null;
  }

  hamburger.addEventListener('click', function () {
    if (menu.classList.contains('is-open')) closeDrawer(); else openDrawer();
  });
  backdrop.addEventListener('click', closeDrawer);

  /* Tab stays inside the drawer while it is open. */
  menu.addEventListener('keydown', function (e) {
    if (e.key !== 'Tab' || !menu.classList.contains('is-open')) return;

    var f = focusables();
    if (!f.length) return;

    var first = f[0];
    var last = f[f.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });

  /* Following a real link closes the drawer; a panel trigger does not. */
  menu.querySelectorAll('.dropdown__link, .menu__item > a').forEach(function (link) {
    link.addEventListener('click', function () {
      if (mq.matches) closeDrawer();
    });
  });

  /* Crossing the breakpoint resets both modes. */
  mq.addEventListener('change', function () {
    if (menu.classList.contains('is-open')) closeDrawer();
    closeAll(null);
  });

  /* ------------------------------------------------------------------------
     STUCK NAV
     ------------------------------------------------------------------------ */
  var ticking = false;

  function readStuck() {
    ticking = false;
    nav.classList.toggle('is-stuck', nav.getBoundingClientRect().top <= 0);
  }

  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(readStuck);
  }, { passive: true });

  readStuck();

  /* ------------------------------------------------------------------------
     PANEL PREVIEW
     Each panel is cloned into the review grid, so the menu is written once.
     ------------------------------------------------------------------------ */
  var grid = document.getElementById('panelPreview');

  if (grid) {
    items.forEach(function (item) {
      var panel = item.querySelector('.dropdown');
      var clone = panel.cloneNode(true);

      /* a clone must not answer to the same id, or carry the interactive
         wiring of the original */
      clone.removeAttribute('id');
      clone.classList.remove('dropdown--narrow');
      clone.querySelectorAll('[id]').forEach(function (el) { el.removeAttribute('id'); });
      clone.querySelectorAll('a').forEach(function (a) { a.setAttribute('tabindex', '-1'); });
      clone.setAttribute('aria-hidden', 'true');

      var card = document.createElement('div');
      card.className = 'panel';

      var name = document.createElement('p');
      name.className = 'panel__name';
      name.textContent = panel.getAttribute('data-panel-name') || '';

      card.appendChild(name);
      card.appendChild(clone);
      grid.appendChild(card);
    });
  }

  /* ------------------------------------------------------------------------
     REVIEW CHROME
     ------------------------------------------------------------------------ */
  var toggle = document.getElementById('statusToggle');
  var label = document.getElementById('statusLabel');

  if (toggle) {
    toggle.addEventListener('click', function () {
      var on = document.body.classList.toggle('show-status');
      toggle.setAttribute('aria-pressed', String(on));
      toggle.textContent = on ? 'Hide build progress' : 'Show build progress';
      label.textContent = on ? 'Internal — build tracker' : 'Production comp';
    });
  }
})();
