# Changelog

All notable changes to the TV Remote Bluetooth project will be documented in this file.

## [Unreleased]-

### Added

- Project structure standardization and reorganization
- Extracted inline CSS (198 lines) into modular component files
- Created documented architecture with separated concerns
- Multi-pattern haptic feedback system with 5 distinct patterns:
  - `BUTTON_PRESS` (30ms) - Standard button interactions
  - `VOLUME_CHANGE` (double pulse) - Volume adjustments
  - `SUCCESS` (ascending pattern) - Successful connections
  - `ERROR` (warning pattern) - Error states
  - `LONG_PRESS` (50ms) - Important actions like power off
- Accessibility support for `prefers-reduced-motion` in haptic feedback (50% intensity reduction)
- CSS classes for UI states: `.button-disabled`, `.loading`, `.error-state`, `.error-text`
- Spin animation keyframe for loading spinners
- Automatic Bluetooth reconnection with exponential backoff (1s, 2s, 4s delays, max 3 attempts)
- Storage error notification system for localStorage failures and corrupted data
- Error handling for all Bluetooth command operations
- Contextual error messages with actionable user guidance

### Changed

- Reorganized JavaScript modules into feature-based folders (core/, services/, ui/)
- Standardized view component folder naming to kebab-case
- Improved CSS organization with variables, components, animations, and responsive files
- Unified all button press feedback to `active:scale-95` with consistent 150ms transition timing
- Enhanced button `.pressed` class with explicit 150ms transition
- Updated all remote control buttons in index.html with standardized `transition-all duration-150`
- Improved `applyButtonFeedback()` method to accept dynamic haptic patterns
- Refactored `sendCommand()` to throw errors instead of silently returning false
- Enhanced error messages in Bluetooth operations with specific failure reasons
- Updated `showNotification()` with error handling and accessibility attributes (role="alert", aria-live)
- Added validation to StateManager `updateState()` method
- Improved localStorage error recovery with automatic corrupted data cleanup

### Fixed

- Bluetooth disconnection handling now properly attempts reconnection
- Missing error notifications for command failures now display to users
- Storage quota exceeded errors now show actionable messages
- Reconnection timeout cleanup on manual disconnect
- Missing transition properties on button press feedback

---

## [1.0.0] - 2025-12-18

### Added <!--markdownlint-disable-line-->

- Initial public release
- Web Bluetooth API integration for device discovery and pairing
- Multi-view navigation system (onboarding, device pairing, remote control, settings)
- Centralized state management with observer pattern
- localStorage persistence for devices, settings, and connection status
- Keyboard shortcut support for remote control testing
- Haptic feedback integration for button presses
- Settings customization (cursor sensitivity, Y-axis inversion)
- Tailwind CSS framework integration
- Material Symbols icon support
- Custom toggle switch components
- Range slider with visual feedback

---

## Architecture Overview

### Core Layer (`js/core/`)

- **app.js**: Main application controller, event routing, command orchestration
- **state.js**: Centralized state management using observer pattern with localStorage persistence
- **constants.js**: Configuration, command definitions, storage keys (single source of truth)

### Service Layer (`js/services/`)

- **bluetooth.js**: Web Bluetooth API abstraction for device discovery, connection, and command transmission

### UI Layer (`js/ui/`)

- **controller.js**: View manager handling navigation, event delegation, and state-driven rendering

### Data Flow

```txt
User Interaction → UI Event → App Handler → State Update → UI Subscriber → View Re-render
```

### State Structure

```javascript
{
  currentView,              // Active view name
  onboardingSlide,          // Current onboarding step
  onboardingComplete,       // Onboarding finished flag
  pairedDevices,            // Array of connected device objects
  activeDeviceId,           // Currently selected device ID
  discoveredDevices,        // Available devices during scanning
  connectionState,          // Current Bluetooth connection status
  isScanning,               // Device discovery in progress
  settings,                 // User preferences (haptic, sensitivity, etc.)
  deviceStatus,             // Per-device metadata and status
  showConnectingAnimation,  // UI animation trigger
  lastCommand,              // Most recently sent command
  commandQueue,             // Queued commands for batch execution
}
```

### Design Patterns

- **Observer Pattern**: StateManager notifies all subscribers of state changes
- **Singleton Pattern**: stateManager, bluetoothManager, uiController as global instances
- **Event-Driven Architecture**: Custom CustomEvent system for UI-to-App communication
- **Immutability**: State updates via spread operators prevent accidental mutations

### Storage Persistence

All state marked for persistence is automatically saved to localStorage:

- `paired-devices`: List of paired remote devices
- `active-device-id`: Currently selected device
- `user-settings`: User preferences and customizations
- `device-status`: Device-specific metadata
- `onboarding-complete`: Onboarding flow flag

---

## Development Guide

### Local Setup

1. Clone the repository
2. Navigate to project directory: `cd TV_remote`
3. Start development server: `npm run dev`
4. Open browser to http://localhost:8000  <!--markdownlint-disable-line-->

The development server uses Python's http.server on port 8000. This is required for Web Bluetooth API support (HTTPS or localhost only).

### Project Structure

```txt
css/
├── index.css              # CSS import manifest
├── variables.css          # Theme tokens and design variables
├── components.css         # UI component styles
├── animations.css         # Keyframe animations and motion
└── responsive.css         # Media query breakpoints

js/
├── core/                  # Application logic and configuration
│   ├── app.js             # Main controller
│   ├── state.js           # State management
│   └── constants.js       # Configuration constants
├── services/              # External API integrations
│   └── bluetooth.js       # Web Bluetooth wrapper
└── ui/                    # View rendering and user interactions
    └── controller.js      # View manager

views/                    # View-specific HTML templates
├── onboarding-tutorial/
├── device-connection/
├── device-list/
├── main-remote-control/
└── settings/

docs/                     # Documentation files
├── CHANGELOG.md          # This file
└── (future expansion)
```

### Adding New Features

#### New Remote Command

1. Add to `js/core/constants.js` in `REMOTE_COMMANDS` object
2. Implement handler in `js/core/app.js` (e.g., `handleVolumeChange()`)
3. Add Bluetooth transmission logic in `js/services/bluetooth.js` if needed
4. Wire UI trigger in corresponding view template

Example:

```javascript
// constants.js
export const REMOTE_COMMANDS = {
  PLAY: 'play',
  PAUSE: 'pause',
  // ... add new command
};

// app.js
async handleNewCommand() {
  await bluetoothManager.sendCommand(REMOTE_COMMANDS.NEW_COMMAND);
  this.applyButtonFeedback();
}

// Trigger in view
<button data-action="new-command">Send Command</button>
```

#### New Settings Option

1. Add default value to `js/core/constants.js` in `DEFAULT_SETTINGS`
2. Update StateManager getter/setter in `js/core/state.js` if needed
3. Add UI control in settings view template
4. Wire event listener in `js/ui/controller.js` `initSettings()` method

#### New View

1. Create folder in root: `new-view-name/`
2. Create `new-view-name/index.html` with view template
3. Add VIEWS constant to `js/core/constants.js`
4. Add container div to main `index.html`: `<div id="new-view-name" class="view-container"></div>`
5. Implement `initNewViewName()` and `updateNewViewName()` in `js/ui/controller.js`
6. Wire navigation in `js/core/app.js` event handlers

### Testing

Use keyboard shortcuts for testing without Bluetooth device:

- **Arrow keys**: D-pad navigation (Up, Down, Left, Right)
- **Enter**: OK/Select button
- **Backspace**: Back button
- **M**: Menu
- **P**: Play/Pause
- **K**: Power off

### Debugging

#### State Changes

```javascript
// In browser console
window.__stateManager.subscribe(state => console.log('State:', state));
```

#### Bluetooth Connection

```javascript
// Check if connected
window.__bluetoothManager.isConnected()

// View current device
window.__bluetoothManager.getDeviceName()
```

#### UI Events

All UI events use `ui:` prefix. Search DevTools console for these patterns:

- `ui:dpad-pressed`
- `ui:action-pressed`
- `ui:volume-changed`
- `ui:power-pressed`

Add breakpoints in event handlers or use:

```javascript
window.addEventListener('ui:volume-changed', (e) => {
  console.log('Volume event:', e.detail);
});
```

### Exported Globals (for debugging)

These objects are available in browser console:

```javascript
window.__app                // Main App instance
window.__stateManager       // Central state manager
window.__bluetoothManager   // Bluetooth API wrapper
```

---

## Bluetooth Remote Commands Reference

All commands are defined in `js/core/constants.js` in the `REMOTE_COMMANDS` object.

### Navigation Commands

| Command | Constant | Purpose |
| --------- | ---------- | --------- |
| up | UP | Move cursor up |
| down | DOWN | Move cursor down |
| left | LEFT | Move cursor left |
| right | RIGHT | Move cursor right |
| ok | OK | Confirm/Select |
| back | BACK | Return to previous screen |
| home | HOME | Go to home screen |
| menu | MENU | Open menu |

### Media Playback Commands

| Command | Constant | Purpose |
| --------- | ---------- | --------- |
| play | PLAY | Start playback |
| pause | PAUSE | Pause playback |
| previous | PREVIOUS | Previous track/chapter |
| next | NEXT | Next track/chapter |
| replay-10s | REPLAY_10S | Rewind 10 seconds |
| forward-10s | FORWARD_10S | Fast forward 10 seconds |

### Volume Commands

| Command | Constant | Purpose |
| --------- | ---------- | --------- |
| volume-up | VOLUME_UP | Increase volume |
| volume-down | VOLUME_DOWN | Decrease volume |
| mute | VOLUME_MUTE | Toggle mute |

### Power Commands

| Command | Constant | Purpose |
|---------|----------|---------|
| power-on | POWER_ON | Turn device on |
| power-off | POWER_OFF | Turn device off |

### Sending Commands Programmatically

```javascript
// Single command
await bluetoothManager.sendCommand(REMOTE_COMMANDS.PLAY);

// Command sequence (with delay)
await bluetoothManager.sendCommandSequence([
  REMOTE_COMMANDS.VOLUME_UP,
  REMOTE_COMMANDS.VOLUME_UP
], 100); // 100ms delay between commands
```

---

## Contribution Guidelines

### Code Style

- Use ES6+ syntax (no transpilation needed for modern browsers)
- Follow existing naming conventions (camelCase for functions/variables, kebab-case for HTML attributes)
- Keep functions focused and single-purpose
- Add JSDoc comments for complex methods

### Commit Messages

- Use imperative mood ("Add feature" not "Added feature")
- Reference relevant issues or sections
- Example: "Add volume control command to REMOTE_COMMANDS"

### Before Committing

- Test functionality in multiple views
- Check console for errors or warnings
- Verify keyboard shortcuts work
- Test Bluetooth connection/disconnection flows
- Ensure localStorage persistence works correctly

---

## Known Limitations & Future Work

### Current Limitations

- Web Bluetooth API requires HTTPS or localhost
- Mock Bluetooth device implementation (no actual BLE communication yet)
- Limited to devices supporting generic BLE services
- No multi-device simultaneous control

### Planned Features

- Multi-language support (i18n)
- Custom command mapping
- Cloud synchronization of settings
- Voice control integration
- Widget-based UI components
- PWA capabilities for offline use

---

## Browser Compatibility

- **Chrome/Chromium**: ✅ Full support
- **Edge**: ✅ Full support
- **Firefox**: ⚠️ Web Bluetooth API limited (feature flag needed)
- **Safari**: ⚠️ Web Bluetooth API not supported

Requires:

- ES6 module support
- Web Bluetooth API
- localStorage
- CSS Grid & Flexbox
- CSS custom properties (variables)

---

## License & Attribution

This project uses:

- **Tailwind CSS**: Utility-first CSS framework
- **Google Material Symbols**: Icon library
- **Google Fonts**: Typography (Space Grotesk, Noto Sans)

All third-party resources are loaded from CDN and are subject to their respective licenses.
