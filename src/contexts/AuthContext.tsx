import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole =
  | "head_admin"
  | "admin"
  | "owner"
  | "co_ceo"
  | "editor"
  | "writer"
  | "journalist"
  | "designer"
  | "intern"
  | "client"
  | "social_manager"
  | "booking_manager"
  | "media_manager"
  | "social_articles_lead"
  | "project_manager"
  | "crew"
  | "photographer"
  | "videographer"
  | "video_editor"
  | "director"
  | "producer"
  | "audio_engineer"
  | "grip_lighting"
  | "makeup_artist"
  | "production_assistant"
  | "studio_staff";

export const CREW_ROLES: AppRole[] = [
  "photographer",
  "videographer",
  "video_editor",
  "director",
  "producer",
  "audio_engineer",
  "grip_lighting",
  "makeup_artist",
  "production_assistant",
  "studio_staff",
];

export const isCrewRole = (role: AppRole) => role === "crew" || CREW_ROLES.includes(role);

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  roles: AppRole[];
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, displayName: string, adminInviteCode?: string, staffInviteCode?: string, signupCode?: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  hasRole: (role: AppRole) => boolean;
  refreshRoles: () => Promise<void>;
  rolesLoaded: boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [rolesLoaded, setRolesLoaded] = useState(false);

  const loadRoles = async (userId: string) => {
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    setRoles((data ?? []).map((r) => r.role as AppRole));
    setRolesLoaded(true);
  };

  useEffect(() => {
    // onAuthStateChange is the single source of truth.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) {
        setRolesLoaded(false);
        // Defer to avoid deadlocks
        setTimeout(() => {
          loadRoles(sess.user.id).finally(() => setLoading(false));
        }, 0);
      } else {
        setRoles([]);
        setRolesLoaded(true);
        setLoading(false);
      }
    });

    // getSession only handles the unauthenticated boot case.
    supabase.auth.getSession().then(({ data: { session: sess } }) => {
      if (!sess?.user) {
        setRolesLoaded(true);
        setLoading(false);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signUp = async (email: string, password: string, displayName: string, adminInviteCode?: string, staffInviteCode?: string, signupCode?: string) => {
    const redirectUrl = `${window.location.origin}/dashboard`;
    const data: Record<string, string> = { display_name: displayName };
    if (adminInviteCode) data.admin_invite_code = adminInviteCode;
    if (staffInviteCode) data.staff_invite_code = staffInviteCode;
    if (signupCode) data.signup_code = signupCode;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectUrl, data },
    });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const hasRole = (role: AppRole) => roles.includes(role);
  const refreshRoles = async () => { if (user) await loadRoles(user.id); };

  return (
    <AuthContext.Provider value={{ user, session, roles, loading, signIn, signUp, signOut, hasRole, refreshRoles }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
