// Centralized State Management

import { STORAGE_KEYS, DEFAULT_SETTINGS, CONNECTION_STATES, VIEWS } from './constants.js';

class StateManager {
  constructor() {
    this.state = {
      // Current view
      currentView: this.getOnboardingState() ? VIEWS.DEVICE_LIST : VIEWS.ONBOARDING,
      
      // Onboarding
      onboardingSlide: 0,
      onboardingComplete: this.loadFromStorage(STORAGE_KEYS.ONBOARDING_COMPLETE, false),
      
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
    return this.loadFromStorage(STORAGE_KEYS.ONBOARDING_COMPLETE, false);
  }
  
  getUserSettings() {
    return { ...this.state.settings };
  }
  
  getDeviceStatus(deviceId) {
    return this.state.deviceStatus[deviceId] || {};
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
    this.updateState({
      lastCommand: command,
      commandQueue: [...this.state.commandQueue, command]
    });
  }
  
  clearCommandQueue() {
    this.updateState({ commandQueue: [] });
  }
  
  // Storage
  saveToStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Failed to save to localStorage: ${key}`, error);
    }
  }
  
  loadFromStorage(key, defaultValue) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Failed to load from localStorage: ${key}`, error);
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
    this.state = { ...this.state, ...changes };
    this.notifyListeners();
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
