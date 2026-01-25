# UI Style Organization Guide

## 📋 Overview

The UI styles are organized into dedicated, isolated files for easy maintenance:

| File | Purpose |
|------|---------|
| `styles/variables.css` | CSS custom properties (colors, spacing) |
| `styles/base.css` | Reset, body, #app grid |
| `styles/buttons.css` | All button types (.btn, .btn-icon, .btn-mode) |
| `styles/navbar.css` | Navbar containers and layout |
| `styles/layout.css` | Sidebar, main-view, canvas, visibility helpers |
| `styles/components.css` | Toolbox, tabs, badges, selects |
| `styles/overlays.css` | Modal overlays (intro, instructions) |
| `styles/roadmap.css` | Level selection roadmap |
| `styles/glossary.css` | Glossary panel |
| `styles/content.css` | Educational content cards |
| `styles/visuals.css` | SVG visuals and diagrams |

## 🏗️ Navbar Structure

```
#navbar (main container)
│
├─── .nav-row-top (first row)
│    ├─── .nav-left
│    │    ├─── h2#level-title
│    │    ├─── #btn-instructions (.btn.secondary.btn-small)
│    │    └─── #nav-variant-select-inline (.variant-select)
│    │
│    └─── .nav-right
│         ├─── #btn-toggle-sidebar (.btn-icon.mobile-only)
│         └─── #btn-more-open (.btn-icon.nav-more-trigger)
│
└─── .nav-row-secondary (second row)
     ├─── .controls
     │    ├─── #btn-reset (.btn.secondary.btn-small)
     │    ├─── #btn-check (.btn.primary.btn-small)
     │    ├─── #btn-sim-toggle (.btn.secondary.btn-small.desktop-only)
     │    ├─── #btn-sim-step (.btn.secondary.btn-small.desktop-only)
     │    └─── #btn-next (.btn.success.btn-small)
     │
     └─── .nav-right-group
          ├─── .mode-toggle
          │    ├─── #btn-mode-select (.btn-mode.active)
          │    └─── #btn-mode-wire (.btn-mode)
          │
          ├─── .zoom-controls.desktop-only
          │    ├─── #btn-zoom-out (.btn.secondary.btn-small)
          │    ├─── #zoom-display (span)
          │    └─── #btn-zoom-in (.btn.secondary.btn-small)
          │
          └─── .nav-more-inline.desktop-only
               ├─── .xp-badge (with #xp-display)
               ├─── #btn-glossary (.btn-icon)
               └─── #btn-help (.btn-icon)
```

## 🎨 Style Reference

### Container Classes

| Class | Location | Purpose | Key Properties |
|-------|----------|---------|----------------|
| `#navbar` | navbar.css | Root navbar container | `display: flex; flex-direction: column; gap: 4-6px` |
| `.nav-row-top` | navbar.css | First row (title area) | `justify-content: center; gap: 8px` |
| `.nav-row-secondary` | navbar.css | Second row (controls) | `justify-content: space-between; gap: 8px` |
| `.nav-left` | navbar.css | Left section of top row | `flex: 0 1 auto; gap: 6px` |
| `.nav-right` | navbar.css | Right section of top row | `gap: 6px; flex-shrink: 0` |
| `.controls` | navbar.css | Main button group | `gap: 3px; padding: 4px 6px; border-radius: 14px` |
| `.nav-right-group` | navbar.css | Right section of bottom row | `gap: 4px; flex-shrink: 0` |
| `.mode-toggle` | navbar.css | Hand/wire button container | `gap: 1px; padding: 3px; background: rgba(0,0,0,0.3)` |
| `.zoom-controls` | navbar.css | Zoom button container | `gap: 2px; padding: 4px; background: rgba(0,0,0,0.2)` |
| `.nav-more-inline` | navbar.css | XP/glossary/help group | `gap: 6px` |

### Button Classes

| Class | Location | Purpose | Key Properties |
|-------|----------|---------|----------------|
| `.btn` | buttons.css | Base button | `padding: 6px 14px; border-radius: 16px` |
| `.btn-small` | buttons.css | Compact variant | `padding: 5px 10px; font-size: 0.8rem; min-height: 30px` |
| `.btn.primary` | buttons.css | Blue accent (Verify) | `background: var(--accent-color)` |
| `.btn.secondary` | buttons.css | Gray (Reset, Pause) | `background: #555` |
| `.btn.success` | buttons.css | Green (Next) | `background: var(--success-color)` |
| `.btn-icon` | buttons.css | Circular icon button | `width: 32px; height: 32px; border-radius: 50%` |
| `.btn-mode` | navbar.css | Mode toggle button | `padding: 8px 12px; font-size: 1.2rem` |

## 📱 Responsive Breakpoints

### Desktop (≥ 769px)
- Navbar padding: `8px 16px`
- Navbar gap: `6px`
- Full controls visible
- Zoom controls visible
- More menu hidden

### Tablet/Mobile (≤ 768px)
- Navbar padding: `4px 8px`
- Navbar gap: `4px`
- Controls gap: `2px`
- Nav-right-group gap: `3px`
- More trigger button visible
- Zoom controls in modal

### Small Mobile (≤ 400px)
- Icon-only buttons
- Ultra-compact spacing (`2px` gaps)
- Simplified mode toggles

## 🛠️ How to Modify

### Changing Button Spacing

**All navbar buttons:**
```css
/* styles/navbar.css */
.controls {
    gap: 3px;  /* Change this value */
}
```

**Mode toggle buttons:**
```css
/* styles/navbar.css */
.mode-toggle {
    gap: 1px;  /* Change this value */
}
```

**Zoom control buttons:**
```css
/* styles/navbar.css */
.zoom-controls {
    gap: 2px;  /* Change this value */
}
```

**Between button groups:**
```css
/* styles/navbar.css */
.nav-right-group {
    gap: 4px;  /* Change this value */
}
```

### Adding New Buttons

**To main controls:**
```html
<!-- In HUD.js setupUI() -->
<div class="controls">
    <!-- Existing buttons -->
    <button id="btn-new" class="btn secondary btn-small">New</button>
</div>
```

**To right group:**
```html
<!-- In HUD.js setupUI() -->
<div class="nav-more-inline desktop-only">
    <!-- Existing buttons -->
    <button id="btn-new" class="btn-icon" title="New">🆕</button>
</div>
```

### Adjusting Responsive Behavior

Mobile navbar spacing is controlled in:
```css
/* styles/navbar.css */
@media (max-width: 768px) {
    #navbar { padding: 4px 8px; gap: 4px; }
    .nav-row-secondary { gap: 6px; }
    .nav-right-group { gap: 3px; }
    .controls { padding: 3px 5px; gap: 2px; }
}
```

## 🎯 Quick Reference

**Need to change:**
- Button colors → `styles/buttons.css` (`.btn.primary`, `.btn.secondary`, `.btn.success`)
- Button sizes → `styles/buttons.css` (`.btn`, `.btn-small`)
- Button spacing within groups → `styles/navbar.css` (`.controls`, `.mode-toggle`, `.zoom-controls`)
- Spacing between groups → `styles/navbar.css` (`.nav-right-group`, `.nav-row-secondary`)
- Mobile behavior → `styles/navbar.css` + `styles/buttons.css` (media queries)
- Navbar layout → `styles/navbar.css` (`#navbar`, `.nav-row-*`)

## ✅ Best Practices

1. **Always edit in the correct file** - Don't duplicate styles across files
2. **Use CSS variables** - Colors should use `var(--accent-color)`, etc.
3. **Test responsive** - Check desktop (≥769px), tablet (≤768px), mobile (≤400px)
4. **Keep hierarchy** - Maintain the container → subcontainer → button structure
5. **Document changes** - Add comments when adding new sections

## 📝 File Import Order

In `style.css`:
```css
@import './styles/variables.css';  /* 1. CSS variables first */
@import './styles/base.css';       /* 2. Base HTML elements */
@import './styles/buttons.css';    /* 3. Buttons (used by navbar) */
@import './styles/navbar.css';     /* 4. Navbar structure */
@import './styles/layout.css';     /* 5. Main layout grid */
@import './styles/components.css'; /* 6. Other components */
/* ... other imports ... */
```

This order ensures variables are available before use, and dependencies load correctly.
