import { useNavigate } from "@tanstack/react-router"
import { authClient } from "./auth-client"
import { toast } from "sonner"

export const useLogout = () => {
  const navigate = useNavigate()

  return async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          navigate({ to: "/" })
          toast.success("Successfully logged out.")
        },
        onError: (error) => {
          toast.error(error.error.message || "Logout failed.")
        },
      },
    })
  }
}
