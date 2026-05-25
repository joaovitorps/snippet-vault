import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/snippets/')({
  component: () => (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Snippets</h2>
        <Link
          to="/snippets/new"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          New snippet
        </Link>
      </div>
      <p className="mt-12 text-center text-gray-500">No snippets yet. Create your first one!</p>
    </div>
  ),
})
