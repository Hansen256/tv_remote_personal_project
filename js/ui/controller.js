// UI Controller - Manages View Rendering and Navigation

import { stateManager } from '../core/state.js';
import { VIEWS } from '../core/constants.js';

class UIController {
  constructor() {
    this.currentView = null;
    this.viewContainers = {};
    this.viewScripts = {};
  }
  
  /**
   * Initialize UI system
   */
  async init() {
    // Cache view containers
    this.viewContainers = {
      [VIEWS.ONBOARDING]: document.getElementById(VIEWS.ONBOARDING),
      [VIEWS.DEVICE_CONNECTION]: document.getElementById(VIEWS.DEVICE_CONNECTION),
      [VIEWS.DEVICE_LIST]: document.getElementById(VIEWS.DEVICE_LIST),
      [VIEWS.MAIN_REMOTE]: document.getElementById(VIEWS.MAIN_REMOTE),
      [VIEWS.SETTINGS]: document.getElementById(VIEWS.SETTINGS),
    };
    
    // Subscribe to state changes
    stateManager.subscribe((state) => {
      this.handleStateChange(state);
    });
  }
  
  /**
   * Handle state changes and update UI accordingly
   */
  handleStateChange(state) {
    if (state.currentView !== this.currentView) {
      this.navigateToView(state.currentView);
    }
    
    // Update view-specific UI based on state
    this.updateActiveView(state);
  }
  
  /**
   * Navigate to a specific view
   */
  navigateToView(viewName) {
    // Hide all views
    Object.values(this.viewContainers).forEach(container => {
      if (container) container.style.display = 'none';
    });
    
    // Show target view
    const targetContainer = this.viewContainers[viewName];
    if (targetContainer) {
      targetContainer.style.display = 'block';
      this.currentView = viewName;
      
      // Trigger view initialization
      this.initializeView(viewName);
    }
  }
  
  /**
   * Initialize view-specific logic
   */
  initializeView(viewName) {
    switch (viewName) {
      case VIEWS.ONBOARDING:
        this.initOnboarding();
        break;
      case VIEWS.DEVICE_CONNECTION:
        this.initDeviceConnection();
        break;
      case VIEWS.DEVICE_LIST:
        this.initDeviceList();
        break;
      case VIEWS.MAIN_REMOTE:
        this.initMainRemote();
        break;
      case VIEWS.SETTINGS:
        this.initSettings();
        break;
    }
  }
  
  /**
   * Update active view with current state
   */
  updateActiveView(state) {
    switch (this.currentView) {
      case VIEWS.ONBOARDING:
        this.updateOnboarding(state);
        break;
      case VIEWS.DEVICE_CONNECTION:
        this.updateDeviceConnection(state);
        break;
      case VIEWS.DEVICE_LIST:
        this.updateDeviceList(state);
        break;
      case VIEWS.MAIN_REMOTE:
        this.updateMainRemote(state);
        break;
      case VIEWS.SETTINGS:
        this.updateSettings(state);
        break;
    }
  }
  
  // ============ Onboarding View ============
  initOnboarding() {
    const container = this.viewContainers[VIEWS.ONBOARDING];
    if (!container) return;
    
    // Setup skip button
    const skipBtn = container.querySelector('[data-action="skip"]');
    if (skipBtn) {
      skipBtn.addEventListener('click', () => {
        stateManager.completeOnboarding();
      });
    }
    
    // Setup next button
    const nextBtn = container.querySelector('[data-action="next-slide"]');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        const state = stateManager.getState();
        const nextSlide = state.onboardingSlide + 1;
        if (nextSlide >= 4) {
          stateManager.completeOnboarding();
        } else {
          stateManager.setOnboardingSlide(nextSlide);
        }
      });
    }
    
    // Setup pagination dots
    const dots = container.querySelectorAll('[data-slide-indicator]');
    dots.forEach((dot, index) => {
      dot.addEventListener('click', () => {
        stateManager.setOnboardingSlide(index);
      });
    });
  }
  
  updateOnboarding(state) {
    const container = this.viewContainers[VIEWS.ONBOARDING];
    if (!container) return;
    
    // Update active slide indicator
    const dots = container.querySelectorAll('[data-slide-indicator]');
    dots.forEach((dot, index) => {
      dot.classList.toggle('active', index === state.onboardingSlide);
    });
    
    // Update slide visibility (if carousel is implemented)
    const slides = container.querySelectorAll('[data-slide]');
    slides.forEach((slide, index) => {
      slide.style.display = index === state.onboardingSlide ? 'block' : 'none';
    });
  }
  
  // ============ Device Connection View ============
  initDeviceConnection() {
    const container = this.viewContainers[VIEWS.DEVICE_CONNECTION];
    if (!container) return;
    
    // Setup device selection radio buttons
    const deviceRadios = container.querySelectorAll('[data-device-radio]');
    deviceRadios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        const deviceId = e.target.value;
        stateManager.addPairedDevice({
          id: deviceId,
          name: e.target.dataset.deviceName,
          connected: false
        });
      });
    });
    
    // Setup connect button
    const connectBtn = container.querySelector('[data-action="connect"]');
    if (connectBtn) {
      connectBtn.addEventListener('click', async () => {
        // This would trigger actual Bluetooth connection in app.js
        this.dispatchEvent('device-connect-requested');
      });
    }
  }
  
  updateDeviceConnection(state) {
    const container = this.viewContainers[VIEWS.DEVICE_CONNECTION];
    if (!container) return;
    
    // Update discovered devices list
    const deviceList = container.querySelector('[data-discovered-devices]');
    if (deviceList && state.discoveredDevices.length > 0) {
      this.renderDiscoveredDevices(deviceList, state.discoveredDevices);
    }
    
    // Show/hide scanning animation
    const scanningIndicator = container.querySelector('[data-scanning]');
    if (scanningIndicator) {
      scanningIndicator.style.display = state.isScanning ? 'block' : 'none';
    }
  }
  
  renderDiscoveredDevices(container, devices) {
    const fragment = document.createDocumentFragment();
    devices.forEach(device => {
      const deviceEl = document.createElement('div');
      deviceEl.className = 'device-item';
      deviceEl.innerHTML = `
        <input type="radio" name="device" value="${device.id}" data-device-radio data-device-name="${device.name}" />
        <label>${device.name}</label>
        <div class="signal-indicator" style="--signal-width: ${device.signal}%"></div>
      `;
      fragment.appendChild(deviceEl);
    });
    container.innerHTML = '';
    container.appendChild(fragment);
  }
  
  // ============ Device List View ============
  initDeviceList() {
    const container = this.viewContainers[VIEWS.DEVICE_LIST];
    if (!container) return;
    
    // Setup edit button
    const editBtn = container.querySelector('[data-action="edit-devices"]');
    if (editBtn) {
      editBtn.addEventListener('click', () => {
        // Toggle edit mode
        container.classList.toggle('edit-mode');
      });
    }
    
    // Setup pair new device button
    const pairBtn = container.querySelector('[data-action="pair-new"]');
    if (pairBtn) {
      pairBtn.addEventListener('click', () => {
        stateManager.setCurrentView(VIEWS.DEVICE_CONNECTION);
      });
    }
    
    // Setup device selection with event delegation
    const deviceList = container.querySelector('[data-saved-devices]');
    if (deviceList) {
      deviceList.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-action="select-device"]');
        if (btn) {
          const deviceId = btn.dataset.deviceId;
          stateManager.setActiveDevice(deviceId);
          stateManager.setCurrentView(VIEWS.MAIN_REMOTE);
        }
      });
    }
  }
  
  updateDeviceList(state) {
    const container = this.viewContainers[VIEWS.DEVICE_LIST];
    if (!container) return;
    
    // Update active device section
    const activeDeviceCard = container.querySelector('[data-active-device]');
    if (activeDeviceCard && state.activeDeviceId) {
      const device = state.pairedDevices.find(d => d.id === state.activeDeviceId);
      if (device) {
        activeDeviceCard.innerHTML = `
          <div class="device-card active">
            <h3>${device.name}</h3>
            <p class="connection-status">${state.connectionState}</p>
            <div class="ping-animation"></div>
            <button data-action="locate-device">Locate</button>
            <button data-action="disconnect">Disconnect</button>
          </div>
        `;
      }
    }
    
    // Update device list
    const deviceList = container.querySelector('[data-saved-devices]');
    if (deviceList) {
      this.renderDeviceList(deviceList, state.pairedDevices);
    }
  }
  
  renderDeviceList(container, devices) {
    const fragment = document.createDocumentFragment();
    devices.forEach(device => {
      const deviceEl = document.createElement('div');
      deviceEl.className = 'device-list-item';
      deviceEl.innerHTML = `
        <div class="device-info">
          <h4>${device.name}</h4>
          <p>${device.connected ? 'Connected' : 'Offline'}</p>
        </div>
        <button data-action="select-device" data-device-id="${device.id}">
          <span class="material-symbols-outlined">chevron_right</span>
        </button>
      `;
      fragment.appendChild(deviceEl);
    });
    container.innerHTML = '';
    container.appendChild(fragment);
  }
  
  // ============ Main Remote Control View ============
  initMainRemote() {
    const container = this.viewContainers[VIEWS.MAIN_REMOTE];
    if (!container) return;
    
    // Setup D-pad buttons
    const dpadButtons = container.querySelectorAll('[data-dpad-button]');
    dpadButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const direction = btn.dataset.dpadButton;
        this.dispatchEvent('dpad-pressed', { direction });
      });
    });
    
    // Setup quick action buttons
    const quickActions = container.querySelectorAll('[data-quick-action]');
    quickActions.forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.quickAction;
        this.dispatchEvent('action-pressed', { action });
      });
    });
    
    // Setup volume slider
    const volumeSlider = container.querySelector('[data-volume-slider]');
    if (volumeSlider) {
      volumeSlider.addEventListener('input', (e) => {
        const volume = e.target.value;
        this.dispatchEvent('volume-changed', { volume });
      });
    }
    
    // Setup playback controls
    const playbackBtns = container.querySelectorAll('[data-playback-control]');
    playbackBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const control = btn.dataset.playbackControl;
        this.dispatchEvent('playback-control', { control });
      });
    });
    
    // Setup power button
    const powerBtn = container.querySelector('[data-power-button]');
    if (powerBtn) {
      powerBtn.addEventListener('click', () => {
        this.dispatchEvent('power-pressed', {});
      });
    }
  }
  
  updateMainRemote(state) {
    const container = this.viewContainers[VIEWS.MAIN_REMOTE];
    if (!container) return;
    
    // Update connection status
    const statusIndicator = container.querySelector('[data-connection-status]');
    if (statusIndicator) {
      statusIndicator.textContent = state.connectionState;
    }
    
    // Update active device name
    const deviceName = container.querySelector('[data-device-name]');
    if (deviceName && state.activeDeviceId) {
      const device = state.pairedDevices.find(d => d.id === state.activeDeviceId);
      if (device) {
        deviceName.textContent = device.name;
      }
    }
  }
  
  // ============ Settings View ============
  initSettings() {
    const container = this.viewContainers[VIEWS.SETTINGS];
    if (!container) return;
    
    // Setup haptic feedback toggle
    const hapticToggle = container.querySelector('[data-setting="haptic-feedback"]');
    if (hapticToggle) {
      hapticToggle.addEventListener('change', (e) => {
        stateManager.updateUserSetting('hapticFeedback', e.target.checked);
      });
    }
    
    // Setup cursor sensitivity slider
    const sensitivitySlider = container.querySelector('[data-setting="cursor-sensitivity"]');
    if (sensitivitySlider) {
      sensitivitySlider.addEventListener('input', (e) => {
        stateManager.updateUserSetting('cursorSensitivity', e.target.value);
      });
    }
    
    // Setup Y-axis invert toggle
    const invertToggle = container.querySelector('[data-setting="invert-y-axis"]');
    if (invertToggle) {
      invertToggle.addEventListener('change', (e) => {
        stateManager.updateUserSetting('invertYAxis', e.target.checked);
      });
    }
    
    // Setup reset button
    const resetBtn = container.querySelector('[data-action="reset-defaults"]');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.dispatchEvent('reset-settings-requested', {});
      });
    }
  }
  
  updateSettings(state) {
    const container = this.viewContainers[VIEWS.SETTINGS];
    if (!container) return;
    
    // Update setting values
    const hapticToggle = container.querySelector('[data-setting="haptic-feedback"]');
    if (hapticToggle) {
      hapticToggle.checked = state.settings.hapticFeedback;
    }
    
    const sensitivitySlider = container.querySelector('[data-setting="cursor-sensitivity"]');
    if (sensitivitySlider) {
      sensitivitySlider.value = state.settings.cursorSensitivity;
    }
    
    const invertToggle = container.querySelector('[data-setting="invert-y-axis"]');
    if (invertToggle) {
      invertToggle.checked = state.settings.invertYAxis;
    }
  }
  
  // ============ Utility Methods ============
  dispatchEvent(eventName, detail = {}) {
    window.dispatchEvent(new CustomEvent(`ui:${eventName}`, { detail }));
  }
  
  addEventListener(eventName, handler) {
    window.addEventListener(`ui:${eventName}`, (e) => handler(e.detail));
  }
  
  showNotification(message, type = 'info') {
    // Simple notification system
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => notification.remove(), 3000);
  }
}

export const uiController = new UIController();
