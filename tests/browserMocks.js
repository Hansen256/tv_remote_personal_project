import { jest } from '@jest/globals';

const originals = {
  localStorage: null,
  matchMedia: null,
  bluetooth: null,
  vibrate: null,
  requestAnimationFrame: null,
  cancelAnimationFrame: null
};

const FRAME_TIME_MS = 16; // Approximate time for ~60fps (1000ms/60 ≈ 16.67ms)

const storageBacking = new Map();

const createLocalStorageMock = () => ({
  getItem: (key) => (storageBacking.has(key) ? storageBacking.get(key) : null),
  setItem: (key, value) => {
    storageBacking.set(key, String(value));
  },
  removeItem: (key) => {
    storageBacking.delete(key);
  },
  clear: () => {
    storageBacking.clear();
  },
  key: (index) => Array.from(storageBacking.keys())[index] ?? null,
  get length() {
    return storageBacking.size;
  }
});

const createMatchMediaMock = () => {
  const listenerSet = new Set();
  
  return jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: (listener) => {
      // Legacy API: always uses 'change' event
      listenerSet.add({ event: 'change', listener });
    },
    removeListener: (listener) => {
      // Legacy API: removes listener registered with addListener (event: 'change')
      for (const entry of listenerSet) {
        if (entry.event === 'change' && entry.listener === listener) {
          listenerSet.delete(entry);
          break;
        }
      }
    },
    addEventListener: (event, listener) => {
      // Modern API: explicit event type
      listenerSet.add({ event, listener });
    },
    removeEventListener: (event, listener) => {
      // Modern API: removes listener by matching event and listener function
      for (const entry of listenerSet) {
        if (entry.event === event && entry.listener === listener) {
          listenerSet.delete(entry);
          break;
        }
      }
    },
    dispatchEvent: jest.fn()
  }));
};

const createBluetoothMock = () => ({
  requestDevice: jest.fn().mockResolvedValue({
    id: 'mock-device',
    name: 'Mock Device',
    gatt: {
      connect: jest.fn().mockResolvedValue({
        getPrimaryService: jest.fn().mockResolvedValue({
          getCharacteristic: jest.fn().mockResolvedValue({
            writeValueWithResponse: jest.fn().mockResolvedValue(undefined)
          })
        })
      }),
      disconnect: jest.fn()
    }
  })
});

const createAnimationFrameMock = () => {
  let frameId = 0;
  const frameMap = new Map();
  let startTime = performance.now();
  
  return {
    requestAnimationFrame: jest.fn((cb) => {
      const id = ++frameId;
      const timeoutId = setTimeout(() => {
        cb(performance.now() - startTime); // Pass DOMHighResTimeStamp to callback
      }, FRAME_TIME_MS);
      frameMap.set(id, timeoutId);
      return id; // Return numeric ID, not Timeout object
    }),
    cancelAnimationFrame: jest.fn((id) => {
      const timeoutId = frameMap.get(id);
      if (timeoutId) {
        clearTimeout(timeoutId);
        frameMap.delete(id);
      }
    })
  };
};

const ensureCustomEvent = () => {
  if (typeof globalThis.CustomEvent === 'function') {
    return;
  }
  
  class CustomEvent extends Event {
    constructor(event, params = { bubbles: false, cancelable: false, detail: null }) {
      super(event, params);
      this.detail = params.detail;
    }
  }
  
  globalThis.CustomEvent = CustomEvent;
};

export const installBrowserMocks = () => {
  const localStorageMock = createLocalStorageMock();
  originals.localStorage = globalThis.localStorage ?? null;
  Object.defineProperty(globalThis, 'localStorage', {
    value: localStorageMock,
    configurable: true,
    writable: true
  });
  if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      configurable: true,
      writable: true
    });
  }

  const bluetoothMock = createBluetoothMock();
  originals.bluetooth = navigator.bluetooth ?? null;
  Object.defineProperty(navigator, 'bluetooth', {
    value: bluetoothMock,
    configurable: true
  });


  originals.vibrate = navigator.vibrate ?? null;
  navigator.vibrate = jest.fn();

  if (typeof window !== 'undefined') {
    originals.matchMedia = window.matchMedia ?? null;
    window.matchMedia = createMatchMediaMock();

    const { requestAnimationFrame: rafMock, cancelAnimationFrame: cafMock } = createAnimationFrameMock();
    originals.requestAnimationFrame = window.requestAnimationFrame ?? null;
    window.requestAnimationFrame = rafMock;

    originals.cancelAnimationFrame = window.cancelAnimationFrame ?? null;
    window.cancelAnimationFrame = cafMock;
  }

  ensureCustomEvent();
};

export const resetBrowserMocks = () => {
  storageBacking.clear();
  jest.clearAllMocks();
};

export const restoreBrowserMocks = () => {
  if (originals.localStorage) {
    Object.defineProperty(globalThis, 'localStorage', {
      value: originals.localStorage,
      configurable: true,
      writable: true
    });
    if (typeof window !== 'undefined') {
      Object.defineProperty(window, 'localStorage', {
        value: originals.localStorage,
        configurable: true,
        writable: true
      });
    }
  }

  if (originals.bluetooth) {
    Object.defineProperty(navigator, 'bluetooth', {
      value: originals.bluetooth,
      configurable: true
    });
  }

  if (originals.vibrate) {
    navigator.vibrate = originals.vibrate;
  }

  if (typeof window !== 'undefined') {
    if (originals.matchMedia) {
      window.matchMedia = originals.matchMedia;
    }

    if (originals.requestAnimationFrame) {
      window.requestAnimationFrame = originals.requestAnimationFrame;
    }

    if (originals.cancelAnimationFrame) {
      window.cancelAnimationFrame = originals.cancelAnimationFrame;
    }
  }
};
