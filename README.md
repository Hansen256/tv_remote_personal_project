# Bluetooth TV Remote Application

A Google Stitch-designed Bluetooth TV remote application built with vanilla JavaScript, Tailwind CSS, and the Web Bluetooth API. Control your TV and entertainment devices seamlessly from your mobile device.

## Project Structure

```txt
stitch_bluetooth_remote/
├── index.html                 # Main entry point
├── package.json              # Project dependencies
├── .gitignore                # Git ignore rules
├── device_connection/        # Device pairing UI (original Google Stitch designs)
│   ├── code.html
│   └── screen.png
├── device_list/             # Device dashboard UI
│   ├── code.html
│   └── screen.png
├── main_remote_control/     # Primary remote control interface
│   ├── code.html
│   └── screen.png
├── onboarding_tutorial/     # User onboarding flow
│   ├── code.html
│   └── screen.png
├── settings/                # Settings and customization
│   ├── code.html
│   └── screen.png
└── js/                      # Core JavaScript modules
    ├── app.js              # Main application controller
    ├── state.js            # Centralized state management
    ├── bluetooth.js        # Web Bluetooth API wrapper
    ├── ui-controller.js    # UI view management and event handling
    └── constants.js        # Application constants and configuration
```

## Features

### MVP (Phase 1 - Core Functionality)

- ✅ Onboarding carousel with navigation
- ✅ Bluetooth device discovery and pairing
- ✅ Device list with active device management
- ✅ Main remote control interface with:
  - D-pad directional controls
  - Quick action buttons (back, home, menu)
  - Volume slider
  - Playback controls
  - Power button
- ✅ Settings panel with:
  - Haptic feedback toggle
  - Cursor sensitivity slider
  - Y-axis inversion toggle
  - Reset to defaults button
- ✅ localStorage persistence for device and settings data
- ✅ Keyboard input support for testing

### Phase 2 - Enhanced Experience

- [x] Haptic feedback on button press
- [x] Battery level display and monitoring
- [x] Connection status indicators with animations
- [x] Advanced Bluetooth commands (volume ramp with long-press, playback)
- [x] Device custom naming
- [x] Command history
- [x] PWA support (Add to Home Screen)

### Phase 3 - Polish & Optimization

- [ ] Error handling and graceful fallbacks
- [ ] Offline mode with command queueing
- [ ] Performance optimization
- [ ] Cross-browser testing
- [ ] HID protocol support for desktop

## Technology Stack

| Component | Technology |
|-----------|-----------|
| **Layout** | Tailwind CSS v3 + Forms Plugin |
| **Icons** | Google Material Symbols Outlined |
| **Typography** | Google Fonts (Space Grotesk, Noto Sans) |
| **JavaScript** | Vanilla ES6+ Modules |
| **Bluetooth** | Web Bluetooth API |
| **State** | Custom state manager with localStorage |
| **Dark Mode** | Tailwind class-based system |

## Getting Started

### Prerequisites

- Modern browser with Web Bluetooth API support (Chrome, Edge, Opera)
- Bluetooth-enabled device
- Python 3 (for local development server) or any HTTP server

### Installation

1. **Navigate to project directory:**

```bash
cd stitch_bluetooth_remote
```

1. **Install dependencies (optional - no npm packages required for MVP):**

```bash
npm install
```

1. **Start development server:**

```bash
# Using Python 3
python -m http.server 8000

# Or using Node.js
npx http-server

# Or using another HTTP server of your choice
```

1. **Open in browser:**

```http
http://localhost:8000
```

## Usage

### Onboarding Flow

1. App launches showing onboarding tutorial
2. User swipes through slides or clicks next button
3. After final slide, onboarding is marked complete

### Device Connection

1. Navigate to device connection view
2. App discovers nearby Bluetooth devices
3. Select a device and click "Connect"
4. Device is added to paired devices list

### Remote Control

1. Select an active device from device list
2. Use D-pad for navigation
3. Use quick action buttons for back/home/menu
4. Control volume with slider
5. Use playback controls for media
6. Power button turns off device

### Settings Customization

1. Navigate to settings view
2. Toggle haptic feedback
3. Adjust cursor sensitivity (0-100)
4. Toggle Y-axis inversion
5. Reset to defaults if needed

## Architecture

### State Management (`js/state.js`)

Centralized state store using observer pattern:

- Manages application state
- Persists state to localStorage
- Notifies subscribers of state changes
- Provides getter/setter methods

**Key state properties:**

```javascript
{
  currentView: string,
  onboardingComplete: boolean,
  pairedDevices: Array,
  activeDeviceId: string,
  connectionState: string,
  settings: Object,
  deviceStatus: Object,
  commandQueue: Array
}
```

### Bluetooth Manager (`js/bluetooth.js`)

Wraps Web Bluetooth API:

- Device discovery and connection
- Command transmission
- Battery level monitoring
- Graceful error handling
- Mock device support for testing

### UI Controller (`js/ui-controller.js`)

Manages view rendering and user interactions:

- View initialization and switching
- Event listener setup
- UI state updates
- Custom event dispatching
- Notification system

### App Controller (`js/app.js`)

Main application logic:

- Initializes all systems
- Coordinates between modules
- Handles user interactions
- Manages Bluetooth commands
- Applies UI feedback (visual/haptic)

## API Reference

### State Manager

```javascript
// Get/Set Current View
stateManager.setCurrentView(VIEWS.MAIN_REMOTE)
const view = stateManager.getCurrentView()

// Device Management
stateManager.addPairedDevice(device)
stateManager.removePairedDevice(deviceId)
stateManager.setActiveDevice(deviceId)

// Settings
stateManager.updateUserSetting(key, value)
const settings = stateManager.getUserSettings()

// Onboarding
stateManager.completeOnboarding()
stateManager.setOnboardingSlide(index)

// State Subscription
const unsubscribe = stateManager.subscribe((state) => {
  console.log('State changed:', state)
})
```

### Bluetooth Manager

```javascript
// Device Connection
await bluetoothManager.requestDevice(options)
await bluetoothManager.connect()
await bluetoothManager.disconnect()

// Commands
await bluetoothManager.sendCommand(REMOTE_COMMANDS.UP)
await bluetoothManager.sendCommandSequence(commands, delay)

// Device Info
bluetoothManager.getDeviceName()
bluetoothManager.getDeviceId()
bluetoothManager.isConnected()
await bluetoothManager.getBatteryLevel()
```

### UI Controller

```javascript
// Navigation
uiController.navigateTo(VIEWS.SETTINGS)

// Events
uiController.addEventListener('dpad-pressed', (detail) => {})
uiController.dispatchEvent('button-clicked', { button: 'power' })

// Notifications
uiController.showNotification('Connected!', 'success')
uiController.showNotification('Error connecting', 'error')
```

## Constants

Key constants defined in `js/constants.js`:

```javascript
// Views
VIEWS.ONBOARDING
VIEWS.DEVICE_CONNECTION
VIEWS.DEVICE_LIST
VIEWS.MAIN_REMOTE
VIEWS.SETTINGS

// Connection States
CONNECTION_STATES.DISCONNECTED
CONNECTION_STATES.CONNECTING
CONNECTION_STATES.CONNECTED
CONNECTION_STATES.ERROR

// Remote Commands
REMOTE_COMMANDS.UP, DOWN, LEFT, RIGHT, OK
REMOTE_COMMANDS.BACK, HOME, MENU
REMOTE_COMMANDS.PLAY, PAUSE, PREVIOUS, NEXT
REMOTE_COMMANDS.VOLUME_UP, VOLUME_DOWN, VOLUME_MUTE
REMOTE_COMMANDS.POWER_OFF, POWER_ON
```

## Data Persistence

Application data is persisted to localStorage under these keys:

| Key | Data |
|-----|------|
| `onboarding-complete` | boolean |
| `paired-devices` | Array\<Device\> |
| `active-device-id` | string |
| `user-settings` | Object |
| `device-status` | Object |

**Example device object:**

```javascript
{
  id: "device-123",
  name: "Samsung TV",
  connected: true,
  lastConnected: "2025-12-17T10:30:00Z"
}
```

## Browser Compatibility

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome 90+ | ✅ Full | Recommended |
| Edge 90+ | ✅ Full | Works well |
| Opera 76+ | ✅ Full | Works well |
| Safari | ⚠️ Limited | Web Bluetooth API in development |
| Firefox | ⚠️ Limited | Web Bluetooth API in development |

## Keyboard Shortcuts (Testing)

When viewing the remote control:

| Key | Action |
|-----|--------|
| ↑ / ↓ / ← / → | D-pad navigation |
| Enter | OK button |
| Backspace | Back button |
| Home | Home button |
| M | Menu button |
| P | Play/Pause |
| K | Power off |

## Development Guide

### Adding a New Remote Command

1. Add constant to `js/constants.js`:

```javascript
REMOTE_COMMANDS.MY_COMMAND = 'my-command'
```

1. Add handler in `js/app.js`:

```javascript
async handleMyCommand() {
  await bluetoothManager.sendCommand(REMOTE_COMMANDS.MY_COMMAND)
  this.applyButtonFeedback()
}
```

1. Wire up UI event in `js/ui-controller.js`:

```javascript
const myButton = container.querySelector('[data-my-button]')
if (myButton) {
  myButton.addEventListener('click', () => {
    this.dispatchEvent('my-command', {})
  })
}
```

### Adding a New Setting

1. Add default to `js/constants.js`:

```javascript
DEFAULT_SETTINGS.mySetting = true
```

1. Add UI control to `index.html` in settings view:

```html
<input type="checkbox" data-setting="my-setting">
```

1. Add event listener in `js/ui-controller.js`:

```javascript
const myToggle = container.querySelector('[data-setting="my-setting"]')
if (myToggle) {
  myToggle.addEventListener('change', (e) => {
    stateManager.updateUserSetting('mySetting', e.target.checked)
  })
}
```

### Testing with Mock Bluetooth

Set `MOCK_MODE = true` in `js/bluetooth.js` to use simulated device:

```javascript
const mockDevices = [
  { id: 'mock-1', name: 'Mock TV', signal: 85 }
]
```

All commands will log to console without actual Bluetooth connection.

## Debugging

Access debugging utilities in browser console:

```javascript
// Global references
window.__app           // Main app instance
window.__stateManager  // State manager
window.__bluetoothManager  // Bluetooth manager

// Example usage
console.log(__stateManager.getState())
__app.navigateTo('settings')
__bluetoothManager.isConnected()
```

## Performance Considerations

- **State updates:** Subscribers notified only on state change
- **Lazy loading:** Views only initialize when navigated to
- **localStorage limits:** ~5-10MB available (sufficient for 1000+ devices)
- **Bluetooth polling:** Minimal - only on user action
- **Animation performance:** Optimized with CSS over JavaScript

## Known Limitations

1. **Web Bluetooth API:** Requires HTTPS in production (exception for localhost)
2. **Device persistence:** Uses localStorage, not cloud sync
3. **Command queue:** Limited to session scope (not persisted)
4. **Bluetooth scanning:** Requires user gesture to initiate
5. **Battery API:** Not available on all devices/browsers

## Future Enhancements

- [ ] Cloud synchronization with Firebase
- [ ] Voice commands integration
- [ ] Gesture controls for mobile
- [ ] Custom button mapping UI builder
- [ ] Multi-room device support
- [ ] Activity logging and analytics
- [ ] Shortcuts and automation
- [ ] Dark/light theme toggle
- [ ] Internationalization (i18n)
- [ ] Native mobile app wrapper

## Contributing

This is a personal project.

## Support

For issues or questions, refer to:

- [Web Bluetooth API Docs](https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Material Symbols Guide](https://fonts.google.com/icons)
- [Phase 2 Implementation Guide](docs/PHASE2.md) - Detailed documentation for Phase 2 features

---

**Last Updated:** December 21, 2025  
**Status:** Phase 2 - Enhanced Experience Complete
