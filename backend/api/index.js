// Vercel serverless function entry point
import app from '../server.js';

// Export handler for Vercel
export default (req, res) => {
  return app(req, res);
};

