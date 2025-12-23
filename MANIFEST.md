<!--markdownlint-disable-->
# Project Manifest

Complete file inventory and dependencies for the TV Remote Bluetooth project.

---

## File Inventory & Purposes

### Configuration Files

| File | Purpose | Size |
| ------ | --------- | ------ |
| `package.json` | NPM project metadata and scripts | ~200 bytes |
| `.gitignore` | Git exclusion rules | ~50 bytes |
| `.github/copilot-instructions.md` | Copilot development guidelines | ~3.5 KB |

### HTML & Entry Points

| File | Purpose | Lines |
|------|---------|-------|
| `index.html` | Main application shell, loads CSS and JS modules | 509 |

## Stylesheets

| File | Purpose | Lines |
|------|---------|-------|
| `styles.css` | Utility styles (background patterns, icons, signal indicators) | 62 |
| `css/index.css` | CSS import manifest consolidates all project styles | 5 |
| `css/variables.css` | CSS custom properties, color palette, typography | 24 |
| `css/components.css` | UI component styles (cards, buttons, toggles, sliders) | 110 |
| `css/animations.css` | Keyframe animations, transitions, motion effects | 19 |
| `css/responsive.css` | Media queries and responsive design adjustments | 8 |

**Total CSS**: 228 lines across 6 files

### JavaScript Modules

#### Core Layer (`js/core/`)

| File | Purpose | Lines | Dependencies |
|------|---------|-------|--------------|
| `app.js` | Main application controller, event routing, command handlers | 323 | state, bluetooth, ui-controller, constants |
| `state.js` | State management (observer pattern), localStorage persistence | 205 | constants |
| `constants.js` | Global configuration, commands, storage keys (root dependency) | 80 | none |

#### Service Layer (`js/services/`)

| File | Purpose | Lines | Dependencies |
|------|---------|-------|--------------|
| `bluetooth.js` | Web Bluetooth API wrapper, device discovery, command transmission | 212 | state, constants |

#### UI Layer (`js/ui/`)

| File | Purpose | Lines | Dependencies |
|------|---------|-------|--------------|
| `controller.js` | View manager, event delegation, state-driven rendering | 458 | state, constants |

**Total JS Modules**: 1,278 lines across 5 files

### Views

| View Folder | Purpose | Files |
|------------|---------|-------|
| `onboarding-tutorial/` | Initial setup and feature introduction flow | code.html, screen.png |
| `device-connection/` | Device discovery and Bluetooth pairing interface | code.html, screen.png |
| `device-list/` | Dashboard showing paired devices and active selection | code.html, screen.png |
| `main-remote-control/` | Primary remote control interface with all buttons | code.html, screen.png |
| `settings/` | User settings and customization options | code.html, screen.png |

### Documentation

| File | Purpose | Audience |
|------|---------|----------|
| `docs/CHANGELOG.md` | Complete changelog, architecture, development guide, commands reference | Developers, maintainers |
| `README.md` | Project overview, features, tech stack, quick start (at project root) | Users, contributors |

---

## Dependency Graph

```txt
index.html (entry point)
  ├─ External CDN Resources
  │  ├─ Tailwind CSS 3 (https://cdn.tailwindcss.com)
  │  ├─ Tailwind Forms plugin
  │  ├─ Material Symbols Icons (Google Fonts)
  │  ├─ Space Grotesk font (Google Fonts)
  │  └─ Noto Sans font (Google Fonts)
  │
  ├─ CSS Files
  │  └─ css/index.css (imports all CSS modules)
  │     ├─ css/variables.css
  │     ├─ css/components.css
  │     ├─ css/animations.css
  │     └─ css/responsive.css
  │
  ├─ External Styles
  │  └─ styles.css
  │
  └─ JavaScript Entry Point
     └─ js/core/app.js
        ├─ js/core/state.js
        │  └─ js/core/constants.js
        ├─ js/services/bluetooth.js
        │  ├─ js/core/state.js
        │  └─ js/core/constants.js
        ├─ js/ui/controller.js
        │  ├─ js/core/state.js
        │  └─ js/core/constants.js
        └─ js/core/constants.js

View Containers (in index.html):
  ├─ <div id="onboarding"> → onboarding-tutorial/code.html markup
  ├─ <div id="device-connection"> → device-connection/code.html markup
  ├─ <div id="device-list"> → device-list/code.html markup
  ├─ <div id="main-remote"> → main-remote-control/code.html markup
  └─ <div id="settings"> → settings/code.html markup
```

---

## Code Statistics

| Metric | Value | Notes |
| -------- | ------- | ------- |
| **HTML** | 509 lines | Single-page app shell |
| **CSS** | 228 lines | Extracted from inline, organized by concern |
| **JavaScript** | 1,278 lines | Modular, feature-based organization |
| **Total Code** | ~2,015 lines | Excluding comments, whitespace |
| **Modules** | 5 files | Core (3), Services (1), UI (1) |
| **Views** | 5 components | Onboarding, Connection, List, Remote, Settings |
| **CSS Variables** | 5 custom properties | Color palette, surface colors |
| **Remote Commands** | 19 total | Navigation, playback, volume, power |
| **Storage Keys** | 5 entries | Devices, settings, status persistence |

---

## Storage & Persistence

### localStorage Keys

| Key | Data Type | Persistence | Example |
| ----- | ----------- | ------------- | --------- |
| `onboarding-complete` | Boolean | Post-onboarding | `true` |
| `paired-devices` | Array | All paired devices | `[{id, name, ...}, ...]` |
| `active-device-id` | String | Currently selected device | `"device-1"` |
| `user-settings` | Object | User preferences | `{hapticFeedback, sensitivity, ...}` |
| `device-status` | Object | Per-device metadata | `{deviceId: {battery, status, ...}}` |

**Storage Limit**: ~5-10 MB available in most browsers

---

## Module Relationships

### State Manager (Singleton)

- **Used by**: app.js, bluetooth.js, ui-controller.js
- **Pattern**: Observer pattern with subscribers
- **Responsibility**: Centralized state, localStorage sync, notifications

### Bluetooth Manager (Singleton)

- **Used by**: app.js
- **Pattern**: Async command execution with error handling
- **Responsibility**: Web Bluetooth API abstraction, device lifecycle

### UI Controller (Singleton)

- **Used by**: app.js
- **Pattern**: Event delegation, view management
- **Responsibility**: View navigation, DOM updates, event listeners

### App (Singleton)

- **Initializes**: stateManager, bluetoothManager, uiController
- **Coordinates**: Event routing, command execution, state updates
- **Entry point**: Loaded by index.html module script

---

## External Dependencies

### CDN Resources (Loaded in index.html)

1. **Tailwind CSS 3**
   - URL: https://cdn.tailwindcss.com
   - Usage: Utility CSS framework for responsive design
   - Size: ~50 KB (minified, gzipped)

2. **Tailwind Forms Plugin**
   - URL: https://cdn.tailwindcss.com/forms.min.js
   - Usage: Styled form elements
   - Size: ~5 KB

3. **Google Fonts - Material Symbols Outlined**
   - URL: https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined
   - Usage: Icon library (48px, 400 weight, no fill, no gradient)
   - Size: ~10 KB

4. **Google Fonts - Space Grotesk & Noto Sans**
   - URL: https://fonts.googleapis.com/css2?family=Space+Grotesk...
   - Usage: Typography (headings, body text)
   - Size: ~30 KB

### No npm Dependencies

- ✅ Pure vanilla JavaScript (ES6+)
- ✅ No build step required
- ✅ Direct ES module imports in browser
- ✅ Minimal tooling needed (only Python http.server)

---

## Development Server

### Running Locally

```bash
# Start development server
npm run dev

# Browser access
http://localhost:8000
```

### Why Python http.server?

- **Requirement**: Web Bluetooth API requires secure context (HTTPS or localhost)
- **Simple**: No build step, no bundler needed
- **Portable**: Python is pre-installed on most systems
- **Sufficient**: Serves static files for local development

### Alternative Servers

- `npx http-server`
- `npx serve`
- Node.js express server
- Any local web server on port 8000+

---

## Build & Deployment Notes

### No Build Step

- Direct ES6 module imports in browser
- No transpilation needed
- All CSS and JS organized but not bundled

### For Production

Consider:
- CSS minification
- JavaScript minification & bundling
- Service worker for offline capability
- Compression (gzip, brotli)
- CDN caching headers

### Deployment Requirements

- HTTPS support (for Web Bluetooth API)
- Static file hosting (HTML, CSS, JS, images)
- CORS headers if serving from different domain
- Optional: Service worker for PWA capabilities

---

## File Size Overview

| Category | Files | Total Size (approx) |
| ---------- | ------- | ------------------- |
| HTML | 1 | 20 KB |
| CSS (total) | 6 | 10 KB |
| JavaScript (total) | 5 | 45 KB |
| Images | 5 (.png) | 20 KB |
| Fonts (CDN) | 2 | 40 KB |
| Icons (CDN) | 1 | 10 KB |
| **Total (excluding CDN)** | 17 | ~95 KB |
| **Total (with CDN)** | - | ~145 KB |

---

## Related Documentation

- **Full Documentation**: See [`docs/CHANGELOG.md`](../docs/CHANGELOG.md)
  - Architecture overview
  - Development guide
  - Debugging tips
  - Commands reference
  - Contribution guidelines

- **Project README**: See [`README.md`](../README.md)
  - Features
  - Tech stack
  - Quick start
  - Browser compatibility

---

## Last Updated

- **Date**: December 18, 2025
- **Version**: 1.0.0
- **Structure**: Reorganized with modular CSS and JS layers
