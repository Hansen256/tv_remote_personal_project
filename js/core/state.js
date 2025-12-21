// Centralized State Management

import { STORAGE_KEYS, DEFAULT_SETTINGS, CONNECTION_STATES, VIEWS } from './constants.js';

class StateManager {
  // Configuration
  static MAX_COMMAND_QUEUE_SIZE = 100;
  
  constructor() {
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
    // Add new command and cap queue to MAX_COMMAND_QUEUE_SIZE
    // Drops oldest entries (FIFO) when queue exceeds max
    const updatedQueue = [...this.state.commandQueue, command];
    const trimmedQueue = updatedQueue.length > StateManager.MAX_COMMAND_QUEUE_SIZE
      ? updatedQueue.slice(-StateManager.MAX_COMMAND_QUEUE_SIZE)
      : updatedQueue;
    
    this.updateState({
      lastCommand: command,
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
}

// Singleton instance
export const stateManager = new StateManager();
