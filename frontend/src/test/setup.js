import { afterEach, vi } from 'vitest';

// React 18+ expects test runners to opt into act() support.
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const ROUTER_FUTURE_FLAGS = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
};

afterEach(() => {
  document.body.innerHTML = '';
  vi.clearAllMocks();
});

export { ROUTER_FUTURE_FLAGS };
