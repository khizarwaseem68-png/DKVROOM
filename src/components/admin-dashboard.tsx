'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  LayoutDashboard,
  Users,
  Car,
  CalendarCheck,
  Banknote,
  Wallet,
  AlertTriangle,
  ShieldAlert,
  BarChart3,
  Settings,
  Bell,
  Search,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  DollarSign,
  CheckCircle,
  XCircle,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Menu,
  X,
  Clock,
  AlertCircle,
  UserCheck,
  UserX,
  FileCheck,
  Shield,
  CreditCard,
  Activity,
  Flag,
  Gavel,
} from 'lucide-react'

// Mock data
const mockDealers = [
  { id: 'd1', company: 'Prestige Auto KL', city: 'Kuala Lumpur', status: 'verified', listings: 45, rating: 4.9 },
  { id: 'd2', company: 'Merc Gallery MY', city: 'Kuala Lumpur', status: 'verified', listings: 38, rating: 4.8 },
  { id: 'd3', company: 'Stuttgart Motors', city: 'Selangor', status: 'verified', listings: 22, rating: 5.0 },
  { id: 'd4', company: 'Southern Auto Hub', city: 'Johor', status: 'verified', listings: 120, rating: 4.5 },
  { id: 'd5', company: 'Honda Power Zone', city: 'Selangor', status: 'pending', listings: 65, rating: 4.7 },
  { id: 'd6', company: 'MyviMart Shah Alam', city: 'Selangor', status: 'verified', listings: 90, rating: 4.3 },
  { id: 'd7', company: 'Bavarian Motors KL', city: 'Kuala Lumpur', status: 'pending', listings: 35, rating: 4.8 },
  { id: 'd8', company: 'Supercars Asia', city: 'Kuala Lumpur', status: 'rejected', listings: 15, rating: 4.9 },
]

const mockCars = [
  { id: '1', brand: 'BMW M4 Competition', dealer: 'Prestige Auto KL', type: 'rent', price: 680, status: 'approved', photo: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=200&q=60' },
  { id: '2', brand: 'Mercedes S580', dealer: 'Merc Gallery MY', type: 'sale', price: 898000, status: 'approved', photo: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=200&q=60' },
  { id: '3', brand: 'Porsche 911 Turbo S', dealer: 'Stuttgart Motors', type: 'rent', price: 1200, status: 'pending', photo: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=200&q=60' },
  { id: '4', brand: 'Toyota Camry 2.5V', dealer: 'Southern Auto Hub', type: 'sale', price: 138000, status: 'pending', photo: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=200&q=60' },
  { id: '5', brand: 'Honda Civic Type R', dealer: 'Honda Power Zone', type: 'rent', price: 380, status: 'approved', photo: 'https://images.unsplash.com/photo-1542362567-b07e54358753?w=200&q=60' },
  { id: '6', brand: 'Perodua Myvi 1.5 AV', dealer: 'MyviMart Shah Alam', type: 'continueLoan', price: 52000, status: 'approved', photo: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=200&q=60' },
]

const mockLoans = [
  { id: 'LN001', applicant: 'Ahmad Razak', car: 'Perodua Myvi 1.5 AV', bank: 'Maybank', amount: 41880, status: 'pending', date: 'Mar 1, 2026' },
  { id: 'LN002', applicant: 'Sarah Tan', car: 'BMW X5 xDrive40i', bank: 'CIMB', amount: 153600, status: 'underReview', date: 'Mar 2, 2026' },
  { id: 'LN003', applicant: 'Lim Wei Jie', car: 'Mazda CX-5 Turbo', bank: 'Hong Leong Bank', amount: 99900, status: 'approved', date: 'Feb 28, 2026' },
  { id: 'LN004', applicant: 'Nurul Aisyah', car: 'Honda HR-V', bank: 'Public Bank', amount: 85000, status: 'rejected', date: 'Feb 25, 2026' },
  { id: 'LN005', applicant: 'David Kumar', car: 'Toyota Vios', bank: 'Maybank', amount: 62000, status: 'pending', date: 'Mar 4, 2026' },
]

const mockPayments = [
  { id: 'TXN001', user: 'Ahmad Razak', dealer: 'Prestige Auto KL', amount: 3400, method: 'FPX', status: 'completed', date: 'Mar 1, 2026' },
  { id: 'TXN002', user: 'Sarah Tan', dealer: 'Merc Gallery MY', amount: 5200, method: 'TNG', status: 'pending', date: 'Mar 3, 2026' },
  { id: 'TXN003', user: 'Lim Wei Jie', dealer: 'Stuttgart Motors', amount: 3600, method: 'Billplz', status: 'completed', date: 'Mar 8, 2026' },
  { id: 'TXN004', user: 'Nurul Aisyah', dealer: 'Honda Power Zone', amount: 760, method: 'Stripe', status: 'failed', date: 'Mar 10, 2026' },
  { id: 'TXN005', user: 'David Kumar', dealer: 'MyviMart Shah Alam', amount: 3000, method: 'FPX', status: 'completed', date: 'Mar 12, 2026' },
  { id: 'TXN006', user: 'Wei Ming', dealer: 'Bavarian Motors KL', amount: 15000, method: 'Billplz', status: 'pending', date: 'Mar 13, 2026' },
]

const mockFraud = [
  { id: 'FR001', type: 'Suspicious Listing', desc: '2019 Proton Saga listed at RM 180,000 — well above market value', user: 'Unknown Dealer', date: 'Mar 10, 2026', severity: 'high' },
  { id: 'FR002', type: 'Duplicate Account', desc: 'Two dealer accounts with identical company registration', user: 'Auto Dealer X', date: 'Mar 9, 2026', severity: 'medium' },
  { id: 'FR003', type: 'Unusual Pricing', desc: 'BMW X5 listed at RM 89,000 — significantly below market', user: 'Quick Cars MY', date: 'Mar 8, 2026', severity: 'high' },
  { id: 'FR004', type: 'Fake Documents', desc: 'Uploaded IC appears to be digitally altered', user: 'Applicant #4521', date: 'Mar 7, 2026', severity: 'high' },
  { id: 'FR005', type: 'Suspicious Listing', desc: 'Multiple high-value vehicles listed by newly registered dealer', user: 'Luxury Auto Hub', date: 'Mar 6, 2026', severity: 'low' },
]

const recentActivity = [
  { text: 'New dealer registration: Honda Power Zone', time: '5 min ago', icon: Users },
  { text: 'Car listing approved: BMW M4 Competition', time: '12 min ago', icon: Car },
  { text: 'Loan application submitted: RM 41,880', time: '25 min ago', icon: Banknote },
  { text: 'Payment received: RM 3,400 via FPX', time: '1 hour ago', icon: Wallet },
  { text: 'Fraud flag: Suspicious listing detected', time: '2 hours ago', icon: ShieldAlert },
  { text: 'Dealer verified: Prestige Auto KL', time: '3 hours ago', icon: UserCheck },
  { text: 'New car listing: Toyota Camry 2.5V', time: '4 hours ago', icon: Car },
  { text: 'Loan approved: CIMB - RM 153,600', time: '5 hours ago', icon: Banknote },
  { text: 'Dispute resolved: Booking #BK-2341', time: '6 hours ago', icon: CheckCircle },
  { text: 'New user registration: david.kumar@email.com', time: '7 hours ago', icon: Users },
]

const monthlyPlatformRevenue = [
  { month: 'Sep', rental: 30, sale: 45, loan: 15, auction: 10 },
  { month: 'Oct', rental: 35, sale: 50, loan: 20, auction: 15 },
  { month: 'Nov', rental: 40, sale: 55, loan: 18, auction: 12 },
  { month: 'Dec', rental: 50, sale: 65, loan: 25, auction: 20 },
  { month: 'Jan', rental: 55, sale: 70, loan: 28, auction: 18 },
  { month: 'Feb', rental: 60, sale: 75, loan: 32, auction: 22 },
]

const sidebarItems = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'dealers', label: 'Dealers', icon: Users },
  { id: 'cars', label: 'Cars', icon: Car },
  { id: 'bookings', label: 'Bookings', icon: CalendarCheck },
  { id: 'loans', label: 'Loans', icon: Banknote },
  { id: 'payments', label: 'Payments', icon: Wallet },
  { id: 'disputes', label: 'Disputes', icon: AlertTriangle },
  { id: 'fraud', label: 'Fraud', icon: ShieldAlert },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
]

function getVerificationBadge(status: string) {
  switch (status) {
    case 'verified':
      return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">Verified</Badge>
    case 'pending':
      return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">Pending</Badge>
    case 'rejected':
      return <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">Rejected</Badge>
    default:
      return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30 text-xs">{status}</Badge>
  }
}

function getLoanStatusBadge(status: string) {
  switch (status) {
    case 'pending':
      return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">Pending</Badge>
    case 'underReview':
      return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">Under Review</Badge>
    case 'approved':
      return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">Approved</Badge>
    case 'rejected':
      return <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">Rejected</Badge>
    default:
      return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30 text-xs">{status}</Badge>
  }
}

function getSeverityBadge(severity: string) {
  switch (severity) {
    case 'high':
      return <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">High</Badge>
    case 'medium':
      return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">Medium</Badge>
    case 'low':
      return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">Low</Badge>
    default:
      return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30 text-xs">{severity}</Badge>
  }
}

function getTypeLabel(type: string) {
  switch (type) {
    case 'rent': return 'For Rent'
    case 'sale': return 'For Sale'
    case 'continueLoan': return 'Continue Loan'
    case 'auction': return 'Auction'
    default: return type
  }
}

export default function AdminDashboard() {
  const { userName, goBack } = useAppStore()
  const [activeTab, setActiveTab] = useState('overview')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [dealerFilter, setDealerFilter] = useState('all')
  const [dealerSearch, setDealerSearch] = useState('')
  const [loanFilter, setLoanFilter] = useState('all')
  const [paymentFilter, setPaymentFilter] = useState('all')

  const filteredDealers = mockDealers
    .filter((d) => dealerFilter === 'all' || d.status === dealerFilter)
    .filter((d) => dealerSearch === '' || d.company.toLowerCase().includes(dealerSearch.toLowerCase()))

  const filteredLoans = loanFilter === 'all'
    ? mockLoans
    : mockLoans.filter((l) => l.status === loanFilter)

  const filteredPayments = paymentFilter === 'all'
    ? mockPayments
    : mockPayments.filter((p) => p.method === paymentFilter)

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    setMobileSidebarOpen(false)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5f0e8] flex">
      {/* Sidebar - Desktop */}
      <aside
        className={`hidden lg:flex flex-col border-r border-[#2a2a2a] bg-[#0f0f0f] transition-all duration-300 ${
          sidebarCollapsed ? 'w-16' : 'w-60'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-[#2a2a2a]">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                <Shield className="size-4 text-red-400" />
              </div>
              <span className="text-sm font-bold text-red-400">Admin Panel</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="text-[#8a8578] hover:text-[#c9a84c] hover:bg-[#c9a84c]/10 h-7 w-7"
          >
            {sidebarCollapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
          </Button>
        </div>
        <nav className="flex-1 py-4 px-2 space-y-1">
          {sidebarItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-[#c9a84c]/10 text-[#c9a84c]'
                    : 'text-[#8a8578] hover:bg-[#1a1a1a] hover:text-[#f5f0e8]'
                } ${sidebarCollapsed ? 'justify-center' : ''}`}
              >
                <Icon className="size-4 shrink-0" />
                {!sidebarCollapsed && <span>{item.label}</span>}
                {item.id === 'fraud' && !sidebarCollapsed && (
                  <Badge className="ml-auto bg-red-500/20 text-red-400 border-red-500/30 text-[10px] px-1.5">3</Badge>
                )}
                {item.id === 'dealers' && !sidebarCollapsed && (
                  <Badge className="ml-auto bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-[10px] px-1.5">2</Badge>
                )}
              </button>
            )
          })}
        </nav>
        {!sidebarCollapsed && (
          <div className="p-4 border-t border-[#2a2a2a]">
            <Button
              variant="ghost"
              onClick={goBack}
              className="w-full text-[#8a8578] hover:text-[#c9a84c] hover:bg-[#c9a84c]/10 text-sm"
            >
              <ChevronLeft className="size-4 mr-1" />
              Back to Site
            </Button>
          </div>
        )}
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-[#0f0f0f] border-r border-[#2a2a2a] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-[#2a2a2a]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <Shield className="size-4 text-red-400" />
                </div>
                <span className="text-sm font-bold text-red-400">Admin Panel</span>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setMobileSidebarOpen(false)} className="text-[#8a8578]">
                <X className="size-4" />
              </Button>
            </div>
            <nav className="flex-1 py-4 px-2 space-y-1">
              {sidebarItems.map((item) => {
                const Icon = item.icon
                const isActive = activeTab === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabChange(item.id)}
                    className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-[#c9a84c]/10 text-[#c9a84c]'
                        : 'text-[#8a8578] hover:bg-[#1a1a1a] hover:text-[#f5f0e8]'
                    }`}
                  >
                    <Icon className="size-4" />
                    <span>{item.label}</span>
                  </button>
                )
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-40 border-b border-[#2a2a2a] bg-[#0a0a0a]/95 backdrop-blur-xl">
          <div className="flex items-center justify-between px-4 sm:px-6 h-14">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileSidebarOpen(true)}
                className="lg:hidden text-[#8a8578] hover:text-[#c9a84c]"
              >
                <Menu className="size-5" />
              </Button>
              <h1 className="text-lg font-semibold">
                {sidebarItems.find((i) => i.id === activeTab)?.label || 'Dashboard'}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="relative text-[#8a8578] hover:text-[#c9a84c]">
                <Bell className="size-4" />
                <span className="absolute top-1 right-1 size-2 bg-red-500 rounded-full" />
              </Button>
              <Separator orientation="vertical" className="h-6 bg-[#2a2a2a]" />
              <div className="flex items-center gap-2">
                <Avatar className="size-8 border border-red-500/30">
                  <AvatarFallback className="bg-red-500/10 text-red-400 text-xs font-bold">
                    {userName?.charAt(0) || 'A'}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:flex flex-col">
                  <span className="text-sm font-medium">{userName || 'Admin'}</span>
                  <span className="text-[10px] text-red-400 font-medium uppercase">Super Admin</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
          {/* ===== OVERVIEW ===== */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total Users', value: '15,247', icon: Users, change: '+842', up: true },
                  { label: 'Total Dealers', value: '183', icon: UserCheck, change: '+12', up: true },
                  { label: 'Total Cars Listed', value: '2,541', icon: Car, change: '+156', up: true },
                  { label: 'Platform Revenue', value: 'RM 1.2M', icon: DollarSign, change: '+23%', up: true },
                ].map((stat) => {
                  const Icon = stat.icon
                  return (
                    <Card key={stat.label} className="bg-[#111111] border-[#2a2a2a]">
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex items-start justify-between mb-3">
                          <div className="w-10 h-10 rounded-lg bg-[#c9a84c]/10 flex items-center justify-center">
                            <Icon className="size-5 text-[#c9a84c]" />
                          </div>
                          <span className={`flex items-center text-xs font-medium ${stat.up ? 'text-emerald-400' : 'text-red-400'}`}>
                            {stat.up ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                            {stat.change}
                          </span>
                        </div>
                        <div className="text-2xl font-bold text-[#f5f0e8]">{stat.value}</div>
                        <div className="text-xs text-[#8a8578] mt-1">{stat.label}</div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Platform Activity Chart */}
                <Card className="lg:col-span-2 bg-[#111111] border-[#2a2a2a]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold">Platform Revenue</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 pt-0">
                    <div className="flex items-end gap-2 sm:gap-3 h-48">
                      {monthlyPlatformRevenue.map((item) => (
                        <div key={item.month} className="flex-1 flex flex-col items-center gap-2">
                          <div className="w-full relative flex gap-0.5" style={{ height: '160px' }}>
                            <div className="absolute bottom-0 w-1/4 h-full flex flex-col justify-end">
                              <div className="bg-[#c9a84c] rounded-t-sm" style={{ height: `${item.rental}%` }} />
                            </div>
                            <div className="absolute bottom-0 left-1/4 w-1/4 h-full flex flex-col justify-end">
                              <div className="bg-emerald-500 rounded-t-sm" style={{ height: `${item.sale}%` }} />
                            </div>
                            <div className="absolute bottom-0 left-1/2 w-1/4 h-full flex flex-col justify-end">
                              <div className="bg-purple-500 rounded-t-sm" style={{ height: `${item.loan}%` }} />
                            </div>
                            <div className="absolute bottom-0 left-3/4 w-1/4 h-full flex flex-col justify-end">
                              <div className="bg-orange-500 rounded-t-sm" style={{ height: `${item.auction}%` }} />
                            </div>
                          </div>
                          <span className="text-[10px] text-[#8a8578]">{item.month}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-4 mt-4 flex-wrap">
                      {[
                        { label: 'Rental', color: 'bg-[#c9a84c]' },
                        { label: 'Sale', color: 'bg-emerald-500' },
                        { label: 'Loan', color: 'bg-purple-500' },
                        { label: 'Auction', color: 'bg-orange-500' },
                      ].map((l) => (
                        <div key={l.label} className="flex items-center gap-1.5">
                          <div className={`w-2.5 h-2.5 rounded-sm ${l.color}`} />
                          <span className="text-xs text-[#8a8578]">{l.label}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card className="bg-[#111111] border-[#2a2a2a]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 pt-2 space-y-3 max-h-72 overflow-y-auto">
                    {recentActivity.map((item, idx) => {
                      const Icon = item.icon
                      return (
                        <div key={idx} className="flex items-start gap-3 py-2 border-b border-[#2a2a2a]/50 last:border-0">
                          <div className="w-7 h-7 rounded-full bg-[#1a1a1a] flex items-center justify-center shrink-0 mt-0.5">
                            <Icon className="size-3.5 text-[#c9a84c]" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs leading-relaxed">{item.text}</p>
                            <p className="text-[10px] text-[#8a8578] mt-0.5">{item.time}</p>
                          </div>
                        </div>
                      )
                    })}
                  </CardContent>
                </Card>
              </div>

              {/* Alerts */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="bg-[#111111] border-yellow-500/20">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center shrink-0">
                      <Clock className="size-5 text-yellow-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Pending Verifications</p>
                      <p className="text-2xl font-bold text-yellow-400">2</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-[#111111] border-orange-500/20">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
                      <AlertTriangle className="size-5 text-orange-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Unresolved Disputes</p>
                      <p className="text-2xl font-bold text-orange-400">5</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-[#111111] border-red-500/20">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                      <ShieldAlert className="size-5 text-red-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Fraud Flags</p>
                      <p className="text-2xl font-bold text-red-400">3</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* ===== DEALERS ===== */}
          {activeTab === 'dealers' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2 flex-1 max-w-md">
                  <Search className="size-4 text-[#8a8578] shrink-0" />
                  <Input
                    value={dealerSearch}
                    onChange={(e) => setDealerSearch(e.target.value)}
                    placeholder="Search dealers..."
                    className="bg-[#1a1a1a] border-[#2a2a2a] text-[#f5f0e8] placeholder:text-[#4a4535] focus-visible:border-[#c9a84c]"
                  />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {['all', 'verified', 'pending', 'rejected'].map((status) => (
                    <Button
                      key={status}
                      variant={dealerFilter === status ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setDealerFilter(status)}
                      className={dealerFilter === status
                        ? 'bg-[#c9a84c] text-[#0a0a0a] hover:bg-[#b8963e] text-xs'
                        : 'text-[#8a8578] hover:text-[#f5f0e8] text-xs'
                      }
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>

              <Card className="bg-[#111111] border-[#2a2a2a]">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[#2a2a2a]">
                          <th className="text-left py-3 px-4 text-[#8a8578] font-medium">Company Name</th>
                          <th className="text-left py-3 px-4 text-[#8a8578] font-medium">City</th>
                          <th className="text-left py-3 px-4 text-[#8a8578] font-medium">Verification</th>
                          <th className="text-left py-3 px-4 text-[#8a8578] font-medium">Listings</th>
                          <th className="text-left py-3 px-4 text-[#8a8578] font-medium">Rating</th>
                          <th className="text-left py-3 px-4 text-[#8a8578] font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredDealers.map((dealer) => (
                          <tr key={dealer.id} className="border-b border-[#2a2a2a]/50 hover:bg-[#1a1a1a]/50">
                            <td className="py-3 px-4 font-medium">{dealer.company}</td>
                            <td className="py-3 px-4 text-[#8a8578]">{dealer.city}</td>
                            <td className="py-3 px-4">{getVerificationBadge(dealer.status)}</td>
                            <td className="py-3 px-4">{dealer.listings}</td>
                            <td className="py-3 px-4 text-[#c9a84c] font-medium">{dealer.rating}</td>
                            <td className="py-3 px-4">
                              {dealer.status === 'pending' ? (
                                <div className="flex items-center gap-1">
                                  <Button variant="ghost" size="sm" className="h-7 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 text-xs">
                                    <CheckCircle className="size-3.5 mr-1" />Verify
                                  </Button>
                                  <Button variant="ghost" size="sm" className="h-7 text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs">
                                    <XCircle className="size-3.5 mr-1" />Reject
                                  </Button>
                                </div>
                              ) : (
                                <Button variant="ghost" size="sm" className="h-7 text-[#8a8578] hover:text-[#c9a84c] text-xs">
                                  <Eye className="size-3.5 mr-1" />View
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ===== CARS ===== */}
          {activeTab === 'cars' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-[#8a8578]">{mockCars.length} car listings</p>
              </div>
              <Card className="bg-[#111111] border-[#2a2a2a]">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[#2a2a2a]">
                          <th className="text-left py-3 px-4 text-[#8a8578] font-medium">Photo</th>
                          <th className="text-left py-3 px-4 text-[#8a8578] font-medium">Brand / Model</th>
                          <th className="text-left py-3 px-4 text-[#8a8578] font-medium">Dealer</th>
                          <th className="text-left py-3 px-4 text-[#8a8578] font-medium">Type</th>
                          <th className="text-left py-3 px-4 text-[#8a8578] font-medium">Price</th>
                          <th className="text-left py-3 px-4 text-[#8a8578] font-medium">Status</th>
                          <th className="text-left py-3 px-4 text-[#8a8578] font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mockCars.map((car) => (
                          <tr key={car.id} className="border-b border-[#2a2a2a]/50 hover:bg-[#1a1a1a]/50">
                            <td className="py-3 px-4">
                              <img src={car.photo} alt={car.brand} className="w-16 h-12 object-cover rounded-md" />
                            </td>
                            <td className="py-3 px-4 font-medium">{car.brand}</td>
                            <td className="py-3 px-4 text-[#8a8578]">{car.dealer}</td>
                            <td className="py-3 px-4">
                              <Badge variant="outline" className="border-[#2a2a2a] text-[#8a8578] text-xs">
                                {getTypeLabel(car.type)}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 font-medium text-[#c9a84c]">
                              RM {car.price.toLocaleString()}{car.type === 'rent' ? '/day' : ''}
                            </td>
                            <td className="py-3 px-4">
                              {car.status === 'approved' ? (
                                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">Approved</Badge>
                              ) : (
                                <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">Pending</Badge>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              {car.status === 'pending' ? (
                                <div className="flex items-center gap-1">
                                  <Button variant="ghost" size="sm" className="h-7 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 text-xs">
                                    <CheckCircle className="size-3.5 mr-1" />Approve
                                  </Button>
                                  <Button variant="ghost" size="sm" className="h-7 text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs">
                                    <XCircle className="size-3.5 mr-1" />Reject
                                  </Button>
                                </div>
                              ) : (
                                <Button variant="ghost" size="sm" className="h-7 text-[#8a8578] hover:text-[#c9a84c] text-xs">
                                  <Eye className="size-3.5 mr-1" />View
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ===== BOOKINGS ===== */}
          {activeTab === 'bookings' && (
            <div className="space-y-4">
              <Card className="bg-[#111111] border-[#2a2a2a]">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[#2a2a2a]">
                          <th className="text-left py-3 px-4 text-[#8a8578] font-medium">Booking ID</th>
                          <th className="text-left py-3 px-4 text-[#8a8578] font-medium">Customer</th>
                          <th className="text-left py-3 px-4 text-[#8a8578] font-medium">Car</th>
                          <th className="text-left py-3 px-4 text-[#8a8578] font-medium">Dealer</th>
                          <th className="text-left py-3 px-4 text-[#8a8578] font-medium">Dates</th>
                          <th className="text-left py-3 px-4 text-[#8a8578] font-medium">Amount</th>
                          <th className="text-left py-3 px-4 text-[#8a8578] font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { id: 'BK001', customer: 'Ahmad Razak', car: 'BMW M4', dealer: 'Prestige Auto KL', dates: 'Mar 1-5', amount: 3400, status: 'confirmed' },
                          { id: 'BK002', customer: 'Sarah Tan', car: 'Mercedes S580', dealer: 'Merc Gallery MY', dates: 'Mar 3-7', amount: 5200, status: 'pending' },
                          { id: 'BK003', customer: 'Lim Wei Jie', car: 'Porsche 911', dealer: 'Stuttgart Motors', dates: 'Mar 8-10', amount: 3600, status: 'confirmed' },
                        ].map((b) => (
                          <tr key={b.id} className="border-b border-[#2a2a2a]/50 hover:bg-[#1a1a1a]/50">
                            <td className="py-3 px-4 font-mono text-xs">{b.id}</td>
                            <td className="py-3 px-4">{b.customer}</td>
                            <td className="py-3 px-4">{b.car}</td>
                            <td className="py-3 px-4 text-[#8a8578]">{b.dealer}</td>
                            <td className="py-3 px-4 text-[#8a8578]">{b.dates}</td>
                            <td className="py-3 px-4 font-medium text-[#c9a84c]">RM {b.amount.toLocaleString()}</td>
                            <td className="py-3 px-4">{getVerificationBadge(b.status)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ===== LOANS ===== */}
          {activeTab === 'loans' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <Filter className="size-4 text-[#8a8578]" />
                {['all', 'pending', 'underReview', 'approved', 'rejected'].map((status) => (
                  <Button
                    key={status}
                    variant={loanFilter === status ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setLoanFilter(status)}
                    className={loanFilter === status
                      ? 'bg-[#c9a84c] text-[#0a0a0a] hover:bg-[#b8963e] text-xs'
                      : 'text-[#8a8578] hover:text-[#f5f0e8] text-xs'
                    }
                  >
                    {status === 'all' ? 'All' : status === 'underReview' ? 'Under Review' : status.charAt(0).toUpperCase() + status.slice(1)}
                  </Button>
                ))}
              </div>

              <Card className="bg-[#111111] border-[#2a2a2a]">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[#2a2a2a]">
                          <th className="text-left py-3 px-4 text-[#8a8578] font-medium">Applicant</th>
                          <th className="text-left py-3 px-4 text-[#8a8578] font-medium">Car</th>
                          <th className="text-left py-3 px-4 text-[#8a8578] font-medium">Bank</th>
                          <th className="text-left py-3 px-4 text-[#8a8578] font-medium">Amount</th>
                          <th className="text-left py-3 px-4 text-[#8a8578] font-medium">Status</th>
                          <th className="text-left py-3 px-4 text-[#8a8578] font-medium">Date</th>
                          <th className="text-left py-3 px-4 text-[#8a8578] font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredLoans.map((loan) => (
                          <tr key={loan.id} className="border-b border-[#2a2a2a]/50 hover:bg-[#1a1a1a]/50">
                            <td className="py-3 px-4 font-medium">{loan.applicant}</td>
                            <td className="py-3 px-4 text-[#8a8578]">{loan.car}</td>
                            <td className="py-3 px-4 text-[#8a8578]">{loan.bank}</td>
                            <td className="py-3 px-4 font-medium text-[#c9a84c]">RM {loan.amount.toLocaleString()}</td>
                            <td className="py-3 px-4">{getLoanStatusBadge(loan.status)}</td>
                            <td className="py-3 px-4 text-[#8a8578]">{loan.date}</td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-1">
                                <Button variant="ghost" size="sm" className="h-7 text-[#8a8578] hover:text-[#c9a84c] text-xs">
                                  <Eye className="size-3.5 mr-1" />View
                                </Button>
                                {(loan.status === 'pending' || loan.status === 'underReview') && (
                                  <Button variant="ghost" size="sm" className="h-7 text-[#c9a84c] hover:text-[#e8d48b] text-xs">
                                    <FileCheck className="size-3.5 mr-1" />Process
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ===== PAYMENTS ===== */}
          {activeTab === 'payments' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total Processed', value: 'RM 1.2M' },
                  { label: 'Pending', value: 'RM 23,400' },
                  { label: 'Failed', value: 'RM 760' },
                  { label: 'Commission Earned', value: 'RM 96,000' },
                ].map((stat) => (
                  <Card key={stat.label} className="bg-[#111111] border-[#2a2a2a]">
                    <CardContent className="p-4">
                      <div className="text-xs text-[#8a8578]">{stat.label}</div>
                      <div className="text-xl font-bold text-[#c9a84c] mt-1">{stat.value}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Filter className="size-4 text-[#8a8578]" />
                {['all', 'FPX', 'TNG', 'Billplz', 'Stripe'].map((method) => (
                  <Button
                    key={method}
                    variant={paymentFilter === method ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setPaymentFilter(method)}
                    className={paymentFilter === method
                      ? 'bg-[#c9a84c] text-[#0a0a0a] hover:bg-[#b8963e] text-xs'
                      : 'text-[#8a8578] hover:text-[#f5f0e8] text-xs'
                    }
                  >
                    {method === 'all' ? 'All Methods' : method}
                  </Button>
                ))}
              </div>

              <Card className="bg-[#111111] border-[#2a2a2a]">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[#2a2a2a]">
                          <th className="text-left py-3 px-4 text-[#8a8578] font-medium">Transaction ID</th>
                          <th className="text-left py-3 px-4 text-[#8a8578] font-medium">User</th>
                          <th className="text-left py-3 px-4 text-[#8a8578] font-medium">Dealer</th>
                          <th className="text-left py-3 px-4 text-[#8a8578] font-medium">Amount</th>
                          <th className="text-left py-3 px-4 text-[#8a8578] font-medium">Method</th>
                          <th className="text-left py-3 px-4 text-[#8a8578] font-medium">Status</th>
                          <th className="text-left py-3 px-4 text-[#8a8578] font-medium">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPayments.map((txn) => (
                          <tr key={txn.id} className="border-b border-[#2a2a2a]/50 hover:bg-[#1a1a1a]/50">
                            <td className="py-3 px-4 font-mono text-xs">{txn.id}</td>
                            <td className="py-3 px-4">{txn.user}</td>
                            <td className="py-3 px-4 text-[#8a8578]">{txn.dealer}</td>
                            <td className="py-3 px-4 font-medium text-[#c9a84c]">RM {txn.amount.toLocaleString()}</td>
                            <td className="py-3 px-4">
                              <Badge variant="outline" className="border-[#2a2a2a] text-[#8a8578] text-xs">{txn.method}</Badge>
                            </td>
                            <td className="py-3 px-4">
                              {txn.status === 'completed' ? (
                                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">Completed</Badge>
                              ) : txn.status === 'pending' ? (
                                <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">Pending</Badge>
                              ) : (
                                <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">Failed</Badge>
                              )}
                            </td>
                            <td className="py-3 px-4 text-[#8a8578]">{txn.date}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ===== DISPUTES ===== */}
          {activeTab === 'disputes' && (
            <div className="space-y-4">
              {[
                { id: 'DSP001', title: 'Car not as described', user: 'Ahmad Razak', dealer: 'Prestige Auto KL', status: 'open', date: 'Mar 10, 2026', amount: 'RM 3,400' },
                { id: 'DSP002', title: 'Overcharged for rental extension', user: 'Sarah Tan', dealer: 'Merc Gallery MY', status: 'investigating', date: 'Mar 9, 2026', amount: 'RM 520' },
                { id: 'DSP003', title: 'Deposit not refunded', user: 'Lim Wei Jie', dealer: 'Stuttgart Motors', status: 'resolved', date: 'Mar 8, 2026', amount: 'RM 5,000' },
                { id: 'DSP004', title: 'Late return penalty dispute', user: 'Nurul Aisyah', dealer: 'Honda Power Zone', status: 'open', date: 'Mar 7, 2026', amount: 'RM 380' },
                { id: 'DSP005', title: 'Damage claim disagreement', user: 'David Kumar', dealer: 'MyviMart Shah Alam', status: 'investigating', date: 'Mar 6, 2026', amount: 'RM 2,500' },
              ].map((dispute) => (
                <Card key={dispute.id} className="bg-[#111111] border-[#2a2a2a]">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                      <div>
                        <p className="font-semibold">{dispute.title}</p>
                        <p className="text-xs text-[#8a8578] mt-0.5">{dispute.id} · {dispute.date}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[#c9a84c]">{dispute.amount}</span>
                        {dispute.status === 'open' && (
                          <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">Open</Badge>
                        )}
                        {dispute.status === 'investigating' && (
                          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">Investigating</Badge>
                        )}
                        {dispute.status === 'resolved' && (
                          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">Resolved</Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-[#8a8578] mb-3">User: {dispute.user} · Dealer: {dispute.dealer}</p>
                    <div className="flex items-center gap-2">
                      <Button size="sm" className="bg-[#c9a84c] hover:bg-[#b8963e] text-[#0a0a0a] text-xs">
                        <Eye className="size-3.5 mr-1" />View Details
                      </Button>
                      {dispute.status !== 'resolved' && (
                        <Button variant="outline" size="sm" className="border-[#2a2a2a] text-[#8a8578] hover:text-[#f5f0e8] text-xs">
                          <CheckCircle className="size-3.5 mr-1" />Resolve
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* ===== FRAUD ===== */}
          {activeTab === 'fraud' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <Card className="bg-[#111111] border-red-500/20">
                  <CardContent className="p-4">
                    <div className="text-xs text-[#8a8578]">High Severity</div>
                    <div className="text-2xl font-bold text-red-400 mt-1">3</div>
                  </CardContent>
                </Card>
                <Card className="bg-[#111111] border-yellow-500/20">
                  <CardContent className="p-4">
                    <div className="text-xs text-[#8a8578]">Medium Severity</div>
                    <div className="text-2xl font-bold text-yellow-400 mt-1">1</div>
                  </CardContent>
                </Card>
                <Card className="bg-[#111111] border-emerald-500/20">
                  <CardContent className="p-4">
                    <div className="text-xs text-[#8a8578]">Low Severity</div>
                    <div className="text-2xl font-bold text-emerald-400 mt-1">1</div>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-[#111111] border-[#2a2a2a]">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[#2a2a2a]">
                          <th className="text-left py-3 px-4 text-[#8a8578] font-medium">Type</th>
                          <th className="text-left py-3 px-4 text-[#8a8578] font-medium">Description</th>
                          <th className="text-left py-3 px-4 text-[#8a8578] font-medium">User</th>
                          <th className="text-left py-3 px-4 text-[#8a8578] font-medium">Date</th>
                          <th className="text-left py-3 px-4 text-[#8a8578] font-medium">Severity</th>
                          <th className="text-left py-3 px-4 text-[#8a8578] font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mockFraud.map((item) => (
                          <tr key={item.id} className="border-b border-[#2a2a2a]/50 hover:bg-[#1a1a1a]/50">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-1.5">
                                <Flag className={`size-3.5 ${item.severity === 'high' ? 'text-red-400' : item.severity === 'medium' ? 'text-yellow-400' : 'text-emerald-400'}`} />
                                <span className="text-xs">{item.type}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-xs text-[#8a8578] max-w-xs truncate">{item.desc}</td>
                            <td className="py-3 px-4 text-xs">{item.user}</td>
                            <td className="py-3 px-4 text-xs text-[#8a8578]">{item.date}</td>
                            <td className="py-3 px-4">{getSeverityBadge(item.severity)}</td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-1">
                                <Button variant="ghost" size="sm" className="h-7 text-[#c9a84c] hover:text-[#e8d48b] hover:bg-[#c9a84c]/10 text-xs">
                                  <Eye className="size-3.5 mr-1" />Investigate
                                </Button>
                                <Button variant="ghost" size="sm" className="h-7 text-[#8a8578] hover:text-[#f5f0e8] text-xs">
                                  <XCircle className="size-3.5 mr-1" />Dismiss
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ===== ANALYTICS ===== */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              {/* Revenue Breakdown */}
              <Card className="bg-[#111111] border-[#2a2a2a]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">Revenue by Module</CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-2 space-y-4">
                  {[
                    { label: 'Car Sales', value: 520000, color: 'bg-emerald-500', percent: 43 },
                    { label: 'Rental Income', value: 340000, color: 'bg-[#c9a84c]', percent: 28 },
                    { label: 'Loan Commission', value: 180000, color: 'bg-purple-500', percent: 15 },
                    { label: 'Auction Fees', value: 96000, color: 'bg-orange-500', percent: 8 },
                    { label: 'Insurance Commission', value: 64000, color: 'bg-cyan-500', percent: 5 },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div className={`w-2.5 h-2.5 rounded-sm ${item.color}`} />
                          <span className="text-sm">{item.label}</span>
                        </div>
                        <span className="text-sm font-semibold text-[#c9a84c]">RM {item.value.toLocaleString()}</span>
                      </div>
                      <div className="w-full h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
                        <div className={`h-full ${item.color} rounded-full transition-all duration-500`} style={{ width: `${item.percent}%` }} />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* User Growth */}
                <Card className="bg-[#111111] border-[#2a2a2a]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold">User Growth</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 pt-0">
                    <div className="flex items-end gap-2 sm:gap-3 h-48">
                      {[
                        { month: 'Sep', value: 40 },
                        { month: 'Oct', value: 48 },
                        { month: 'Nov', value: 52 },
                        { month: 'Dec', value: 60 },
                        { month: 'Jan', value: 72 },
                        { month: 'Feb', value: 85 },
                      ].map((item) => (
                        <div key={item.month} className="flex-1 flex flex-col items-center gap-2">
                          <div className="w-full relative" style={{ height: '160px' }}>
                            <div
                              className="absolute bottom-0 w-full rounded-t-md bg-gradient-to-t from-emerald-600 to-emerald-400 transition-all duration-500"
                              style={{ height: `${item.value}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-[#8a8578]">{item.month}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Top Dealers */}
                <Card className="bg-[#111111] border-[#2a2a2a]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold">Top Dealers</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 pt-2 space-y-3">
                    {[
                      { name: 'Prestige Auto KL', revenue: 'RM 128,500', rating: 4.9 },
                      { name: 'Merc Gallery MY', revenue: 'RM 98,200', rating: 4.8 },
                      { name: 'Stuttgart Motors', revenue: 'RM 76,300', rating: 5.0 },
                      { name: 'Southern Auto Hub', revenue: 'RM 65,800', rating: 4.5 },
                      { name: 'Bavarian Motors KL', revenue: 'RM 54,200', rating: 4.8 },
                    ].map((dealer, idx) => (
                      <div key={dealer.name} className="flex items-center justify-between py-2 border-b border-[#2a2a2a]/50 last:border-0">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-[#c9a84c] w-6">#{idx + 1}</span>
                          <div>
                            <p className="text-sm font-medium">{dealer.name}</p>
                            <p className="text-xs text-[#8a8578]">Rating: {dealer.rating}</p>
                          </div>
                        </div>
                        <span className="text-sm font-semibold text-[#c9a84c]">{dealer.revenue}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Commission Tracking */}
              <Card className="bg-[#111111] border-[#2a2a2a]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">Commission Tracking</CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                      { label: 'Sales Commission', value: 'RM 52,000', rate: '10%' },
                      { label: 'Rental Commission', value: 'RM 34,000', rate: '8%' },
                      { label: 'Loan Commission', value: 'RM 18,000', rate: '5%' },
                      { label: 'Auction Commission', value: 'RM 9,600', rate: '3%' },
                    ].map((item) => (
                      <div key={item.label} className="p-4 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a]">
                        <p className="text-xs text-[#8a8578]">{item.label}</p>
                        <p className="text-lg font-bold text-[#c9a84c] mt-1">{item.value}</p>
                        <p className="text-xs text-[#8a8578] mt-0.5">Rate: {item.rate}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ===== SETTINGS ===== */}
          {activeTab === 'settings' && (
            <div className="max-w-2xl mx-auto space-y-6">
              <Card className="bg-[#111111] border-[#2a2a2a]">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Platform Settings</CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs text-[#8a8578]">Platform Name</label>
                      <Input defaultValue="DK Vroom" className="bg-[#1a1a1a] border-[#2a2a2a] text-[#f5f0e8] focus-visible:border-[#c9a84c]" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-[#8a8578]">Support Email</label>
                      <Input defaultValue="admin@dkvroom.com" className="bg-[#1a1a1a] border-[#2a2a2a] text-[#f5f0e8] focus-visible:border-[#c9a84c]" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-[#8a8578]">Default Commission (%)</label>
                      <Input defaultValue="8" className="bg-[#1a1a1a] border-[#2a2a2a] text-[#f5f0e8] focus-visible:border-[#c9a84c]" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-[#8a8578]">Currency</label>
                      <Input defaultValue="MYR (RM)" disabled className="bg-[#1a1a1a] border-[#2a2a2a] text-[#8a8578]" />
                    </div>
                  </div>
                  <Button className="bg-[#c9a84c] hover:bg-[#b8963e] text-[#0a0a0a] font-semibold">
                    Save Settings
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
