// API Configuration for ChefHub
// Automatically switches between localhost and production based on environment

const getApiBaseUrl = () => {
  // Priority 1: Use explicit environment variable if set (for Vercel/production deployments)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // Priority 2: Check if we're in development (running on localhost)
  const isDevelopment = import.meta.env.DEV || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  
  if (isDevelopment) {
    return 'http://localhost:5000';
  } else {
    // Priority 3: Default production URL
    return 'https://chefhub-backend1.onrender.com';
  }
};

const getSocketUrl = () => {
  // Priority 1: Use explicit environment variable if set
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // Priority 2: Same logic for Socket.io connections
  const isDevelopment = import.meta.env.DEV || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  
  if (isDevelopment) {
    return 'http://localhost:5000';
  } else {
    return 'https://chefhub-backend1.onrender.com';
  }
};

export const API_BASE_URL = getApiBaseUrl();
export const SOCKET_URL = getSocketUrl();

// Helper function to build API endpoints
export const buildApiUrl = (endpoint) => {
  // Remove leading slash if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${API_BASE_URL}/${cleanEndpoint}`;
};

// Helper function to build full API URLs with /api prefix
export const buildApiEndpoint = (endpoint) => {
  // Remove leading slash if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${API_BASE_URL}/api/${cleanEndpoint}`;
};

export default {
  API_BASE_URL,
  SOCKET_URL,
  buildApiUrl,
  buildApiEndpoint
};
