import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { LoginInput, RegistrationInput } from '../lib/validation';
import { authService } from '../services/authService';
import type { ApiResult, User } from '../types';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  login: (input: LoginInput) => Promise<ApiResult<User>>;
  register: (input: RegistrationInput) => Promise<ApiResult<User>>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Restored synchronously so protected routes never redirect before the session is known.
  const [user, setUser] = useState<User | null>(() => authService.getCurrentUser());

  useEffect(() => authService.subscribe(() => setUser(authService.getCurrentUser())), []);

  const login = useCallback(async (input: LoginInput) => {
    const result = await authService.login(input);
    if (result.ok) setUser(result.data);
    return result;
  }, []);

  const register = useCallback(async (input: RegistrationInput) => {
    const result = await authService.register(input);
    if (result.ok) setUser(result.data);
    return result;
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, isAuthenticated: user !== null, login, register, logout }),
    [user, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
