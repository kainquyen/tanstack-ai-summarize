import { auth } from '#/lib/auth'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { createMiddleware } from '@tanstack/react-start'
import { redirect } from '@tanstack/react-router'

// 1. Middleware thuần để inject session (dùng cho server functions)
export const sessionMiddleware = createMiddleware({ type: 'function' })
  .server(async ({ next }) => {
    const headers = getRequestHeaders()
    const session = await auth.api.getSession({ headers })
    return next({ context: { session } })
  })

// 2. Middleware bảo vệ route (dùng cho server functions cần auth)
export const authMiddleware = createMiddleware({ type: 'function' })
  .middleware([sessionMiddleware])
  .server(async ({ next, context }) => {
    if (!context.session) {
      throw redirect({ to: '/login' })
    }
    return next()
  })
