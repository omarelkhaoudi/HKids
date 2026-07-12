import express from 'express';
import { verifyToken } from './auth.js';

const router = express.Router();

router.get('/manifest', verifyToken, (req, res) => {
  res.json({
    version: 1,
    generated_at: new Date().toISOString(),
    capabilities: {
      offline_downloads: true,
      cloud_sync: true,
      mutation_queue: true,
      service_worker: true,
    },
    sync: {
      cloud: '/api/parental/me/cloud-sync',
      access_policy: '/api/parental/me/access-policy',
      activity_import: '/api/parental/me/activity-import',
    },
    content_types: ['book', 'generated-story', 'voice-message'],
    limits: {
      max_downloads: 60,
      favorites: 20,
      history: 50,
      progress: 50,
    },
    conflict_policy: {
      favorites: 'union',
      history: 'latest_timestamp',
      progress: 'greatest_page',
      downloads: 'registry_merge',
      queue: 'last_write_wins',
    },
  });
});

export default router;
