import { createAuthClient } from "better-auth/react"

export const authClient = createAuthClient({
    /** The base URL of the server (optional if you're using the same domain) */
    baseURL: "https://tanstack-ai-summarize.vercel.app"
    // baseURL: "http://localhost:3000"
})