import { API_URL } from './config.js';
import { storage } from './storage.js';

const buildQueryString = (params = {}) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    if (Array.isArray(value)) {
      if (value.length > 0) searchParams.set(key, value.join(','));
      return;
    }
    searchParams.set(key, value);
  });
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
};

export const request = async (path, options = {}) => {
  const token = storage.getItem('token');
  const headers = new Headers(options.headers || {});
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;

  if (!isFormData && !headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    body: isFormData || !options.body || typeof options.body === 'string' ? options.body : JSON.stringify(options.body),
  });

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await response.json() : await response.text();

  if (!response.ok) {
    const message = data?.erreur || data?.message || 'Erreur API';
    throw new Error(message);
  }

  return data;
};

export const get = (path, params) => request(`${path}${buildQueryString(params)}`);
export const post = (path, body, options = {}) => request(path, { ...options, method: 'POST', body });
export const patch = (path, body, options = {}) => request(path, { ...options, method: 'PATCH', body });
export const put = (path, body, options = {}) => request(path, { ...options, method: 'PUT', body });
export const del = (path, options = {}) => request(path, { ...options, method: 'DELETE' });
