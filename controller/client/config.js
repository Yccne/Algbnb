const runtimeEnv = typeof import.meta !== 'undefined' ? import.meta.env || {} : {};
const processEnv = typeof process !== 'undefined' ? process.env || {} : {};
const browserDefaultApiUrl =
  typeof window !== 'undefined' && window.location?.hostname
    ? `${window.location.protocol}//${window.location.hostname}:3001/api`
    : null;

export const API_URL =
  runtimeEnv.VITE_API_URL ||
  runtimeEnv.EXPO_PUBLIC_API_URL ||
  processEnv.VITE_API_URL ||
  processEnv.EXPO_PUBLIC_API_URL ||
  processEnv.API_URL ||
  browserDefaultApiUrl ||
  'http://localhost:3001/api';

export const API_ORIGIN = API_URL.replace(/\/api\/?$/, '');
