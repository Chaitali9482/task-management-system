'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckSquare } from 'lucide-react'
import type { EmailOtpType } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function AuthCallbackPage() {
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    let active = true

    const handleCallback = async () => {
      try {
        const supabase = createClient()
        const searchParams = new URLSearchParams(window.location.search)
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))

        const callbackError = searchParams.get('error')
        const callbackErrorDescription = searchParams.get('error_description')
        if (callbackError) {
          throw new Error(callbackErrorDescription || 'Unable to confirm email.')
        }

        const code = searchParams.get('code')
        const tokenHash = searchParams.get('token_hash') || hashParams.get('token_hash')
        const type = searchParams.get('type') || hashParams.get('type')

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) throw error
        } else if (tokenHash && type) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type as EmailOtpType,
          })
          if (error) throw error
        }

        router.replace('/dashboard')
      } catch (err: unknown) {
        if (!active) return
        const message = err instanceof Error ? err.message : 'Unable to confirm email.'
        setError(message)
      }
    }

    void handleCallback()
    return () => {
      active = false
    }
  }, [router])

  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <CheckSquare className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold text-foreground">TaskFlow</span>
          </div>
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">
                {error ? 'Confirmation failed' : 'Confirming your email...'}
              </CardTitle>
              <CardDescription>
                {error ? error : 'Please wait while we complete your sign-in.'}
              </CardDescription>
            </CardHeader>
            {error && (
              <CardContent>
                <Button asChild className="w-full">
                  <Link href="/auth/login">Back to sign in</Link>
                </Button>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
