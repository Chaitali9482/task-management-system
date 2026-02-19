'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { CheckSquare, Shield, User } from 'lucide-react'
import { useEffect, useCallback } from 'react'

const DEFAULT_ADMIN = { email: 'admin@taskflow.com', password: 'admin123456' }

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [adminSeeded, setAdminSeeded] = useState<boolean | null>(null)
  const router = useRouter()

  // Auto-seed the default admin on first visit
  useEffect(() => {
    fetch('/api/seed-admin', { method: 'POST' })
      .then((res) => res.json())
      .then(() => setAdminSeeded(true))
      .catch(() => setAdminSeeded(false))
  }, [])

  const fillCredentials = useCallback((role: 'admin' | 'user') => {
    if (role === 'admin') {
      setEmail(DEFAULT_ADMIN.email)
      setPassword(DEFAULT_ADMIN.password)
    } else {
      setEmail('')
      setPassword('')
    }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      router.push('/dashboard')
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

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
            <CardHeader>
              <CardTitle className="text-2xl">Welcome back</CardTitle>
              <CardDescription>
                Sign in to your account to continue
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin}>
                <div className="flex flex-col gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  {error && (
                    <p className="text-sm text-destructive-foreground">{error}</p>
                  )}
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Signing in...' : 'Sign in'}
                  </Button>
                </div>
                <div className="mt-4 text-center text-sm text-muted-foreground">
                  {"Don't have an account? "}
                  <Link
                    href="/auth/sign-up"
                    className="font-medium text-foreground underline underline-offset-4"
                  >
                    Sign up
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Default credentials */}
          <Card className="border-dashed">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Demo Credentials</CardTitle>
              <CardDescription className="text-xs">
                Click a role to auto-fill login credentials
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => fillCredentials('admin')}
                className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
                  <Shield className="h-4 w-4 text-primary-foreground" />
                </div>
                <div className="flex flex-col">
                  <span className="font-medium text-foreground">Admin</span>
                  <span className="text-xs text-muted-foreground">
                    admin@taskflow.com / admin123456
                  </span>
                </div>
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('user')}
                className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex flex-col">
                  <span className="font-medium text-foreground">User</span>
                  <span className="text-xs text-muted-foreground">
                    Sign up to create a user account
                  </span>
                </div>
              </button>
              {adminSeeded === true && (
                <p className="mt-1 text-center text-xs text-muted-foreground">
                  Default admin account is ready
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
