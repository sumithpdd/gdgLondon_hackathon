import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileQuestion } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center p-4">
      <Card className="bg-slate-900/50 border-slate-800 max-w-md">
        <CardHeader>
          <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
            <FileQuestion className="w-8 h-8 text-amber-500" />
          </div>
          <CardTitle className="text-white text-center text-4xl">404</CardTitle>
          <CardDescription className="text-slate-400 text-center text-lg">
            Page Not Found
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-slate-300 text-center">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
          <Link href="/">
            <Button className="w-full bg-blue-600 hover:bg-blue-700">
              Go Home
            </Button>
          </Link>
          <div className="pt-4 border-t border-slate-700">
            <p className="text-sm text-slate-400 text-center">Quick Links:</p>
            <div className="flex gap-2 justify-center mt-2">
              <Link href="/submit" className="text-sm text-blue-400 hover:underline">
                Submit
              </Link>
              <span className="text-slate-600">•</span>
              <Link href="/gallery" className="text-sm text-blue-400 hover:underline">
                Gallery
              </Link>
              <span className="text-slate-600">•</span>
              <Link href="/admin/login" className="text-sm text-blue-400 hover:underline">
                Admin
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

