import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/snippets/")({
  component: () => (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Snippets</h2>
      </div>
      <p className="mt-12 text-center text-gray-500">
        No snippets yet. Create your first one!
      </p>
    </div>
  ),
});
