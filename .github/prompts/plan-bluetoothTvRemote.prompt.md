# Plan: Implement Google Stitch TV Remote Application

Turn five static HTML/CSS templates into a fully functional Bluetooth TV remote app by adding JavaScript logic, Bluetooth connectivity, state management, and event handlers across modular screens—organized as a single-page application with view switching and persistent device/settings data.

## Implementation Steps

### 1. Set up project infrastructure
- Create `app.js` (main controller)
- Create `bluetooth.js` (Web Bluetooth API)
- Create `ui-controller.js` (view/state management)
- Add `package.json` for optional build tooling
- Ensure all HTML files can load these scripts as modules

### 2. Implement Bluetooth device discovery & connection
- Use Web Bluetooth API in `device_connection/code.html` to scan for devices
- Populate the device list with discovered devices
- Handle pairing failures gracefully
- Store connected devices to localStorage
- Implement device filtering and sorting

### 3. Build view/state management system
- Create a router that switches between five screens:
  - Onboarding (first-time setup)
  - Device list (dashboard)
  - Main remote (primary control interface)
  - Settings (customization)
  - Device connection (pairing flow)
- Store active device state
- Track connection status (connected, connecting, offline)
- Persist settings across sessions

### 4. Implement onboarding carousel
- Add JavaScript to `onboarding_tutorial/code.html` for slide navigation
- Handle dot indicator clicks for direct navigation
- Implement "Next Step" button functionality
- Create skip functionality
- Mark onboarding complete in localStorage and redirect to device list

### 5. Create main remote control handlers
- Wire up directional input mapping (D-pad buttons)
- Implement volume slider event listeners and Bluetooth commands
- Connect playback controls (play, pause, previous, next, replay/forward)
- Add power button functionality
- Send all commands via Bluetooth to connected device
- Implement button feedback (visual/haptic)

### 6. Implement settings persistence & customization
- Add event listeners to toggle switches (haptic feedback, Y-axis invert)
- Connect slider controls (cursor sensitivity)
- Persist preferences to localStorage
- Create button mapping UI and bind to actual remote commands
- Implement "Reset to Defaults" functionality
- Display device status and battery level

## Further Considerations

### Bluetooth Permissions & Error Handling
- Web Bluetooth API requires user gestures to initiate pairing
- May have browser/platform limitations (desktop Chrome supported; Safari/Firefox limited)
- Plan for graceful fallbacks:
  - Mock mode for testing/development
  - Manual code entry as alternative pairing method
  - Clear error messages for unsupported browsers

### Architecture Choice
**Option A: Vanilla JavaScript**
- Pros: Minimal bundle size, no framework dependencies
- Cons: More manual state management, more boilerplate
- Recommended for: Simple apps with few screens

**Option B: Lightweight Framework (Vue.js/Alpine.js)**
- Pros: Built-in state management, component system, cleaner code
- Cons: Additional dependencies, slightly larger bundle
- Recommended for: Growing codebase with complex interactions

**Recommended: Vanilla JavaScript with custom state manager** (minimal overhead, full control)

### Data Persistence Strategy
**Option 1: localStorage only**
- Pros: No server needed, instant persistence, offline support
- Cons: Limited storage (5-10MB), no cross-device sync
- Good for: Single-device personal remotes

**Option 2: Backend service (Firebase/REST API)**
- Pros: Cross-device sync, cloud backup, advanced features
- Cons: Server complexity, requires authentication
- Good for: Multi-device households, cloud sync features

**Recommended for MVP: localStorage** with architecture designed to migrate to backend later

## Project Structure (Proposed)

```
stitch_bluetooth_remote/
├── device_connection/
│   ├── code.html
│   └── screen.png
├── device_list/
│   ├── code.html
│   └── screen.png
├── main_remote_control/
│   ├── code.html
│   └── screen.png
├── onboarding_tutorial/
│   ├── code.html
│   └── screen.png
├── settings/
│   ├── code.html
│   └── screen.png
├── index.html (entry point)
├── js/
│   ├── app.js (main controller)
│   ├── bluetooth.js (Web Bluetooth API wrapper)
│   ├── ui-controller.js (view/state management)
│   ├── state.js (centralized state store)
│   └── constants.js (magic numbers, defaults)
├── css/
│   └── global.css (any global styles not in Tailwind)
├── package.json
└── .gitignore
```

## Technology Stack (Confirmed)

| Component | Technology |
|-----------|-----------|
| Layout Framework | Tailwind CSS v3 |
| Icons | Google Material Symbols Outlined |
| Typography | Google Fonts (Space Grotesk, Noto Sans) |
| Dark Mode | Tailwind class-based dark mode |
| JavaScript | Vanilla (ES6+) |
| Bluetooth | Web Bluetooth API |
| Persistence | localStorage (localStorage-backed state) |
| Build Tool | Optional (Vite/esbuild) |

## Priority & Phasing

### Phase 1: Core Functionality (MVP)
- [ ] Project structure setup
- [ ] View/state management system
- [ ] Onboarding flow completion detection
- [ ] Device connection (Bluetooth discovery)
- [ ] Device list rendering with localStorage persistence
- [ ] Main remote basic button mappings
- [ ] localStorage-based persistence

### Phase 2: Enhanced Experience
- [ ] Haptic feedback on button press
- [ ] Settings persistence and restoration
- [ ] Advanced Bluetooth commands (volume, playback)
- [ ] Battery level display
- [ ] Connection status indicators with animations

### Phase 3: Polish & Optimization
- [ ] Error handling and fallbacks
- [ ] Offline mode support
- [ ] Performance optimization
- [ ] Cross-browser testing
- [ ] Mobile app packaging (PWA or native wrapper)

## Success Metrics

- [ ] All 5 screens navigate correctly
- [ ] Bluetooth device discovery works reliably
- [ ] Remote commands execute on target device
- [ ] Settings persist across sessions
- [ ] Onboarding completes and doesn't re-show
- [ ] App works offline (cached views + command queue)
- [ ] Works on target platforms (mobile browsers)
