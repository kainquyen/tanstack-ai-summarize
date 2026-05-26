// src/start.ts
import { createMiddleware, createStart } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { auth } from './lib/auth'
import { redirect } from '@tanstack/react-router'

export const authMiddleware = createMiddleware({ type: 'request' }).server(
  async ({ next, request }) => {
    const url = new URL(request.url)
    const headers = getRequestHeaders()
    const session = await auth.api.getSession({ headers })

    if (!session && url.pathname.startsWith('/dashboard')) {
      throw redirect({
        to: '/login',
        search: {
          redirect: url.pathname,
        },
      })
    }

    return next({ context: { session } })
  },
)

export const startInstance = createStart(() => {
  return {
    requestMiddleware: [authMiddleware],
  }
})
