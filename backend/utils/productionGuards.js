export function isDevOnlyEndpointEnabled(nodeEnv = process.env.NODE_ENV) {
  return nodeEnv !== 'production';
}
