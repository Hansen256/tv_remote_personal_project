// Main Application Controller

import { stateManager } from './state.js';
import { bluetoothManager } from '../services/bluetooth.js';
import { uiController } from '../ui/controller.js';
import { VIEWS, REMOTE_COMMANDS, DEFAULT_SETTINGS, HAPTIC_PATTERNS, HAPTIC_SETTINGS } from './constants.js';

class App {
  constructor() {
    this.initialized = false;
    this.keyboardListener = null;
  }
  
  /**
   * Initialize the application
   */
  async init() {
    console.log('Initializing Bluetooth Remote App...');
    
    try {
      // Initialize UI system
      await uiController.init();
      
      // Flush any storage errors that occurred during construction
      stateManager.flushStorageErrors();
      
      // Setup event listeners
      this.setupEventListeners();
      
      // Trigger initial view navigation by re-setting the current view,
      // which notifies UI subscribers and renders the initial screen
      stateManager.setCurrentView(stateManager.getCurrentView());
      
      // Setup Bluetooth listeners
      this.setupBluetoothListeners();
      
      this.initialized = true;
      console.log('App initialized successfully');
    } catch (error) {
      console.error('Failed to initialize app:', error);
    }
  }
  
  /**
   * Setup UI event listeners
   */
  setupEventListeners() {
    // Onboarding events
    uiController.addEventListener('onboarding-complete', () => {
      stateManager.completeOnboarding();
    });
    
    // Device connection events
    uiController.addEventListener('device-connect-requested', async () => {
      await this.handleDeviceConnection();
    });
    
    // Device list events
    uiController.addEventListener('disconnect', async (detail) => {
      await bluetoothManager.disconnect();
    });
    
    // Remote control events
    uiController.addEventListener('dpad-pressed', (detail) => {
      this.handleDpadInput(detail.direction);
    });
    
    uiController.addEventListener('action-pressed', (detail) => {
      this.handleActionButton(detail.action);
    });
    
    uiController.addEventListener('playback-control', (detail) => {
      this.handlePlaybackControl(detail.control);
    });
    
    uiController.addEventListener('volume-changed', (detail) => {
      this.handleVolumeChange(detail.volume);
    });
    
    uiController.addEventListener('power-pressed', () => {
      this.handlePowerButton();
    });
    
    // Settings events
    uiController.addEventListener('reset-settings-requested', () => {
      this.handleResetSettings();
    });
    
    // Storage error notifications
    window.addEventListener('state:storage-error', (e) => {
      uiController.showNotification(e.detail.message, 'error');
    });
  }
  
  /**
   * Setup Bluetooth event listeners
   */
  setupBluetoothListeners() {
    // Listen to state changes
    stateManager.subscribe((state) => {
      // Handle Bluetooth status updates
      if (state.connectionState) {
        console.log('Connection state:', state.connectionState);
      }
      
      // Manage keyboard listener based on current view
      if (state.currentView === VIEWS.MAIN_REMOTE) {
        if (!this.keyboardListener) {
          this.keyboardListener = (e) => this.handleKeyboardInput(e);
          document.addEventListener('keydown', this.keyboardListener);
        }
      } else {
        if (this.keyboardListener) {
          document.removeEventListener('keydown', this.keyboardListener);
          this.keyboardListener = null;
        }
      }
    });
  }
  
  /**
   * Handle device connection flow
   */
  async handleDeviceConnection() {
    try {
      if (!bluetoothManager.isSupported) {
        uiController.showNotification('Bluetooth not supported on this device. Try using Chrome or Edge.', 'error');
        return;
      }
      
      // Request device
      const device = await bluetoothManager.requestDevice();
      console.log('Device selected:', device.name);
      
      // Connect to device
      await bluetoothManager.connect();
      
      this.sendHapticPattern(HAPTIC_PATTERNS.SUCCESS);
      uiController.showNotification(`Connected to ${device.name}`, 'success');
      stateManager.setCurrentView(VIEWS.DEVICE_LIST);
    } catch (error) {
      console.error('Connection error:', error);
      this.sendHapticPattern(HAPTIC_PATTERNS.ERROR);
      uiController.showNotification(error.message || 'Failed to connect. Make sure device is powered on and in range.', 'error');
    }
  }
  
  /**
   * Handle D-pad input
   */
  async handleDpadInput(direction) {
    const commands = {
      'up': REMOTE_COMMANDS.UP,
      'down': REMOTE_COMMANDS.DOWN,
      'left': REMOTE_COMMANDS.LEFT,
      'right': REMOTE_COMMANDS.RIGHT,
      'center': REMOTE_COMMANDS.OK,
    };
    
    const command = commands[direction];
    if (command) {
      try {
        await bluetoothManager.sendCommand(command);
        this.applyButtonFeedback();
      } catch (error) {
        console.error('Failed to send command:', error);
        uiController.showNotification('Device disconnected. Please reconnect.', 'error');
      }    }
  }
  
  /**
   * Handle quick action buttons (back, home, menu)
   */
  async handleActionButton(action) {
    const commands = {
      'back': REMOTE_COMMANDS.BACK,
      'home': REMOTE_COMMANDS.HOME,
      'menu': REMOTE_COMMANDS.MENU,
    };
    
    const command = commands[action];
    if (command) {
      try {
        await bluetoothManager.sendCommand(command);
        this.applyButtonFeedback();
      } catch (error) {
        console.error('Failed to send command:', error);
        uiController.showNotification('Device disconnected. Reconnecting...', 'error');
      }
    }
  }
  
  /**
   * Handle playback controls
   */
  async handlePlaybackControl(control) {
    const commands = {
      'replay-10s': REMOTE_COMMANDS.REPLAY_10S,
      'previous': REMOTE_COMMANDS.PREVIOUS,
      'play-pause': REMOTE_COMMANDS.PLAY,
      'next': REMOTE_COMMANDS.NEXT,
      'forward-10s': REMOTE_COMMANDS.FORWARD_10S,
    };
    
    const command = commands[control];
    if (command) {
      try {
        await bluetoothManager.sendCommand(command);
        this.applyButtonFeedback();
      } catch (error) {
        console.error('Failed to send command:', error);
        uiController.showNotification('Device disconnected. Reconnecting...', 'error');
      }
    }
  }
  
  /**
   * Handle volume changes
   */
  async handleVolumeChange(volume) {
    const commands = [];
    
    // Determine if volume increased or decreased
    const state = stateManager.getState();
    const lastVolume = state.lastCommand?.volume || 50;
    
    if (volume > lastVolume) {
      commands.push(REMOTE_COMMANDS.VOLUME_UP);
    } else if (volume < lastVolume) {
      commands.push(REMOTE_COMMANDS.VOLUME_DOWN);
    }
    
    if (commands.length > 0) {
      try {
        await bluetoothManager.sendCommandSequence(commands);
        this.sendHapticPattern(HAPTIC_PATTERNS.VOLUME_CHANGE);
      } catch (error) {
        console.error('Failed to send command:', error);
        uiController.showNotification('Device disconnected. Reconnecting...', 'error');
      }
    }
  }
  
  /**
   * Handle power button
   */
  async handlePowerButton() {
    const confirmed = await uiController.showConfirmation('Turn off the remote?');
    if (confirmed) {
      await bluetoothManager.sendCommand(REMOTE_COMMANDS.POWER_OFF);
      this.applyButtonFeedback(HAPTIC_PATTERNS.LONG_PRESS);
    }
  }
  
  /**
   * Handle settings reset
   */
  async handleResetSettings() {
    const confirmed = await uiController.showConfirmation('Reset all settings to defaults?');
    if (confirmed) {
      // Restore default settings
      Object.entries(DEFAULT_SETTINGS).forEach(([key, value]) => {
        stateManager.updateUserSetting(key, value);
      });
      uiController.showNotification('Settings reset to defaults', 'info');
    }
  }
  
  /**
   * Handle keyboard input for remote control
   */
  handleKeyboardInput(event) {
    const currentView = stateManager.getCurrentView();
    
    // Only handle keyboard input for remote control view
    if (currentView !== VIEWS.MAIN_REMOTE) {
      return;
    }
    
    const keyMap = {
      'ArrowUp': { type: 'dpad', value: 'up' },
      'ArrowDown': { type: 'dpad', value: 'down' },
      'ArrowLeft': { type: 'dpad', value: 'left' },
      'ArrowRight': { type: 'dpad', value: 'right' },
      'Enter': { type: 'dpad', value: 'center' },
      'Backspace': { type: 'action', value: 'back' },
      'Home': { type: 'action', value: 'home' },
      'm': { type: 'action', value: 'menu' },
      'p': { type: 'playback', value: 'play-pause' },
      'k': { type: 'power', value: 'off' },
    };
    
    const mapping = keyMap[event.key];
    if (mapping) {
      event.preventDefault();
      
      switch (mapping.type) {
        case 'dpad':
          this.handleDpadInput(mapping.value);
          break;
        case 'action':
          this.handleActionButton(mapping.value);
          break;
        case 'playback':
          this.handlePlaybackControl(mapping.value);
          break;
        case 'power':
          this.handlePowerButton();
          break;
      }
    }
  }
  
  /**
   * Send haptic feedback with pattern
   */
  sendHapticPattern(pattern = HAPTIC_PATTERNS.BUTTON_PRESS) {
    const settings = stateManager.getUserSettings();
    
    // Check if haptic feedback is enabled
    if (!settings.hapticFeedback || !navigator.vibrate) {
      return;
    }
    
    // Normalize pattern to array
    const normalizedPattern = Array.isArray(pattern) ? pattern : [pattern];
    
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      // Use reduced intensity for accessibility
      const reducedPattern = normalizedPattern.map(duration => 
        Math.floor(duration * HAPTIC_SETTINGS.REDUCED_INTENSITY)
      );
      navigator.vibrate(reducedPattern);
    } else {
      navigator.vibrate(normalizedPattern);
    }
  }
  
  /**
   * Apply visual/haptic feedback for button press
   */
  applyButtonFeedback(hapticPattern = HAPTIC_PATTERNS.BUTTON_PRESS) {
    // Visual feedback
    const activeElement = document.activeElement;
    if (activeElement) {
      activeElement.classList.add('pressed');
      setTimeout(() => activeElement.classList.remove('pressed'), 150);
    }
    
    // Haptic feedback with pattern
    this.sendHapticPattern(hapticPattern);
  }
  
  /**
   * Navigate to view
   */
  navigateTo(viewName) {
    stateManager.setCurrentView(viewName);
  }
  
  /**
   * Get current state
   */
  getState() {
    return stateManager.getState();
  }
}

// Initialize app when DOM is ready
const app = new App();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    app.init();
  });
} else {
  app.init();
}

// TODO: Remove debug exports before production deployment to avoid exposing internal objects
// Export for debugging
window.__app = app;
window.__stateManager = stateManager;
window.__bluetoothManager = bluetoothManager;
