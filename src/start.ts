// src/start.ts
import { createStart } from '@tanstack/react-start'

import { authMiddleware } from './middlewares/auth'

// export const authMiddleware = createMiddleware({ type: 'request' }).server(
//   async ({ next, request }) => {
//     const url = new URL(request.url)
//     const headers = getRequestHeaders()
//     const session = await auth.api.getSession({ headers })

//     if (!session && url.pathname.startsWith('/dashboard') || !session && url.pathname.startsWith('/api')) {
//       throw redirect({
//         to: '/login',
//         search: {
//           redirect: url.pathname,
//         },
//       })
//     }

//     return next({ context: { session } })
//   },
// )

export const startInstance = createStart(() => {
  return {
    requestMiddleware: [authMiddleware],
  }
})
