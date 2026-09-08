/* ==========================================================================
   ImageWorks Creative — Navigation
   ==========================================================================

   Four behaviours, kept apart: the desktop panels, the keyboard map, the
   mobile drawer, and the review chrome. No dependencies.

   CONTENTS
     1. Config and element references
     2. Panel open/close
     3. Pointer
     4. Keyboard
     5. Drawer
     6. Stuck nav
     7. Review chrome

   ========================================================================== */
(function () {
  'use strict';

  /* ========================================================================
     1. CONFIG AND ELEMENT REFERENCES
     ======================================================================== */

  /* Kept in step with the breakpoint in styles.css §14. */
  var DRAWER_AT = '(max-width: 1000px)';
  var CLOSE_DELAY = 140;   /* ms of grace on the diagonal trip to a panel */

  var mq = window.matchMedia(DRAWER_AT);

  var nav = document.getElementById('nav');
  var menu = document.getElementById('menu');
  var hamburger = document.querySelector('.hamburger');
  var backdrop = document.querySelector('.nav-backdrop');

  /* The items that own a panel. */
  var items = Array.prototype.slice.call(
    document.querySelectorAll('.menu__item[data-menu]')
  );

  /* Every top-level control on the bar, in the order it is read. */
  var bar = Array.prototype.slice.call(
    document.querySelectorAll('.menu > .menu__item > .menu__link, .menu > .menu__item > .btn')
  );

  var closeTimer = null;
  var lastFocus = null;


  /* ========================================================================
     2. PANEL OPEN/CLOSE
     ======================================================================== */

  function triggerOf(item) {
    return item.querySelector('.menu__link');
  }

  function linksIn(item) {
    return Array.prototype.slice.call(item.querySelectorAll('.dropdown__link'));
  }

  function isOpen(item) {
    return item.classList.contains('is-open');
  }

  function closeItem(item) {
    item.classList.remove('is-open');
    triggerOf(item).setAttribute('aria-expanded', 'false');
  }

  function closeAll(except) {
    items.forEach(function (i) {
      if (i !== except) closeItem(i);
    });
  }

  function openItem(item) {
    window.clearTimeout(closeTimer);
    closeAll(item);
    item.classList.add('is-open');
    triggerOf(item).setAttribute('aria-expanded', 'true');
  }

  function toggleItem(item) {
    if (isOpen(item)) closeItem(item);
    else openItem(item);
  }


  /* ========================================================================
     3. POINTER
     ======================================================================== */

  items.forEach(function (item) {
    var trigger = triggerOf(item);

    /* Open on enter, close on a short delay so the diagonal trip from the
       label to the panel does not lose it. */
    item.addEventListener('mouseenter', function () {
      if (!mq.matches) openItem(item);
    });

    item.addEventListener('mouseleave', function () {
      if (mq.matches) return;
      closeTimer = window.setTimeout(function () {
        closeItem(item);
      }, CLOSE_DELAY);
    });

    /* Click toggles, on both sides of the breakpoint. */
    trigger.addEventListener('click', function (e) {
      e.preventDefault();
      toggleItem(item);
    });

    /* Focus leaving the item entirely closes it. */
    item.addEventListener('focusout', function (e) {
      if (mq.matches) return;
      if (!item.contains(e.relatedTarget)) closeItem(item);
    });
  });

  /* A click anywhere else closes the panels. */
  document.addEventListener('click', function (e) {
    if (mq.matches) return;
    if (!e.target.closest('.menu__item')) closeAll(null);
  });


  /* ========================================================================
     4. KEYBOARD
     ======================================================================== */

  /* ---- on a trigger: down into the panel it owns ---- */
  items.forEach(function (item) {
    var trigger = triggerOf(item);

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

    /* ---- inside a panel ---- */
    item.querySelector('.dropdown').addEventListener('keydown', function (e) {
      var all = linksIn(item);
      var i = all.indexOf(document.activeElement);
      if (i === -1) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        all[(i + 1) % all.length].focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (i === 0) trigger.focus();
        else all[i - 1].focus();
      } else if (e.key === 'Home') {
        e.preventDefault();
        all[0].focus();
      } else if (e.key === 'End') {
        e.preventDefault();
        all[all.length - 1].focus();
      } else if (e.key === 'Tab' && !e.shiftKey && i === all.length - 1) {
        /* Tabbing off the end closes the panel rather than leaving it hanging
           open behind the next section. */
        closeItem(item);
      }
    });
  });

  /* ---- along the bar ----
     Bound to every control, including the entries that own no panel —
     otherwise the arrow keys would stall on Branding and Portfolio. */
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

  /* ---- Escape closes whatever is open, and hands focus back ---- */
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;

    if (menu.classList.contains('is-open')) {
      closeDrawer();
      return;
    }

    var open = items.filter(isOpen)[0];
    if (open) {
      closeItem(open);
      triggerOf(open).focus();
    }
  });


  /* ========================================================================
     5. DRAWER
     ======================================================================== */

  function focusables() {
    return Array.prototype.slice.call(
      menu.querySelectorAll('a[href], button:not([disabled])')
    ).filter(function (el) {
      return el.offsetParent !== null;
    });
  }

  function openDrawer() {
    lastFocus = document.activeElement;
    menu.classList.add('is-open');
    backdrop.classList.add('is-open');
    hamburger.classList.add('is-active');
    hamburger.setAttribute('aria-expanded', 'true');
    hamburger.setAttribute('aria-label', 'Close menu');
    /* A class rather than an inline style: the page scroll lock is a state,
       and its declaration belongs in the stylesheet with everything else. */
    document.body.classList.add('is-locked');
  }

  function closeDrawer() {
    menu.classList.remove('is-open');
    backdrop.classList.remove('is-open');
    hamburger.classList.remove('is-active');
    hamburger.setAttribute('aria-expanded', 'false');
    hamburger.setAttribute('aria-label', 'Open menu');
    document.body.classList.remove('is-locked');
    closeAll(null);

    if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
    lastFocus = null;
  }

  hamburger.addEventListener('click', function () {
    if (menu.classList.contains('is-open')) closeDrawer();
    else openDrawer();
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


  /* ========================================================================
     6. STUCK NAV
     ======================================================================== */

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


  /* ========================================================================
     7. REVIEW CHROME
     ======================================================================== */

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
