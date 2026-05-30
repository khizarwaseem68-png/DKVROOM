'use client'

import { useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { useAppStore } from '@/lib/store'
import { Header } from '@/components/header'

// Dynamic imports for code splitting — only load what's needed
const HomePage = dynamic(() => import('@/components/home-page'), { ssr: false })
const CarListing = dynamic(() => import('@/components/car-listing'), { ssr: false })
const CarDetail = dynamic(() => import('@/components/car-detail'), { ssr: false })
const RepairPage = dynamic(() => import('@/components/repair-page'), { ssr: false })
const InsurancePage = dynamic(() => import('@/components/insurance-page'), { ssr: false })
const AuctionPage = dynamic(() => import('@/components/auction-page'), { ssr: false })
const LoanPage = dynamic(() => import('@/components/loan-page'), { ssr: false })
const LoanApplication = dynamic(() => import('@/components/loan-application'), { ssr: false })
const DealerDashboard = dynamic(() => import('@/components/dealer-dashboard'), { ssr: false })
const AdminDashboard = dynamic(() => import('@/components/admin-dashboard'), { ssr: false })
const AuthPage = dynamic(() => import('@/components/auth-page'), { ssr: false })
const PaymentPage = dynamic(() => import('@/components/payment-page'), { ssr: false })
const ContinueLoanEnquiry = dynamic(() => import('@/components/continue-loan-enquiry'), { ssr: false })

// Map hash to view and vice versa
const HASH_VIEW_MAP: Record<string, string> = {
  '': 'home',
  'rent': 'rent',
  'buy': 'buy',
  'continue-loan': 'continueLoan',
  'car': 'carDetail',
  'repair': 'repair',
  'insurance': 'insurance',
  'auction': 'auction',
  'loan': 'loan',
  'apply-loan': 'applyLoan',
  'track-status': 'trackStatus',
  'dealer': 'dealerDashboard',
  'admin': 'adminDashboard',
  'login': 'login',
  'register': 'register',
  'profile': 'profile',
  'payment': 'payment',
  'continue-loan-enquiry': 'continueLoanEnquiry',
}

const VIEW_HASH_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(HASH_VIEW_MAP).map(([k, v]) => [v, k])
)

function ViewRenderer() {
  const currentView = useAppStore((state) => state.currentView)

  switch (currentView) {
    case 'home':
      return <HomePage />
    case 'rent':
      return <CarListing type="rent" />
    case 'buy':
      return <CarListing type="sale" />
    case 'continueLoan':
      return <CarListing type="continueLoan" />
    case 'carDetail':
      return <CarDetail />
    case 'repair':
      return <RepairPage />
    case 'insurance':
      return <InsurancePage />
    case 'auction':
      return <AuctionPage />
    case 'loan':
      return <LoanPage />
    case 'applyLoan':
    case 'trackStatus':
      return <LoanApplication />
    case 'dealerDashboard':
      return <DealerDashboard />
    case 'adminDashboard':
      return <AdminDashboard />
    case 'login':
    case 'register':
    case 'profile':
      return <AuthPage />
    case 'payment':
      return <PaymentPage />
    case 'continueLoanEnquiry':
      return <ContinueLoanEnquiry />
    default:
      return <HomePage />
  }
}

export default function Home() {
  const currentView = useAppStore((state) => state.currentView)
  const navigate = useAppStore((state) => state.navigate)
  const checkAuth = useAppStore((state) => state.checkAuth)
  const isAuthPage = currentView === 'login' || currentView === 'register'
  const isDashboard = currentView === 'dealerDashboard' || currentView === 'adminDashboard'

  // Check auth state once on app load
  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  // Listen for auth expiration events
  useEffect(() => {
    const handleAuthExpired = () => {
      useAppStore.getState().logout()
    }
    window.addEventListener('auth:expired', handleAuthExpired)
    return () => window.removeEventListener('auth:expired', handleAuthExpired)
  }, [])

  // On mount, read URL hash and navigate to that view
  useEffect(() => {
    const hash = window.location.hash.replace('#', '')
    const view = HASH_VIEW_MAP[hash]
    if (view && view !== 'home') {
      navigate(view as any)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // When currentView changes, update URL hash (but skip initial mount)
  const isInitialMount = useRef(true)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }
    const hash = VIEW_HASH_MAP[currentView] || ''
    window.history.replaceState(null, '', hash ? `#${hash}` : window.location.pathname)
  }, [currentView])

  // Listen for browser back/forward
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '')
      const view = HASH_VIEW_MAP[hash] || 'home'
      const currentStoreView = useAppStore.getState().currentView
      if (view !== currentStoreView) {
        navigate(view as any)
      }
    }
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [navigate])

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {!isAuthPage && !isDashboard && <Header />}
      <main className="flex-1">
        <ViewRenderer />
      </main>
    </div>
  )
}
