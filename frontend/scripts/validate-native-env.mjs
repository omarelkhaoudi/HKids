/**
 * Validates required environment variables for native (Capacitor) release builds.
 */
const apiUrl = process.env.VITE_API_URL?.trim();

if (!apiUrl) {
  console.error(
    'VITE_API_URL is required for Android release builds.\n'
    + 'Example: VITE_API_URL=https://your-backend.example.com npm run android:release'
  );
  process.exit(1);
}

console.log('Native env validation passed (VITE_API_URL set).');
