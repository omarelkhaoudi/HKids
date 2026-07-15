import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';

before(() => {
  delete process.env.SENTRY_DSN;
});

describe('backend sentry config', async () => {
  const mod = await import('../config/sentry.js');

  it('exports initSentry function', () => {
    assert.equal(typeof mod.initSentry, 'function');
  });

  it('exports captureException function', () => {
    assert.equal(typeof mod.captureException, 'function');
  });

  it('exports captureMessage function', () => {
    assert.equal(typeof mod.captureMessage, 'function');
  });

  it('exports setUser function', () => {
    assert.equal(typeof mod.setUser, 'function');
  });

  it('exports addBreadcrumb function', () => {
    assert.equal(typeof mod.addBreadcrumb, 'function');
  });

  it('exports startSpan function', () => {
    assert.equal(typeof mod.startSpan, 'function');
  });

  it('isEnabled returns false without DSN', () => {
    assert.equal(mod.isEnabled(), false);
  });

  it('initSentry is safe to call without DSN', () => {
    assert.doesNotThrow(() => mod.initSentry());
    assert.equal(mod.isEnabled(), false);
  });

  it('captureException is a no-op without DSN', () => {
    assert.doesNotThrow(() => mod.captureException(new Error('test')));
  });

  it('captureMessage is a no-op without DSN', () => {
    assert.doesNotThrow(() => mod.captureMessage('test'));
  });

  it('setUser is a no-op without DSN', () => {
    assert.doesNotThrow(() => mod.setUser({ id: 1, username: 'test' }));
    assert.doesNotThrow(() => mod.setUser(null));
  });

  it('addBreadcrumb is a no-op without DSN', () => {
    assert.doesNotThrow(() => mod.addBreadcrumb({ category: 'test', message: 'hello' }));
  });

  it('startSpan executes callback without DSN', () => {
    const result = mod.startSpan('test', 'op', () => 42);
    assert.equal(result, 42);
  });

  it('re-exports Sentry namespace', () => {
    assert.ok(mod.Sentry);
    assert.equal(typeof mod.Sentry.init, 'function');
  });
});
