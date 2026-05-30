'use client'

import { useAppStore } from '@/lib/store'
import { Header } from '@/components/header'
import HomePage from '@/components/home-page'
import CarListing from '@/components/car-listing'
import CarDetail from '@/components/car-detail'
import RepairPage from '@/components/repair-page'
import InsurancePage from '@/components/insurance-page'
import AuctionPage from '@/components/auction-page'
import LoanPage from '@/components/loan-page'
import LoanApplication from '@/components/loan-application'
import DealerDashboard from '@/components/dealer-dashboard'
import AdminDashboard from '@/components/admin-dashboard'
import AuthPage from '@/components/auth-page'

function ViewRenderer() {
  const { currentView } = useAppStore()

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
      return <AuthPage />
    case 'profile':
      return <AuthPage />
    default:
      return <HomePage />
  }
}

export default function Home() {
  const { currentView } = useAppStore()
  const isAuthPage = currentView === 'login' || currentView === 'register'
  const isDashboard = currentView === 'dealerDashboard' || currentView === 'adminDashboard'

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a] text-[#f5f0e8]">
      {!isAuthPage && !isDashboard && <Header />}
      <main className="flex-1">
        <ViewRenderer />
      </main>
    </div>
  )
}
