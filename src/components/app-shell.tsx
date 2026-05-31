'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAppStore } from '@/lib/store'
import { getToken } from '@/lib/api'
import { Header } from '@/components/header'

// Routes where the main Header should be hidden
const HIDE_HEADER_ROUTES = ['/login', '/register', '/dealer-dashboard', '/admin-dashboard', '/customer-dashboard']
const PROTECTED_ROUTES = ['/dealer-dashboard', '/dealer-status', '/admin-dashboard', '/customer-dashboard']

type ProtectedRole = 'dealer' | 'admin' | 'customer'

function isProtectedRoute(pathname: string | null): boolean {
  return Boolean(pathname && PROTECTED_ROUTES.some((route) => pathname.startsWith(route)))
}

function getRequiredRole(pathname: string | null): ProtectedRole | null {
  if (!pathname) return null
  if (pathname.startsWith('/admin-dashboard')) return 'admin'
  if (pathname.startsWith('/dealer-dashboard') || pathname.startsWith('/dealer-status')) return 'dealer'
  if (pathname.startsWith('/customer-dashboard')) return 'customer'
  return null
}

function getDealerStatus(user: { dealer?: Record<string, unknown> | null } | null): 'verified' | 'rejected' | 'pending' {
  const dealer = user?.dealer
  if (dealer?.rejectedAt) return 'rejected'
  if (dealer?.verified) return 'verified'
  return 'pending'
}

function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const checkAuth = useAppStore((state) => state.checkAuth)
  const isLoggedIn = useAppStore((state) => state.isLoggedIn)
  const user = useAppStore((state) => state.user)
  const [authReady, setAuthReady] = useState(() => !getToken())

  // Check auth state once on app load
  useEffect(() => {
    let mounted = true

    if (!getToken()) {
      return () => {
        mounted = false
      }
    }

    checkAuth().finally(() => {
      if (mounted) setAuthReady(true)
    })

    return () => {
      mounted = false
    }
  }, [checkAuth])

  // Listen for auth expiration events
  useEffect(() => {
    const handleAuthExpired = () => {
      useAppStore.getState().logout()
    }
    window.addEventListener('auth:expired', handleAuthExpired)
    return () => window.removeEventListener('auth:expired', handleAuthExpired)
  }, [])

  useEffect(() => {
    if (!authReady || !isProtectedRoute(pathname)) return

    if (!getToken() || !isLoggedIn || !user) {
      router.replace('/')
      return
    }

    const requiredRole = getRequiredRole(pathname)
    if (requiredRole && user.role !== requiredRole) {
      router.replace('/')
      return
    }

    if (pathname?.startsWith('/dealer-dashboard') && user.role === 'dealer' && getDealerStatus(user) !== 'verified') {
      router.replace('/dealer-status')
    }

    if (pathname?.startsWith('/customer-dashboard') && user.role === 'customer') {
      router.replace('/')
    }
  }, [authReady, isLoggedIn, pathname, router, user])

  // Determine if header should be shown
  const hideHeader = HIDE_HEADER_ROUTES.some((route) => pathname?.startsWith(route))

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {!hideHeader && <Header />}
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}

export default function AppShellWrapper({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>
}
