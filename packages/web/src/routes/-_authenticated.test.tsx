import { Route } from "./_authenticated";
import { sessionQueryKey } from "@web/auth/session";

function getBeforeLoad() {
  return Route.options.beforeLoad!;
}

describe("authenticated route guard", () => {
  it("redirects to sign in when no authenticated user exists", async () => {
    const queryClient = {
      ensureQueryData: vi.fn().mockResolvedValue(null),
    };

    await expect(
      getBeforeLoad()({ context: { queryClient } } as never),
    ).rejects.toMatchObject({ options: { to: "/signin" } });

    expect(queryClient.ensureQueryData).toHaveBeenCalledWith({
      queryKey: sessionQueryKey,
    });
  });

  it("allows protected routes when an authenticated user exists", async () => {
    const user = { id: "user-1", email: "test@example.com" };
    const queryClient = {
      ensureQueryData: vi.fn().mockResolvedValue(user),
    };

    await expect(
      getBeforeLoad()({ context: { queryClient } } as never),
    ).resolves.toBeUndefined();
  });
});
