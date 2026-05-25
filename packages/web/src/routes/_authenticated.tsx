import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: ({ context }) => {
    const isAuthenticated = true
    if (!isAuthenticated) {
      throw redirect({ to: '/signin' })
    }
  },
  component: () => <Outlet />,
})
