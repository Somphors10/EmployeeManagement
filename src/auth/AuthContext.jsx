import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../api/auth';
import { settingApi } from '../api/settings';
import { clearSession, getStoredUser, onUnauthorized, setSession } from '../api/session';
import { applyWorkspaceSettings, clearWorkspaceSettings } from '../utils/workspace';
import { Permission, can as canDo } from './permissions';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [workspace, setWorkspace] = useState({ companyName: 'Employee Hub' });

  const applyUser = useCallback((payload) => {
    if (!payload?.token) {
      clearSession();
      setUser(null);
      return;
    }
    setSession(payload);
    setUser(payload);
  }, []);

  const logout = useCallback(() => {
    clearSession();
    clearWorkspaceSettings();
    setUser(null);
  }, []);

  useEffect(() => {
    onUnauthorized(() => {
      clearWorkspaceSettings();
      setUser(null);
    });

    const stored = getStoredUser();
    if (!stored?.token) {
      setReady(true);
      return undefined;
    }

    let cancelled = false;
    setUser(stored);
    authApi
      .me()
      .then((response) => {
        if (!cancelled) applyUser(response.payload);
      })
      .catch(() => {
        if (!cancelled) logout();
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [applyUser, logout]);

  useEffect(() => {
    if (!user || !canDo(user, Permission.SETTINGS_VIEW)) {
      if (!user) {
        clearWorkspaceSettings();
        setWorkspace({ companyName: 'Employee Hub' });
      }
      return undefined;
    }

    let cancelled = false;
    settingApi
      .getAll()
      .then((response) => {
        if (cancelled) return;
        setWorkspace(applyWorkspaceSettings(response.payload || []));
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [user]);

  const login = useCallback(
    async (username, password) => {
      const response = await authApi.login(username, password);
      applyUser(response.payload);
      return response.payload;
    },
    [applyUser],
  );

  const value = useMemo(
    () => ({
      user,
      ready,
      workspace,
      login,
      logout,
      can: (permission) => canDo(user, permission),
    }),
    [user, ready, workspace, login, logout],
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
