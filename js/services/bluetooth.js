// Web Bluetooth API Wrapper

import { stateManager } from '../core/state.js';
import { CONNECTION_STATES, REMOTE_COMMANDS } from '../core/constants.js';

class BluetoothManager {
  constructor() {
    this.device = null;
    this.gattServer = null;
    this.characteristic = null;
    this.isSupported = this.checkBluetoothSupport();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 3;
    this.reconnectTimeout = null;
    this.operationInProgress = false;
  }
  
  checkBluetoothSupport() {
    return navigator.bluetooth !== undefined;
  }
  
  /**
   * Request device from user
   */
  async requestDevice(options = {}) {
    if (this.operationInProgress) {
      throw new Error('Another Bluetooth operation is in progress');
    }
    
    this.operationInProgress = true;
    
    try {
      if (!this.isSupported) {
        throw new Error('Bluetooth is not supported on this device');
      }
      
      const filters = options.filters || [
        { services: ['generic_access'] }
      ];
      
      try {
        stateManager.setScanning(true);
        
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
        
        // Provide user-friendly error messages
        if (error.name === 'NotFoundError') {
          throw new Error('No device selected. Please try pairing again.');
        } else if (error.name === 'SecurityError') {
          throw new Error('Bluetooth access denied. Check browser permissions.');
        } else {
          throw new Error(`Failed to discover device: ${error.message}`);
        }
      } finally {
        stateManager.setScanning(false);
      }
    } finally {
      this.operationInProgress = false;
    }
  }
  
  /**
   * Connect to GATT server
   */
  async connect() {
    if (this.operationInProgress) {
      throw new Error('Another Bluetooth operation is in progress');
    }
    
    this.operationInProgress = true;
    
    try {
      if (!this.device) {
        throw new Error('No device selected');
      }
      
      try {
        stateManager.setConnectionState(CONNECTION_STATES.CONNECTING);
        
        this.gattServer = await this.device.gatt.connect();
        this.reconnectAttempts = 0; // Reset on successful connection
        
        // Discover and store characteristic for command transmission
        try {
          const service = await this.gattServer.getPrimaryService('generic_access');
          this.characteristic = await service.getCharacteristic('device_name');
        } catch (error) {
          console.warn('Could not discover characteristic on initial connection:', error);
          // Continue even if characteristic discovery fails - some devices may not have this
          // or may use custom UUIDs not accessible this way
        }
        
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
        
        // Provide user-friendly error messages
        if (error.name === 'NetworkError') {
          throw new Error('Device out of range or turned off.');
        } else if (error.name === 'NotFoundError') {
          throw new Error('Device no longer available.');
        } else {
          throw new Error(`Connection failed: ${error.message}`);
        }
      }
    } finally {
      this.operationInProgress = false;
    }
  }
  
  /**
   * Disconnect from device
   */
  async disconnect() {
    if (this.operationInProgress) {
      throw new Error('Another Bluetooth operation is in progress');
    }
    
    this.operationInProgress = true;
    
    try {
      // Clear any pending reconnection attempts
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = null;
      }
      
      if (this.device && this.device.gatt.connected) {
        this.device.gatt.disconnect();
      }
      
      this.device = null;
      this.gattServer = null;
      this.characteristic = null;
      this.reconnectAttempts = 0;
      stateManager.setConnectionState(CONNECTION_STATES.DISCONNECTED);
      stateManager.setActiveDevice(null);
    } finally {
      this.operationInProgress = false;
    }
  }
  
  /**
   * Handle disconnection
   */
  onDisconnected() {
    console.log('Device disconnected');
    stateManager.setConnectionState(CONNECTION_STATES.DISCONNECTED);
    
    // Attempt reconnection with exponential backoff
    if (this.device && this.reconnectAttempts < this.maxReconnectAttempts) {
      const delay = Math.pow(2, this.reconnectAttempts) * 1000; // 1s, 2s, 4s
      this.reconnectAttempts++;
      
      console.log(`Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);
      
      // Clear any existing reconnection timeout before setting a new one
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = null;
      }
      
      this.reconnectTimeout = setTimeout(async () => {
        try {
          stateManager.setConnectionState(CONNECTION_STATES.CONNECTING);
          await this.device.gatt.connect();
          this.gattServer = this.device.gatt;
          
          // Re-discover and set characteristic after reconnection
          try {
            const service = await this.gattServer.getPrimaryService('generic_access');
            this.characteristic = await service.getCharacteristic('device_name');
          } catch (error) {
            console.warn('Could not rediscover characteristic after reconnection:', error);
            // Continue even if characteristic discovery fails - some devices may not have this
          }
          
          this.reconnectAttempts = 0;
          stateManager.setConnectionState(CONNECTION_STATES.CONNECTED);
          console.log('Reconnected successfully');
        } catch (error) {
          console.error('Reconnection failed:', error);
          // Schedule next retry inline if attempts remain
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            const nextDelay = Math.pow(2, this.reconnectAttempts) * 1000;
            this.reconnectAttempts++;
            console.log(`Scheduling next reconnection attempt in ${nextDelay}ms`);
            
            this.reconnectTimeout = setTimeout(() => {
              this.onDisconnected();
            }, nextDelay);
          } else {
            // Max attempts reached, clean up
            this.device = null;
            this.gattServer = null;
            this.characteristic = null;
            this.reconnectAttempts = 0;
            stateManager.setActiveDevice(null);
          }
        }
      }, delay);
    } else {
      // Max attempts reached, clean up
      this.device = null;
      this.gattServer = null;
      this.characteristic = null;
      this.reconnectAttempts = 0;
      stateManager.setActiveDevice(null);
    }
  }
  
  /**
   * Send command to remote device
   */
  async sendCommand(command) {
    if (!this.gattServer || !this.gattServer.connected) {
      console.warn('Device not connected');
      throw new Error('Device is not connected. Please reconnect.');
    }
    
    if (!this.characteristic) {
      console.warn('Characteristic not available for command transmission');
      throw new Error('Device characteristic not available. Cannot send command.');
    }
    
    try {
      // Log command for debugging
      console.log(`Sending command: ${command}`);
      
      // Record command in state
      stateManager.recordCommand(command);
      
      // Write command to BLE characteristic
      const encoder = new TextEncoder();
      await this.characteristic.writeValue(encoder.encode(command));
      
      return true;
    } catch (error) {
      console.error('Error sending command:', error);
      
      // Check if it's a connection error
      if (error.name === 'NetworkError' || error.name === 'NotConnectedError') {
        stateManager.setConnectionState(CONNECTION_STATES.ERROR);
        throw new Error('Lost connection to device. Please reconnect.');
      }
      
      throw new Error(`Failed to send command: ${error.message}`);
    }
  }
  
  /**
   * Send command sequence (for volume, etc.)
   */
  async sendCommandSequence(commands, options = {}) {
    const { delay = 100, stopOnError = true } = options;
    const results = { successes: [], failures: [] };

    for (const command of commands) {
      try {
        await this.sendCommand(command);
        results.successes.push(command);
      } catch (error) {
        console.error(`Failed to send command '${command}':`, error);
        results.failures.push({ command, error });
        
        if (stopOnError) {
          throw error;
        }
      }
      
      // Always wait the delay, even on failure
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    return results;
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
