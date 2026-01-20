// src/contexts/AuthContext.tsx
import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

/**
 * Fake Auth (DEV-only)
 * - Enabled only when import.meta.env.DEV === true AND VITE_FAKE_AUTH === "true"
 * - Provides a stable fake user/session to unlock UI and flows quickly
 * - NEVER use sb_secret_ keys in frontend
 */

type EfaRole = "GLOBAL_ADMIN" | "CONTINENTAL_ADMIN" | "COUNTRY_ADMIN" | "COUNTRY_MOD" | "USER";

type AuthProfile = {
  role: EfaRole;
  continent_id?: string | null;
  country_id?: string | null;
};

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  mustChangePassword: boolean;

  // Existing API (kept)
  signUp: (
    email: string,
    password: string,
    metadata?: { username?: string; display_name?: string }
  ) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;

  // Extra (safe to ignore if not used)
  role: EfaRole;
  profile: AuthProfile | null;
  setFakeProfile?: (p: AuthProfile) => void; // only available when fake auth is enabled
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const isFakeAuthEnabled =
  import.meta.env.DEV && String(import.meta.env.VITE_FAKE_AUTH).toLowerCase() === "true";

const FAKE_PROFILE_STORAGE_KEY = "efa_fake_profile_v1";

function getDefaultFakeProfile(): AuthProfile {
  return { role: "GLOBAL_ADMIN", continent_id: "SA", country_id: "BR" };
}

function loadFakeProfile(): AuthProfile {
  try {
    const raw = localStorage.getItem(FAKE_PROFILE_STORAGE_KEY);
    if (!raw) return getDefaultFakeProfile();
    const parsed = JSON.parse(raw) as AuthProfile;
    // minimal validation
    if (!parsed?.role) return getDefaultFakeProfile();
    return parsed;
  } catch {
    return getDefaultFakeProfile();
  }
}

function saveFakeProfile(p: AuthProfile) {
  localStorage.setItem(FAKE_PROFILE_STORAGE_KEY, JSON.stringify(p));
}

function buildFakeUser(email = "fake@local.dev"): User {
  // Minimal object to satisfy usage in app
  return {
    id: "fake-user",
    aud: "authenticated",
    role: "authenticated",
    email,
    phone: "",
    app_metadata: {},
    user_metadata: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } as unknown as User;
}

function buildFakeSession(fakeUser: User): Session {
  return {
    access_token: "fake-access-token",
    token_type: "bearer",
    expires_in: 60 * 60,
    expires_at: Math.floor(Date.now() / 1000) + 60 * 60,
    refresh_token: "fake-refresh-token",
    user: fakeUser,
  } as unknown as Session;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [mustChangePassword, setMustChangePassword] = useState(false);

  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [role, setRole] = useState<EfaRole>("USER");

  // DEV helper: allow switching fake roles quickly
  const setFakeProfile = useMemo(() => {
    if (!isFakeAuthEnabled) return undefined;
    return (p: AuthProfile) => {
      saveFakeProfile(p);
      setProfile(p);
      setRole(p.role);
      // keep user/session present
      const fu = buildFakeUser();
      setUser(fu);
      setSession(buildFakeSession(fu));
      setMustChangePassword(false);
      setLoading(false);
    };
  }, []);

  useEffect(() => {
    // === Fake auth path (DEV-only) ===
    if (isFakeAuthEnabled) {
      const p = loadFakeProfile();
      setProfile(p);
      setRole(p.role);

      const fu = buildFakeUser();
      setUser(fu);
      setSession(buildFakeSession(fu));

      setMustChangePassword(false);
      setLoading(false);
      return;
    }

    // === Real auth path (Supabase) ===
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      const needsPasswordChange = session?.user?.user_metadata?.must_change_password === true;
      setMustChangePassword(needsPasswordChange);

      // profile/role: default to USER unless you later load profile table
      setRole("USER");
      setProfile(null);

      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      const needsPasswordChange = session?.user?.user_metadata?.must_change_password === true;
      setMustChangePassword(needsPasswordChange);

      setRole("USER");
      setProfile(null);

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp: AuthContextType["signUp"] = async (email, password, metadata) => {
    if (isFakeAuthEnabled) {
      // In DEV fake mode, pretend sign up succeeded.
      return { error: null };
    }

    const redirectUrl = `${window.location.origin}/`;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: metadata,
      },
    });

    return { error: error as Error | null };
  };

  const signIn: AuthContextType["signIn"] = async (email, password) => {
    if (isFakeAuthEnabled) {
      // In DEV fake mode, pretend sign in succeeded.
      return { error: null };
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signOut: AuthContextType["signOut"] = async () => {
    if (isFakeAuthEnabled) {
      // Keep fake session for faster testing; you can change this behavior if you prefer.
      return;
    }
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        mustChangePassword,
        signUp,
        signIn,
        signOut,
        role,
        profile,
        setFakeProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
