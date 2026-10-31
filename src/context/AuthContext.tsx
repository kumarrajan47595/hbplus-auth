// src/context/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { Platform } from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "../config/supabase";

WebBrowser.maybeCompleteAuthSession();

export const ALLOWED_DOMAIN =
  process.env.EXPO_PUBLIC_ALLOWED_DOMAIN || "@hbplus.fit";

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: "admin" | "user";
  last_sign_in_at?: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  error: string | null;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const redirectUri = AuthSession.makeRedirectUri({ preferLocalhost: true });

  const fetchProfile = async (userId: string, email: string) => {
    try {
      const { data, error: profileErr } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (profileErr) {
        console.warn("Profile fetch warning:", profileErr.message);
        return;
      }

      if (data) {
        setProfile(data as UserProfile);
      } else {
        // Fallback profile creation if trigger hasn't fired yet
        const defaultRole = email.startsWith("admin") ? "admin" : "user";
        const fallbackProfile: UserProfile = {
          id: userId,
          email,
          full_name: "HBPlus Member",
          role: defaultRole,
        };
        await supabase.from("profiles").upsert([fallbackProfile]);
        setProfile(fallbackProfile);
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    }
  };

  const validateUserDomain = async (currentSession: Session | null) => {
    if (!currentSession?.user) {
      setUser(null);
      setProfile(null);
      setSession(null);
      setLoading(false);
      return;
    }

    const email = currentSession.user.email || "";
    const isAllowed = email
      .toLowerCase()
      .endsWith(ALLOWED_DOMAIN.toLowerCase());

    if (!isAllowed) {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      setSession(null);
      setError(
        "Access restricted. Please login using your official domain email.",
      );
      setLoading(false);
      return;
    }

    setUser(currentSession.user);
    setSession(currentSession);
    await fetchProfile(currentSession.user.id, email);
    setError(null);
    setLoading(false);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      validateUserDomain(session);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        await validateUserDomain(session);
      },
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const loginWithGoogle = async () => {
    setLoading(true);
    setError(null);

    try {
      if (Platform.OS === "web") {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: window.location.origin,
            queryParams: { prompt: "select_account" },
          },
        });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: redirectUri,
            skipBrowserRedirect: true,
          },
        });
        if (error) throw error;

        const authResponse = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectUri,
        );
        if (authResponse.type === "success") {
          const hash = authResponse.url.split("#")[1];
          const params = new URLSearchParams(hash);
          const accessToken = params.get("access_token");
          const refreshToken = params.get("refresh_token");

          if (accessToken && refreshToken) {
            await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
          }
        }
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
    setLoading(false);
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id, user.email || "");
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        loading,
        isAdmin: profile?.role === "admin",
        error,
        loginWithGoogle,
        logout,
        refreshProfile,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
