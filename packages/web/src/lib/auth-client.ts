import { magicLinkClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

type AuthUser = {
  id: string;
  name?: string | null;
  email: string;
};

type AuthSessionResponse = {
  data: { user: AuthUser } | null;
};

type AuthClient = {
  getSession: () => Promise<AuthSessionResponse>;
  signOut: () => Promise<unknown>;
  signIn: {
    magicLink: (params: {
      email: string;
      callbackURL: string;
    }) => Promise<unknown>;
  };
};

const betterAuthClient = createAuthClient({
  plugins: [magicLinkClient()],
});

export const authClient: AuthClient = {
  getSession: () => betterAuthClient.getSession(),
  signOut: () => betterAuthClient.signOut(),
  signIn: {
    magicLink: (params) => betterAuthClient.signIn.magicLink(params),
  },
};
