import axios from 'axios';

/**
 * Shared axios instance. In dev the API lives on its own origin (VITE_API_BASE);
 * in production the server mounts the built client and proxies /api itself.
 */
const API_BASE =
  import.meta.env.MODE === 'development' ? import.meta.env.VITE_API_BASE : '/api';

export const api = axios.create({ baseURL: API_BASE });
