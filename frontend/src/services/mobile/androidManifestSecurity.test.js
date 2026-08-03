import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const manifestPath = path.resolve(__dirname, '..', '..', '..', 'android', 'app', 'src', 'main', 'AndroidManifest.xml');
const manifest = fs.readFileSync(manifestPath, 'utf8');

function manifestNode(name) {
  const pattern = new RegExp(`<[^>]+android:name="${name}"[\\s\\S]*?>`);
  return manifest.match(pattern)?.[0] || '';
}

describe('Android manifest security posture', () => {
  it('disables backup and cleartext traffic for embedded production installs', () => {
    expect(manifest).toContain('android:allowBackup="false"');
    expect(manifest).toContain('android:usesCleartextTraffic="false"');
  });

  it('keeps the boot receiver internal while preserving boot actions', () => {
    const receiver = manifestNode('.BootReceiver');

    expect(receiver).toContain('android:exported="false"');
    expect(manifest).toContain('android.intent.action.BOOT_COMPLETED');
    expect(manifest).toContain('android.intent.action.MY_PACKAGE_REPLACED');
  });

  it('keeps FileProvider private', () => {
    const provider = manifestNode('androidx.core.content.FileProvider');

    expect(provider).toContain('android:exported="false"');
    expect(provider).toContain('android:grantUriPermissions="true"');
  });
});
