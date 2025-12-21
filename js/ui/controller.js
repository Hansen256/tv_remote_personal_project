// UI Controller - Manages View Rendering and Navigation

import { stateManager } from '../core/state.js';
import { VIEWS } from '../core/constants.js';

const SLIDE_COUNT = 4;

class UIController {
  constructor() {
    this.currentView = null;
    this.viewContainers = {};
    this.viewScripts = {};
    this.notificationContainer = null;
    this.previousViewState = null;
    this.modal = document.getElementById('confirmation-modal');
    this.modalMessage = document.getElementById('modal-message');
    this.modalCancel = document.getElementById('modal-cancel');
    this.modalConfirm = document.getElementById('modal-confirm');
    this.renameModal = document.getElementById('rename-modal');
    this.renameInput = document.getElementById('rename-input');
    this.renameCancel = document.getElementById('rename-cancel');
    this.renameConfirm = document.getElementById('rename-confirm');
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
    
    // Update view-specific UI based on state only if relevant state changed
    const currentViewState = this.getViewState(state);
    if (JSON.stringify(currentViewState) !== JSON.stringify(this.previousViewState)) {
      this.updateActiveView(state);
      this.previousViewState = currentViewState;
    }
  }
  
  /**
   * Get the state slice relevant to the current view
   */
  getViewState(state) {
    switch (this.currentView) {
      case VIEWS.ONBOARDING:
        return { onboardingSlide: state.onboardingSlide };
      case VIEWS.DEVICE_CONNECTION:
        return { discoveredDevices: state.discoveredDevices, isScanning: state.isScanning };
      case VIEWS.DEVICE_LIST:
        return { pairedDevices: state.pairedDevices, activeDeviceId: state.activeDeviceId, connectionState: state.connectionState };
      case VIEWS.MAIN_REMOTE:
        return { pairedDevices: state.pairedDevices, activeDeviceId: state.activeDeviceId, connectionState: state.connectionState, deviceStatus: state.deviceStatus };
      case VIEWS.SETTINGS:
        return { settings: state.settings, commandQueue: state.commandQueue };
      default:
        return {};
    }
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
    
    // Return early if already initialized to prevent duplicate listeners
    if (this._onboardingInitialized) return;
    
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
        if (nextSlide >= SLIDE_COUNT) {
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
    
    // Mark as initialized
    this._onboardingInitialized = true;
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
    
    // Return early if already initialized to prevent duplicate listeners
    if (this._deviceConnectionInitialized) return;
    
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
    
    // Mark as initialized
    this._deviceConnectionInitialized = true;
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
      
      // Create input element
      const input = document.createElement('input');
      input.setAttribute('type', 'radio');
      input.setAttribute('name', 'device');
      input.setAttribute('value', String(device.id));
      input.setAttribute('data-device-radio', '');
      input.dataset.deviceName = device.name;
      deviceEl.appendChild(input);
      
      // Create label element
      const label = document.createElement('label');
      label.textContent = device.name;
      deviceEl.appendChild(label);
      
      // Create signal indicator element
      const signalIndicator = document.createElement('div');
      signalIndicator.className = 'signal-indicator';
      const signalValue = Number(device.signal) || 0;
      signalIndicator.style.width = `${signalValue}%`;
      deviceEl.appendChild(signalIndicator);
      
      fragment.appendChild(deviceEl);
    });
    container.innerHTML = '';
    container.appendChild(fragment);
  }
  
  // ============ Device List View ============
  initDeviceList() {
    const container = this.viewContainers[VIEWS.DEVICE_LIST];
    if (!container) return;
    
    // Return early if already initialized to prevent duplicate listeners
    if (this._deviceListInitialized) return;
    
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
    
    // Setup device selection and rename with event delegation
    const deviceList = container.querySelector('[data-saved-devices]');
    if (deviceList) {
      deviceList.addEventListener('click', async (e) => {
        const selectBtn = e.target.closest('[data-action="select-device"]');
        if (selectBtn) {
          const deviceId = selectBtn.dataset.deviceId;
          stateManager.setActiveDevice(deviceId);
          stateManager.setCurrentView(VIEWS.MAIN_REMOTE);
          return;
        }
        
        const renameBtn = e.target.closest('[data-action="rename-device"]');
        if (renameBtn) {
          const deviceId = renameBtn.dataset.deviceId;
          const device = state.pairedDevices.find(d => d.id === deviceId);
          if (device) {
            const newName = await this.showRenameModal(device.customName || device.name);
            if (newName && newName !== (device.customName || device.name)) {
              stateManager.updateDeviceName(deviceId, newName);
              this.showNotification('Device renamed successfully', 'success');
            }
          }
        }
      });
    }
    
    // Mark as initialized
    this._deviceListInitialized = true;
  }
  
  updateDeviceList(state) {
    const container = this.viewContainers[VIEWS.DEVICE_LIST];
    if (!container) return;
    
    // Update active device section
    const activeDeviceCard = container.querySelector('[data-active-device]');
    if (activeDeviceCard && state.activeDeviceId) {
      const device = state.pairedDevices.find(d => d.id === state.activeDeviceId);
      if (device) {
        // Clear existing content
        activeDeviceCard.innerHTML = '';
        
        // Create device card
        const deviceCard = document.createElement('div');
        deviceCard.className = 'device-card active';
        
        // Create and add device name
        const deviceName = document.createElement('h3');
        deviceName.textContent = device.name;
        deviceCard.appendChild(deviceName);
        
        // Create and add connection status
        const connectionStatus = document.createElement('p');
        connectionStatus.className = 'connection-status';
        connectionStatus.textContent = state.connectionState;
        deviceCard.appendChild(connectionStatus);
        
        // Create and add ping animation
        const pingAnimation = document.createElement('div');
        pingAnimation.className = 'ping-animation';
        deviceCard.appendChild(pingAnimation);
        
        // Create and add locate device button
        const locateBtn = document.createElement('button');
        locateBtn.setAttribute('data-action', 'locate-device');
        locateBtn.textContent = 'Locate';
        locateBtn.addEventListener('click', () => {
          console.log('Locate device:', device.name);
        });
        deviceCard.appendChild(locateBtn);
        
        // Create and add disconnect button
        const disconnectBtn = document.createElement('button');
        disconnectBtn.setAttribute('data-action', 'disconnect');
        disconnectBtn.textContent = 'Disconnect';
        disconnectBtn.addEventListener('click', () => {
          this.dispatchEvent('disconnect', { deviceId: device.id });
        });
        deviceCard.appendChild(disconnectBtn);
        
        activeDeviceCard.appendChild(deviceCard);
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
      
      // Create device info section
      const deviceInfo = document.createElement('div');
      deviceInfo.className = 'device-info';
      
      const deviceName = document.createElement('h4');
      deviceName.textContent = device.customName || device.name;
      deviceInfo.appendChild(deviceName);
      
      const status = document.createElement('p');
      status.textContent = device.connected ? 'Connected' : 'Offline';
      deviceInfo.appendChild(status);
      
      deviceEl.appendChild(deviceInfo);
      
      // Create actions container
      const actions = document.createElement('div');
      actions.className = 'flex items-center gap-2';
      
      // Add rename button
      const renameBtn = document.createElement('button');
      renameBtn.setAttribute('data-action', 'rename-device');
      renameBtn.setAttribute('data-device-id', String(device.id));
      renameBtn.className = 'text-gray-400 hover:text-blue-400 transition';
      const renameIcon = document.createElement('span');
      renameIcon.className = 'material-symbols-outlined text-sm';
      renameIcon.textContent = 'edit';
      renameBtn.appendChild(renameIcon);
      actions.appendChild(renameBtn);
      
      // Add select button
      const button = document.createElement('button');
      button.setAttribute('data-action', 'select-device');
      button.setAttribute('data-device-id', String(device.id));
      const icon = document.createElement('span');
      icon.className = 'material-symbols-outlined';
      icon.textContent = 'chevron_right';
      button.appendChild(icon);
      actions.appendChild(button);
      
      deviceEl.appendChild(actions);
      
      fragment.appendChild(deviceEl);
    });
    container.innerHTML = '';
    container.appendChild(fragment);
  }
  
  // ============ Main Remote Control View ============
  initMainRemote() {
    const container = this.viewContainers[VIEWS.MAIN_REMOTE];
    if (!container) return;
    
    // Return early if already initialized to prevent duplicate listeners
    if (this._mainRemoteInitialized) return;
    
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
    const volumeDisplay = container.querySelector('[data-volume-display]');
    if (volumeSlider) {
      volumeSlider.addEventListener('input', (e) => {
        const volume = e.target.value;
        if (volumeDisplay) {
          volumeDisplay.textContent = `${volume}%`;
        }
        this.dispatchEvent('volume-changed', { volume });
      });
    }
    
    // Setup volume buttons with long-press detection
    const volumeButtons = container.querySelectorAll('[data-volume-button]');
    volumeButtons.forEach(btn => {
      let pressTimer = null;
      let isLongPress = false;
      
      const startPress = () => {
        isLongPress = false;
        const direction = btn.dataset.volumeButton;
        
        // Immediate single command
        this.dispatchEvent('volume-button-pressed', { direction, isLongPress: false });
        
        // Start long press detection
        pressTimer = setTimeout(() => {
          isLongPress = true;
          this.dispatchEvent('volume-long-press-start', { direction });
        }, 500); // 500ms threshold for long press
      };
      
      const endPress = () => {
        if (pressTimer) {
          clearTimeout(pressTimer);
          pressTimer = null;
        }
        
        if (isLongPress) {
          this.dispatchEvent('volume-long-press-end', {});
        }
      };
      
      btn.addEventListener('mousedown', startPress);
      btn.addEventListener('touchstart', startPress);
      btn.addEventListener('mouseup', endPress);
      btn.addEventListener('mouseleave', endPress);
      btn.addEventListener('touchend', endPress);
      btn.addEventListener('touchcancel', endPress);
    });
    
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
    
    // Mark as initialized
    this._mainRemoteInitialized = true;
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
        deviceName.textContent = device.name || device.customName || 'Remote';
      }
    }
    
    // Update battery level
    const batteryLevel = container.querySelector('[data-battery-level]');
    if (batteryLevel && state.activeDeviceId) {
      const deviceStatus = state.deviceStatus[state.activeDeviceId];
      if (deviceStatus && deviceStatus.battery !== undefined) {
        batteryLevel.textContent = `${deviceStatus.battery}%`;
      } else {
        batteryLevel.textContent = '--';
      }
    }
  }
  
  // ============ Settings View ============
  initSettings() {
    const container = this.viewContainers[VIEWS.SETTINGS];
    if (!container) return;
    
    // Return early if already initialized to prevent duplicate listeners
    if (this._settingsInitialized) return;
    
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
    
    // Setup clear history button
    const clearHistoryBtn = container.querySelector('[data-action="clear-history"]');
    if (clearHistoryBtn) {
      clearHistoryBtn.addEventListener('click', () => {
        stateManager.clearCommandQueue();
        this.showNotification('Command history cleared', 'info');
      });
    }
    
    // Mark as initialized
    this._settingsInitialized = true;
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
    
    // Update command history
    const historyContainer = container.querySelector('[data-command-history]');
    if (historyContainer && state.commandQueue) {
      if (state.commandQueue.length === 0) {
        historyContainer.innerHTML = '<p class="text-gray-400 text-sm text-center">No commands yet</p>';
      } else {
        // Show last 10 commands
        const recentCommands = state.commandQueue.slice(-10).reverse();
        historyContainer.innerHTML = recentCommands.map((cmd, idx) => {
          const timestamp = new Date().toLocaleTimeString();
          return `<div class="text-xs py-1 border-b border-gray-700 last:border-0">
            <span class="text-gray-400">${timestamp}</span>
            <span class="text-white ml-2">${cmd}</span>
          </div>`;
        }).join('');
      }
    }
  }
  
  // ============ Utility Methods ============
  dispatchEvent(eventName, detail = {}) {
    window.dispatchEvent(new CustomEvent(`ui:${eventName}`, { detail }));
  }
  
  addEventListener(eventName, handler) {
    const boundHandler = (e) => handler(e.detail);
    window.addEventListener(`ui:${eventName}`, boundHandler);
    return () => window.removeEventListener(`ui:${eventName}`, boundHandler);
  }
  
  /**
   * Get or create notification container for stacking
   */
  getNotificationContainer() {
    if (!this.notificationContainer) {
      this.notificationContainer = document.createElement('div');
      this.notificationContainer.id = 'notification-container';
      this.notificationContainer.style.position = 'fixed';
      this.notificationContainer.style.top = '16px';
      this.notificationContainer.style.right = '16px';
      this.notificationContainer.style.zIndex = '9999';
      this.notificationContainer.style.display = 'flex';
      this.notificationContainer.style.flexDirection = 'column';
      this.notificationContainer.style.gap = '8px';
      this.notificationContainer.style.pointerEvents = 'none';
      document.body.appendChild(this.notificationContainer);
    }
    return this.notificationContainer;
  }
  
  showNotification(message, type = 'info') {
    try {
      // Create notification element
      const notification = document.createElement('div');
      notification.className = `notification notification-${type}`;
      notification.textContent = message;
      notification.setAttribute('role', 'alert');
      notification.style.pointerEvents = 'auto';
      
      // Add to stacked container
      const container = this.getNotificationContainer();
      container.appendChild(notification);
      
      // Remove notification after timeout
      setTimeout(() => {
        notification.remove();
      }, 3000);
    } catch (error) {
      console.error('Failed to show notification:', error);
      // Fallback to console if DOM manipulation fails
      console[type === 'error' ? 'error' : 'warn'](`[${type.toUpperCase()}] ${message}`);
    }
  }
  
  /**
   * Show confirmation modal
   */
  showConfirmation(message) {
    return new Promise((resolve) => {
      this.modalMessage.textContent = message;
      this.modal.classList.remove('hidden');
      
      const handleConfirm = () => {
        cleanup();
        resolve(true);
      };
      
      const handleCancel = () => {
        cleanup();
        resolve(false);
      };
      
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          handleCancel();
        } else if (e.key === 'Enter') {
          handleConfirm();
        }
      };
      
      const cleanup = () => {
        this.modal.classList.add('hidden');
        this.modalCancel.removeEventListener('click', handleCancel);
        this.modalConfirm.removeEventListener('click', handleConfirm);
        document.removeEventListener('keydown', handleKeyDown);
      };
      
      this.modalCancel.addEventListener('click', handleCancel);
      this.modalConfirm.addEventListener('click', handleConfirm);
      document.addEventListener('keydown', handleKeyDown);
      
      // Focus the cancel button by default
      this.modalCancel.focus();
    });
  }
  
  showRenameModal(currentName) {
    return new Promise((resolve) => {
      this.renameInput.value = currentName;
      this.renameModal.classList.remove('hidden');
      
      const handleConfirm = () => {
        const newName = this.renameInput.value.trim();
        cleanup();
        resolve(newName || null);
      };
      
      const handleCancel = () => {
        cleanup();
        resolve(null);
      };
      
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          handleCancel();
        } else if (e.key === 'Enter') {
          handleConfirm();
        }
      };
      
      const cleanup = () => {
        this.renameModal.classList.add('hidden');
        this.renameCancel.removeEventListener('click', handleCancel);
        this.renameConfirm.removeEventListener('click', handleConfirm);
        this.renameInput.removeEventListener('keydown', handleKeyDown);
      };
      
      this.renameCancel.addEventListener('click', handleCancel);
      this.renameConfirm.addEventListener('click', handleConfirm);
      this.renameInput.addEventListener('keydown', handleKeyDown);
      
      // Focus the input
      this.renameInput.focus();
      this.renameInput.select();
    });
  }
}

export const uiController = new UIController();
