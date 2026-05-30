'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAppStore } from '@/lib/store'
import { adminApi } from '@/lib/api'
import {
  formatPrice,
  formatDate,
  type VehicleType,
} from '@/lib/constants'
import {
  LoadingState,
  EmptyState,
  StatusBadge,
  VehicleTypeBadge,
} from '@/components/shared'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
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
  Shield,
  Loader2,
} from 'lucide-react'

// ===== TYPES =====

interface AdminStats {
  totalUsers: number
  totalDealers: number
  totalCars: number
  totalRevenue: number
  totalPayments: number
  totalLoans: number
  pendingDealers: number
  pendingCars: number
  pendingPayments: number
  rejectedDealers: number
  rejectedCars: number
  rejectedPayments: number
}

interface DealerItem {
  id: string
  companyName?: string
  company?: string
  city?: string
  verified?: boolean
  status: string
  totalListings?: number
  listings?: number
  rating?: number
}

interface CarItem {
  id: string
  brand: string
  model: string
  type: VehicleType | string
  price: number
  status: string
  photos?: string
  dealer?: { companyName: string; city: string; verified: boolean; rating: number; totalListings: number }
  dealerName?: string
  dealerUser?: { name: string }
}

interface PaymentItem {
  id: string
  user?: { name: string }
  userName?: string
  dealer?: { companyName: string }
  dealerName?: string
  amount?: number
  paymentMethod?: string
  method?: string
  status: string
  createdAt?: string
}

interface LoanItem {
  id: string
  user?: { name: string }
  applicantName?: string
  car?: { brand: string; model: string }
  carName?: string
  bankName?: string
  bank?: string
  loanAmount?: number
  amount?: number
  status: string
  createdAt?: string
}

interface BookingItem {
  id: string
  user?: { name: string }
  customerName?: string
  car?: { brand: string; model: string }
  dealer?: { companyName: string }
  startDate?: string
  totalAmount?: number
  amount?: number
  status: string
}

// ===== HELPERS =====

function parseJsonField(val: unknown, fallback: string[] = []): string[] {
  if (typeof val === 'string') {
    try { return JSON.parse(val) } catch { return fallback }
  }
  return Array.isArray(val) ? val : fallback
}

function getCarPhoto(car: CarItem): string {
  const photos = parseJsonField(car.photos)
  return photos[0] || ''
}

function getCarBrand(car: CarItem): string {
  return car.brand && car.model ? `${car.brand} ${car.model}` : car.brand || 'Unknown'
}

// ===== SIDEBAR CONFIG =====

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
] as const

type AdminTab = (typeof sidebarItems)[number]['id']

// ===== COMPONENT =====

export default function AdminDashboard() {
  const { user, goBack } = useAppStore()
  const userName = user?.name
  const [activeTab, setActiveTab] = useState<AdminTab>('overview')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [dealerFilter, setDealerFilter] = useState('all')
  const [dealerSearch, setDealerSearch] = useState('')
  const [loanFilter, setLoanFilter] = useState('all')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [carStatusFilter, setCarStatusFilter] = useState('all')

  // API data states
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [dealers, setDealers] = useState<DealerItem[]>([])
  const [dealersLoading, setDealersLoading] = useState(true)
  const [cars, setCars] = useState<CarItem[]>([])
  const [carsLoading, setCarsLoading] = useState(true)
  const [payments, setPayments] = useState<PaymentItem[]>([])
  const [paymentsLoading, setPaymentsLoading] = useState(true)
  const [loans, setLoans] = useState<LoanItem[]>([])
  const [loansLoading, setLoansLoading] = useState(true)
  const [bookings] = useState<BookingItem[]>([])
  const [bookingsLoading] = useState(false)

  // Action states
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [rejectDialog, setRejectDialog] = useState<{ type: 'dealer' | 'car' | 'payment'; id: string } | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  // Fetch stats
  const fetchStats = useCallback(async () => {
    setStatsLoading(true)
    try {
      const result = await adminApi.getStats()
      setStats((result.data ?? result) as AdminStats)
    } catch {
      setStats({
        totalUsers: 0, totalDealers: 0, totalCars: 0, totalRevenue: 0,
        pendingDealers: 0, pendingCars: 0, pendingPayments: 0,
        totalPayments: 0, totalLoans: 0, rejectedDealers: 0, rejectedCars: 0, rejectedPayments: 0,
      })
    } finally {
      setStatsLoading(false)
    }
  }, [])

  // Fetch dealers
  const fetchDealers = useCallback(async () => {
    setDealersLoading(true)
    try {
      const params: Record<string, string> = {}
      if (dealerFilter !== 'all') params.status = dealerFilter
      if (dealerSearch) params.search = dealerSearch
      const result = await adminApi.getDealers(params)
      setDealers((result.data ?? []) as DealerItem[])
    } catch {
      setDealers([])
    } finally {
      setDealersLoading(false)
    }
  }, [dealerFilter, dealerSearch])

  // Fetch cars
  const fetchCars = useCallback(async () => {
    setCarsLoading(true)
    try {
      const params: Record<string, string> = {}
      if (carStatusFilter !== 'all') params.status = carStatusFilter
      const result = await adminApi.getCars(params)
      setCars((result.data ?? []) as CarItem[])
    } catch {
      setCars([])
    } finally {
      setCarsLoading(false)
    }
  }, [carStatusFilter])

  // Fetch payments
  const fetchPayments = useCallback(async () => {
    setPaymentsLoading(true)
    try {
      const params: Record<string, string> = {}
      if (paymentFilter !== 'all') params.status = paymentFilter
      const result = await adminApi.getPayments(params)
      setPayments((result.data ?? []) as PaymentItem[])
    } catch {
      setPayments([])
    } finally {
      setPaymentsLoading(false)
    }
  }, [paymentFilter])

  // Fetch loans
  const fetchLoans = useCallback(async () => {
    setLoansLoading(true)
    try {
      const params: Record<string, string> = {}
      if (loanFilter !== 'all') params.status = loanFilter
      const result = await adminApi.getPayments({ ...params, type: 'loan' })
      setLoans((result.data ?? []) as LoanItem[])
    } catch {
      setLoans([])
    } finally {
      setLoansLoading(false)
    }
  }, [loanFilter])

  useEffect(() => { fetchStats() }, [fetchStats])
  useEffect(() => { if (activeTab === 'dealers') fetchDealers() }, [activeTab, fetchDealers])
  useEffect(() => { if (activeTab === 'cars') fetchCars() }, [activeTab, fetchCars])
  useEffect(() => { if (activeTab === 'payments') fetchPayments() }, [activeTab, fetchPayments])
  useEffect(() => { if (activeTab === 'loans') fetchLoans() }, [activeTab, fetchLoans])

  // Action handlers
  const handleVerifyDealer = async (dealerId: string, action: 'verify' | 'reject') => {
    setActionLoading(dealerId)
    try {
      await adminApi.verifyDealer(dealerId, action, action === 'reject' ? rejectReason : undefined)
      await fetchDealers()
      await fetchStats()
      setRejectDialog(null)
      setRejectReason('')
    } catch {
      // silent
    } finally {
      setActionLoading(null)
    }
  }

  const handleApproveCar = async (carId: string, action: 'approve' | 'reject') => {
    setActionLoading(carId)
    try {
      await adminApi.approveCar(carId, action, action === 'reject' ? rejectReason : undefined)
      await fetchCars()
      await fetchStats()
      setRejectDialog(null)
      setRejectReason('')
    } catch {
      // silent
    } finally {
      setActionLoading(null)
    }
  }

  const handleVerifyPayment = async (paymentId: string, action: 'verify' | 'reject') => {
    setActionLoading(paymentId)
    try {
      await adminApi.verifyPayment(paymentId, action, action === 'reject' ? rejectReason : undefined)
      await fetchPayments()
      await fetchStats()
      setRejectDialog(null)
      setRejectReason('')
    } catch {
      // silent
    } finally {
      setActionLoading(null)
    }
  }

  const handleTabChange = (tab: AdminTab) => {
    setActiveTab(tab)
    setMobileSidebarOpen(false)
  }

  // ===== RENDER =====
  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Sidebar - Desktop */}
      <aside className={`hidden lg:flex flex-col border-r border-border bg-sidebar transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-60'}`}>
        <div className="flex items-center justify-between p-4 border-b border-border">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                <Shield className="size-4 text-red-400" />
              </div>
              <span className="text-sm font-bold text-red-400">Admin Panel</span>
            </div>
          )}
          <Button variant="ghost" size="icon" onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="text-muted-foreground hover:text-gold hover:bg-gold/10 h-7 w-7">
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
                    ? 'bg-gold/10 text-gold'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                } ${sidebarCollapsed ? 'justify-center' : ''}`}
              >
                <Icon className="size-4 shrink-0" />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </button>
            )
          })}
        </nav>
        {!sidebarCollapsed && (
          <div className="p-4 border-t border-border">
            <Button variant="ghost" onClick={goBack} className="w-full text-muted-foreground hover:text-gold hover:bg-gold/10 text-sm">
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
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-sidebar border-r border-border flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <Shield className="size-4 text-red-400" />
                </div>
                <span className="text-sm font-bold text-red-400">Admin Panel</span>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setMobileSidebarOpen(false)} className="text-muted-foreground">
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
                        ? 'bg-gold/10 text-gold'
                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
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
          <Card className="bg-card border-border w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="heading-sm flex items-center gap-2">
                <XCircle className="size-5 text-red-400" />
                Reject {rejectDialog.type === 'dealer' ? 'Dealer' : rejectDialog.type === 'car' ? 'Car' : 'Payment'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-caption text-muted-foreground">Reason for rejection</label>
                <Input
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Enter reason..."
                  className="bg-secondary border-border text-foreground placeholder:text-muted-foreground/50 focus-visible:border-gold"
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
                  className="border-border text-muted-foreground hover:text-foreground flex-1"
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
        <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-xl">
          <div className="flex items-center justify-between px-4 sm:px-6 h-14">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => setMobileSidebarOpen(true)} className="lg:hidden text-muted-foreground hover:text-gold">
                <Menu className="size-5" />
              </Button>
              <h1 className="heading-sm">{sidebarItems.find((i) => i.id === activeTab)?.label || 'Dashboard'}</h1>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-gold">
                <Bell className="size-4" />
                <span className="absolute top-1 right-1 size-2 bg-red-500 rounded-full" />
              </Button>
              <Separator orientation="vertical" className="h-6 bg-border" />
              <div className="flex items-center gap-2">
                <Avatar className="size-8 border border-red-500/30">
                  <AvatarFallback className="bg-red-500/10 text-red-400 text-xs font-bold">
                    {userName?.charAt(0) || 'A'}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:flex flex-col">
                  <span className="text-body-sm font-medium">{userName || 'Admin'}</span>
                  <span className="text-overline text-red-400 font-medium">Super Admin</span>
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
                    <Card key={i} className="bg-card border-border animate-pulse">
                      <CardContent className="p-4 sm:p-6">
                        <div className="h-10 bg-secondary rounded mb-3" />
                        <div className="h-7 bg-secondary rounded w-2/3 mb-1" />
                        <div className="h-4 bg-secondary rounded w-1/2" />
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  [
                    { label: 'Total Users', value: (stats?.totalUsers ?? 0).toLocaleString(), icon: Users, change: '+842', up: true },
                    { label: 'Total Dealers', value: (stats?.totalDealers ?? 0).toLocaleString(), icon: CheckCircle, change: '+12', up: true },
                    { label: 'Total Cars Listed', value: (stats?.totalCars ?? 0).toLocaleString(), icon: Car, change: '+156', up: true },
                    { label: 'Platform Revenue', value: stats?.totalRevenue ? `${formatPrice(stats.totalRevenue)}` : 'RM 0', icon: DollarSign, change: '+23%', up: true },
                  ].map((stat) => {
                    const Icon = stat.icon
                    return (
                      <Card key={stat.label} className="bg-card border-border">
                        <CardContent className="p-4 sm:p-6">
                          <div className="flex items-start justify-between mb-3">
                            <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center">
                              <Icon className="size-5 text-gold" />
                            </div>
                            <span className={`flex items-center text-overline ${stat.up ? 'text-emerald-400' : 'text-red-400'}`}>
                              {stat.up ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                              {stat.change}
                            </span>
                          </div>
                          <div className="heading-md">{stat.value}</div>
                          <div className="text-overline text-muted-foreground mt-1">{stat.label}</div>
                        </CardContent>
                      </Card>
                    )
                  })
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Platform Overview */}
                <Card className="lg:col-span-2 bg-card border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="heading-sm">Platform Overview</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 pt-0">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-6">
                      {[
                        { icon: Car, label: 'Total Cars', value: stats?.totalCars ?? 0, color: 'text-gold' },
                        { icon: Users, label: 'Total Users', value: stats?.totalUsers ?? 0, color: 'text-emerald-400' },
                        { icon: Wallet, label: 'Payments', value: stats?.totalPayments ?? 0, color: 'text-purple-400' },
                        { icon: Banknote, label: 'Loans', value: stats?.totalLoans ?? 0, color: 'text-orange-400' },
                      ].map((item) => {
                        const Icon = item.icon
                        return (
                          <div key={item.label} className="text-center p-4 rounded-xl bg-secondary">
                            <Icon className={`size-6 ${item.color} mx-auto mb-2`} />
                            <div className="heading-md">{item.value}</div>
                            <div className="text-overline text-muted-foreground">{item.label}</div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Platform Status */}
                <Card className="bg-card border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="heading-sm">Platform Status</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 pt-2 space-y-3">
                    {[
                      { icon: Clock, color: 'bg-yellow-500/10 text-yellow-400', text: `${stats?.pendingDealers ?? 0} dealer(s) pending verification`, sub: 'Requires action' },
                      { icon: Car, color: 'bg-yellow-500/10 text-yellow-400', text: `${stats?.pendingCars ?? 0} car(s) pending approval`, sub: 'Requires review' },
                      { icon: Wallet, color: 'bg-yellow-500/10 text-yellow-400', text: `${stats?.pendingPayments ?? 0} payment(s) pending verification`, sub: 'Requires verification' },
                      { icon: CheckCircle, color: 'bg-emerald-500/10 text-emerald-400', text: 'Platform operating normally', sub: 'All systems online' },
                    ].map((item) => {
                      const Icon = item.icon
                      return (
                        <div key={item.text} className="flex items-start gap-3 py-2 border-b border-border/50 last:border-0">
                          <div className={`w-7 h-7 rounded-full ${item.color} flex items-center justify-center shrink-0 mt-0.5`}>
                            <Icon className="size-3.5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-caption leading-relaxed">{item.text}</p>
                            <p className="text-overline text-muted-foreground mt-0.5">{item.sub}</p>
                          </div>
                        </div>
                      )
                    })}
                  </CardContent>
                </Card>
              </div>

              {/* Alerts */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: 'Pending Verifications', value: (stats?.pendingDealers ?? 0) + (stats?.pendingCars ?? 0), icon: Clock, borderColor: 'border-yellow-500/20', iconBg: 'bg-yellow-500/10', textColor: 'text-yellow-400' },
                  { label: 'Pending Payments', value: stats?.pendingPayments ?? 0, icon: AlertTriangle, borderColor: 'border-orange-500/20', iconBg: 'bg-orange-500/10', textColor: 'text-orange-400' },
                  { label: 'Rejected Items', value: (stats?.rejectedDealers ?? 0) + (stats?.rejectedCars ?? 0), icon: ShieldAlert, borderColor: 'border-red-500/20', iconBg: 'bg-red-500/10', textColor: 'text-red-400' },
                ].map((alert) => {
                  const Icon = alert.icon
                  return (
                    <Card key={alert.label} className={`bg-card ${alert.borderColor}`}>
                      <CardContent className="p-4 flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg ${alert.iconBg} flex items-center justify-center shrink-0`}>
                          <Icon className={`size-5 ${alert.textColor}`} />
                        </div>
                        <div>
                          <p className="text-body-sm font-semibold">{alert.label}</p>
                          <p className={`heading-md ${alert.textColor}`}>{alert.value}</p>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}

          {/* ===== DEALERS ===== */}
          {activeTab === 'dealers' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2 flex-1 max-w-md">
                  <Search className="size-4 text-muted-foreground shrink-0" />
                  <Input
                    value={dealerSearch}
                    onChange={(e) => setDealerSearch(e.target.value)}
                    placeholder="Search dealers..."
                    className="bg-secondary border-border text-foreground placeholder:text-muted-foreground/50 focus-visible:border-gold"
                  />
                </div>
                <Tabs value={dealerFilter} onValueChange={setDealerFilter}>
                  <TabsList className="bg-secondary">
                    {['all', 'verified', 'pending', 'rejected'].map((status) => (
                      <TabsTrigger key={status} value={status} className="text-xs data-[state=active]:bg-gold data-[state=active]:text-primary-foreground">
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </div>

              {dealersLoading ? (
                <LoadingState message="Loading dealers..." />
              ) : dealers.length === 0 ? (
                <EmptyState title="No dealers found" description="No dealers match your current filters." />
              ) : (
                <>
                  {/* Desktop table */}
                  <Card className="bg-card border-border hidden md:block">
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <table className="w-full text-body-sm">
                          <thead>
                            <tr className="border-b border-border">
                              <th className="text-left py-3 px-4 text-muted-foreground font-medium">Company Name</th>
                              <th className="text-left py-3 px-4 text-muted-foreground font-medium">City</th>
                              <th className="text-left py-3 px-4 text-muted-foreground font-medium">Verification</th>
                              <th className="text-left py-3 px-4 text-muted-foreground font-medium">Listings</th>
                              <th className="text-left py-3 px-4 text-muted-foreground font-medium">Rating</th>
                              <th className="text-left py-3 px-4 text-muted-foreground font-medium">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {dealers.map((dealer) => (
                              <tr key={dealer.id} className="border-b border-border/50 hover:bg-secondary/50">
                                <td className="py-3 px-4 font-medium">{dealer.companyName || dealer.company}</td>
                                <td className="py-3 px-4 text-muted-foreground">{dealer.city}</td>
                                <td className="py-3 px-4"><StatusBadge status={dealer.verified ? 'verified' : dealer.status || 'pending'} /></td>
                                <td className="py-3 px-4">{dealer.totalListings || dealer.listings || 0}</td>
                                <td className="py-3 px-4 text-gold font-medium">{dealer.rating?.toFixed(1) || 'N/A'}</td>
                                <td className="py-3 px-4">
                                  {(dealer.status === 'pending' || dealer.verified === false) ? (
                                    <div className="flex items-center gap-1">
                                      <Button variant="ghost" size="sm" className="h-7 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 text-xs"
                                        disabled={actionLoading === dealer.id} onClick={() => handleVerifyDealer(dealer.id, 'verify')}>
                                        {actionLoading === dealer.id ? <Loader2 className="size-3.5 mr-1 animate-spin" /> : <CheckCircle className="size-3.5 mr-1" />}
                                        Verify
                                      </Button>
                                      <Button variant="ghost" size="sm" className="h-7 text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs"
                                        onClick={() => setRejectDialog({ type: 'dealer', id: dealer.id })}>
                                        <XCircle className="size-3.5 mr-1" />Reject
                                      </Button>
                                    </div>
                                  ) : (
                                    <Button variant="ghost" size="sm" className="h-7 text-muted-foreground hover:text-gold text-xs">
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

                  {/* Mobile cards */}
                  <div className="md:hidden space-y-3">
                    {dealers.map((dealer) => (
                      <Card key={dealer.id} className="bg-card border-border">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-medium">{dealer.companyName || dealer.company}</p>
                              <p className="text-caption text-muted-foreground">{dealer.city}</p>
                              <div className="mt-1"><StatusBadge status={dealer.verified ? 'verified' : dealer.status || 'pending'} /></div>
                            </div>
                            <div className="text-right">
                              <p className="text-body-sm font-medium text-gold">{dealer.rating?.toFixed(1) || 'N/A'}</p>
                              <p className="text-caption text-muted-foreground">{dealer.totalListings || dealer.listings || 0} listings</p>
                            </div>
                          </div>
                          {(dealer.status === 'pending' || dealer.verified === false) && (
                            <div className="flex items-center gap-2 mt-3">
                              <Button variant="ghost" size="sm" className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 text-xs"
                                disabled={actionLoading === dealer.id} onClick={() => handleVerifyDealer(dealer.id, 'verify')}>
                                <CheckCircle className="size-3.5 mr-1" />Verify
                              </Button>
                              <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs"
                                onClick={() => setRejectDialog({ type: 'dealer', id: dealer.id })}>
                                <XCircle className="size-3.5 mr-1" />Reject
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ===== CARS ===== */}
          {activeTab === 'cars' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <p className="text-body-sm text-muted-foreground">{cars.length} car listings</p>
                <Tabs value={carStatusFilter} onValueChange={setCarStatusFilter}>
                  <TabsList className="bg-secondary">
                    {['all', 'approved', 'pending', 'rejected'].map((status) => (
                      <TabsTrigger key={status} value={status} className="text-xs data-[state=active]:bg-gold data-[state=active]:text-primary-foreground">
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </div>

              {carsLoading ? (
                <LoadingState message="Loading cars..." />
              ) : cars.length === 0 ? (
                <EmptyState title="No cars found" description="No car listings match your current filters." />
              ) : (
                <>
                  {/* Desktop */}
                  <Card className="bg-card border-border hidden md:block">
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <table className="w-full text-body-sm">
                          <thead>
                            <tr className="border-b border-border">
                              <th className="text-left py-3 px-4 text-muted-foreground font-medium">Photo</th>
                              <th className="text-left py-3 px-4 text-muted-foreground font-medium">Brand / Model</th>
                              <th className="text-left py-3 px-4 text-muted-foreground font-medium">Dealer</th>
                              <th className="text-left py-3 px-4 text-muted-foreground font-medium">Type</th>
                              <th className="text-left py-3 px-4 text-muted-foreground font-medium">Price</th>
                              <th className="text-left py-3 px-4 text-muted-foreground font-medium">Status</th>
                              <th className="text-left py-3 px-4 text-muted-foreground font-medium">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {cars.map((car) => {
                              const photoUrl = getCarPhoto(car)
                              return (
                                <tr key={car.id} className="border-b border-border/50 hover:bg-secondary/50">
                                  <td className="py-3 px-4">
                                    {photoUrl ? (
                                      <img src={photoUrl} alt={getCarBrand(car)} className="w-16 h-12 object-cover rounded-md" />
                                    ) : (
                                      <div className="w-16 h-12 bg-secondary rounded-md flex items-center justify-center">
                                        <Car className="size-5 text-muted-foreground/30" />
                                      </div>
                                    )}
                                  </td>
                                  <td className="py-3 px-4 font-medium">{getCarBrand(car)}</td>
                                  <td className="py-3 px-4 text-muted-foreground">{car.dealer?.companyName || car.dealerName || 'Unknown'}</td>
                                  <td className="py-3 px-4"><VehicleTypeBadge type={car.type} /></td>
                                  <td className="py-3 px-4 font-medium text-gold">{formatPrice(car.price ?? 0, car.type)}</td>
                                  <td className="py-3 px-4"><StatusBadge status={car.status} /></td>
                                  <td className="py-3 px-4">
                                    {car.status === 'pending' ? (
                                      <div className="flex items-center gap-1">
                                        <Button variant="ghost" size="sm" className="h-7 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 text-xs"
                                          disabled={actionLoading === car.id} onClick={() => handleApproveCar(car.id, 'approve')}>
                                          {actionLoading === car.id ? <Loader2 className="size-3.5 mr-1 animate-spin" /> : <CheckCircle className="size-3.5 mr-1" />}
                                          Approve
                                        </Button>
                                        <Button variant="ghost" size="sm" className="h-7 text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs"
                                          onClick={() => setRejectDialog({ type: 'car', id: car.id })}>
                                          <XCircle className="size-3.5 mr-1" />Reject
                                        </Button>
                                      </div>
                                    ) : (
                                      <Button variant="ghost" size="sm" className="h-7 text-muted-foreground hover:text-gold text-xs">
                                        <Eye className="size-3.5 mr-1" />View
                                      </Button>
                                    )}
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Mobile cards */}
                  <div className="md:hidden space-y-3">
                    {cars.map((car) => {
                      const photoUrl = getCarPhoto(car)
                      return (
                        <Card key={car.id} className="bg-card border-border">
                          <CardContent className="p-4">
                            <div className="flex gap-3">
                              {photoUrl ? (
                                <img src={photoUrl} alt={getCarBrand(car)} className="w-20 h-14 object-cover rounded-md shrink-0" />
                              ) : (
                                <div className="w-20 h-14 bg-secondary rounded-md flex items-center justify-center shrink-0">
                                  <Car className="size-5 text-muted-foreground/30" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0">
                                    <p className="font-medium truncate">{getCarBrand(car)}</p>
                                    <p className="text-caption text-muted-foreground">{car.dealer?.companyName || car.dealerName || 'Unknown'}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                      <VehicleTypeBadge type={car.type} />
                                      <StatusBadge status={car.status} />
                                    </div>
                                  </div>
                                  <p className="text-body-sm font-semibold text-gold shrink-0">{formatPrice(car.price ?? 0, car.type)}</p>
                                </div>
                                {car.status === 'pending' && (
                                  <div className="flex items-center gap-2 mt-2">
                                    <Button variant="ghost" size="sm" className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 text-xs h-7"
                                      disabled={actionLoading === car.id} onClick={() => handleApproveCar(car.id, 'approve')}>
                                      <CheckCircle className="size-3.5 mr-1" />Approve
                                    </Button>
                                    <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs h-7"
                                      onClick={() => setRejectDialog({ type: 'car', id: car.id })}>
                                      <XCircle className="size-3.5 mr-1" />Reject
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ===== BOOKINGS ===== */}
          {activeTab === 'bookings' && (
            <div className="space-y-4">
              {bookingsLoading ? (
                <LoadingState message="Loading bookings..." />
              ) : bookings.length === 0 ? (
                <EmptyState title="No bookings found" description="Bookings will appear here once customers start making reservations." />
              ) : (
                <Card className="bg-card border-border">
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-body-sm">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-3 px-4 text-muted-foreground font-medium">Booking ID</th>
                            <th className="text-left py-3 px-4 text-muted-foreground font-medium">Customer</th>
                            <th className="text-left py-3 px-4 text-muted-foreground font-medium">Car</th>
                            <th className="text-left py-3 px-4 text-muted-foreground font-medium">Dealer</th>
                            <th className="text-left py-3 px-4 text-muted-foreground font-medium">Dates</th>
                            <th className="text-left py-3 px-4 text-muted-foreground font-medium">Amount</th>
                            <th className="text-left py-3 px-4 text-muted-foreground font-medium">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bookings.map((b) => (
                            <tr key={b.id} className="border-b border-border/50 hover:bg-secondary/50">
                              <td className="py-3 px-4 font-mono text-caption">{b.id}</td>
                              <td className="py-3 px-4">{b.user?.name || b.customerName || 'N/A'}</td>
                              <td className="py-3 px-4 text-muted-foreground">{b.car?.brand} {b.car?.model || ''}</td>
                              <td className="py-3 px-4 text-muted-foreground">{b.dealer?.companyName || 'N/A'}</td>
                              <td className="py-3 px-4 text-muted-foreground">{b.startDate ? formatDate(b.startDate) : 'N/A'}</td>
                              <td className="py-3 px-4 font-medium text-gold">{formatPrice(b.totalAmount ?? b.amount ?? 0)}</td>
                              <td className="py-3 px-4"><StatusBadge status={b.status} /></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* ===== LOANS ===== */}
          {activeTab === 'loans' && (
            <div className="space-y-4">
              <Tabs value={loanFilter} onValueChange={setLoanFilter}>
                <div className="flex items-center gap-2 flex-wrap">
                  <Filter className="size-4 text-muted-foreground" />
                  <TabsList className="bg-secondary">
                    {['all', 'pending', 'underReview', 'approved', 'rejected'].map((status) => (
                      <TabsTrigger key={status} value={status} className="text-xs data-[state=active]:bg-gold data-[state=active]:text-primary-foreground">
                        {status === 'all' ? 'All' : status === 'underReview' ? 'Under Review' : status.charAt(0).toUpperCase() + status.slice(1)}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>
              </Tabs>

              {loansLoading ? (
                <LoadingState message="Loading loans..." />
              ) : loans.length === 0 ? (
                <EmptyState title="No loans found" description="Loan applications will appear here." />
              ) : (
                <>
                  {/* Desktop */}
                  <Card className="bg-card border-border hidden md:block">
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <table className="w-full text-body-sm">
                          <thead>
                            <tr className="border-b border-border">
                              <th className="text-left py-3 px-4 text-muted-foreground font-medium">Applicant</th>
                              <th className="text-left py-3 px-4 text-muted-foreground font-medium">Car</th>
                              <th className="text-left py-3 px-4 text-muted-foreground font-medium">Bank</th>
                              <th className="text-left py-3 px-4 text-muted-foreground font-medium">Amount</th>
                              <th className="text-left py-3 px-4 text-muted-foreground font-medium">Status</th>
                              <th className="text-left py-3 px-4 text-muted-foreground font-medium">Date</th>
                              <th className="text-left py-3 px-4 text-muted-foreground font-medium">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {loans.map((loan) => (
                              <tr key={loan.id} className="border-b border-border/50 hover:bg-secondary/50">
                                <td className="py-3 px-4 font-medium">{loan.user?.name || loan.applicantName || 'N/A'}</td>
                                <td className="py-3 px-4 text-muted-foreground">{loan.car?.brand} {loan.car?.model || loan.carName || 'N/A'}</td>
                                <td className="py-3 px-4 text-muted-foreground">{loan.bankName || loan.bank || 'N/A'}</td>
                                <td className="py-3 px-4 font-medium text-gold">{formatPrice(loan.loanAmount ?? loan.amount ?? 0)}</td>
                                <td className="py-3 px-4"><StatusBadge status={loan.status} /></td>
                                <td className="py-3 px-4 text-muted-foreground">{loan.createdAt ? formatDate(loan.createdAt) : 'N/A'}</td>
                                <td className="py-3 px-4">
                                  <Button variant="ghost" size="sm" className="h-7 text-muted-foreground hover:text-gold text-xs">
                                    <Eye className="size-3.5 mr-1" />View
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Mobile cards */}
                  <div className="md:hidden space-y-3">
                    {loans.map((loan) => (
                      <Card key={loan.id} className="bg-card border-border">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-medium">{loan.user?.name || loan.applicantName || 'N/A'}</p>
                              <p className="text-caption text-muted-foreground">{loan.car?.brand} {loan.car?.model || loan.carName || 'N/A'}</p>
                              <p className="text-caption text-muted-foreground">{loan.bankName || loan.bank || 'N/A'}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-gold">{formatPrice(loan.loanAmount ?? loan.amount ?? 0)}</p>
                              <StatusBadge status={loan.status} />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ===== PAYMENTS ===== */}
          {activeTab === 'payments' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total Processed', value: stats?.totalRevenue ? formatPrice(stats.totalRevenue) : 'RM 0' },
                  { label: 'Pending', value: `${stats?.pendingPayments ?? 0} items` },
                  { label: 'Failed', value: `${stats?.rejectedPayments ?? 0} items` },
                  { label: 'Commission Earned', value: stats?.totalRevenue ? formatPrice(Math.round(stats.totalRevenue * 0.08)) : 'RM 0' },
                ].map((stat) => (
                  <Card key={stat.label} className="bg-card border-border">
                    <CardContent className="p-4">
                      <div className="text-overline text-muted-foreground">{stat.label}</div>
                      <div className="heading-sm text-gold mt-1">{stat.value}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Tabs value={paymentFilter} onValueChange={setPaymentFilter}>
                <div className="flex items-center gap-2 flex-wrap">
                  <Filter className="size-4 text-muted-foreground" />
                  <TabsList className="bg-secondary">
                    {['all', 'pending', 'verified', 'rejected'].map((status) => (
                      <TabsTrigger key={status} value={status} className="text-xs data-[state=active]:bg-gold data-[state=active]:text-primary-foreground">
                        {status === 'all' ? 'All Status' : status.charAt(0).toUpperCase() + status.slice(1)}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>
              </Tabs>

              {paymentsLoading ? (
                <LoadingState message="Loading payments..." />
              ) : payments.length === 0 ? (
                <EmptyState title="No payments found" description="Payment transactions will appear here." />
              ) : (
                <>
                  {/* Desktop */}
                  <Card className="bg-card border-border hidden md:block">
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <table className="w-full text-body-sm">
                          <thead>
                            <tr className="border-b border-border">
                              <th className="text-left py-3 px-4 text-muted-foreground font-medium">Transaction ID</th>
                              <th className="text-left py-3 px-4 text-muted-foreground font-medium">User</th>
                              <th className="text-left py-3 px-4 text-muted-foreground font-medium">Dealer</th>
                              <th className="text-left py-3 px-4 text-muted-foreground font-medium">Amount</th>
                              <th className="text-left py-3 px-4 text-muted-foreground font-medium">Method</th>
                              <th className="text-left py-3 px-4 text-muted-foreground font-medium">Status</th>
                              <th className="text-left py-3 px-4 text-muted-foreground font-medium">Date</th>
                              <th className="text-left py-3 px-4 text-muted-foreground font-medium">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {payments.map((txn) => (
                              <tr key={txn.id} className="border-b border-border/50 hover:bg-secondary/50">
                                <td className="py-3 px-4 font-mono text-caption">{txn.id}</td>
                                <td className="py-3 px-4">{txn.user?.name || txn.userName || 'N/A'}</td>
                                <td className="py-3 px-4 text-muted-foreground">{txn.dealer?.companyName || txn.dealerName || 'N/A'}</td>
                                <td className="py-3 px-4 font-medium text-gold">{formatPrice(txn.amount ?? 0)}</td>
                                <td className="py-3 px-4">
                                  <Badge variant="outline" className="border-border text-muted-foreground text-xs">{txn.paymentMethod || txn.method || 'N/A'}</Badge>
                                </td>
                                <td className="py-3 px-4"><StatusBadge status={txn.status} /></td>
                                <td className="py-3 px-4 text-muted-foreground">{txn.createdAt ? formatDate(txn.createdAt) : 'N/A'}</td>
                                <td className="py-3 px-4">
                                  {txn.status === 'pending' || txn.status === 'uploaded' ? (
                                    <div className="flex items-center gap-1">
                                      <Button variant="ghost" size="sm" className="h-7 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 text-xs"
                                        disabled={actionLoading === txn.id} onClick={() => handleVerifyPayment(txn.id, 'verify')}>
                                        {actionLoading === txn.id ? <Loader2 className="size-3.5 mr-1 animate-spin" /> : <CheckCircle className="size-3.5 mr-1" />}
                                        Verify
                                      </Button>
                                      <Button variant="ghost" size="sm" className="h-7 text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs"
                                        onClick={() => setRejectDialog({ type: 'payment', id: txn.id })}>
                                        <XCircle className="size-3.5 mr-1" />Reject
                                      </Button>
                                    </div>
                                  ) : (
                                    <Button variant="ghost" size="sm" className="h-7 text-muted-foreground hover:text-gold text-xs">
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

                  {/* Mobile cards */}
                  <div className="md:hidden space-y-3">
                    {payments.map((txn) => (
                      <Card key={txn.id} className="bg-card border-border">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-medium">{txn.user?.name || txn.userName || 'N/A'}</p>
                              <p className="text-caption text-muted-foreground">{txn.dealer?.companyName || txn.dealerName || 'N/A'}</p>
                              <p className="text-caption text-muted-foreground font-mono">{txn.id}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-gold">{formatPrice(txn.amount ?? 0)}</p>
                              <StatusBadge status={txn.status} />
                            </div>
                          </div>
                          {(txn.status === 'pending' || txn.status === 'uploaded') && (
                            <div className="flex items-center gap-2 mt-3">
                              <Button variant="ghost" size="sm" className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 text-xs h-7"
                                disabled={actionLoading === txn.id} onClick={() => handleVerifyPayment(txn.id, 'verify')}>
                                <CheckCircle className="size-3.5 mr-1" />Verify
                              </Button>
                              <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs h-7"
                                onClick={() => setRejectDialog({ type: 'payment', id: txn.id })}>
                                <XCircle className="size-3.5 mr-1" />Reject
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ===== DISPUTES ===== */}
          {activeTab === 'disputes' && (
            <Card className="bg-card border-border">
              <CardContent className="p-8 text-center">
                <AlertTriangle className="size-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Dispute management coming soon</p>
                <p className="text-overline text-muted-foreground/60 mt-1">This feature is under development</p>
              </CardContent>
            </Card>
          )}

          {/* ===== FRAUD ===== */}
          {activeTab === 'fraud' && (
            <Card className="bg-card border-border">
              <CardContent className="p-8 text-center">
                <ShieldAlert className="size-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Fraud detection system coming soon</p>
                <p className="text-overline text-muted-foreground/60 mt-1">This feature is under development</p>
              </CardContent>
            </Card>
          )}

          {/* ===== ANALYTICS ===== */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <Card className="bg-card border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="heading-sm">Platform Statistics</CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-2 space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                      { label: 'Total Cars', value: stats?.totalCars ?? 0 },
                      { label: 'Total Dealers', value: stats?.totalDealers ?? 0 },
                      { label: 'Total Users', value: stats?.totalUsers ?? 0 },
                      { label: 'Revenue', value: formatPrice(stats?.totalRevenue ?? 0) },
                    ].map((item) => (
                      <div key={item.label} className="p-4 rounded-lg bg-secondary border border-border">
                        <p className="text-overline text-muted-foreground">{item.label}</p>
                        <p className="heading-sm text-gold mt-1">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="heading-sm">Top Dealers</CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-2 space-y-3">
                  {dealersLoading ? (
                    <LoadingState message="Loading dealers..." />
                  ) : dealers.length === 0 ? (
                    <EmptyState title="No dealers found" />
                  ) : (
                    dealers
                      .filter((d) => d.verified || d.status === 'verified')
                      .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
                      .slice(0, 5)
                      .map((dealer, idx) => (
                        <div key={dealer.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                          <div className="flex items-center gap-3">
                            <span className="text-body-sm font-bold text-gold w-6">#{idx + 1}</span>
                            <div>
                              <p className="text-body-sm font-medium">{dealer.companyName || dealer.company}</p>
                              <p className="text-caption text-muted-foreground">Rating: {dealer.rating?.toFixed(1) || 'N/A'} · {dealer.totalListings || 0} listings</p>
                            </div>
                          </div>
                          <span className="text-body-sm text-muted-foreground">{dealer.city}</span>
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
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="heading-sm">Platform Settings</CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-caption text-muted-foreground">Platform Name</label>
                      <Input defaultValue="DK Vroom" className="bg-secondary border-border text-foreground focus-visible:border-gold" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-caption text-muted-foreground">Support Email</label>
                      <Input defaultValue="admin@dkvroom.com" className="bg-secondary border-border text-foreground focus-visible:border-gold" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-caption text-muted-foreground">Default Commission (%)</label>
                      <Input defaultValue="8" className="bg-secondary border-border text-foreground focus-visible:border-gold" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-caption text-muted-foreground">Currency</label>
                      <Input defaultValue="MYR (RM)" disabled className="bg-secondary border-border text-muted-foreground" />
                    </div>
                  </div>
                  <Button className="bg-gold hover:bg-gold-dark text-primary-foreground font-semibold">
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
