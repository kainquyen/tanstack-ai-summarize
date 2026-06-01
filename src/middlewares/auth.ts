import { auth } from '#/lib/auth'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { createMiddleware } from '@tanstack/react-start'
import { redirect } from '@tanstack/react-router'

export const authMiddleware = createMiddleware({ type: 'request' }).server(
  async ({ next, request }) => {
    const url = new URL(request.url)
    const headers = getRequestHeaders()
    const session = await auth.api.getSession({ headers })

    if (!session && url.pathname.startsWith('/dashboard') || !session && url.pathname.startsWith('/api')) {
      throw redirect({
        to: '/signup',
        search: {
          redirect: url.pathname,
        },
      })
    }

    return next({ context: { session } })
  },
)
