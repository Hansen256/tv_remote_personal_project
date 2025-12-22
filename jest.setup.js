import { beforeEach, afterAll } from '@jest/globals';
import {
  installBrowserMocks,
  resetBrowserMocks,
  restoreBrowserMocks
} from './tests/browserMocks.js';

// Install browser mocks unless explicitly disabled via environment variable
// To run without mocks: SKIP_BROWSER_MOCKS=true npm test
if (process.env.SKIP_BROWSER_MOCKS !== 'true') {
  installBrowserMocks();

  beforeEach(() => {
    resetBrowserMocks();
  });

  afterAll(() => {
    restoreBrowserMocks();
  });
}
