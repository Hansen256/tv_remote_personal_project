// Application Constants

export const VIEWS = {
  ONBOARDING: 'onboarding',
  DEVICE_CONNECTION: 'device-connection',
  DEVICE_LIST: 'device-list',
  MAIN_REMOTE: 'main-remote',
  SETTINGS: 'settings',
};

export const CONNECTION_STATES = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  ERROR: 'error',
};

export const STORAGE_KEYS = {
  ONBOARDING_COMPLETE: 'onboarding-complete',
  PAIRED_DEVICES: 'paired-devices',
  ACTIVE_DEVICE_ID: 'active-device-id',
  USER_SETTINGS: 'user-settings',
  DEVICE_STATUS: 'device-status',
};

export const DEFAULT_SETTINGS = {
  hapticFeedback: true,
  cursorSensitivity: 75,
  invertYAxis: false,
  buttonMapping: {
    'btn-a': 'play-pause',
    'btn-b': 'back',
    'btn-r-trigger': 'volume-up',
  },
};

export const REMOTE_COMMANDS = {
  // Navigation
  UP: 'up',
  DOWN: 'down',
  LEFT: 'left',
  RIGHT: 'right',
  OK: 'ok',
  BACK: 'back',
  HOME: 'home',
  MENU: 'menu',
  
  // Media Control
  PLAY: 'play',
  PAUSE: 'pause',
  PREVIOUS: 'previous',
  NEXT: 'next',
  REPLAY_10S: 'replay-10s',
  FORWARD_10S: 'forward-10s',
  
  // Volume
  VOLUME_UP: 'volume-up',
  VOLUME_DOWN: 'volume-down',
  VOLUME_MUTE: 'mute',
  
  // Power
  POWER_OFF: 'power-off',
  POWER_ON: 'power-on',
};

export const ONBOARDING_SLIDES = 4;

export const DEVICE_FILTER_OPTIONS = {
  ALL: 'all',
  CONNECTED: 'connected',
  AVAILABLE: 'available',
};

export const BATTERY_THRESHOLDS = {
  LOW: 20,
  CRITICAL: 10,
};

export const HAPTIC_PATTERNS = {
  BUTTON_PRESS: [30],           // Single short pulse for button press
  VOLUME_CHANGE: [20, 50, 20],  // Double pulse for volume adjustment
  SUCCESS: [30, 50, 50, 50, 70], // Ascending pattern for successful connection
  ERROR: [100, 50, 100],        // Warning pattern for errors
  LONG_PRESS: [50],             // Slightly longer for important actions
};

export const HAPTIC_SETTINGS = {
  DEFAULT_INTENSITY: 1.0,       // Full intensity by default
  REDUCED_INTENSITY: 0.5,       // For reduced motion preference
};
