import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

export const Route = createRootRoute({
  component: () => (
    <>
      <header className="border-b border-gray-800 px-6 py-4">
        <nav className="mx-auto flex max-w-6xl items-center justify-between">
          <Link to="/" className="text-xl font-bold tracking-tight">
            SnippetVault
          </Link>
          <div className="flex items-center gap-4">
            <Link
              to="/signin"
              className="text-sm text-gray-400 hover:text-white"
            >
              Sign in
            </Link>
          </div>
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">
        <Outlet />
      </main>
      {import.meta.env.DEV && (
        <>
          <TanStackRouterDevtools />
          <ReactQueryDevtools />
        </>
      )}
    </>
  ),
});
