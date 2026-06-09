import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { sessionQueryKey } from "@web/auth/session";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ context }) => {
    const user = await context.queryClient.ensureQueryData({
      queryKey: sessionQueryKey,
    });

    if (!user) {
      throw redirect({ to: "/signin" });
    }
  },
  component: () => <Outlet />,
});
