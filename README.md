# ImageWorks Creative — Navigation Comp

Working comp of the main site navigation: utility bar, mega-menu panels, and
the mobile drawer, built on the design system from the
[branding page](https://imageworksc.github.io/branding-page/).

**Live:** https://imageworksc.github.io/menu-iwc/

## Files

| File | What it holds |
| --- | --- |
| `index.html` | The menu, plus the page framing it |
| `styles.css` | Brand tokens and every component on the page |
| `script.js` | Menu, drawer, and review-chrome behaviour |

No build step and no dependencies. Open `index.html` directly, or serve the
folder with any static server.

## Reviewing it

- **Panels** — hover or click *Web*, *Marketing*, *Plans*, *About*. Every panel
  is also laid out flat in the *Every panel at once* section, cloned from the
  live nav at load so the two can never drift apart.
- **Drawer** — narrow the window past 1000px.
- **Build markers** — *Show build progress* in the top bar reveals the internal
  per-item status flags. They are hidden in the production view.

## Design system

Colour, type scale, spacing, radii, shadows and easing are the branding page's
variables, redeclared at the top of `styles.css`:

```
--navy #143c66   --blue #1266b5   --green #80c34a   --green-ink #5c9a2e
--r 2px          --shell 1180px   --nav-h 88px      --ease cubic-bezier(.16,.84,.44,1)
```

Type is Plus Jakarta Sans, 400–800.

## Accessibility

`aria-expanded` on every trigger, arrow-key movement along the bar and down a
panel, `Home`/`End`, `Escape` to close and return focus, a focus trap while the
drawer is open, a skip link, visible focus rings, and full
`prefers-reduced-motion` support.
