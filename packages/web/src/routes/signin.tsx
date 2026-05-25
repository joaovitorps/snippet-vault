import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/signin')({
  component: () => (
    <div className="mx-auto mt-24 max-w-sm">
      <h2 className="text-2xl font-bold">Sign in</h2>
      <p className="mt-2 text-sm text-gray-400">Enter your email to receive a magic link.</p>
      <form className="mt-6 space-y-4" onSubmit={(e) => e.preventDefault()}>
        <input
          type="email"
          placeholder="you@example.com"
          className="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <button
          type="submit"
          className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-medium text-white hover:bg-indigo-500"
        >
          Send magic link
        </button>
      </form>
    </div>
  ),
})
