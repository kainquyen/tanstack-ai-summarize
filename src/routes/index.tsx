import ExampleWeb from '#/components/web/ExampleWeb'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  return <ExampleWeb />
}
