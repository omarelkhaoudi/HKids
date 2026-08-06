import test from 'node:test';

test('debug env detection', () => {
  console.log('NODE_TEST_CONTEXT:', JSON.stringify(process.env.NODE_TEST_CONTEXT));
  console.log('execArgv:', JSON.stringify(process.execArgv));
  console.log('argv:', JSON.stringify(process.argv));
  console.log('isChild:', typeof process.send === 'function');
});