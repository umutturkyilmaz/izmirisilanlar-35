import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import supabase from '@/lib/supabase';
import type { Session, User } from '@supabase/supabase-js';

interface Profile {
  id: string;
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
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
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
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (fetchError) throw fetchError;
      setProfile(data as Profile | null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Profil yüklenemedi');
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  }, [user, fetchProfile]);

  useEffect(() => {
    setLoading(true);

    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      if (currentSession?.user) {
        fetchProfile(currentSession.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      if (currentSession?.user) {
        fetchProfile(currentSession.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signIn = async (email: string, password: string) => {
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        return { success: false, error: signInError.message };
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Giriş başarısız' };
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
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            role: data.role,
            full_name: data.fullName,
            phone: data.phone || null,
            city: data.city || null,
            company_name: data.role === 'employer' ? data.companyName : null,
          },
        },
      });

      if (signUpError) {
        return { success: false, error: signUpError.message };
      }

      if (authData.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            role: data.role,
            full_name: data.fullName,
            phone: data.phone || null,
            city: data.city || null,
            company_name: data.role === 'employer' ? data.companyName : null,
            vergi_numarasi: data.role === 'employer' ? data.vergiNumarasi || null : null,
            dogrulama_durumu: data.role === 'employer' && data.vergiNumarasi ? 'pending' : 'unverified',
            dogrulama_talebi_tarihi: data.role === 'employer' && data.vergiNumarasi ? new Date().toISOString() : null,
          });

        if (profileError) {
          return { success: false, error: profileError.message };
        }
      }

      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Kayıt başarısız' };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  const signInWithGoogle = async () => {
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });
      if (oauthError) {
        return { success: false, error: oauthError.message };
      }
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Google ile giriş başarısız',
      };
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    try {
      if (!user) return { success: false, error: 'Kullanıcı bulunamadı' };
      const { error: updateError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (updateError) {
        return { success: false, error: updateError.message };
      }

      await refreshProfile();
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Güncelleme başarısız' };
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
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}