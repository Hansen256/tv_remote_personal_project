// Web Bluetooth API Wrapper

import { stateManager } from './state.js';
import { CONNECTION_STATES, REMOTE_COMMANDS } from './constants.js';

class BluetoothManager {
  constructor() {
    this.device = null;
    this.gattServer = null;
    this.characteristic = null;
    this.isSupported = this.checkBluetoothSupport();
  }
  
  checkBluetoothSupport() {
    return navigator.bluetooth !== undefined;
  }
  
  /**
   * Request device from user
   */
  async requestDevice(options = {}) {
    if (!this.isSupported) {
      throw new Error('Bluetooth is not supported on this device');
    }
    
    const filters = options.filters || [
      { services: ['generic_access'] }
    ];
    
    try {
      stateManager.setScanning(true);
      stateManager.setConnectionState(CONNECTION_STATES.CONNECTING);
      
      this.device = await navigator.bluetooth.requestDevice({
        filters,
        optionalServices: [
          'battery_service',
          'generic_access',
          'generic_attribute'
        ]
      });
      
      this.device.addEventListener('gattserverdisconnected', () => {
        this.onDisconnected();
      });
      
      return this.device;
    } catch (error) {
      console.error('Error requesting Bluetooth device:', error);
      stateManager.setConnectionState(CONNECTION_STATES.ERROR);
      throw error;
    } finally {
      stateManager.setScanning(false);
    }
  }
  
  /**
   * Connect to GATT server
   */
  async connect() {
    if (!this.device) {
      throw new Error('No device selected');
    }
    
    try {
      stateManager.setConnectionState(CONNECTION_STATES.CONNECTING);
      
      this.gattServer = await this.device.gatt.connect();
      stateManager.setConnectionState(CONNECTION_STATES.CONNECTED);
      
      // Store as paired device
      const pairedDevice = {
        id: this.device.id,
        name: this.device.name,
        connected: true,
        lastConnected: new Date().toISOString()
      };
      
      stateManager.addPairedDevice(pairedDevice);
      stateManager.setActiveDevice(this.device.id);
      
      return this.gattServer;
    } catch (error) {
      console.error('Error connecting to device:', error);
      stateManager.setConnectionState(CONNECTION_STATES.ERROR);
      throw error;
    }
  }
  
  /**
   * Disconnect from device
   */
  async disconnect() {
    if (this.device && this.device.gatt.connected) {
      this.device.gatt.disconnect();
      this.onDisconnected();
    }
  }
  
  /**
   * Handle disconnection
   */
  onDisconnected() {
    this.device = null;
    this.gattServer = null;
    this.characteristic = null;
    stateManager.setConnectionState(CONNECTION_STATES.DISCONNECTED);
    stateManager.setActiveDevice(null);
  }
  
  /**
   * Send command to remote device
   */
  async sendCommand(command) {
    if (!this.gattServer || !this.gattServer.connected) {
      console.warn('Device not connected');
      return false;
    }
    
    try {
      // Mock implementation - in production, this would write to actual BLE characteristic
      console.log(`Sending command: ${command}`);
      
      stateManager.recordCommand(command);
      
      // Simulate BLE write
      if (this.characteristic) {
        const encoder = new TextEncoder();
        await this.characteristic.writeValue(encoder.encode(command));
      }
      
      return true;
    } catch (error) {
      console.error('Error sending command:', error);
      return false;
    }
  }
  
  /**
   * Send command sequence (for volume, etc.)
   */
  async sendCommandSequence(commands, delay = 100) {
    for (const command of commands) {
      await this.sendCommand(command);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  /**
   * Get device battery level
   */
  async getBatteryLevel() {
    if (!this.gattServer || !this.gattServer.connected) {
      return null;
    }
    
    try {
      const batteryService = await this.gattServer.getPrimaryService('battery_service');
      const batteryLevelCharacteristic = await batteryService.getCharacteristic('battery_level');
      const value = await batteryLevelCharacteristic.readValue();
      return value.getUint8(0);
    } catch (error) {
      console.warn('Could not read battery level:', error);
      return null;
    }
  }
  
  /**
   * Get device name
   */
  getDeviceName() {
    return this.device?.name || 'Unknown Device';
  }
  
  /**
   * Get device ID
   */
  getDeviceId() {
    return this.device?.id || null;
  }
  
  /**
   * Check if connected
   */
  isConnected() {
    return this.device && this.device.gatt.connected;
  }
  
  /**
   * Scan for available devices (simulated - actual scanning requires persistent characteristics)
   */
  async scanForDevices() {
    if (!this.isSupported) {
      console.warn('Bluetooth not supported');
      return [];
    }
    
    // Mock device list - in production, would implement actual scanning
    const mockDevices = [
      { id: 'device-1', name: 'Samsung TV', signal: 85 },
      { id: 'device-2', name: 'LG Remote', signal: 65 },
      { id: 'device-3', name: 'Sony Soundbar', signal: 75 }
    ];
    
    stateManager.setDiscoveredDevices(mockDevices);
    return mockDevices;
  }
}

// Singleton instance
export const bluetoothManager = new BluetoothManager();
