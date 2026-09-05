import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, getToken, setToken, isApiConfigured } from '@/lib/api';

export interface Profile {
  id: string;
  email?: string;
  role: 'candidate' | 'employer' | 'admin';
  full_name: string | null;
  company_name: string | null;
  phone: string | null;
  city: string | null;
  avatar_url: string | null;
  bio: string | null;
  cv_url: string | null;
  vergi_numarasi: string | null;
  dogrulama_durumu: 'unverified' | 'pending' | 'verified' | 'rejected';
  dogrulama_talebi_tarihi: string | null;
  dogrulanma_tarihi: string | null;
  created_at?: string | null;
}

interface AuthState {
  user: Profile | null;
  session: { access_token: string } | null;
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string; profile?: Profile }>;
  signUp: (data: {
    email: string;
    password: string;
    role: 'candidate' | 'employer';
    fullName: string;
    phone?: string;
    city?: string;
    companyName?: string;
    vergiNumarasi?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: (
    credential: string,
    role?: 'candidate' | 'employer',
    extras?: { companyName?: string; vergiNumarasi?: string },
  ) => Promise<{ success: boolean; error?: string; profile?: Profile }>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<{ access_token: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshProfile = useCallback(async () => {
    if (!isApiConfigured || !getToken()) {
      setUser(null);
      setProfile(null);
      setSession(null);
      return;
    }
    try {
      const data = await api<{ user: Profile; profile: Profile }>('/api/auth/me');
      setUser(data.user);
      setProfile(data.profile);
      setSession({ access_token: getToken()! });
    } catch {
      setToken(null);
      setUser(null);
      setProfile(null);
      setSession(null);
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await refreshProfile();
      setLoading(false);
    })();
  }, [refreshProfile]);

  const signIn = async (email: string, password: string) => {
    try {
      const data = await api<{ token: string; user: Profile; profile: Profile }>('/api/auth/login', {
        body: { email, password },
        auth: false,
      });
      setToken(data.token);
      setUser(data.user);
      setProfile(data.profile);
      setSession({ access_token: data.token });
      return { success: true, profile: data.profile };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : 'Giriş başarısız' };
    }
  };

  const signUp = async (data: {
    email: string;
    password: string;
    role: 'candidate' | 'employer';
    fullName: string;
    phone?: string;
    city?: string;
    companyName?: string;
    vergiNumarasi?: string;
  }) => {
    try {
      const res = await api<{ token: string; user: Profile; profile: Profile }>('/api/auth/register', {
        body: {
          email: data.email,
          password: data.password,
          role: data.role,
          full_name: data.fullName,
          phone: data.phone,
          city: data.city,
          company_name: data.companyName,
          vergi_numarasi: data.vergiNumarasi,
        },
        auth: false,
      });
      setToken(res.token);
      setUser(res.user);
      setProfile(res.profile);
      setSession({ access_token: res.token });
      return { success: true };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : 'Kayıt başarısız' };
    }
  };

  const signOut = async () => {
    setToken(null);
    setUser(null);
    setProfile(null);
    setSession(null);
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    try {
      const data = await api<{ profile: Profile }>('/api/auth/profile', {
        method: 'PATCH',
        body: updates,
      });
      setProfile(data.profile);
      setUser(data.profile);
      return { success: true };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : 'Güncelleme başarısız' };
    }
  };

  const signInWithGoogle = async (
    credential: string,
    role?: 'candidate' | 'employer',
    extras?: { companyName?: string; vergiNumarasi?: string },
  ) => {
    try {
      const data = await api<{ token: string; user: Profile; profile: Profile }>('/api/auth/google', {
        body: {
          credential,
          role,
          company_name: extras?.companyName,
          vergi_numarasi: extras?.vergiNumarasi,
        },
        auth: false,
      });
      setToken(data.token);
      setUser(data.user);
      setProfile(data.profile);
      setSession({ access_token: data.token });
      return { success: true, profile: data.profile };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : 'Google girişi başarısız' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        error,
        signIn,
        signUp,
        signOut,
        refreshProfile,
        updateProfile,
        signInWithGoogle,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
