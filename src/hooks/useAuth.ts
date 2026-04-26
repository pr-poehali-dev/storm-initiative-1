import { useState, useCallback } from "react";

const AUTH_URL = "https://functions.poehali.dev/f3580f48-3a24-4774-b31b-64979e8a108d";
const DATA_URL = "https://functions.poehali.dev/7dc85e0b-455b-4b56-a4e4-aacef205fd94";

export interface AuthUser {
  userId: number;
  email: string;
  token: string;
}

export interface CloudData {
  projects: unknown[];
  canvases: Record<string, unknown>;
  theme: string;
}

// Храним сессию в localStorage
const SESSION_KEY = "waffles_session";

function loadSession(): AuthUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_e) { /* ignore */ }
  return null;
}

function saveSession(user: AuthUser | null) {
  if (user) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(SESSION_KEY);
  }
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(loadSession);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const auth = useCallback(async (action: "login" | "register", email: string, password: string): Promise<CloudData | null> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(AUTH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Ошибка авторизации");
        return null;
      }
      const authUser: AuthUser = { userId: data.userId, email: data.email, token: data.token };
      setUser(authUser);
      saveSession(authUser);
      return { projects: data.projects, canvases: data.canvases, theme: data.theme };
    } catch (_e) {
      setError("Ошибка сети. Проверьте подключение.");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    saveSession(null);
  }, []);

  const saveData = useCallback(async (payload: CloudData): Promise<boolean> => {
    if (!user) return false;
    try {
      const res = await fetch(DATA_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": String(user.userId),
          "X-Auth-Token": user.token,
        },
        body: JSON.stringify(payload),
      });
      return res.ok;
    } catch (_e) {
      return false;
    }
  }, [user]);

  const loadData = useCallback(async (): Promise<CloudData | null> => {
    if (!user) return null;
    try {
      const res = await fetch(DATA_URL, {
        method: "GET",
        headers: {
          "X-User-Id": String(user.userId),
          "X-Auth-Token": user.token,
        },
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (_e) {
      return null;
    }
  }, [user]);

  return { user, loading, error, auth, logout, saveData, loadData };
}
