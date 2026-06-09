import { createContext, useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import { authClient } from "@web/lib/auth-client";

export type SessionUser = {
  id: string;
  name?: string | null;
  email: string;
};

export type AuthContextValue = {
  user: SessionUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
};

export const sessionQueryKey = ["auth", "session"] as const;

export const AuthContext = createContext<AuthContextValue | null>(null);

async function fetchSession(): Promise<SessionUser | null> {
  const response = await authClient.getSession();

  if (!response.data?.user) {
    return null;
  }

  return {
    id: response.data.user.id,
    name: response.data.user.name,
    email: response.data.user.email,
  };
}

export function useSession() {
  return useQuery({
    queryKey: sessionQueryKey,
    queryFn: fetchSession,
    refetchInterval: 60_000,
  });
}

export function useAuth() {
  const auth = useContext(AuthContext);

  if (!auth) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return auth;
}
