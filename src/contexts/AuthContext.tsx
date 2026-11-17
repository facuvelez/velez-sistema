import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { readGuestOperator } from '@/contexts/GuestOperatorContext';

export type UserRole = 'Administrator' | 'Administracion' | 'Operator' | 'Alineador';

interface Profile {
  id: string;
  user_id: string;
  username: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  authReady: boolean;
  signIn: (username: string, password: string) => Promise<{ error: any }>;
  signUp: (username: string, password: string, role?: UserRole) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  hasRole: (role: UserRole) => boolean;
  canAccess: (allowedRoles: UserRole[]) => boolean;
}


const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const usernameToEmail = (username: string) =>
  `${username.trim().toLowerCase()}@internal.app`;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);

  const markReady = async (userId: string | undefined) => {
    if (userId) {
      await fetchProfile(userId);
    } else {
      setProfile(null);
    }
    setAuthReady(true);
  };


  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  useEffect(() => {
    // Limpiar sesión legacy del sistema custom anterior
    localStorage.removeItem('custom_auth_session');

    // 1) Listener de auth — DEBE configurarse ANTES de getSession()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          // Diferir llamadas a Supabase para evitar deadlock
          setTimeout(() => {
            markReady(newSession.user.id);
          }, 0);
        } else {
          setProfile(null);
          setAuthReady(true);
        }

        setLoading(false);
      }
    );

    // 2) Verificar sesión existente
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      setSession(existingSession);
      setUser(existingSession?.user ?? null);

      markReady(existingSession?.user?.id);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);


  const signIn = async (username: string, password: string) => {
    try {
      setLoading(true);

      const { error } = await supabase.auth.signInWithPassword({
        email: usernameToEmail(username),
        password,
      });

      if (error) {
        console.error('signIn error:', error);
        return { error: { message: 'Usuario o contraseña incorrectos' } };
      }

      return { error: null };
    } catch (error) {
      console.error('Error inesperado en signIn:', error);
      return { error: { message: 'Error de conexión' } };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (username: string, password: string, role: UserRole = 'Operator') => {
    try {
      setLoading(true);

      const { data, error } = await supabase.functions.invoke('admin-create-user', {
        body: { username, password, role },
      });

      if (error) {
        console.error('admin-create-user error:', error);
        return { error: { message: error.message || 'Error al crear usuario' } };
      }

      if (data?.error) {
        return { error: { message: data.error } };
      }

      return { error: null };
    } catch (error: any) {
      console.error('Error inesperado en signUp:', error);
      return { error: { message: 'Error inesperado al crear usuario' } };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.log('Logout error (ignored):', error);
    }
    setSession(null);
    setUser(null);
    setProfile(null);
    localStorage.removeItem('custom_auth_session');
    localStorage.removeItem('velez_guest_operator');
  };

  const hasRole = (role: UserRole): boolean => {
    if (profile?.role === role) return true;
    const guest = readGuestOperator();
    if (guest && guest.role === role) return true;
    return false;
  };

  const canAccess = (allowedRoles: UserRole[]): boolean => {
    if (profile && allowedRoles.includes(profile.role)) return true;
    const guest = readGuestOperator();
    if (guest && allowedRoles.includes(guest.role)) return true;
    return false;
  };

  const value = {
    user,
    session,
    profile,
    loading,
    authReady,

    signIn,
    signUp,
    signOut,
    hasRole,
    canAccess,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
