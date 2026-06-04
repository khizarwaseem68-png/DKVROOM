'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/lib/store'
import { bookingsApi, paymentsApi, loansApi, wishlistApi } from '@/lib/api'
import { formatPrice, formatDate } from '@/lib/constants'
import { FEATURES } from '@/lib/config'
import { NotificationDropdown, StatusBadge, EmptyState, VehicleTypeBadge, ReviewModal } from '@/components/shared'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import {
  LayoutDashboard, CalendarCheck, Wallet, Banknote, User,
  ChevronLeft, ChevronRight, Car, DollarSign, Clock,
  LogOut, Menu, X, ArrowUpRight, ArrowDownRight,
  Loader2, CreditCard, FileText, Home, PlusCircle, Heart, MapPin,
  Upload, CheckCircle, AlertCircle, Phone, Mail, MessageCircle, Star,
} from 'lucide-react'

// ===== TYPES =====

interface BookingItem {
  id: string
  carId?: string
  car?: { id: string; brand: string; model: string; year?: number; photos?: string; type?: string }
  dealer?: { id: string; companyName: string; phone?: string | null; whatsapp?: string | null }
  type?: string
  status: string
  contactUnlocked?: boolean
  startDate?: string
  endDate?: string
  totalAmount?: number
  createdAt?: string
  payments?: { id: string; status: string; receiptUrl?: string; contactUnlocked?: boolean }[]
}

interface PaymentItem {
  id: string
  bookingId?: string
  amount?: number
  method?: string
  status: string
  receiptUrl?: string
  receiptStatus?: string
  createdAt?: string
  updatedAt?: string
  booking?: { car?: { brand: string; model: string } }
}

interface LoanItem {
  id: string
  amount?: number
  bankName?: string
  status: string
  tenure?: number
  monthlyInstallment?: number
  createdAt?: string
  car?: { brand: string; model: string; year?: number }
}

interface ActivityItem {
  id: string
  type: 'booking' | 'payment' | 'loan'
  title: string
  subtitle: string
  date: string
  status: string
}

// ===== SIDEBAR CONFIG =====

const sidebarItems = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'bookings', label: 'My Bookings', icon: CalendarCheck },
  { id: 'payments', label: 'My Payments', icon: Wallet },
  { id: 'loans', label: 'My Loans', icon: Banknote },
  { id: 'wishlist', label: 'My Wishlist', icon: Heart },
  { id: 'profile', label: 'Profile', icon: User },
] as const

type CustomerTab = (typeof sidebarItems)[number]['id']

// ===== HELPERS =====

function parseJsonField(val: unknown, fallback: string[] = []): string[] {
  if (typeof val === 'string') {
    try { return JSON.parse(val) } catch { return fallback }
  }
  return Array.isArray(val) ? val : fallback
}

function shortId(id: string): string {
  return id.length > 8 ? `#${id.slice(0, 8).toUpperCase()}` : `#${id.toUpperCase()}`
}

function getBookingTypeLabel(type?: string): string {
  switch (type) {
    case 'rent': return 'Rental'
    case 'sale': return 'Purchase'
    case 'continueLoan': return 'Continue Loan'
    case 'auction': return 'Auction'
    default: return type || 'Booking'
  }
}

function getPaymentMethodLabel(method?: string): string {
  switch (method) {
    case 'qr_manual': return 'QR Payment'
    case 'fpx': return 'FPX Banking'
    case 'tng': return 'Touch n Go'
    case 'bank_transfer': return 'Bank Transfer'
    default: return method || 'Manual'
  }
}

// ===== COMPONENT =====

export default function CustomerDashboard() {
  const router = useRouter()
  const { user, logout } = useAppStore()
  const userName = user?.name || 'Customer'

  const [activeTab, setActiveTab] = useState<CustomerTab>('overview')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  // Booking state
  const [bookings, setBookings] = useState<BookingItem[]>([])
  const [bookingsLoading, setBookingsLoading] = useState(true)
  const [bookingFilter, setBookingFilter] = useState('all')

  // Payments state
  const [payments, setPayments] = useState<PaymentItem[]>([])
  const [paymentsLoading, setPaymentsLoading] = useState(true)
  const [paymentFilter, setPaymentFilter] = useState('all')

  // Loans state
  const [loans, setLoans] = useState<LoanItem[]>([])
  const [loansLoading, setLoansLoading] = useState(true)
  const [loanFilter, setLoanFilter] = useState('all')

  // Wishlist state
  const [wishlistItems, setWishlistItems] = useState<Record<string, unknown>[]>([])
  const [wishlistLoading, setWishlistLoading] = useState(true)

  // Profile state
  const [profileName, setProfileName] = useState(user?.name || '')
  const [profilePhone, setProfilePhone] = useState(user?.phone || '')
  const [profileWhatsapp, setProfileWhatsapp] = useState(user?.whatsapp || '')
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)

  // Receipt upload
  const receiptFileRef = useRef<HTMLInputElement>(null)
  const [uploadingPaymentId, setUploadingPaymentId] = useState<string | null>(null)

  // Review modal state
  const [reviewTarget, setReviewTarget] = useState<{
    targetType: 'car' | 'dealer'
    targetId: string
    targetName: string
    bookingId: string
  } | null>(null)

  // Sync profile state with user
  useEffect(() => {
    if (user) {
      queueMicrotask(() => {
        setProfileName(user.name || '')
        setProfilePhone(user.phone || '')
        setProfileWhatsapp(user.whatsapp || '')
      })
    }
  }, [user])

  // ===== FETCH BOOKINGS =====
  const fetchBookings = useCallback(async () => {
    setBookingsLoading(true)
    try {
      const params: Record<string, string> = {}
      if (bookingFilter !== 'all') params.status = bookingFilter
      const result = await bookingsApi.list(params)
      const data = result.data as { bookings?: BookingItem[] } | BookingItem[]
      setBookings(Array.isArray(data) ? data : (data?.bookings ?? []))
    } catch {
      // silent
    } finally {
      setBookingsLoading(false)
    }
  }, [bookingFilter])

  // ===== FETCH PAYMENTS =====
  const fetchPayments = useCallback(async () => {
    setPaymentsLoading(true)
    try {
      const params: Record<string, string> = {}
      if (paymentFilter !== 'all') params.status = paymentFilter
      const result = await paymentsApi.list(params)
      const data = result.data as { payments?: PaymentItem[] } | PaymentItem[]
      setPayments(Array.isArray(data) ? data : (data?.payments ?? []))
    } catch {
      // silent
    } finally {
      setPaymentsLoading(false)
    }
  }, [paymentFilter])

  // ===== FETCH LOANS =====
  const fetchLoans = useCallback(async () => {
    setLoansLoading(true)
    try {
      const params: Record<string, string> = {}
      if (loanFilter !== 'all') params.status = loanFilter
      const result = await loansApi.list(params)
      const data = result.data as { loans?: LoanItem[] } | LoanItem[]
      setLoans(Array.isArray(data) ? data : (data?.loans ?? []))
    } catch {
      // silent
    } finally {
      setLoansLoading(false)
    }
  }, [loanFilter])

  // ===== FETCH WISHLIST =====
  const fetchWishlist = useCallback(async () => {
    setWishlistLoading(true)
    try {
      const result = await wishlistApi.list()
      const data = result.data as Record<string, unknown>[]
      setWishlistItems(Array.isArray(data) ? data : [])
    } catch {
      // silent
    } finally {
      setWishlistLoading(false)
    }
  }, [])

  // Fetch on tab change / filter change
  useEffect(() => {
    if (activeTab === 'bookings') queueMicrotask(() => { void fetchBookings() })
  }, [activeTab, fetchBookings])

  useEffect(() => {
    if (activeTab === 'payments') queueMicrotask(() => { void fetchPayments() })
  }, [activeTab, fetchPayments])

  useEffect(() => {
    if (activeTab === 'loans') queueMicrotask(() => { void fetchLoans() })
  }, [activeTab, fetchLoans])

  useEffect(() => {
    if (activeTab === 'wishlist') queueMicrotask(() => { void fetchWishlist() })
  }, [activeTab, fetchWishlist])

  // Fetch all data on mount for overview
  useEffect(() => {
    queueMicrotask(() => {
      void fetchBookings()
      void fetchPayments()
      void fetchLoans()
      void fetchWishlist()
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ===== DERIVED DATA =====

  const activeBookings = bookings.filter(b => b.status === 'active' || b.status === 'confirmed').length
  const pendingPayments = payments.filter(p => ['pending', 'uploaded', 'payment_pending', 'rejected'].includes(p.status)).length
  const activeLoans = loans.filter(l => l.status === 'approved' || l.status === 'disbursed' || l.status === 'active').length
  const wishlistCount = wishlistItems.length
  const totalSpent = payments
    .filter(p => p.status === 'verified' || p.status === 'completed')
    .reduce((sum, p) => sum + (p.amount || 0), 0)

  // Recent activity (last 5 from bookings/payments)
  const recentActivity: ActivityItem[] = [
    ...bookings.map(b => ({
      id: b.id,
      type: 'booking' as const,
      title: `${b.car?.brand || ''} ${b.car?.model || ''}`.trim() || 'Booking',
      subtitle: getBookingTypeLabel(b.type),
      date: b.createdAt || b.startDate || '',
      status: b.status,
    })),
    ...payments.map(p => ({
      id: p.id,
      type: 'payment' as const,
      title: p.booking?.car ? `${p.booking.car.brand} ${p.booking.car.model}` : 'Payment',
      subtitle: getPaymentMethodLabel(p.method),
      date: p.createdAt || '',
      status: p.status,
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)

  // ===== HANDLERS =====

  const handleTabChange = (tab: CustomerTab) => {
    setActiveTab(tab)
    setMobileSidebarOpen(false)
  }

  const handleUploadReceipt = async (paymentId: string, file: File) => {
    setUploadingPaymentId(paymentId)
    try {
      await paymentsApi.uploadReceipt(paymentId, file)
      await Promise.all([fetchPayments(), fetchBookings()])
    } catch {
      // silent
    } finally {
      setUploadingPaymentId(null)
    }
  }

  const handleSaveProfile = async () => {
    setProfileSaving(true)
    setProfileSaved(false)
    try {
      // Update profile via API
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profileName,
          phone: profilePhone,
          whatsapp: profileWhatsapp,
        }),
      })
      if (response.ok) {
        setProfileSaved(true)
        // Refresh user state
        const { checkAuth } = useAppStore.getState()
        await checkAuth()
        setTimeout(() => setProfileSaved(false), 3000)
      }
    } catch {
      // silent
    } finally {
      setProfileSaving(false)
    }
  }

  // ===== CARD SKELETON =====

  const CardSkeleton = () => (
    <Card className="bg-card border-border overflow-hidden animate-pulse">
      <CardContent className="p-4 sm:p-6 space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-5 bg-secondary rounded w-2/3" />
          <div className="h-5 bg-secondary rounded w-16" />
        </div>
        <div className="h-4 bg-secondary rounded w-1/2" />
        <div className="h-4 bg-secondary rounded w-3/4" />
        <div className="h-7 bg-secondary rounded w-1/3" />
      </CardContent>
    </Card>
  )

  // ===== RENDER =====
  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* ===== SIDEBAR - DESKTOP ===== */}
      <aside className={`hidden lg:flex flex-col border-r border-border bg-sidebar transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-60'}`}>
        {/* Logo Area */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center">
                <Car className="size-4 text-gold" />
              </div>
              <span className="text-sm font-bold gold-text">DK Vroom</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="text-muted-foreground hover:text-gold hover:bg-gold/10 h-7 w-7"
          >
            {sidebarCollapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
          </Button>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 py-4 px-2 space-y-1">
          {sidebarItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 cursor-pointer ${
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

        {/* Footer Actions */}
        {!sidebarCollapsed && (
          <div className="p-4 border-t border-border space-y-1">
            <Button
              variant="ghost"
              onClick={() => router.push('/')}
              className="w-full text-muted-foreground hover:text-gold hover:bg-gold/10 text-sm"
            >
              <ChevronLeft className="size-4 mr-1" />
              Back to Site
            </Button>
            <Button
              variant="ghost"
              onClick={logout}
              className="w-full text-red-400/80 hover:text-red-400 hover:bg-red-500/10 text-sm"
            >
              <LogOut className="size-4 mr-1" />
              Sign Out
            </Button>
          </div>
        )}
      </aside>

      {/* ===== MOBILE SIDEBAR OVERLAY ===== */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60 cursor-pointer" onClick={() => setMobileSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-sidebar border-r border-border flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center">
                  <Car className="size-4 text-gold" />
                </div>
                <span className="text-sm font-bold gold-text">DK Vroom</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileSidebarOpen(false)}
                className="text-muted-foreground"
              >
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
                    className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all cursor-pointer ${
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
            <div className="p-4 border-t border-border space-y-1">
              <Button
                variant="ghost"
                onClick={() => { setMobileSidebarOpen(false); router.push('/') }}
                className="w-full text-muted-foreground hover:text-gold hover:bg-gold/10 text-sm"
              >
                <ChevronLeft className="size-4 mr-1" />
                Back to Site
              </Button>
              <Button
                variant="ghost"
                onClick={logout}
                className="w-full text-red-400/80 hover:text-red-400 hover:bg-red-500/10 text-sm"
              >
                <LogOut className="size-4 mr-1" />
                Sign Out
              </Button>
            </div>
          </aside>
        </div>
      )}

      {/* ===== MAIN CONTENT ===== */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* ===== TOP BAR ===== */}
        <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-xl">
          <div className="flex items-center justify-between px-4 sm:px-6 h-14">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileSidebarOpen(true)}
                className="lg:hidden text-muted-foreground hover:text-gold"
              >
                <Menu className="size-5" />
              </Button>
              <h1 className="dash-heading-sm">
                {sidebarItems.find((i) => i.id === activeTab)?.label || 'Dashboard'}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <NotificationDropdown />
              <Separator orientation="vertical" className="h-6 bg-border" />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="flex items-center gap-2 cursor-pointer">
                    <Avatar className="size-8 border border-gold/30">
                      <AvatarFallback className="bg-gold/10 text-gold text-xs font-bold">
                        {userName?.charAt(0) || 'C'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-body-sm font-medium hidden sm:inline">{userName}</span>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-card border-border" align="end">
                  <DropdownMenuItem
                    onClick={() => handleTabChange('profile')}
                    className="cursor-pointer focus:bg-gold/10 focus:text-gold"
                  >
                    <User className="size-4 mr-2" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={logout}
                    className="text-red-400 focus:bg-red-500/10 focus:text-red-400 cursor-pointer"
                  >
                    <LogOut className="size-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* ===== CONTENT AREA ===== */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">

          {/* ============================================ */}
          {/* ===== OVERVIEW TAB ===== */}
          {/* ============================================ */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Welcome Message */}
              <div>
                <h2 className="dash-heading-lg">Welcome back, {userName}!</h2>
                <p className="text-muted-foreground text-body-sm mt-1">
                  Here&apos;s what&apos;s happening with your account today.
                </p>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                  {
                    label: 'Active Bookings',
                    value: bookingsLoading ? '...' : String(activeBookings),
                    icon: CalendarCheck,
                    change: `${bookings.length} total`,
                    up: true,
                  },
                  {
                    label: 'Pending Payments',
                    value: paymentsLoading ? '...' : String(pendingPayments),
                    icon: Clock,
                    change: `${payments.length} total`,
                    up: pendingPayments > 0,
                  },
                  {
                    label: 'Active Loans',
                    value: loansLoading ? '...' : String(activeLoans),
                    icon: Banknote,
                    change: `${loans.length} total`,
                    up: true,
                  },
                  {
                    label: 'Total Spent',
                    value: paymentsLoading ? '...' : formatPrice(totalSpent),
                    icon: DollarSign,
                    change: 'Verified payments',
                    up: true,
                  },
                  {
                    label: 'Wishlist',
                    value: wishlistLoading ? '...' : String(wishlistCount),
                    icon: Heart,
                    change: 'Saved vehicles',
                    up: true,
                  },
                ].map((stat) => {
                  const Icon = stat.icon
                  return (
                    <Card key={stat.label} className="bg-card border-border">
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex items-start justify-between mb-3">
                          <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center">
                            <Icon className="size-5 text-gold" />
                          </div>
                          <span className={`flex items-center text-overline ${stat.up ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {stat.up ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                            {stat.change}
                          </span>
                        </div>
                        <div className="dash-heading-md">{stat.value}</div>
                        <div className="text-overline text-muted-foreground mt-1">{stat.label}</div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Activity */}
                <Card className="lg:col-span-2 bg-card border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="dash-heading-sm">Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 pt-2 space-y-3 max-h-96 overflow-y-auto">
                    {bookingsLoading && paymentsLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="size-6 animate-spin text-gold" />
                      </div>
                    ) : recentActivity.length > 0 ? (
                      recentActivity.map((activity) => (
                        <div
                          key={activity.id + activity.type}
                          className="flex items-center justify-between py-3 border-b border-border/50 last:border-0"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                              activity.type === 'booking'
                                ? 'bg-emerald-500/10'
                                : activity.type === 'payment'
                                ? 'bg-blue-500/10'
                                : 'bg-purple-500/10'
                            }`}>
                              {activity.type === 'booking' && <CalendarCheck className="size-4 text-emerald-400" />}
                              {activity.type === 'payment' && <CreditCard className="size-4 text-blue-400" />}
                              {activity.type === 'loan' && <Banknote className="size-4 text-purple-400" />}
                            </div>
                            <div className="min-w-0">
                              <p className="text-body-sm font-medium truncate">{activity.title}</p>
                              <p className="text-caption text-muted-foreground truncate">{activity.subtitle}</p>
                            </div>
                          </div>
                          <div className="text-right shrink-0 ml-3">
                            <StatusBadge status={activity.status} />
                            {activity.date && (
                              <p className="text-caption text-muted-foreground mt-0.5">
                                {formatDate(activity.date)}
                              </p>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <EmptyState
                        icon={<Clock className="size-8" />}
                        title="No recent activity"
                        description="Your recent bookings and payments will appear here."
                      />
                    )}
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="bg-card border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="dash-heading-sm">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 pt-2 space-y-3">
                    {[
                      {
                        label: 'Browse Cars',
                        desc: 'Find your next ride',
                        icon: Car,
                        action: () => router.push('/buy'),
                      },
                      {
                        label: 'My Bookings',
                        desc: 'View booking status',
                        icon: CalendarCheck,
                        action: () => handleTabChange('bookings'),
                      },
                      {
                        label: 'Apply for Loan',
                        desc: 'Get financing help',
                        icon: Banknote,
                        action: () => router.push('/apply-loan'),
                      },
                      {
                        label: 'Upload Receipt',
                        desc: 'Submit payment proof',
                        icon: Upload,
                        action: () => handleTabChange('payments'),
                      },
                    ].map((action) => {
                      const Icon = action.icon
                      return (
                        <button
                          key={action.label}
                          onClick={action.action}
                          className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:border-gold/50 hover:bg-gold/5 transition-all text-left group cursor-pointer"
                        >
                          <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center shrink-0 group-hover:bg-gold/20 transition-colors">
                            <Icon className="size-5 text-gold" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-body-sm font-semibold group-hover:text-gold transition-colors">{action.label}</p>
                            <p className="text-caption text-muted-foreground">{action.desc}</p>
                          </div>
                          <ChevronRight className="size-4 text-muted-foreground ml-auto shrink-0 group-hover:text-gold transition-colors" />
                        </button>
                      )
                    })}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* ============================================ */}
          {/* ===== MY BOOKINGS TAB ===== */}
          {/* ============================================ */}
          {activeTab === 'bookings' && (
            <div className="space-y-4">
              {/* Filter Tabs */}
              <div className="flex items-center gap-2 flex-wrap">
                {(['all', 'payment_pending', 'payment_uploaded', 'confirmed', 'active', 'completed', 'cancelled'] as const).map((filter) => (
                  <Button
                    key={filter}
                    variant={bookingFilter === filter ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setBookingFilter(filter)}
                    className={bookingFilter === filter
                      ? 'bg-gold text-primary-foreground hover:bg-gold-dark text-xs'
                      : 'text-muted-foreground hover:text-foreground text-xs'
                    }
                  >
                    {filter === 'all' ? 'All' : filter.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                  </Button>
                ))}
                <span className="text-caption text-muted-foreground ml-2">
                  {bookings.length} booking{bookings.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Loading State */}
              {bookingsLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <CardSkeleton key={i} />
                  ))}
                </div>
              ) : bookings.length === 0 ? (
                <EmptyState
                  icon={<CalendarCheck className="size-12" />}
                  title="No bookings found"
                  description={bookingFilter !== 'all'
                    ? `No ${bookingFilter} bookings at the moment.`
                    : "You haven't made any bookings yet. Browse cars to get started!"
                  }
                  action={
                    <Button onClick={() => router.push('/buy')} className="bg-gold hover:bg-gold-dark text-primary-foreground">
                      <Car className="size-4 mr-1" />
                      Browse Cars
                    </Button>
                  }
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {bookings.map((booking) => {
                    const carPhoto = booking.car?.photos ? parseJsonField(booking.car.photos)[0] : ''
                    const isPaymentPending = booking.status === 'payment_pending' || booking.payments?.some(p => p.status === 'pending' || p.status === 'rejected')
                    const isUnderVerification = booking.status === 'payment_uploaded' || booking.payments?.some(p => p.status === 'uploaded')
                    const isContactUnlocked = booking.contactUnlocked || booking.payments?.some(p => p.contactUnlocked) || booking.status === 'confirmed' || booking.status === 'active' || booking.status === 'completed'
                    const dealerWhatsapp = booking.dealer?.whatsapp || booking.dealer?.phone
                    const dealerPhone = booking.dealer?.phone
                    return (
                      <Card key={booking.id} className="bg-card border-border overflow-hidden hover:border-gold/30 transition-all">
                        {/* Card Image */}
                        {carPhoto && (
                          <div className="relative aspect-[16/9] overflow-hidden bg-secondary">
                            <img src={carPhoto} alt={`${booking.car?.brand} ${booking.car?.model}`} className="w-full h-full object-cover" />
                            <div className="absolute top-2 left-2">
                              {booking.type && <VehicleTypeBadge type={booking.type} />}
                            </div>
                            <div className="absolute top-2 right-2">
                              <StatusBadge status={booking.status} />
                            </div>
                          </div>
                        )}

                        <CardContent className="p-4 space-y-3">
                          {/* Car Info */}
                          <div>
                            <h3 className="font-semibold text-foreground">
                              {booking.car?.brand || 'Unknown'} {booking.car?.model || 'Vehicle'}
                            </h3>
                            <p className="text-caption text-muted-foreground">
                              {getBookingTypeLabel(booking.type)}
                            </p>
                          </div>

                          {/* Dates */}
                          {(booking.startDate || booking.endDate) && (
                            <div className="flex items-center gap-2 text-caption text-muted-foreground">
                              <Clock className="size-3" />
                              <span>
                                {booking.startDate ? formatDate(booking.startDate) : 'TBD'}
                                {booking.endDate ? ` — ${formatDate(booking.endDate)}` : ''}
                              </span>
                            </div>
                          )}

                          {/* Amount */}
                          {booking.totalAmount != null && (
                            <p className="text-lg font-bold text-gold">
                              {formatPrice(booking.totalAmount)}
                            </p>
                          )}

                          {/* No photo — show status inline */}
                          {!carPhoto && (
                            <div className="flex items-center gap-2">
                              <StatusBadge status={booking.status} />
                              {booking.type && <VehicleTypeBadge type={booking.type} />}
                            </div>
                          )}

                          {/* Upload Receipt Button */}
                          {isPaymentPending && (
                            <Button
                              size="sm"
                              className="w-full bg-gold hover:bg-gold-dark text-primary-foreground font-semibold"
                              disabled={uploadingPaymentId !== null}
                              onClick={() => {
                                const paymentId = booking.payments?.find(p => p.status === 'pending' || p.status === 'rejected')?.id
                                if (paymentId) {
                                  receiptFileRef.current?.setAttribute('data-payment-id', paymentId)
                                  receiptFileRef.current?.click()
                                }
                              }}
                            >
                              {uploadingPaymentId !== null ? (
                                <Loader2 className="size-4 mr-1 animate-spin" />
                              ) : (
                                <Upload className="size-4 mr-1" />
                              )}
                              {uploadingPaymentId !== null ? 'Uploading...' : 'Upload Receipt'}
                            </Button>
                          )}

                          {isUnderVerification && (
                            <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-3 text-caption text-blue-300">
                              Receipt uploaded. Admin is verifying your payment.
                            </div>
                          )}

                          {/* Dealer contact — shown once payment is verified */}
                          {isContactUnlocked && (dealerPhone || dealerWhatsapp) && (
                            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 space-y-2">
                              <p className="text-caption font-semibold text-emerald-400 flex items-center gap-1">
                                <CheckCircle className="size-3" />
                                Dealer Contact Unlocked
                              </p>
                              {dealerPhone && (
                                <a href={`tel:${dealerPhone}`} className="flex items-center gap-2 text-caption text-foreground hover:text-gold">
                                  <Phone className="size-3 text-emerald-400" />
                                  {dealerPhone}
                                </a>
                              )}
                              {dealerWhatsapp && (
                                <a
                                  href={`https://wa.me/${dealerWhatsapp.replace(/[^0-9]/g, '')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 text-caption text-emerald-400 hover:text-emerald-300"
                                >
                                  <MessageCircle className="size-3" />
                                  Chat on WhatsApp
                                </a>
                              )}
                            </div>
                          )}

                          {/* Review button — only for completed bookings */}
                          {FEATURES.showReviewModule && booking.status === 'completed' && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 border-gold/30 text-gold hover:bg-gold/10 hover:text-gold-light text-xs"
                                onClick={() => {
                                  if (booking.car) {
                                    setReviewTarget({
                                      targetType: 'car',
                                      targetId: booking.carId || booking.car?.id || '',
                                      targetName: `${booking.car.brand} ${booking.car.model}`,
                                      bookingId: booking.id,
                                    })
                                  }
                                }}
                              >
                                <Star className="size-3 mr-1" />
                                Review Car
                              </Button>
                              {booking.dealer && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1 border-gold/30 text-gold hover:bg-gold/10 hover:text-gold-light text-xs"
                                  onClick={() => {
                                    setReviewTarget({
                                      targetType: 'dealer',
                                      targetId: booking.dealer?.id || '',
                                      targetName: booking.dealer?.companyName || 'Dealer',
                                      bookingId: booking.id,
                                    })
                                  }}
                                >
                                  <Star className="size-3 mr-1" />
                                  Review Dealer
                                </Button>
                              )}
                            </div>
                          )}

                          {/* Created date */}
                          {booking.createdAt && (
                            <p className="text-caption text-muted-foreground/60">
                              Booked on {formatDate(booking.createdAt)}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ============================================ */}
          {/* ===== MY PAYMENTS TAB ===== */}
          {/* ============================================ */}
          {activeTab === 'payments' && (
            <div className="space-y-4">
              {/* Filter Tabs */}
              <div className="flex items-center gap-2 flex-wrap">
                {(['all', 'pending', 'uploaded', 'verified', 'rejected'] as const).map((filter) => (
                  <Button
                    key={filter}
                    variant={paymentFilter === filter ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setPaymentFilter(filter)}
                    className={paymentFilter === filter
                      ? 'bg-gold text-primary-foreground hover:bg-gold-dark text-xs'
                      : 'text-muted-foreground hover:text-foreground text-xs'
                    }
                  >
                    {filter === 'all' ? 'All' : filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </Button>
                ))}
                <span className="text-caption text-muted-foreground ml-2">
                  {payments.length} payment{payments.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Loading State */}
              {paymentsLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <CardSkeleton key={i} />
                  ))}
                </div>
              ) : payments.length === 0 ? (
                <EmptyState
                  icon={<Wallet className="size-12" />}
                  title="No payments found"
                  description={paymentFilter !== 'all'
                    ? `No ${paymentFilter} payments at the moment.`
                    : "You don't have any payment records yet."
                  }
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {payments.map((payment) => {
                    const isRejected = payment.status === 'rejected'
                    const isPending = payment.status === 'pending' || payment.status === 'payment_pending' || isRejected
                    const hasReceipt = !isRejected && (!!payment.receiptUrl || payment.receiptStatus === 'uploaded' || payment.status === 'uploaded')
                    return (
                      <Card key={payment.id} className="bg-card border-border hover:border-gold/30 transition-all">
                        <CardContent className="p-4 space-y-3">
                          {/* Payment ID & Status */}
                          <div className="flex items-center justify-between">
                            <span className="text-caption font-mono text-muted-foreground">
                              {shortId(payment.id)}
                            </span>
                            <StatusBadge status={payment.status} />
                          </div>

                          {/* Amount */}
                          {payment.amount != null && (
                            <p className="text-xl font-bold text-gold">
                              {formatPrice(payment.amount)}
                            </p>
                          )}

                          {/* Car info if available */}
                          {payment.booking?.car && (
                            <p className="text-body-sm text-muted-foreground">
                              {payment.booking.car.brand} {payment.booking.car.model}
                            </p>
                          )}

                          {/* Method */}
                          <div className="flex items-center gap-2 text-caption text-muted-foreground">
                            <CreditCard className="size-3" />
                            <span>{getPaymentMethodLabel(payment.method)}</span>
                          </div>

                          {/* Receipt Status */}
                          <div className="flex items-center gap-2 text-caption">
                            <FileText className="size-3 text-muted-foreground" />
                            {hasReceipt ? (
                              <span className="text-emerald-400 flex items-center gap-1">
                                <CheckCircle className="size-3" />
                                Receipt uploaded
                              </span>
                            ) : (
                              <span className="text-amber-400 flex items-center gap-1">
                                <AlertCircle className="size-3" />
                                Receipt pending
                              </span>
                            )}
                          </div>

                          {/* Upload Receipt Button */}
                          {payment.status === 'uploaded' && (
                            <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-3 text-caption text-blue-300">
                              Your receipt is under admin verification.
                            </div>
                          )}

                          {isRejected && (
                            <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-caption text-red-300">
                              Receipt rejected. Please upload a clearer or correct payment receipt.
                            </div>
                          )}

                          {isPending && !hasReceipt && (
                            <Button
                              size="sm"
                              className="w-full bg-gold hover:bg-gold-dark text-primary-foreground font-semibold"
                              disabled={uploadingPaymentId === payment.id}
                              onClick={() => {
                                receiptFileRef.current?.setAttribute('data-payment-id', payment.id)
                                receiptFileRef.current?.click()
                              }}
                            >
                              {uploadingPaymentId === payment.id ? (
                                <Loader2 className="size-4 mr-1 animate-spin" />
                              ) : (
                                <Upload className="size-4 mr-1" />
                              )}
                              {uploadingPaymentId === payment.id ? 'Uploading...' : 'Upload Receipt'}
                            </Button>
                          )}

                          {/* Date */}
                          {payment.createdAt && (
                            <p className="text-caption text-muted-foreground/60">
                              {formatDate(payment.createdAt)}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ============================================ */}
          {/* ===== MY LOANS TAB ===== */}
          {/* ============================================ */}
          {activeTab === 'loans' && (
            <div className="space-y-4">
              {/* Filter Tabs */}
              <div className="flex items-center gap-2 flex-wrap">
                {(['all', 'pending', 'approved', 'rejected'] as const).map((filter) => (
                  <Button
                    key={filter}
                    variant={loanFilter === filter ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setLoanFilter(filter)}
                    className={loanFilter === filter
                      ? 'bg-gold text-primary-foreground hover:bg-gold-dark text-xs'
                      : 'text-muted-foreground hover:text-foreground text-xs'
                    }
                  >
                    {filter === 'all' ? 'All' : filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </Button>
                ))}
                <span className="text-caption text-muted-foreground ml-2">
                  {loans.length} loan{loans.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Loading State */}
              {loansLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <CardSkeleton key={i} />
                  ))}
                </div>
              ) : loans.length === 0 ? (
                <EmptyState
                  icon={<Banknote className="size-12" />}
                  title="No loans found"
                  description={loanFilter !== 'all'
                    ? `No ${loanFilter} loans at the moment.`
                    : "You haven't applied for any loans yet."
                  }
                  action={
                    <Button onClick={() => router.push('/apply-loan')} className="bg-gold hover:bg-gold-dark text-primary-foreground">
                      <PlusCircle className="size-4 mr-1" />
                      Apply for Loan
                    </Button>
                  }
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {loans.map((loan) => (
                    <Card key={loan.id} className="bg-card border-border hover:border-gold/30 transition-all">
                      <CardContent className="p-4 space-y-3">
                        {/* Status & Loan ID */}
                        <div className="flex items-center justify-between">
                          <span className="text-caption font-mono text-muted-foreground">
                            {shortId(loan.id)}
                          </span>
                          <StatusBadge status={loan.status} />
                        </div>

                        {/* Loan Amount */}
                        {loan.amount != null && (
                          <p className="text-xl font-bold text-gold">
                            {formatPrice(loan.amount)}
                          </p>
                        )}

                        {/* Car info */}
                        {loan.car && (
                          <p className="text-body-sm text-muted-foreground">
                            {loan.car.brand} {loan.car.model}
                            {loan.car.year ? ` (${loan.car.year})` : ''}
                          </p>
                        )}

                        {/* Bank */}
                        {loan.bankName && (
                          <div className="flex items-center gap-2 text-caption text-muted-foreground">
                            <Home className="size-3" />
                            <span>{loan.bankName}</span>
                          </div>
                        )}

                        {/* Monthly Installment */}
                        {loan.monthlyInstallment != null && (
                          <div className="flex items-center gap-2 text-caption text-muted-foreground">
                            <DollarSign className="size-3" />
                            <span>Monthly: {formatPrice(loan.monthlyInstallment)}</span>
                          </div>
                        )}

                        {/* Tenure */}
                        {loan.tenure != null && (
                          <div className="flex items-center gap-2 text-caption text-muted-foreground">
                            <Clock className="size-3" />
                            <span>{loan.tenure} months</span>
                          </div>
                        )}

                        {/* Date */}
                        {loan.createdAt && (
                          <p className="text-caption text-muted-foreground/60">
                            Applied on {formatDate(loan.createdAt)}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ============================================ */}
          {/* ===== MY WISHLIST TAB ===== */}
          {/* ============================================ */}
          {activeTab === 'wishlist' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="dash-heading-md">My Wishlist</h2>
                <span className="text-caption text-muted-foreground">
                  {wishlistCount} vehicle{wishlistCount !== 1 ? 's' : ''}
                </span>
              </div>

              {wishlistLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <CardSkeleton key={i} />
                  ))}
                </div>
              ) : wishlistItems.length === 0 ? (
                <EmptyState
                  icon={<Heart className="size-12" />}
                  title="Your wishlist is empty"
                  description="Save vehicles you love to your wishlist and find them here."
                  action={
                    <Button onClick={() => router.push('/buy')} className="bg-gold hover:bg-gold-dark text-primary-foreground">
                      <Car className="size-4 mr-1" />
                      Browse Cars
                    </Button>
                  }
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {wishlistItems.map((item) => {
                    const car = item.car as Record<string, unknown> | undefined
                    const carPhotos = car?.photos
                    const photoUrl = typeof carPhotos === 'string'
                      ? (() => { try { return JSON.parse(carPhotos)[0] } catch { return '' } })()
                      : Array.isArray(carPhotos) ? carPhotos[0] : ''
                    return (
                      <Card key={item.id as string} className="bg-card border-border overflow-hidden hover:border-gold/30 transition-all cursor-pointer"
                        onClick={() => router.push(`/car/${car?.id}`)}
                      >
                        {photoUrl && (
                          <div className="relative aspect-[16/9] overflow-hidden bg-secondary">
                            <img src={photoUrl} alt={`${car?.brand} ${car?.model}`} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="min-w-0 flex-1">
                              <h3 className="font-semibold text-foreground truncate">
                                {car?.brand as string} {car?.model as string}
                              </h3>
                              <p className="text-caption text-muted-foreground">{car?.year as string}</p>
                            </div>
                            {car?.price != null && (
                              <span className="text-lg font-bold text-gold shrink-0 ml-2">
                                {formatPrice(Number(car.price))}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-caption text-muted-foreground">
                            <MapPin className="size-3" />
                            <span>{(car?.city as string) || 'Malaysia'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <VehicleTypeBadge type={(car?.type as string) || ''} />
                            {car?.mileage != null && (
                              <span className="text-caption text-muted-foreground">
                                {(car?.mileage as number).toLocaleString()} km
                              </span>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-400"
                            onClick={(e) => {
                              e.stopPropagation()
                              const carId = car?.id as string
                              if (carId) {
                                const { toggleWishlist } = useAppStore.getState()
                                toggleWishlist(carId)
                                setWishlistItems(wishlistItems.filter((i) => i.id !== item.id))
                              }
                            }}
                          >
                            <Heart className="size-4 mr-1 fill-red-500 text-red-500" />
                            Remove
                          </Button>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ============================================ */}
          {/* ===== PROFILE TAB ===== */}
          {/* ============================================ */}
          {activeTab === 'profile' && (
            <div className="max-w-2xl mx-auto space-y-6">
              {/* Profile Header Card */}
              <Card className="bg-card border-border">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <Avatar className="size-16 border-2 border-gold/30">
                      <AvatarFallback className="bg-gold/10 text-gold text-xl font-bold">
                        {userName?.charAt(0) || 'C'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className="dash-heading-md">{user?.name || 'Customer'}</h2>
                      <p className="text-body-sm text-muted-foreground">{user?.email}</p>
                      <Badge className="mt-1 bg-gold/10 text-gold border-gold/30 text-xs">
                        {user?.role?.charAt(0).toUpperCase()}{user?.role?.slice(1) || 'Customer'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Edit Profile Card */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="dash-heading-sm">Edit Profile</CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 space-y-6">
                  {/* Name */}
                  <div className="space-y-2">
                    <Label className="text-muted-foreground text-body-sm font-medium flex items-center gap-2">
                      <User className="size-4 text-gold" />
                      Full Name
                    </Label>
                    <Input
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      placeholder="Enter your full name"
                      className="bg-secondary border-border text-foreground placeholder:text-muted-foreground/50 focus-visible:border-gold h-10"
                    />
                  </div>

                  {/* Email (read-only) */}
                  <div className="space-y-2">
                    <Label className="text-muted-foreground text-body-sm font-medium flex items-center gap-2">
                      <Mail className="size-4 text-gold" />
                      Email Address
                    </Label>
                    <Input
                      value={user?.email || ''}
                      disabled
                      className="bg-secondary/50 border-border text-muted-foreground h-10 cursor-not-allowed"
                    />
                    <p className="text-caption text-muted-foreground/60">Email cannot be changed</p>
                  </div>

                  <Separator className="bg-border" />

                  {/* Phone */}
                  <div className="space-y-2">
                    <Label className="text-muted-foreground text-body-sm font-medium flex items-center gap-2">
                      <Phone className="size-4 text-gold" />
                      Phone Number
                    </Label>
                    <Input
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                      placeholder="+60 12-345 6789"
                      className="bg-secondary border-border text-foreground placeholder:text-muted-foreground/50 focus-visible:border-gold h-10"
                    />
                  </div>

                  {/* WhatsApp */}
                  <div className="space-y-2">
                    <Label className="text-muted-foreground text-body-sm font-medium flex items-center gap-2">
                      <MessageCircle className="size-4 text-gold" />
                      WhatsApp Number
                    </Label>
                    <Input
                      value={profileWhatsapp}
                      onChange={(e) => setProfileWhatsapp(e.target.value)}
                      placeholder="+60 12-345 6789"
                      className="bg-secondary border-border text-foreground placeholder:text-muted-foreground/50 focus-visible:border-gold h-10"
                    />
                  </div>

                  <Separator className="bg-border" />

                  {/* Save Button */}
                  <div className="flex items-center gap-3">
                    <Button
                      onClick={handleSaveProfile}
                      disabled={profileSaving}
                      className="bg-gold hover:bg-gold-dark text-primary-foreground font-semibold"
                    >
                      {profileSaving ? (
                        <Loader2 className="size-4 mr-1 animate-spin" />
                      ) : profileSaved ? (
                        <CheckCircle className="size-4 mr-1" />
                      ) : null}
                      {profileSaving ? 'Saving...' : profileSaved ? 'Saved!' : 'Save Changes'}
                    </Button>
                    {profileSaved && (
                      <span className="text-caption text-emerald-400">Profile updated successfully</span>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Account Info Card */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="dash-heading-sm">Account Information</CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-caption text-muted-foreground">Account Status</p>
                      <div className="flex items-center gap-2">
                        <div className="size-2 rounded-full bg-emerald-400" />
                        <span className="text-body-sm font-medium">Active</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-caption text-muted-foreground">Member Since</p>
                      <span className="text-body-sm font-medium">—</span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-caption text-muted-foreground">Total Bookings</p>
                      <span className="text-body-sm font-medium">{bookings.length}</span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-caption text-muted-foreground">Active Loans</p>
                      <span className="text-body-sm font-medium">{activeLoans}</span>
                    </div>
                  </div>

                  <Separator className="bg-border" />

                  <Button
                    variant="ghost"
                    onClick={logout}
                    className="text-red-400/80 hover:text-red-400 hover:bg-red-500/10"
                  >
                    <LogOut className="size-4 mr-2" />
                    Sign Out
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

        </main>
      </div>

      {/* Hidden file input for receipt uploads */}
      <input
        ref={receiptFileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          const paymentId = receiptFileRef.current?.getAttribute('data-payment-id')
          if (file && paymentId) {
            setUploadingPaymentId(paymentId)
            handleUploadReceipt(paymentId, file)
          }
          e.target.value = ''
        }}
      />

      {/* Review Modal */}
      {reviewTarget && (
        <ReviewModal
          open={true}
          onClose={() => setReviewTarget(null)}
          onSuccess={() => fetchBookings()}
          targetType={reviewTarget.targetType}
          targetId={reviewTarget.targetId}
          targetName={reviewTarget.targetName}
          bookingId={reviewTarget.bookingId}
        />
      )}
    </div>
  )
}
