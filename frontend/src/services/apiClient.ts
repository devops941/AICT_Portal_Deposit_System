import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ApiResponseEnvelope } from '../types';

// Normalize API Base URL: strip trailing slashes, and ensure /api path is present when pointing to remote host
let envBaseUrl = (import.meta.env.VITE_API_BASE_URL || '/api').trim();
envBaseUrl = envBaseUrl.replace(/\/+$/, '');
if (envBaseUrl.startsWith('http') && !envBaseUrl.endsWith('/api')) {
  envBaseUrl = `${envBaseUrl}/api`;
}

export const API_BASE_URL = envBaseUrl;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// Request interceptor to attach JWT and handle multipart/form-data
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // When uploading FormData, remove Content-Type header so the browser/Axios
    // sets multipart/form-data with the correct boundary automatically
    if (config.data instanceof FormData) {
      if (config.headers) {
        delete (config.headers as any)['Content-Type'];
        if (typeof config.headers.delete === 'function') {
          config.headers.delete('Content-Type');
        }
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to unwrap data
apiClient.interceptors.response.use(
  (response) => response.data,
  (error: AxiosError<ApiResponseEnvelope<unknown>>) => {
    if (error.response?.status === 401) {
      // Clear token if expired or invalid
      localStorage.removeItem('token');
    }
    const message = error.response?.data?.message || error.message || 'An unexpected error occurred';
    return Promise.reject(new Error(message));
  }
);

export const checkApiHealth = async () => {
  return apiClient.get('/health');
};

export const checkSystemHealth = async () => {
  return apiClient.get('/health/system');
};
