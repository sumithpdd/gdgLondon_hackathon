'use client' // Error components must be Client Components

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center p-4">
      <Card className="bg-slate-900/50 border-slate-800 max-w-md">
        <CardHeader>
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <CardTitle className="text-white text-center">Something went wrong!</CardTitle>
          <CardDescription className="text-slate-400 text-center">
            Don&apos;t worry, you can try again.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-slate-300 text-sm text-center">
            {error.message || 'An unexpected error occurred'}
          </p>
          <Button
            onClick={reset}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            Try again
          </Button>
          <Button
            onClick={() => window.location.href = '/'}
            variant="outline"
            className="w-full"
          >
            Go home
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

