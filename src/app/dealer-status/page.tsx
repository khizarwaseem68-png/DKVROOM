'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, CheckCircle2, Clock, LogOut, Mail, ShieldCheck } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { getToken } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

function getDealerStatus(dealer?: Record<string, unknown> | null): 'verified' | 'rejected' | 'pending' {
  if (dealer?.rejectedAt) return 'rejected'
  if (dealer?.verified) return 'verified'
  return 'pending'
}

export default function DealerStatusPage() {
  const router = useRouter()
  const user = useAppStore((state) => state.user)
  const isLoggedIn = useAppStore((state) => state.isLoggedIn)
  const checkAuth = useAppStore((state) => state.checkAuth)
  const logout = useAppStore((state) => state.logout)
  const [ready, setReady] = useState(() => !getToken())

  useEffect(() => {
    let mounted = true
    checkAuth().finally(() => {
      if (mounted) setReady(true)
    })
    return () => {
      mounted = false
    }
  }, [checkAuth])

  useEffect(() => {
    if (!ready) return
    if (!getToken() || !isLoggedIn || !user) {
      router.replace('/login')
      return
    }
    if (user.role !== 'dealer') {
      router.replace('/')
      return
    }
    if (getDealerStatus(user.dealer) === 'verified') {
      router.replace('/dealer-dashboard')
    }
  }, [isLoggedIn, ready, router, user])

  const status = getDealerStatus(user?.dealer)
  const rejected = status === 'rejected'
  const companyName = typeof user?.dealer?.companyName === 'string' ? user.dealer.companyName : 'your dealership'
  const rejectionReason = typeof user?.dealer?.rejectionReason === 'string' ? user.dealer.rejectionReason : ''

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(201,168,76,0.18),transparent_34rem)]" />
        <div className="relative mx-auto flex min-h-screen max-w-5xl items-center px-4 py-16 sm:px-6 lg:px-8">
          <Card className="w-full border-gold/20 bg-card/95 shadow-2xl shadow-black/30">
            <CardContent className="p-6 sm:p-10">
              <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-2xl">
                  <Badge className={rejected ? 'mb-5 border-red-500/30 bg-red-500/10 text-red-300' : 'mb-5 border-gold/30 bg-gold/10 text-gold'}>
                    {rejected ? 'Application Rejected' : 'Verification In Progress'}
                  </Badge>
                  <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                    {rejected ? 'Your dealer account was rejected' : 'Your dealer account is being reviewed'}
                  </h1>
                  <p className="mt-4 text-base leading-7 text-muted-foreground">
                    {rejected
                      ? `Your application for ${companyName} was reviewed by the DK Vroom admin team and could not be approved at this time.`
                      : `Thanks for registering ${companyName}. Our admin team is checking your business details and documents. You will be notified by email once your account is accepted.`}
                  </p>

                  {rejected && rejectionReason && (
                    <div className="mt-6 rounded-lg border border-red-500/20 bg-red-500/10 p-4">
                      <p className="text-sm font-medium text-red-200">Reason</p>
                      <p className="mt-1 text-sm leading-6 text-red-100/80">{rejectionReason}</p>
                    </div>
                  )}

                  <div className="mt-8 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-lg border border-border bg-secondary/40 p-4">
                      <ShieldCheck className="mb-3 size-5 text-gold" />
                      <p className="text-sm font-medium">Admin Review</p>
                      <p className="mt-1 text-xs text-muted-foreground">Business details are checked manually.</p>
                    </div>
                    <div className="rounded-lg border border-border bg-secondary/40 p-4">
                      <Mail className="mb-3 size-5 text-gold" />
                      <p className="text-sm font-medium">Email Update</p>
                      <p className="mt-1 text-xs text-muted-foreground">Approval or rejection is sent to your email.</p>
                    </div>
                    <div className="rounded-lg border border-border bg-secondary/40 p-4">
                      {rejected ? <AlertTriangle className="mb-3 size-5 text-red-300" /> : <Clock className="mb-3 size-5 text-gold" />}
                      <p className="text-sm font-medium">{rejected ? 'Access Blocked' : 'Dashboard Locked'}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {rejected ? 'Rejected accounts cannot use dealer tools.' : 'Dashboard opens after approval.'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    <Button onClick={() => router.push('/')} className="bg-gold text-primary-foreground hover:bg-gold-light">
                      Go to Website
                    </Button>
                    <Button variant="outline" onClick={logout} className="border-border text-muted-foreground hover:text-foreground">
                      <LogOut className="mr-2 size-4" />
                      Logout
                    </Button>
                  </div>
                </div>

                <div className="flex justify-center lg:w-72">
                  <div className={`flex size-40 items-center justify-center rounded-full border ${rejected ? 'border-red-500/30 bg-red-500/10' : 'border-gold/30 bg-gold/10'}`}>
                    {rejected ? <AlertTriangle className="size-20 text-red-300" /> : <CheckCircle2 className="size-20 text-gold" />}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  )
}
