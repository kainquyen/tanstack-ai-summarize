import { MessageResponse } from '#/components/ai-elements/message'
import { Button, buttonVariants } from '#/components/ui/button'
import { Card, CardContent } from '#/components/ui/card'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '#/components/ui/collapsible'
import { generateSummaryAndTagsFn, getItemByIdFn } from '#/data/items'
import { cn } from '#/lib/utils'
import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import {
  ArrowLeft,
  Calendar,
  ChevronDown,
  Clock,
  ExternalLink,
  Loader2,
  Sparkle,
  User,
} from 'lucide-react'
import { useState } from 'react'
import { useCompletion } from '@ai-sdk/react'
import { toast } from 'sonner'
import { Badge } from '#/components/ui/badge'

export const Route = createFileRoute('/dashboard/items/$itemId')({
  component: RouteComponent,
  loader: ({ params }) => getItemByIdFn({ data: { id: params.itemId } }),
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData?.title ?? 'Untitled',
      },
      {
        name: 'og:image',
        content: loaderData?.ogImage || '',
      },
      {
        name: 'twitter:title',
        content: loaderData?.title ?? 'Untitled',
      },
    ],
  }),
})

function RouteComponent() {
  const data = Route.useLoaderData()
  const [contentOpen, setContentOpen] = useState(false)
  const router = useRouter()
  const { completion, complete, isLoading } = useCompletion({
    api: '/api/ai/summary',
    initialCompletion: data.summary || '',
    streamProtocol: 'text',
    body: {
      itemId: data.id,
    },
    onFinish: async (_prompt, completionText) => {
      await generateSummaryAndTagsFn({
        data: {
          id: data.id,
          summary: completionText,
        },
      })

      toast.success('Summary generated successfully!')
      router.invalidate()
    },
    onError: (error) => {
      toast.error(
        error.message || 'An error occurred while generating the summary.',
      )
    },
  })

  const handleGenerateSummary = () => {
    if (!data.content) {
      toast.error('No content available to summarize.')
      return
    }
    complete(data.content)
  }
  return (
    <div className="mx-auto space-y-6 w-full">
      <div className="flex justify-start">
        <Link
          to="/dashboard/items"
          className={buttonVariants({ variant: 'outline' })}
        >
          <ArrowLeft />
          Go back
        </Link>
      </div>

      <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
        <img
          src={
            data.ogImage ??
            'https://images.unsplash.com/photo-1614851099511-773084f6911d?fm=jpg&q=60&w=3000&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8YmxhY2slMjBncmFkaWVudHxlbnwwfHwwfHx8MA%3D%3D'
          }
          alt="OG Image"
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
        />
      </div>

      <div className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">
          {data.title ?? 'Untitled'}
        </h1>

        {/* Metadata Row */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          {data.author && (
            <span className="inline-flex items-center gap-1">
              <User className="size-3.5" />
              {data.author}
            </span>
          )}

          {data.publishedAt && (
            <span className="inline-flex items-center gap-1">
              <Calendar className="size-3.5" />
              {new Date(data.publishedAt).toLocaleDateString('en-US')}
            </span>
          )}

          <span className="inline-flex items-center gap-1">
            <Clock className="size-3.5" />
            Saved {new Date(data.createdAt).toLocaleDateString('en-US')}
          </span>
        </div>

        <a
          href={data.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline inline-flex items-center gap-1 text-sm"
        >
          View Original
          <ExternalLink className="size-3.5" />
        </a>

        {/* Tags  */}
        {data.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {data.tags.map((tag) => (
              <Badge key={tag}>{tag}</Badge>
            ))}
          </div>
        )}

        {/* Summary section  */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent>
            <div className="flex flex-start justify-between gap-4">
              <div className="flex-1">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-primary mb-3">
                  Summary
                </h2>

                {completion || data.summary ? (
                  <MessageResponse>{completion}</MessageResponse>
                ) : (
                  <p className="text-muted-foreground italic">
                    {data.content
                      ? 'No summary yet, generate one by clicking the button!'
                      : 'No content available to summarize.'}
                  </p>
                )}
              </div>
              {data.content && !data.summary && (
                <Button
                  onClick={handleGenerateSummary}
                  disabled={isLoading}
                  size="sm"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkle className="mr-2 h-4 w-4" />
                      Generate
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Content section  */}
        {data.content && (
          <Collapsible open={contentOpen} onOpenChange={setContentOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                <span className="font-medium">Full Content</span>
                <ChevronDown
                  className={cn(
                    'size-4 transition-transform',
                    contentOpen && 'rotate-180',
                  )}
                />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <Card className="mt-2">
                <CardContent>
                  <MessageResponse>{data.content}</MessageResponse>
                </CardContent>
              </Card>
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>
    </div>
  )
}
