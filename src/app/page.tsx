'use client'

import { useEffect } from 'react'
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

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {!isAuthPage && !isDashboard && <Header />}
      <main className="flex-1">
        <ViewRenderer />
      </main>
    </div>
  )
}
