import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import { stateManager, resetStateManagerForTesting } from '../state.js';
import { STORAGE_KEYS, VIEWS } from '../constants.js';

describe('StateManager', () => {
  const originalMaxQueueSize = stateManager.getMaxCommandQueueSizeForTesting();

  beforeEach(() => {
    resetStateManagerForTesting();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    stateManager.setMaxCommandQueueSizeForTesting(originalMaxQueueSize);
  });

  test('initial view respects onboarding completion flag', () => {
    resetStateManagerForTesting();
    localStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETE, JSON.stringify(true));
    resetStateManagerForTesting();

    expect(stateManager.getCurrentView()).toBe(VIEWS.DEVICE_LIST);
    expect(stateManager.getOnboardingState()).toBe(true);
  });

  test('initial view defaults to onboarding when flag is missing or false', () => {
    resetStateManagerForTesting();

    expect(stateManager.getCurrentView()).toBe(VIEWS.ONBOARDING);
    expect(stateManager.getOnboardingState()).toBe(false);
  });

  test('setActiveDevice updates state and persists to storage', () => {
    stateManager.setActiveDevice('device-42');

    const storedValue = JSON.parse(localStorage.getItem(STORAGE_KEYS.ACTIVE_DEVICE_ID));
    expect(stateManager.getState().activeDeviceId).toBe('device-42');
    expect(storedValue).toBe('device-42');
  });

  test('recordCommand trims command history to the configured limit', () => {
    stateManager.setMaxCommandQueueSizeForTesting(3);

    ['up', 'down', 'left', 'right'].forEach((cmd) => stateManager.recordCommand(cmd));

    const queue = stateManager.getState().commandQueue;
    expect(queue).toHaveLength(3);
    expect(queue[0].command).toBe('down');
    expect(queue[1].command).toBe('left');
    expect(queue[2].command).toBe('right');
  });

  test('queued storage errors dispatch once initialization completes', () => {
    const dispatchSpy = jest.spyOn(window, 'dispatchEvent');
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const errorMessage = 'Failed to save';

    stateManager.notifyStorageError(errorMessage);
    expect(dispatchSpy).not.toHaveBeenCalled();

    stateManager.flushStorageErrors();
    expect(dispatchSpy).toHaveBeenCalledTimes(1);
    
    const dispatchedEvent = dispatchSpy.mock.calls[0][0];
    expect(dispatchedEvent.type).toBe('state:storage-error');
    expect(dispatchedEvent.detail.message).toBe(errorMessage);
    
    expect(warnSpy).toHaveBeenCalledWith(`[Storage Error] ${errorMessage}`);
  });
});
