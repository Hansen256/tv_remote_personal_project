// Centralized State Management
// Singleton pattern enforced via static instance guard.
// Only the singleton instance is exported; attempting to instantiate new instances will throw an error.

import { STORAGE_KEYS, DEFAULT_SETTINGS, CONNECTION_STATES, VIEWS } from './constants.js';

class StateManager {
  // Configuration
  static MAX_COMMAND_QUEUE_SIZE = 100;
  static #ORIGINAL_QUEUE_SIZE; // Store original for test cleanup
  static #instance = null;

  static {
    StateManager.#ORIGINAL_QUEUE_SIZE = StateManager.MAX_COMMAND_QUEUE_SIZE;
  }
  
  constructor() {
    if (StateManager.#instance !== null) {
      throw new Error('StateManager is a singleton. Use the exported stateManager instance instead of creating a new instance.');
    }
    StateManager.#instance = this;
    const onboardingComplete = this.loadFromStorage(STORAGE_KEYS.ONBOARDING_COMPLETE, false);
    
    this.state = {
      // Current view
      currentView: onboardingComplete ? VIEWS.DEVICE_LIST : VIEWS.ONBOARDING,
      
      // Onboarding
      onboardingSlide: 0,
      onboardingComplete: onboardingComplete,
      
      // Devices
      pairedDevices: this.loadFromStorage(STORAGE_KEYS.PAIRED_DEVICES, []),
      activeDeviceId: this.loadFromStorage(STORAGE_KEYS.ACTIVE_DEVICE_ID, null),
      discoveredDevices: [],
      connectionState: CONNECTION_STATES.DISCONNECTED,
      isScanning: false,
      
      // User Settings
      settings: this.loadFromStorage(STORAGE_KEYS.USER_SETTINGS, DEFAULT_SETTINGS),
      
      // Device Status
      deviceStatus: this.loadFromStorage(STORAGE_KEYS.DEVICE_STATUS, {}),
      
      // UI State
      showConnectingAnimation: false,
      lastCommand: null,
      commandQueue: [],
    };
    
    this.listeners = [];
    this.isInitialized = false;
    this.errorQueue = [];
  }
  
  // Getters
  getState() {
    return { ...this.state };
  }
  
  getCurrentView() {
    return this.state.currentView;
  }
  
  getActiveDevice() {
    return this.state.pairedDevices.find(d => d.id === this.state.activeDeviceId) || null;
  }
  
  getPairedDevices() {
    return [...this.state.pairedDevices];
  }
  
  getDiscoveredDevices() {
    return [...this.state.discoveredDevices];
  }
  
  getConnectionState() {
    return this.state.connectionState;
  }
  
  getOnboardingState() {
    // Return in-memory state first, fall back to storage only if undefined/null
    return this.state.onboardingComplete ?? this.loadFromStorage(STORAGE_KEYS.ONBOARDING_COMPLETE, false);
  }
  
  getUserSettings() {
    return { ...this.state.settings };
  }
  
  getDeviceStatus(deviceId) {
    const status = this.state.deviceStatus[deviceId];
    return status ? { ...status } : {};
  }
  
  // Setters
  setCurrentView(viewName) {
    this.updateState({ currentView: viewName });
  }
  
  setOnboardingSlide(slideIndex) {
    this.updateState({ onboardingSlide: slideIndex });
  }
  
  completeOnboarding() {
    this.updateState({ onboardingComplete: true, currentView: VIEWS.DEVICE_LIST });
    this.saveToStorage(STORAGE_KEYS.ONBOARDING_COMPLETE, true);
  }
  
  addDiscoveredDevice(device) {
    const exists = this.state.discoveredDevices.some(d => d.id === device.id);
    if (!exists) {
      this.updateState({
        discoveredDevices: [...this.state.discoveredDevices, device]
      });
    }
  }
  
  setDiscoveredDevices(devices) {
    this.updateState({ discoveredDevices: devices });
  }
  
  addPairedDevice(device) {
    const exists = this.state.pairedDevices.some(d => d.id === device.id);
    if (!exists) {
      const updated = [...this.state.pairedDevices, device];
      this.updateState({ pairedDevices: updated });
      this.saveToStorage(STORAGE_KEYS.PAIRED_DEVICES, updated);
    }
  }
  
  updateDeviceName(deviceId, customName) {
    const updated = this.state.pairedDevices.map(d => 
      d.id === deviceId ? { ...d, customName } : d
    );
    this.updateState({ pairedDevices: updated });
    this.saveToStorage(STORAGE_KEYS.PAIRED_DEVICES, updated);
  }
  
  removePairedDevice(deviceId) {
    const updated = this.state.pairedDevices.filter(d => d.id !== deviceId);
    this.updateState({ pairedDevices: updated });
    this.saveToStorage(STORAGE_KEYS.PAIRED_DEVICES, updated);
    
    if (this.state.activeDeviceId === deviceId) {
      this.setActiveDevice(null);
    }
  }
  
  setActiveDevice(deviceId) {
    this.updateState({ activeDeviceId: deviceId });
    this.saveToStorage(STORAGE_KEYS.ACTIVE_DEVICE_ID, deviceId);
  }
  
  setConnectionState(state) {
    this.updateState({ connectionState: state });
  }
  
  setScanning(isScanning) {
    this.updateState({ isScanning });
  }
  
  updateUserSetting(key, value) {
    const updated = { ...this.state.settings, [key]: value };
    this.updateState({ settings: updated });
    this.saveToStorage(STORAGE_KEYS.USER_SETTINGS, updated);
  }
  
  updateDeviceStatus(deviceId, status) {
    const updated = {
      ...this.state.deviceStatus,
      [deviceId]: { ...this.state.deviceStatus[deviceId], ...status }
    };
    this.updateState({ deviceStatus: updated });
    this.saveToStorage(STORAGE_KEYS.DEVICE_STATUS, updated);
  }
  
  recordCommand(command) {
    // Add new command with timestamp and cap queue to MAX_COMMAND_QUEUE_SIZE
    // Drops oldest entries (FIFO) when queue exceeds max
    const commandEntry = {
      command,
      timestamp: Date.now()
    };
    const updatedQueue = [...this.state.commandQueue, commandEntry];
    const trimmedQueue = updatedQueue.length > StateManager.MAX_COMMAND_QUEUE_SIZE
      ? updatedQueue.slice(-StateManager.MAX_COMMAND_QUEUE_SIZE)
      : updatedQueue;
    
    this.updateState({
      lastCommand: commandEntry,
      commandQueue: trimmedQueue
    });
  }
  
  clearCommandQueue() {
    // Clear all recorded commands from history
    this.updateState({ commandQueue: [] });
  }
  
  // Storage
  saveToStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Failed to save to localStorage: ${key}`, error);
      
      // Notify user of storage failure
      if (error.name === 'QuotaExceededError') {
        this.notifyStorageError('Storage quota exceeded. Please clear app data.');
      } else {
        this.notifyStorageError('Failed to save settings. Changes may not persist.');
      }
    }
  }
  
  loadFromStorage(key, defaultValue) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Failed to load from localStorage: ${key}`, error);
      
      // Notify user of corrupted data
      if (error instanceof SyntaxError) {
        this.notifyStorageError('Corrupted settings detected. Using defaults.');
        // Clear corrupted data
        try {
          localStorage.removeItem(key);
        } catch (e) {
          console.error('Failed to clear corrupted data:', e);
        }
      }
      
      return defaultValue;
    }
  }
  
  clearStorage() {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }
  
  // State Updates
  updateState(changes) {
    // Validate state changes
    if (typeof changes !== 'object' || changes === null || Array.isArray(changes)) {
      console.error('Invalid state update: changes must be a plain object');
      return;
    }
    
    this.state = { ...this.state, ...changes };
    this.notifyListeners();
  }
  
  // Error Notifications
  notifyStorageError(message) {
    // If initialization is not complete, queue the error for later dispatch
    if (!this.isInitialized) {
      this.errorQueue.push(message);
      console.warn(`[Storage Error] ${message}`);
      return;
    }
    
    // Dispatch custom event for UI to handle
    window.dispatchEvent(new CustomEvent('state:storage-error', {
      detail: { message }
    }));
  }
  
  /**
   * Flush queued storage errors after initialization completes
   */
  flushStorageErrors() {
    this.isInitialized = true;
    
    // Dispatch all queued errors
    this.errorQueue.forEach(message => {
      window.dispatchEvent(new CustomEvent('state:storage-error', {
        detail: { message }
      }));
    });
    
    // Clear the queue
    this.errorQueue = [];
  }
  
  // Observer Pattern
  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
  
  notifyListeners() {
    this.listeners.forEach(listener => listener(this.getState()));
  }

  /**
   * Get the current maximum command queue size (for testing only)
   * @returns {number} The current MAX_COMMAND_QUEUE_SIZE value
   */
  getMaxCommandQueueSizeForTesting() {
    return StateManager.MAX_COMMAND_QUEUE_SIZE;
  }

  /**
   * Set the maximum command queue size (for testing only)
   * @param {number} size - The new maximum queue size
   */
  setMaxCommandQueueSizeForTesting(size) {
    if (!Number.isInteger(size) || size <= 0) {
      throw new Error('Queue size must be a positive finite integer');
    }
    StateManager.MAX_COMMAND_QUEUE_SIZE = size;
  }

  /**
   * Reset state to initial values (for testing only)
   * 
   * Clears all instance state while preserving onboarding completion status.
   * ⚠️ IMPORTANT: This method modifies static class state (MAX_COMMAND_QUEUE_SIZE).
   * 
   * Side effects:
   * - Clears all localStorage entries (except onboarding flag)
   * - Resets MAX_COMMAND_QUEUE_SIZE to original value (100)
   * - Clears all event listeners and error queues
   * - Resets initialization flag
   * 
   * Test isolation: Must be called in beforeEach hooks or test setup to ensure
   * clean state between tests. Failure to do so may cause test pollution.
   */
  resetForTesting() {
    const onboardingComplete = this.loadFromStorage(STORAGE_KEYS.ONBOARDING_COMPLETE, false);
    
    this.clearStorage();
    this.saveToStorage(STORAGE_KEYS.ONBOARDING_COMPLETE, onboardingComplete);
    
    this.listeners = [];
    this.errorQueue = [];
    this.isInitialized = false;
    StateManager.MAX_COMMAND_QUEUE_SIZE = StateManager.#ORIGINAL_QUEUE_SIZE;
    this.state = {
      currentView: onboardingComplete ? VIEWS.DEVICE_LIST : VIEWS.ONBOARDING,
      onboardingSlide: 0,
      onboardingComplete: onboardingComplete,
      pairedDevices: [],
      activeDeviceId: null,
      discoveredDevices: [],
      connectionState: CONNECTION_STATES.DISCONNECTED,
      isScanning: false,
      settings: DEFAULT_SETTINGS,
      deviceStatus: {},
      showConnectingAnimation: false,
      lastCommand: null,
      commandQueue: [],
    };
  }
}

// Singleton instance
export const stateManager = new StateManager();

// For testing: delegate to the instance method
export function resetStateManagerForTesting() {
  stateManager.resetForTesting();
}
