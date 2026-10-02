import axios, { type AxiosInstance } from 'axios';

import { API_BASE_URL } from '@/constants/config';

import { attachApiInterceptors, setUnauthorizedHandler } from './interceptors';

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL ?? undefined,
  timeout: 30000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

attachApiInterceptors(api);

export { setUnauthorizedHandler };
