import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ error?: Error }>
  signUpWithEmail: (email: string, password: string, metadata?: Record<string, unknown>) => Promise<{ error?: Error }>
  signOut: () => Promise<{ error?: Error }>
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (!isMounted) return;
      setSession(data.session ?? null);
      setUser(data.session?.user ?? null);
      setIsLoading(false);
    };
    init();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
    });

    return () => {
      isMounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    session,
    isLoading,
    async signInWithEmail(email, password) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error: error ?? undefined };
    },
    async signUpWithEmail(email, password, metadata) {
      console.log('=== SIGNUP DEBUG START ===');
      console.log('Signing up with:', { email, password: '***', metadata });
      console.log('Supabase client URL:', supabase.supabaseUrl);
      console.log('Supabase client key present:', !!supabase.supabaseKey);
      
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: metadata }
        });
        
        console.log('=== SIGNUP RESULT ===');
        console.log('Data:', data);
        console.log('Error:', error);
        console.log('User:', data?.user);
        console.log('Session:', data?.session);
        console.log('=====================');
        
        if (error) {
          console.error('Signup error details:', {
            message: error.message,
            status: error.status,
            statusText: error.statusText
          });
        }
        
        return { error: error ?? undefined };
      } catch (err) {
        console.error('Signup exception:', err);
        return { error: err as Error };
      }
    },
    async signOut() {
      const { error } = await supabase.auth.signOut();
      return { error: error ?? undefined };
    }
  }), [user, session, isLoading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};


