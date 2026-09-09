/* ==========================================================================
   ImageWorks Creative — Navigation
   ==========================================================================

   Four behaviours, kept apart: the desktop panels, the keyboard map, the
   mobile drawer, and the review chrome. No dependencies, no build step.

   Written as a classic script rather than an ES module on purpose: a module
   is fetched, and fetching is blocked under file://, so index.html would stop
   working when opened straight from the folder. The arrow IIFE below gives
   the same scope isolation a module would.

   CONTENTS
     1. Config and element references
     2. Panel open/close
     3. Pointer
     4. Keyboard
     5. Drawer
     6. Stuck nav
     7. Review chrome

   ========================================================================== */
(() => {
  'use strict';

  /* ========================================================================
     1. CONFIG AND ELEMENT REFERENCES
     ======================================================================== */

  /* Kept in step with the breakpoint in styles.css §14. */
  const DRAWER_AT = '(max-width: 1000px)';
  const CLOSE_DELAY = 140;   /* ms of grace on the diagonal trip to a panel */

  const mq = window.matchMedia(DRAWER_AT);

  const nav = document.getElementById('nav');
  const drawer = document.getElementById('drawer');
  const menu = document.getElementById('menu');
  const hamburger = document.querySelector('.hamburger');
  const drawerClose = document.querySelector('.drawer__close');
  const backdrop = document.querySelector('.nav-backdrop');

  /* The items that own a panel. */
  const items = [...document.querySelectorAll('.menu__item[data-menu]')];

  /* Every top-level control on the bar, in the order it is read. */
  const bar = [...document.querySelectorAll(
    '.menu > .menu__item > .menu__link, .menu > .menu__item > .btn'
  )];

  let closeTimer = null;
  let lastFocus = null;


  /* ========================================================================
     2. PANEL OPEN/CLOSE
     ======================================================================== */

  const triggerOf = (item) => item.querySelector('.menu__link');

  const linksIn = (item) => [...item.querySelectorAll('.dropdown__link')];

  const isOpen = (item) => item.classList.contains('is-open');

  const closeItem = (item) => {
    item.classList.remove('is-open');
    triggerOf(item).setAttribute('aria-expanded', 'false');
  };

  const closeAll = (except = null) => {
    for (const item of items) {
      if (item !== except) closeItem(item);
    }
  };

  const openItem = (item) => {
    clearTimeout(closeTimer);
    closeAll(item);
    item.classList.add('is-open');
    triggerOf(item).setAttribute('aria-expanded', 'true');
  };

  const toggleItem = (item) => (isOpen(item) ? closeItem(item) : openItem(item));


  /* ========================================================================
     3. POINTER
     ======================================================================== */

  for (const item of items) {
    const trigger = triggerOf(item);

    /* Open on enter, close on a short delay so the diagonal trip from the
       label to the panel does not lose it. */
    item.addEventListener('mouseenter', () => {
      if (!mq.matches) openItem(item);
    });

    item.addEventListener('mouseleave', () => {
      if (mq.matches) return;
      closeTimer = setTimeout(() => closeItem(item), CLOSE_DELAY);
    });

    /* Click toggles, on both sides of the breakpoint. */
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      toggleItem(item);
    });

    /* Focus leaving the item entirely closes it. */
    item.addEventListener('focusout', (e) => {
      if (mq.matches) return;
      if (!item.contains(e.relatedTarget)) closeItem(item);
    });
  }

  /* A click anywhere else closes the panels. */
  document.addEventListener('click', (e) => {
    if (mq.matches) return;
    if (!e.target.closest('.menu__item')) closeAll();
  });


  /* ========================================================================
     4. KEYBOARD
     ======================================================================== */

  for (const item of items) {
    const trigger = triggerOf(item);

    /* ---- on a trigger: down into the panel it owns ---- */
    trigger.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;

      e.preventDefault();
      openItem(item);

      const links = linksIn(item);
      if (!links.length) return;

      const target = e.key === 'ArrowDown' ? links[0] : links.at(-1);
      target.focus();
    });

    /* ---- inside a panel ---- */
    item.querySelector('.dropdown').addEventListener('keydown', (e) => {
      const links = linksIn(item);
      const i = links.indexOf(document.activeElement);
      if (i === -1) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          links[(i + 1) % links.length].focus();
          break;

        case 'ArrowUp':
          e.preventDefault();
          (i === 0 ? trigger : links[i - 1]).focus();
          break;

        case 'Home':
          e.preventDefault();
          links[0].focus();
          break;

        case 'End':
          e.preventDefault();
          links.at(-1).focus();
          break;

        case 'Tab':
          /* Tabbing off the end closes the panel rather than leaving it
             hanging open behind the next section. */
          if (!e.shiftKey && i === links.length - 1) closeItem(item);
          break;
      }
    });
  }

  /* ---- along the bar ----
     Bound to every control, including the entries that own no panel —
     otherwise the arrow keys would stall on Branding and Portfolio. */
  bar.forEach((el, i) => {
    el.addEventListener('keydown', (e) => {
      if (mq.matches) return;

      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault();
          bar[(i + 1) % bar.length].focus();
          break;

        case 'ArrowLeft':
          e.preventDefault();
          bar[(i - 1 + bar.length) % bar.length].focus();
          break;

        case 'Home':
          e.preventDefault();
          bar[0].focus();
          break;

        case 'End':
          e.preventDefault();
          bar.at(-1).focus();
          break;
      }
    });
  });

  /* ---- Escape closes whatever is open, and hands focus back ----
     closeDrawer is declared in §5. The reference resolves when the key is
     pressed, long after this script has finished running. */
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;

    if (isDrawerOpen()) {
      closeDrawer();
      return;
    }

    const open = items.find(isOpen);
    if (open) {
      closeItem(open);
      triggerOf(open).focus();
    }
  });


  /* ========================================================================
     5. DRAWER
     ======================================================================== */

  const isDrawerOpen = () => drawer.classList.contains('is-open');

  /* The close button lives in the panel, so the trap is scoped to the panel
     rather than to the list inside it. */
  const focusables = () =>
    [...drawer.querySelectorAll('a[href], button:not([disabled])')]
      .filter((el) => el.offsetParent !== null);

  const openDrawer = () => {
    lastFocus = document.activeElement;
    drawer.classList.add('is-open');
    backdrop.classList.add('is-open');
    hamburger.classList.add('is-active');
    hamburger.setAttribute('aria-expanded', 'true');
    hamburger.setAttribute('aria-label', 'Close menu');
    /* A class rather than an inline style: the page scroll lock is a state,
       and its declaration belongs in the stylesheet with everything else. */
    document.body.classList.add('is-locked');
  };

  const closeDrawer = () => {
    drawer.classList.remove('is-open');
    backdrop.classList.remove('is-open');
    hamburger.classList.remove('is-active');
    hamburger.setAttribute('aria-expanded', 'false');
    hamburger.setAttribute('aria-label', 'Open menu');
    document.body.classList.remove('is-locked');
    closeAll();

    if (lastFocus?.isConnected) lastFocus.focus();
    lastFocus = null;
  };

  hamburger.addEventListener('click', () => {
    if (isDrawerOpen()) closeDrawer();
    else openDrawer();
  });

  drawerClose.addEventListener('click', closeDrawer);
  backdrop.addEventListener('click', closeDrawer);

  /* Tab stays inside the drawer while it is open. */
  drawer.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab' || !isDrawerOpen()) return;

    const reachable = focusables();
    if (!reachable.length) return;

    const first = reachable[0];
    const last = reachable.at(-1);

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });

  /* Following a real link closes the drawer; a panel trigger does not. */
  for (const link of menu.querySelectorAll('.dropdown__link, .menu__item > a')) {
    link.addEventListener('click', () => {
      if (mq.matches) closeDrawer();
    });
  }

  /* Crossing the breakpoint resets both modes. */
  mq.addEventListener('change', () => {
    if (isDrawerOpen()) closeDrawer();
    closeAll();
  });


  /* ========================================================================
     6. STUCK NAV
     ======================================================================== */

  let ticking = false;

  const readStuck = () => {
    ticking = false;
    nav.classList.toggle('is-stuck', nav.getBoundingClientRect().top <= 0);
  };

  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(readStuck);
  }, { passive: true });

  readStuck();


  /* ========================================================================
     7. REVIEW CHROME
     ======================================================================== */

  const toggle = document.getElementById('statusToggle');
  const label = document.getElementById('statusLabel');

  toggle?.addEventListener('click', () => {
    const on = document.body.classList.toggle('show-status');
    toggle.setAttribute('aria-pressed', String(on));
    toggle.textContent = on ? 'Hide build progress' : 'Show build progress';
    label.textContent = on ? 'Internal — build tracker' : 'Production comp';
  });

})();
