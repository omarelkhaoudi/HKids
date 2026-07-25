import express from 'express';
import { verifyToken } from './auth.js';
import {
  getCatalogManifestExtras,
  listCatalogVersions,
  getCurrentCatalogVersion,
  getCatalogChangelog,
} from '../services/content/catalogVersionService.js';

const router = express.Router();

router.get('/manifest', verifyToken, async (req, res) => {
  try {
    const catalogExtras = await getCatalogManifestExtras();
    res.json({
      version: 2,
      generated_at: new Date().toISOString(),
      capabilities: {
        offline_downloads: true,
        cloud_sync: true,
        mutation_queue: true,
        service_worker: true,
        catalog_versioning: true,
        content_packs: true,
        incremental_downloads: true,
        pause_resume: true,
        safe_rollback: true,
      },
      sync: {
        cloud: '/api/parental/me/cloud-sync',
        access_policy: '/api/parental/me/access-policy',
        activity_import: '/api/parental/me/activity-import',
        catalog: '/api/offline/catalog/current',
      },
      content_types: ['book', 'generated-story', 'voice-message', 'pack', 'quiz', 'game'],
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
        catalog: 'published_wins_with_local_rollback',
      },
      ...catalogExtras,
    });
  } catch (error) {
    console.error('Error building offline manifest:', error);
    res.status(500).json({ error: 'Failed to build offline manifest' });
  }
});

router.get('/catalog/current', verifyToken, async (req, res) => {
  try {
    res.json(await getCurrentCatalogVersion());
  } catch (error) {
    console.error('Error fetching current catalog:', error);
    res.status(500).json({ error: 'Failed to fetch catalog' });
  }
});

router.get('/catalog/versions', verifyToken, async (req, res) => {
  try {
    res.json(await listCatalogVersions({
      includeArchived: String(req.query.include_archived || 'false') === 'true',
    }));
  } catch (error) {
    console.error('Error listing catalog versions:', error);
    res.status(500).json({ error: 'Failed to list catalog versions' });
  }
});

router.get('/catalog/changelog', verifyToken, async (req, res) => {
  try {
    const since = req.query.since || null;
    res.json({
      since,
      changes: await getCatalogChangelog(since),
    });
  } catch (error) {
    console.error('Error fetching catalog changelog:', error);
    res.status(500).json({ error: 'Failed to fetch changelog' });
  }
});

export default router;
