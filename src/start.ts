// src/start.ts
import { createStart } from '@tanstack/react-start'

import { authMiddleware } from './middlewares/auth'

export const startInstance = createStart(() => {
  return {
    functionMiddleware: [authMiddleware],
  }
})
