import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Header } from "./header";

const mockUseAuth = vi.fn();
const mockSignOut = vi.fn();
const mockInvalidateQueries = vi.fn();
const mockNavigate = vi.fn();

vi.mock("@web/auth/session", () => ({
  sessionQueryKey: ["auth", "session"],
  useAuth: () => mockUseAuth(),
}));

vi.mock("@web/lib/auth-client", () => ({
  authClient: {
    signOut: (...args: unknown[]) => mockSignOut(...args),
  },
}));

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({
    invalidateQueries: (...args: unknown[]) => mockInvalidateQueries(...args),
  }),
}));

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    to,
    children,
    ...props
  }: {
    to: string;
    children: React.ReactNode;
  }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
  useNavigate: () => mockNavigate,
}));

describe("Header", () => {
  beforeEach(() => {
    mockUseAuth.mockReset();
    mockSignOut.mockReset();
    mockInvalidateQueries.mockReset();
    mockNavigate.mockReset();
  });

  it("shows a sign in link when unauthenticated", () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
      isAuthenticated: false,
    });

    render(<Header />);

    expect(screen.getByRole("link", { name: /sign in/i })).toHaveProperty(
      "href",
      "http://localhost:3000/signin",
    );
    expect(screen.queryByRole("button", { name: /sign out/i })).toBeNull();
  });

  it("shows the user's name when authenticated", () => {
    mockUseAuth.mockReturnValue({
      user: { id: "user-1", name: "Test User", email: "test@example.com" },
      isLoading: false,
      isAuthenticated: true,
    });

    render(<Header />);

    expect(screen.getByText("Test User")).toBeTruthy();
    expect(screen.getByRole("button", { name: /sign out/i })).toBeTruthy();
  });

  it("falls back to the user's email when no name is present", () => {
    mockUseAuth.mockReturnValue({
      user: { id: "user-1", name: null, email: "test@example.com" },
      isLoading: false,
      isAuthenticated: true,
    });

    render(<Header />);

    expect(screen.getByText("test@example.com")).toBeTruthy();
  });

  it("signs out, invalidates the session query, and navigates to sign in", async () => {
    mockUseAuth.mockReturnValue({
      user: { id: "user-1", name: "Test User", email: "test@example.com" },
      isLoading: false,
      isAuthenticated: true,
    });
    mockSignOut.mockResolvedValue({});

    render(<Header />);
    fireEvent.click(screen.getByRole("button", { name: /sign out/i }));

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled();
      expect(mockInvalidateQueries).toHaveBeenCalledWith({
        queryKey: ["auth", "session"],
      });
      expect(mockNavigate).toHaveBeenCalledWith({ to: "/signin" });
    });
  });
});
