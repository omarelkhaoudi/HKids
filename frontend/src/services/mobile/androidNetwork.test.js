import { describe, expect, it } from 'vitest';
import { normalizeNetworkStatus } from './androidNetwork';

describe('androidNetwork', () => {
  it('normalizes native network status with stable metadata', () => {
    const previous = {
      online: false,
      connectionType: 'none',
      changedAt: 100,
      stableAt: 100,
    };

    const next = normalizeNetworkStatus({ connected: true, connectionType: 'wifi' }, previous);

    expect(next.online).toBe(true);
    expect(next.connectionType).toBe('wifi');
    expect(next.changedAt).toBeGreaterThanOrEqual(previous.changedAt);
    expect(next.stableAt).toBeGreaterThanOrEqual(previous.stableAt);
  });

  it('keeps the prior stable timestamp when the status has not changed', () => {
    const previous = {
      online: true,
      connectionType: 'wifi',
      changedAt: 100,
      stableAt: 42,
    };

    const next = normalizeNetworkStatus({ connected: true, connectionType: 'wifi' }, previous);

    expect(next.online).toBe(true);
    expect(next.connectionType).toBe('wifi');
    expect(next.stableAt).toBe(42);
  });
});
