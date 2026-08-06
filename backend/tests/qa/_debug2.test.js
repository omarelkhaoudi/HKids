import test from 'node:test';
import { initDatabase } from '../../database/init.js';

process.env.NODE_ENV = 'development';
process.env.SKIP_SERVER_START = '1';
process.env.JWT_SECRET ||= 'hkids-test-jwt-secret-with-32-characters-minimum';

await initDatabase();
const { app } = await import('../../server.js');

test('debug server context', async () => {
  console.log('[DEBUG] isTestRunnerContext:', JSON.stringify({
    NODE_TEST_CONTEXT: process.env.NODE_TEST_CONTEXT,
    argv1: process.argv[1],
    execArgv: process.execArgv.join(' ').slice(0, 100),
    app: typeof app,
  }));
});