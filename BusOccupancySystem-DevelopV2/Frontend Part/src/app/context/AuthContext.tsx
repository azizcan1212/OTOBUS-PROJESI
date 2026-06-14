import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  ApiError,
  clearAuthorizedSession,
  getStoredAuthHeader,
  getStoredAuthorizedUsername,
  storeAuthorizedSession,
} from '../services/apiClient';
import { API_BASE_URL } from '../config/env';

interface AuthResponse {
  token: string;
}

interface AuthContextValue {
  isAuthorized: boolean;
  authorizedUsername: string | null;
  isAuthenticating: boolean;
  authError: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [authorizedUsername, setAuthorizedUsername] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Sayfa yenilendiginde session storage'dan mevcut oturumu geri yukle
  useEffect(() => {
    const storedToken = getStoredAuthHeader();
    const storedUsername = getStoredAuthorizedUsername();

    if (storedToken && storedUsername) {
      setAuthorizedUsername(storedUsername);
      setIsAuthorized(true);
    }
  }, []);

  async function login(username: string, password: string): Promise<boolean> {
    setIsAuthenticating(true);
    setAuthError(null);

    try {
      // Backend POST /api/v1/auth/login ile JWT token aliniyor
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          setAuthError('Kullanici adi veya sifre yanlis.');
        } else if (response.status === 404) {
          setAuthError('Bu kullanici adi kayitli degil.');
        } else {
          setAuthError('Giris sirasinda beklenmeyen bir hata olustu.');
        }
        clearAuthorizedSession();
        setIsAuthorized(false);
        return false;
      }

      const data = (await response.json()) as AuthResponse;
      const bearerHeader = `Bearer ${data.token}`;

      // JWT token'i Bearer header olarak sakla
      storeAuthorizedSession(username, bearerHeader);
      setAuthorizedUsername(username);
      setIsAuthorized(true);
      return true;
    } catch (error) {
      clearAuthorizedSession();
      setAuthorizedUsername(null);
      setIsAuthorized(false);

      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        setAuthError('Yetkili girisi dogrulanamadi. Kullanici adi veya sifreyi kontrol et.');
      } else if (error instanceof Error) {
        setAuthError(error.message);
      } else {
        setAuthError('Yetkili dogrulamasi sirasinda beklenmeyen bir hata olustu.');
      }

      return false;
    } finally {
      setIsAuthenticating(false);
    }
  }

  function logout() {
    clearAuthorizedSession();
    setAuthorizedUsername(null);
    setIsAuthorized(false);
    setAuthError(null);
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthorized,
      authorizedUsername,
      isAuthenticating,
      authError,
      login,
      logout,
    }),
    [authError, authorizedUsername, isAuthorized, isAuthenticating],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
