import { Link } from '@tanstack/react-router'
import { Button, buttonVariants } from '../ui/button'
import { ThemeToggle } from './ThemeToggle'
import { authClient } from '#/lib/auth-client'
import { toast } from 'sonner'

const Navbar = () => {
  const { data: session, isPending } = authClient.useSession()
  const handleLogout = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          toast.success('Successfully logged out.') // Optionally, you can show a success message or perform additional actions here
        },
        onError: (error) => {
          toast.error(error.error.message)
        },
      },
    })
  }
  return (
    <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 ">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <img
            src="https://tanstack.com/images/logos/logo-color-banner-600.png"
            alt="TanStack Start Logo"
            className="size-8"
          />
          <h1 className="text-lg font-semibold">TanStack Start</h1>
        </div>

        <div className="flex items-center gap-3">
          <>
            <ThemeToggle />
            {isPending ? null : session ? (
              <>
                <Button variant="secondary" onClick={handleLogout}>
                  Log out
                </Button>
                <Link to="/dashboard" className={buttonVariants()}>
                  Dashboard
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className={buttonVariants({ variant: 'secondary' })}
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className={buttonVariants({ variant: 'default' })}
                >
                  Get Started
                </Link>
              </>
            )}
          </>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
