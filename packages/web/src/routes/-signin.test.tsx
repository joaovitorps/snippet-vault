import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { SignInPage } from "./signin";

const mockMagicLink = vi.fn();
const mockUseAuth = vi.fn();

vi.mock("@web/lib/auth-client", () => ({
  authClient: {
    signIn: {
      magicLink: (...args: unknown[]) => mockMagicLink(...args),
    },
  },
}));

vi.mock("@web/auth/session", () => ({
  useAuth: () => mockUseAuth(),
}));

function renderSignInPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <SignInPage />
    </QueryClientProvider>,
  );
}

describe("SignInPage", () => {
  beforeEach(() => {
    mockMagicLink.mockReset();
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
      isAuthenticated: false,
    });
  });

  it("renders an email field and send magic link button", () => {
    renderSignInPage();

    expect(screen.getByLabelText(/email/i)).toBeTruthy();
    expect(
      screen.getByRole("button", { name: /send magic link/i }),
    ).toBeTruthy();
  });

  it("sends a magic link for the entered email", async () => {
    mockMagicLink.mockResolvedValue({});
    renderSignInPage();

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send magic link/i }));

    await waitFor(() => {
      expect(mockMagicLink).toHaveBeenCalledWith({
        email: "test@example.com",
        callbackURL: "http://localhost:5173/snippets",
      });
    });
  });

  it("shows a check email confirmation after successful submission", async () => {
    mockMagicLink.mockResolvedValue({});
    renderSignInPage();

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send magic link/i }));

    expect(await screen.findByText(/check your email/i)).toBeTruthy();
  });

  it("disables the form while submitting", async () => {
    let resolveMagicLink: () => void;
    mockMagicLink.mockReturnValue(
      new Promise<void>((resolve) => {
        resolveMagicLink = resolve;
      }),
    );
    renderSignInPage();

    const emailInput = screen.getByLabelText(/email/i);
    const submitButton = screen.getByRole("button", {
      name: /send magic link/i,
    });

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.click(submitButton);

    expect(emailInput).toHaveProperty("disabled", true);
    expect(screen.getByRole("button", { name: /sending/i })).toHaveProperty(
      "disabled",
      true,
    );

    await act(async () => {
      resolveMagicLink!();
    });
  });

  it("shows an accessible error and keeps the form usable when sign-in fails", async () => {
    mockMagicLink.mockRejectedValue(new Error("Email service unavailable"));
    renderSignInPage();

    const emailInput = screen.getByLabelText(/email/i);
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: /send magic link/i }));

    expect((await screen.findByRole("alert")).textContent).toContain(
      "Email service unavailable",
    );
    expect(emailInput).toHaveProperty("disabled", false);
    expect(
      screen.getByRole("button", { name: /send magic link/i }),
    ).toHaveProperty("disabled", false);
  });
});
