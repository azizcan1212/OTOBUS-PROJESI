import { API_BASE_URL } from '../config/env';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Backend ErrorResponseDTO sekli: { error: { code, message }, date }
interface ApiErrorResponse {
  error?: {
    code?: string;
    message?: string;
  };
}

const AUTH_HEADER_STORAGE_KEY = 'bus-information-auth-header';
const AUTH_USERNAME_STORAGE_KEY = 'bus-information-auth-username';

function safeSessionStorage() {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.sessionStorage;
}

export function createBasicAuthHeader(username: string, password: string) {
  return `Basic ${window.btoa(`${username}:${password}`)}`;
}

export function getStoredAuthHeader() {
  return safeSessionStorage()?.getItem(AUTH_HEADER_STORAGE_KEY) ?? null;
}

export function getStoredAuthorizedUsername() {
  return safeSessionStorage()?.getItem(AUTH_USERNAME_STORAGE_KEY) ?? null;
}

export function storeAuthorizedSession(username: string, authHeader: string) {
  safeSessionStorage()?.setItem(AUTH_HEADER_STORAGE_KEY, authHeader);
  safeSessionStorage()?.setItem(AUTH_USERNAME_STORAGE_KEY, username);
}

export function clearAuthorizedSession() {
  safeSessionStorage()?.removeItem(AUTH_HEADER_STORAGE_KEY);
  safeSessionStorage()?.removeItem(AUTH_USERNAME_STORAGE_KEY);
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const authHeader = getStoredAuthHeader();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(authHeader ? { Authorization: authHeader } : {}),
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    let message = 'Beklenmeyen bir API hatasi olustu.';

    try {
      const errorBody = (await response.json()) as ApiErrorResponse;
      if (errorBody.error?.message) {
        message = errorBody.error.message;
      }
    } catch {
      message = response.statusText || message;
    }

    throw new ApiError(message, response.status);
  }

  if (response.status === 204 || response.status === 201) {
    return undefined as T;
  }

  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}
