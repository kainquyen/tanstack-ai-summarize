import { auth } from '#/lib/auth'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { createMiddleware } from '@tanstack/react-start'
import { redirect } from '@tanstack/react-router'

export const authFnMiddleware = createMiddleware({ type: 'function' }).server(
  async ({ next }) => {
    const headers = getRequestHeaders()
    const session = await auth.api.getSession({ headers })

    if (!session) {
      throw redirect({ to: '/login' })
    }

    session.user.image ||= `https://api.dicebear.com/9.x/big-ears-neutral/svg?seed=${session.user.name}`

    return next({ context: { session } })
  },
)
