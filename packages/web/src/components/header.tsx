import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { sessionQueryKey, useAuth } from "@web/auth/session";
import { Avatar, AvatarFallback } from "@web/components/ui/avatar";
import { Button } from "@web/components/ui/button";
import { buttonVariants } from "@web/components/ui/button-variants";
import { Separator } from "@web/components/ui/separator";
import { authClient } from "@web/lib/auth-client";
import { cn, getInitials } from "@web/lib/utils";

export function Header() {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  async function handleSignOut() {
    await authClient.signOut();
    await queryClient.invalidateQueries({ queryKey: sessionQueryKey });
    await navigate({ to: "/signin" });
  }

  const userLabel = user?.name || user?.email;

  return (
    <header className="border-b bg-background text-foreground">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link
          to="/"
          className={cn(
            buttonVariants({ variant: "transparent" }),
            "px-0 text-xl font-semibold tracking-tight",
          )}
        >
          SnippetVault
        </Link>

        {isAuthenticated && user && userLabel ? (
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback>{getInitials(userLabel)}</AvatarFallback>
            </Avatar>
            <div className="max-w-48 truncate text-sm text-muted-foreground">
              {userLabel}
            </div>
            <Separator orientation="vertical" className="h-6" />
            <Button type="button" variant="ghost" onClick={handleSignOut}>
              Sign out
            </Button>
          </div>
        ) : (
          <Link
            to="/signin"
            className={cn(buttonVariants({ variant: "ghost" }))}
          >
            Sign in
          </Link>
        )}
      </nav>
    </header>
  );
}
