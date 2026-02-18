import { API_URL } from '../config/api';

// Helper function to normalize image paths
// Removes any full URL (http:// or https://) and keeps only the path
export const normalizeImagePath = (imagePath) => {
  if (!imagePath) return null;
  
  // If it's already a full URL, extract just the path
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    try {
      const url = new URL(imagePath);
      return url.pathname;
    } catch (e) {
      // If URL parsing fails, try to extract path manually
      const match = imagePath.match(/\/uploads\/.*/);
      return match ? match[0] : imagePath;
    }
  }
  
  // Ensure path starts with /
  return imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
};

// Helper function to get the base URL for images
// Images are served by the backend, so we use the API URL without /api
export const getImageBaseUrl = () => {
  // Priority 1: Use VITE_API_URL if available (most reliable in production)
  const viteApiUrl = import.meta.env.VITE_API_URL;
  if (viteApiUrl) {
    const baseUrl = viteApiUrl.replace(/\/api\/?$/, '');
    return baseUrl;
  }
  
  // Priority 2: Use API_URL if it's an absolute URL (production)
  if (API_URL && (API_URL.startsWith('http://') || API_URL.startsWith('https://'))) {
    const baseUrl = API_URL.replace(/\/api\/?$/, '');
    return baseUrl;
  }
  
  // Priority 3: If API_URL is relative (starts with /), we're in dev mode with proxy
  if (API_URL && API_URL.startsWith('/')) {
    return 'http://localhost:3000';
  }
  
  // Last resort
  return 'http://localhost:3000';
};

// Main function to get the full image URL
export const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  
  // If it's already a full URL, return it as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // Normalize the path and combine with base URL
  const normalizedPath = normalizeImagePath(imagePath);
  const baseUrl = getImageBaseUrl();
  
  return `${baseUrl}${normalizedPath}`;
};

