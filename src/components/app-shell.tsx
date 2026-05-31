'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useAppStore } from '@/lib/store'
import { Header } from '@/components/header'
import { Toaster } from '@/components/ui/sonner'

// Routes where the main Header should be hidden
const HIDE_HEADER_ROUTES = ['/login', '/register', '/dealer-dashboard', '/admin-dashboard', '/customer-dashboard']

function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const checkAuth = useAppStore((state) => state.checkAuth)

  // Check auth state once on app load
  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  // Listen for auth expiration events
  useEffect(() => {
    const handleAuthExpired = () => {
      const state = useAppStore.getState()
      if (state.isLoggedIn) {
        state.logout()
      }
    }
    window.addEventListener('auth:expired', handleAuthExpired)
    return () => window.removeEventListener('auth:expired', handleAuthExpired)
  }, [])

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
