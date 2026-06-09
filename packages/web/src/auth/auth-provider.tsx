import type { PropsWithChildren } from "react";
import { AuthContext, useSession } from "./session";

export function AuthProvider({ children }: PropsWithChildren) {
  const { data: user = null, isLoading } = useSession();

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: Boolean(user),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
