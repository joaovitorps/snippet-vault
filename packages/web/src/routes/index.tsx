import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: () => (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <h1 className="text-5xl font-bold tracking-tight">SnippetVault</h1>
      <p className="mt-4 max-w-md text-lg text-gray-400">
        Save, organize, and share your code snippets. Syntax highlighting, tags,
        and search — all in one place.
      </p>
      <div className="mt-8 flex gap-4">
        <Link
          to="/signin"
          className="rounded-lg bg-indigo-600 px-6 py-3 text-sm font-medium text-white hover:bg-indigo-500"
        >
          Get started
        </Link>
        <a
          href="https://github.com/joaovitorps/snippet-vault"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg border border-gray-700 px-6 py-3 text-sm font-medium text-gray-300 hover:border-gray-600"
        >
          View on GitHub
        </a>
      </div>
    </div>
  ),
});
