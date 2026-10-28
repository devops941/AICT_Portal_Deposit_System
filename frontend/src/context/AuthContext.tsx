import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../services/apiClient';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  userType: 'ADMIN' | 'USER';
  roles: string[];
  permissions: string[];
  institutionId?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (role: string) => boolean;
  hasPermission: (permission: string) => boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [user, setUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoading, setIsLoading] = useState(true);

  // Sync session on mount
  useEffect(() => {
    const checkSession = async () => {
      const savedToken = localStorage.getItem('token');
      if (savedToken) {
        try {
          const res: any = await apiClient.get('/v1/auth/me');
          if (res.data) {
            setUser(res.data);
            localStorage.setItem('user', JSON.stringify(res.data));
          }
        } catch {
          // Token invalid or expired
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    checkSession();
  }, []);

  const login = async (email: string, password: string) => {
    const res: any = await apiClient.post('/v1/auth/login', { email, password });
    const { accessToken, refreshToken, user: loggedInUser } = res.data;

    localStorage.setItem('token', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(loggedInUser));

    setToken(accessToken);
    setUser(loggedInUser);
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    try {
      if (refreshToken) {
        await apiClient.post('/v1/auth/logout', { refreshToken });
      }
    } catch {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      setToken(null);
      setUser(null);
    }
  };

  const hasRole = (roleName: string): boolean => {
    if (!user) return false;
    if (user.userType === 'ADMIN' || user.roles.includes('SYSTEM_ADMINISTRATOR')) return true;
    return user.roles.includes(roleName);
  };

  const hasPermission = (permissionCode: string): boolean => {
    if (!user) return false;
    if (user.userType === 'ADMIN' || user.permissions.includes('*')) return true;
    return user.permissions.includes(permissionCode);
  };

  const refreshUser = async () => {
    try {
      const res: any = await apiClient.get('/v1/auth/me');
      if (res.data) {
        setUser(res.data);
        localStorage.setItem('user', JSON.stringify(res.data));
      }
    } catch (err) {
      console.error('Failed to refresh user profile:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(token && user),
        isLoading,
        login,
        logout,
        hasRole,
        hasPermission,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
