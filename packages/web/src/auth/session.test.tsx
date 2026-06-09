import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { AuthProvider } from "./auth-provider";
import { useAuth } from "./session";

const mockGetSession = vi.fn();

vi.mock("@web/lib/auth-client", () => ({
  authClient: {
    getSession: (...args: unknown[]) => mockGetSession(...args),
  },
}));

function AuthStatus() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading session</div>;
  }

  return (
    <div>
      <div>{isAuthenticated ? "Authenticated" : "Unauthenticated"}</div>
      <div>{user?.email ?? "No user"}</div>
    </div>
  );
}

function renderWithAuthProvider() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AuthStatus />
      </AuthProvider>
    </QueryClientProvider>,
  );
}

describe("AuthProvider", () => {
  beforeEach(() => {
    mockGetSession.mockReset();
  });

  it("exposes loading while the session query is pending", () => {
    mockGetSession.mockReturnValue(new Promise(() => undefined));

    renderWithAuthProvider();

    expect(screen.getByText("Loading session")).toBeTruthy();
  });

  it("exposes an authenticated user when the session has a user", async () => {
    mockGetSession.mockResolvedValue({
      data: {
        user: {
          id: "user-1",
          name: "Test User",
          email: "test@example.com",
        },
      },
    });

    renderWithAuthProvider();

    await waitFor(() => {
      expect(screen.getByText("Authenticated")).toBeTruthy();
      expect(screen.getByText("test@example.com")).toBeTruthy();
    });
  });

  it("exposes unauthenticated state when the session has no user", async () => {
    mockGetSession.mockResolvedValue({ data: null });

    renderWithAuthProvider();

    await waitFor(() => {
      expect(screen.getByText("Unauthenticated")).toBeTruthy();
      expect(screen.getByText("No user")).toBeTruthy();
    });
  });
});
