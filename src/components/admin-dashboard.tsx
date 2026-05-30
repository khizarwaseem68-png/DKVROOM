'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAppStore } from '@/lib/store'
import { adminApi } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
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
  Loader2,
} from 'lucide-react'

// Static sidebar items
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
    case 'approved':
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

function getPaymentStatusBadge(status: string) {
  switch (status) {
    case 'completed':
    case 'verified':
      return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">Completed</Badge>
    case 'pending':
    case 'uploaded':
      return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">Pending</Badge>
    case 'rejected':
    case 'failed':
      return <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">Failed</Badge>
    default:
      return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30 text-xs">{status}</Badge>
  }
}

export default function AdminDashboard() {
  const { user, goBack } = useAppStore()
  const userName = user?.name
  const [activeTab, setActiveTab] = useState('overview')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [dealerFilter, setDealerFilter] = useState('all')
  const [dealerSearch, setDealerSearch] = useState('')
  const [loanFilter, setLoanFilter] = useState('all')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [carStatusFilter, setCarStatusFilter] = useState('all')

  // API data states
  const [stats, setStats] = useState<any>(null)
  const [statsLoading, setStatsLoading] = useState(true)

  const [dealers, setDealers] = useState<any[]>([])
  const [dealersLoading, setDealersLoading] = useState(true)

  const [cars, setCars] = useState<any[]>([])
  const [carsLoading, setCarsLoading] = useState(true)

  const [payments, setPayments] = useState<any[]>([])
  const [paymentsLoading, setPaymentsLoading] = useState(true)

  const [loans, setLoans] = useState<any[]>([])
  const [loansLoading, setLoansLoading] = useState(true)

  const [bookings, setBookings] = useState<any[]>([])
  const [bookingsLoading, setBookingsLoading] = useState(true)

  // Action states
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [rejectDialog, setRejectDialog] = useState<{ type: 'dealer' | 'car' | 'payment'; id: string } | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true)
      const result = await adminApi.getStats()
      setStats(result.data || result)
    } catch (e) {
      console.error('Failed to fetch stats:', e)
      setStats({
        totalUsers: 0, totalDealers: 0, totalCars: 0, totalRevenue: 0,
        pendingDealers: 0, pendingCars: 0, pendingPayments: 0,
      })
    } finally {
      setStatsLoading(false)
    }
  }, [])

  // Fetch dealers
  const fetchDealers = useCallback(async () => {
    try {
      setDealersLoading(true)
      const params: Record<string, string> = {}
      if (dealerFilter !== 'all') params.status = dealerFilter
      if (dealerSearch) params.search = dealerSearch
      const result = await adminApi.getDealers(params)
      setDealers(result.data || [])
    } catch (e) {
      console.error('Failed to fetch dealers:', e)
      setDealers([])
    } finally {
      setDealersLoading(false)
    }
  }, [dealerFilter, dealerSearch])

  // Fetch cars
  const fetchCars = useCallback(async () => {
    try {
      setCarsLoading(true)
      const params: Record<string, string> = {}
      if (carStatusFilter !== 'all') params.status = carStatusFilter
      const result = await adminApi.getCars(params)
      setCars(result.data || [])
    } catch (e) {
      console.error('Failed to fetch cars:', e)
      setCars([])
    } finally {
      setCarsLoading(false)
    }
  }, [carStatusFilter])

  // Fetch payments
  const fetchPayments = useCallback(async () => {
    try {
      setPaymentsLoading(true)
      const params: Record<string, string> = {}
      if (paymentFilter !== 'all') params.status = paymentFilter
      const result = await adminApi.getPayments(params)
      setPayments(result.data || [])
    } catch (e) {
      console.error('Failed to fetch payments:', e)
      setPayments([])
    } finally {
      setPaymentsLoading(false)
    }
  }, [paymentFilter])

  // Fetch loans
  const fetchLoans = useCallback(async () => {
    try {
      setLoansLoading(true)
      const params: Record<string, string> = {}
      if (loanFilter !== 'all') params.status = loanFilter
      const result = await adminApi.getPayments({ ...params, type: 'loan' })
      setLoans(result.data || [])
    } catch (e) {
      console.error('Failed to fetch loans:', e)
      setLoans([])
    } finally {
      setLoansLoading(false)
    }
  }, [loanFilter])

  // Initial data fetch
  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  useEffect(() => {
    if (activeTab === 'dealers') fetchDealers()
  }, [activeTab, fetchDealers])

  useEffect(() => {
    if (activeTab === 'cars') fetchCars()
  }, [activeTab, fetchCars])

  useEffect(() => {
    if (activeTab === 'payments') fetchPayments()
  }, [activeTab, fetchPayments])

  useEffect(() => {
    if (activeTab === 'loans') fetchLoans()
  }, [activeTab, fetchLoans])

  // Action handlers
  const handleVerifyDealer = async (dealerId: string, action: 'verify' | 'reject') => {
    try {
      setActionLoading(dealerId)
      await adminApi.verifyDealer(dealerId, action, action === 'reject' ? rejectReason : undefined)
      await fetchDealers()
      await fetchStats()
      setRejectDialog(null)
      setRejectReason('')
    } catch (e) {
      console.error('Failed to verify dealer:', e)
    } finally {
      setActionLoading(null)
    }
  }

  const handleApproveCar = async (carId: string, action: 'approve' | 'reject') => {
    try {
      setActionLoading(carId)
      await adminApi.approveCar(carId, action, action === 'reject' ? rejectReason : undefined)
      await fetchCars()
      await fetchStats()
      setRejectDialog(null)
      setRejectReason('')
    } catch (e) {
      console.error('Failed to approve car:', e)
    } finally {
      setActionLoading(null)
    }
  }

  const handleVerifyPayment = async (paymentId: string, action: 'verify' | 'reject') => {
    try {
      setActionLoading(paymentId)
      await adminApi.verifyPayment(paymentId, action, action === 'reject' ? rejectReason : undefined)
      await fetchPayments()
      await fetchStats()
      setRejectDialog(null)
      setRejectReason('')
    } catch (e) {
      console.error('Failed to verify payment:', e)
    } finally {
      setActionLoading(null)
    }
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    setMobileSidebarOpen(false)
  }

  // Derived data
  const pendingDealerCount = dealers.filter(d => d.status === 'pending' || d.verified === false).length

  // Helper to parse JSON strings for car photos
  const getCarPhoto = (car: any) => {
    try {
      const photos = typeof car.photos === 'string' ? JSON.parse(car.photos) : car.photos
      return Array.isArray(photos) && photos.length > 0 ? photos[0] : ''
    } catch {
      return ''
    }
  }

  const getCarBrand = (car: any) => {
    return car.brand && car.model ? `${car.brand} ${car.model}` : car.brand || car.title || 'Unknown'
  }

  // Loading spinner component
  const LoadingSpinner = () => (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="size-8 text-[#c9a84c] animate-spin" />
    </div>
  )

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

      {/* Reject Reason Dialog */}
      {rejectDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <Card className="bg-[#111111] border-[#2a2a2a] w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <XCircle className="size-5 text-red-400" />
                Reject {rejectDialog.type === 'dealer' ? 'Dealer' : rejectDialog.type === 'car' ? 'Car' : 'Payment'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs text-[#8a8578]">Reason for rejection</label>
                <Input
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Enter reason..."
                  className="bg-[#1a1a1a] border-[#2a2a2a] text-[#f5f0e8] placeholder:text-[#4a4535] focus-visible:border-[#c9a84c]"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => {
                    if (rejectDialog.type === 'dealer') handleVerifyDealer(rejectDialog.id, 'reject')
                    else if (rejectDialog.type === 'car') handleApproveCar(rejectDialog.id, 'reject')
                    else handleVerifyPayment(rejectDialog.id, 'reject')
                  }}
                  disabled={!rejectReason || actionLoading !== null}
                  className="bg-red-500 hover:bg-red-600 text-white font-semibold flex-1"
                >
                  {actionLoading ? <Loader2 className="size-4 animate-spin mr-1" /> : null}
                  Reject
                </Button>
                <Button
                  variant="outline"
                  onClick={() => { setRejectDialog(null); setRejectReason('') }}
                  className="border-[#2a2a2a] text-[#8a8578] hover:text-[#f5f0e8] flex-1"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
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
                {statsLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i} className="bg-[#111111] border-[#2a2a2a] animate-pulse">
                      <CardContent className="p-4 sm:p-6">
                        <div className="h-10 bg-[#1a1a1a] rounded mb-3" />
                        <div className="h-7 bg-[#1a1a1a] rounded w-2/3 mb-1" />
                        <div className="h-4 bg-[#1a1a1a] rounded w-1/2" />
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  [
                    { label: 'Total Users', value: stats?.totalUsers?.toLocaleString() || '0', icon: Users, change: '+842', up: true },
                    { label: 'Total Dealers', value: stats?.totalDealers?.toLocaleString() || '0', icon: UserCheck, change: '+12', up: true },
                    { label: 'Total Cars Listed', value: stats?.totalCars?.toLocaleString() || '0', icon: Car, change: '+156', up: true },
                    { label: 'Platform Revenue', value: stats?.totalRevenue ? `RM ${(stats.totalRevenue / 1000000).toFixed(1)}M` : 'RM 0', icon: DollarSign, change: '+23%', up: true },
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
                  })
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Platform Activity Chart - static visualization */}
                <Card className="lg:col-span-2 bg-[#111111] border-[#2a2a2a]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold">Platform Overview</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 pt-0">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-6">
                      <div className="text-center p-4 rounded-xl bg-[#1a1a1a]">
                        <Car className="size-6 text-[#c9a84c] mx-auto mb-2" />
                        <div className="text-xl font-bold text-[#f5f0e8]">{stats?.totalCars || 0}</div>
                        <div className="text-xs text-[#8a8578]">Total Cars</div>
                      </div>
                      <div className="text-center p-4 rounded-xl bg-[#1a1a1a]">
                        <Users className="size-6 text-emerald-400 mx-auto mb-2" />
                        <div className="text-xl font-bold text-[#f5f0e8]">{stats?.totalUsers || 0}</div>
                        <div className="text-xs text-[#8a8578]">Total Users</div>
                      </div>
                      <div className="text-center p-4 rounded-xl bg-[#1a1a1a]">
                        <Wallet className="size-6 text-purple-400 mx-auto mb-2" />
                        <div className="text-xl font-bold text-[#f5f0e8]">{stats?.totalPayments || 0}</div>
                        <div className="text-xs text-[#8a8578]">Payments</div>
                      </div>
                      <div className="text-center p-4 rounded-xl bg-[#1a1a1a]">
                        <Banknote className="size-6 text-orange-400 mx-auto mb-2" />
                        <div className="text-xl font-bold text-[#f5f0e8]">{stats?.totalLoans || 0}</div>
                        <div className="text-xs text-[#8a8578]">Loans</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Activity - derived from stats */}
                <Card className="bg-[#111111] border-[#2a2a2a]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold">Platform Status</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 pt-2 space-y-3">
                    <div className="flex items-start gap-3 py-2 border-b border-[#2a2a2a]/50">
                      <div className="w-7 h-7 rounded-full bg-yellow-500/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Clock className="size-3.5 text-yellow-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs leading-relaxed">{stats?.pendingDealers || 0} dealer(s) pending verification</p>
                        <p className="text-[10px] text-[#8a8578] mt-0.5">Requires action</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 py-2 border-b border-[#2a2a2a]/50">
                      <div className="w-7 h-7 rounded-full bg-yellow-500/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Car className="size-3.5 text-yellow-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs leading-relaxed">{stats?.pendingCars || 0} car(s) pending approval</p>
                        <p className="text-[10px] text-[#8a8578] mt-0.5">Requires review</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 py-2 border-b border-[#2a2a2a]/50">
                      <div className="w-7 h-7 rounded-full bg-yellow-500/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Wallet className="size-3.5 text-yellow-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs leading-relaxed">{stats?.pendingPayments || 0} payment(s) pending verification</p>
                        <p className="text-[10px] text-[#8a8578] mt-0.5">Requires verification</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 py-2">
                      <div className="w-7 h-7 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle className="size-3.5 text-emerald-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs leading-relaxed">Platform operating normally</p>
                        <p className="text-[10px] text-[#8a8578] mt-0.5">All systems online</p>
                      </div>
                    </div>
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
                      <p className="text-2xl font-bold text-yellow-400">{(stats?.pendingDealers || 0) + (stats?.pendingCars || 0)}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-[#111111] border-orange-500/20">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
                      <AlertTriangle className="size-5 text-orange-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Pending Payments</p>
                      <p className="text-2xl font-bold text-orange-400">{stats?.pendingPayments || 0}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-[#111111] border-red-500/20">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                      <ShieldAlert className="size-5 text-red-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Rejected Items</p>
                      <p className="text-2xl font-bold text-red-400">{(stats?.rejectedDealers || 0) + (stats?.rejectedCars || 0)}</p>
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
                        {dealersLoading ? (
                          <tr>
                            <td colSpan={6} className="py-8 text-center">
                              <Loader2 className="size-6 text-[#c9a84c] animate-spin mx-auto" />
                              <p className="text-xs text-[#8a8578] mt-2">Loading dealers...</p>
                            </td>
                          </tr>
                        ) : dealers.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-[#8a8578]">No dealers found</td>
                          </tr>
                        ) : (
                          dealers.map((dealer) => (
                            <tr key={dealer.id} className="border-b border-[#2a2a2a]/50 hover:bg-[#1a1a1a]/50">
                              <td className="py-3 px-4 font-medium">{dealer.companyName || dealer.company}</td>
                              <td className="py-3 px-4 text-[#8a8578]">{dealer.city}</td>
                              <td className="py-3 px-4">{getVerificationBadge(dealer.verified ? 'verified' : dealer.status || 'pending')}</td>
                              <td className="py-3 px-4">{dealer.totalListings || dealer.listings || 0}</td>
                              <td className="py-3 px-4 text-[#c9a84c] font-medium">{dealer.rating?.toFixed(1) || 'N/A'}</td>
                              <td className="py-3 px-4">
                                {(dealer.status === 'pending' || dealer.verified === false) ? (
                                  <div className="flex items-center gap-1">
                                    <Button
                                                                      variant="ghost" size="sm"
                                                                      className="h-7 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 text-xs"
                                                                      disabled={actionLoading === dealer.id}
                                                                      onClick={() => handleVerifyDealer(dealer.id, 'verify')}
                                                                    >
                                                                      {actionLoading === dealer.id ? <Loader2 className="size-3.5 mr-1 animate-spin" /> : <CheckCircle className="size-3.5 mr-1" />}
                                      Verify
                                    </Button>
                                    <Button
                                      variant="ghost" size="sm"
                                      className="h-7 text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs"
                                      onClick={() => setRejectDialog({ type: 'dealer', id: dealer.id })}
                                    >
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
                          ))
                        )}
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
                <p className="text-sm text-[#8a8578]">{cars.length} car listings</p>
                <div className="flex items-center gap-2">
                  {['all', 'approved', 'pending', 'rejected'].map((status) => (
                    <Button
                      key={status}
                      variant={carStatusFilter === status ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setCarStatusFilter(status)}
                      className={carStatusFilter === status
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
                        {carsLoading ? (
                          <tr>
                            <td colSpan={7} className="py-8 text-center">
                              <Loader2 className="size-6 text-[#c9a84c] animate-spin mx-auto" />
                              <p className="text-xs text-[#8a8578] mt-2">Loading cars...</p>
                            </td>
                          </tr>
                        ) : cars.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-8 text-center text-[#8a8578]">No cars found</td>
                          </tr>
                        ) : (
                          cars.map((car) => (
                            <tr key={car.id} className="border-b border-[#2a2a2a]/50 hover:bg-[#1a1a1a]/50">
                              <td className="py-3 px-4">
                                {getCarPhoto(car) ? (
                                  <img src={getCarPhoto(car)} alt={getCarBrand(car)} className="w-16 h-12 object-cover rounded-md" />
                                ) : (
                                  <div className="w-16 h-12 bg-[#1a1a1a] rounded-md flex items-center justify-center">
                                    <Car className="size-5 text-[#8a8578]" />
                                  </div>
                                )}
                              </td>
                              <td className="py-3 px-4 font-medium">{getCarBrand(car)}</td>
                              <td className="py-3 px-4 text-[#8a8578]">{car.dealer?.companyName || car.dealerName || 'Unknown'}</td>
                              <td className="py-3 px-4">
                                <Badge variant="outline" className="border-[#2a2a2a] text-[#8a8578] text-xs">
                                  {getTypeLabel(car.type)}
                                </Badge>
                              </td>
                              <td className="py-3 px-4 font-medium text-[#c9a84c]">
                                RM {car.price?.toLocaleString() || 0}{car.type === 'rent' ? '/day' : ''}
                              </td>
                              <td className="py-3 px-4">
                                {car.status === 'approved' ? (
                                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">Approved</Badge>
                                ) : car.status === 'rejected' ? (
                                  <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">Rejected</Badge>
                                ) : (
                                  <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">Pending</Badge>
                                )}
                              </td>
                              <td className="py-3 px-4">
                                {car.status === 'pending' ? (
                                  <div className="flex items-center gap-1">
                                    <Button
                                      variant="ghost" size="sm"
                                      className="h-7 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 text-xs"
                                      disabled={actionLoading === car.id}
                                      onClick={() => handleApproveCar(car.id, 'approve')}
                                    >
                                      {actionLoading === car.id ? <Loader2 className="size-3.5 mr-1 animate-spin" /> : <CheckCircle className="size-3.5 mr-1" />}
                                      Approve
                                    </Button>
                                    <Button
                                      variant="ghost" size="sm"
                                      className="h-7 text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs"
                                      onClick={() => setRejectDialog({ type: 'car', id: car.id })}
                                    >
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
                          ))
                        )}
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
                        {bookingsLoading ? (
                          <tr>
                            <td colSpan={7} className="py-8 text-center">
                              <Loader2 className="size-6 text-[#c9a84c] animate-spin mx-auto" />
                              <p className="text-xs text-[#8a8578] mt-2">Loading bookings...</p>
                            </td>
                          </tr>
                        ) : bookings.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-8 text-center text-[#8a8578]">No bookings found</td>
                          </tr>
                        ) : (
                          bookings.map((b: any) => (
                            <tr key={b.id} className="border-b border-[#2a2a2a]/50 hover:bg-[#1a1a1a]/50">
                              <td className="py-3 px-4 font-mono text-xs">{b.id}</td>
                              <td className="py-3 px-4">{b.user?.name || b.customerName || 'N/A'}</td>
                              <td className="py-3 px-4">{b.car?.brand} {b.car?.model || ''}</td>
                              <td className="py-3 px-4 text-[#8a8578]">{b.dealer?.companyName || 'N/A'}</td>
                              <td className="py-3 px-4 text-[#8a8578]">{b.startDate ? new Date(b.startDate).toLocaleDateString() : 'N/A'}</td>
                              <td className="py-3 px-4 font-medium text-[#c9a84c]">RM {b.totalAmount?.toLocaleString() || b.amount?.toLocaleString() || 0}</td>
                              <td className="py-3 px-4">{getVerificationBadge(b.status)}</td>
                            </tr>
                          ))
                        )}
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
                        {loansLoading ? (
                          <tr>
                            <td colSpan={7} className="py-8 text-center">
                              <Loader2 className="size-6 text-[#c9a84c] animate-spin mx-auto" />
                              <p className="text-xs text-[#8a8578] mt-2">Loading loans...</p>
                            </td>
                          </tr>
                        ) : loans.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-8 text-center text-[#8a8578]">No loans found</td>
                          </tr>
                        ) : (
                          loans.map((loan: any) => (
                            <tr key={loan.id} className="border-b border-[#2a2a2a]/50 hover:bg-[#1a1a1a]/50">
                              <td className="py-3 px-4 font-medium">{loan.user?.name || loan.applicantName || 'N/A'}</td>
                              <td className="py-3 px-4 text-[#8a8578]">{loan.car?.brand} {loan.car?.model || loan.carName || 'N/A'}</td>
                              <td className="py-3 px-4 text-[#8a8578]">{loan.bankName || loan.bank || 'N/A'}</td>
                              <td className="py-3 px-4 font-medium text-[#c9a84c]">RM {loan.loanAmount?.toLocaleString() || loan.amount?.toLocaleString() || 0}</td>
                              <td className="py-3 px-4">{getLoanStatusBadge(loan.status)}</td>
                              <td className="py-3 px-4 text-[#8a8578]">{loan.createdAt ? new Date(loan.createdAt).toLocaleDateString() : 'N/A'}</td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-1">
                                  <Button variant="ghost" size="sm" className="h-7 text-[#8a8578] hover:text-[#c9a84c] text-xs">
                                    <Eye className="size-3.5 mr-1" />View
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
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
                  { label: 'Total Processed', value: stats?.totalRevenue ? `RM ${(stats.totalRevenue / 1000).toFixed(0)}K` : 'RM 0' },
                  { label: 'Pending', value: `${stats?.pendingPayments || 0} items` },
                  { label: 'Failed', value: `${stats?.rejectedPayments || 0} items` },
                  { label: 'Commission Earned', value: stats?.totalRevenue ? `RM ${(stats.totalRevenue * 0.08 / 1000).toFixed(0)}K` : 'RM 0' },
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
                {['all', 'pending', 'verified', 'rejected'].map((status) => (
                  <Button
                    key={status}
                    variant={paymentFilter === status ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setPaymentFilter(status)}
                    className={paymentFilter === status
                      ? 'bg-[#c9a84c] text-[#0a0a0a] hover:bg-[#b8963e] text-xs'
                      : 'text-[#8a8578] hover:text-[#f5f0e8] text-xs'
                    }
                  >
                    {status === 'all' ? 'All Status' : status.charAt(0).toUpperCase() + status.slice(1)}
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
                          <th className="text-left py-3 px-4 text-[#8a8578] font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paymentsLoading ? (
                          <tr>
                            <td colSpan={8} className="py-8 text-center">
                              <Loader2 className="size-6 text-[#c9a84c] animate-spin mx-auto" />
                              <p className="text-xs text-[#8a8578] mt-2">Loading payments...</p>
                            </td>
                          </tr>
                        ) : payments.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="py-8 text-center text-[#8a8578]">No payments found</td>
                          </tr>
                        ) : (
                          payments.map((txn: any) => (
                            <tr key={txn.id} className="border-b border-[#2a2a2a]/50 hover:bg-[#1a1a1a]/50">
                              <td className="py-3 px-4 font-mono text-xs">{txn.id}</td>
                              <td className="py-3 px-4">{txn.user?.name || txn.userName || 'N/A'}</td>
                              <td className="py-3 px-4 text-[#8a8578]">{txn.dealer?.companyName || txn.dealerName || 'N/A'}</td>
                              <td className="py-3 px-4 font-medium text-[#c9a84c]">RM {txn.amount?.toLocaleString() || 0}</td>
                              <td className="py-3 px-4">
                                <Badge variant="outline" className="border-[#2a2a2a] text-[#8a8578] text-xs">{txn.paymentMethod || txn.method || 'N/A'}</Badge>
                              </td>
                              <td className="py-3 px-4">
                                {getPaymentStatusBadge(txn.status)}
                              </td>
                              <td className="py-3 px-4 text-[#8a8578]">{txn.createdAt ? new Date(txn.createdAt).toLocaleDateString() : 'N/A'}</td>
                              <td className="py-3 px-4">
                                {txn.status === 'pending' || txn.status === 'uploaded' ? (
                                  <div className="flex items-center gap-1">
                                    <Button
                                      variant="ghost" size="sm"
                                      className="h-7 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 text-xs"
                                      disabled={actionLoading === txn.id}
                                      onClick={() => handleVerifyPayment(txn.id, 'verify')}
                                    >
                                      {actionLoading === txn.id ? <Loader2 className="size-3.5 mr-1 animate-spin" /> : <CheckCircle className="size-3.5 mr-1" />}
                                      Verify
                                    </Button>
                                    <Button
                                      variant="ghost" size="sm"
                                      className="h-7 text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs"
                                      onClick={() => setRejectDialog({ type: 'payment', id: txn.id })}
                                    >
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
                          ))
                        )}
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
              <Card className="bg-[#111111] border-[#2a2a2a]">
                <CardContent className="p-8 text-center">
                  <AlertTriangle className="size-8 text-[#8a8578] mx-auto mb-3" />
                  <p className="text-[#8a8578]">Dispute management coming soon</p>
                  <p className="text-xs text-[#8a8578]/60 mt-1">This feature is under development</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ===== FRAUD ===== */}
          {activeTab === 'fraud' && (
            <div className="space-y-4">
              <Card className="bg-[#111111] border-[#2a2a2a]">
                <CardContent className="p-8 text-center">
                  <ShieldAlert className="size-8 text-[#8a8578] mx-auto mb-3" />
                  <p className="text-[#8a8578]">Fraud detection system coming soon</p>
                  <p className="text-xs text-[#8a8578]/60 mt-1">This feature is under development</p>
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
                  <CardTitle className="text-base font-semibold">Platform Statistics</CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-2 space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-4 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a]">
                      <p className="text-xs text-[#8a8578]">Total Cars</p>
                      <p className="text-lg font-bold text-[#c9a84c] mt-1">{stats?.totalCars || 0}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a]">
                      <p className="text-xs text-[#8a8578]">Total Dealers</p>
                      <p className="text-lg font-bold text-[#c9a84c] mt-1">{stats?.totalDealers || 0}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a]">
                      <p className="text-xs text-[#8a8578]">Total Users</p>
                      <p className="text-lg font-bold text-[#c9a84c] mt-1">{stats?.totalUsers || 0}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a]">
                      <p className="text-xs text-[#8a8578]">Revenue</p>
                      <p className="text-lg font-bold text-[#c9a84c] mt-1">RM {stats?.totalRevenue?.toLocaleString() || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Top Dealers from API */}
              <Card className="bg-[#111111] border-[#2a2a2a]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">Top Dealers</CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-2 space-y-3">
                  {dealersLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="size-6 text-[#c9a84c] animate-spin" />
                    </div>
                  ) : dealers.length === 0 ? (
                    <p className="text-center text-[#8a8578] py-4">No dealers found</p>
                  ) : (
                    dealers
                      .filter((d) => d.verified || d.status === 'verified')
                      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
                      .slice(0, 5)
                      .map((dealer, idx) => (
                        <div key={dealer.id} className="flex items-center justify-between py-2 border-b border-[#2a2a2a]/50 last:border-0">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-[#c9a84c] w-6">#{idx + 1}</span>
                            <div>
                              <p className="text-sm font-medium">{dealer.companyName || dealer.company}</p>
                              <p className="text-xs text-[#8a8578]">Rating: {dealer.rating?.toFixed(1) || 'N/A'} · {dealer.totalListings || 0} listings</p>
                            </div>
                          </div>
                          <span className="text-sm text-[#8a8578]">{dealer.city}</span>
                        </div>
                      ))
                  )}
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
