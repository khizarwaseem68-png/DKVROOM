'use client'

import { useState, useEffect, useCallback, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/lib/store'
import { adminApi, bookingsApi, loansApi } from '@/lib/api'
import {
  formatPrice,
  formatDate,
  getFeeLabel,
  type VehicleType,
} from '@/lib/constants'
import {
  EmptyState,
  StatusBadge,
  VehicleTypeBadge,
  NotificationDropdown,
} from '@/components/shared'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { toast } from 'sonner'
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
  LogOut,
  Copy,
  FileText,
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

interface AdminStatsResponse {
  totals?: {
    users?: number
    dealers?: number
    cars?: number
    payments?: number
    loanApplications?: number
  }
  dealerVerification?: {
    pending?: number
    rejected?: number
  }
  carBreakdown?: {
    byStatus?: {
      pending?: number
      rejected?: number
    }
  }
  paymentBreakdown?: {
    byStatus?: {
      pending?: number
      uploaded?: number
      rejected?: number
    }
  }
  revenue?: {
    total?: number
  }
}

interface DealerItem {
  id: string
  userId?: string
  companyName?: string
  company?: string
  dealerType?: string
  registrationNo?: string | null
  registrationDocUrl?: string | null
  contactPerson?: string | null
  address?: string | null
  city?: string
  state?: string | null
  phone?: string | null
  whatsapp?: string | null
  description?: string | null
  verified?: boolean
  status: string
  totalListings?: number
  listings?: number
  rating?: number
  bankName?: string | null
  bankAccountNumber?: string | null
  bankAccountHolder?: string | null
  subscriptionTier?: string | null
  operatingHours?: string | null
  verifiedAt?: string | null
  rejectedAt?: string | null
  rejectionReason?: string | null
  createdAt?: string
  user?: { name?: string; email?: string; phone?: string | null; active?: boolean; createdAt?: string }
  _count?: { cars?: number; bookings?: number }
}

interface CarItem {
  id: string
  dealerId?: string
  userId?: string
  brand: string
  model: string
  year?: number
  color?: string | null
  mileage?: number | null
  fuelType?: string | null
  transmission?: string | null
  seats?: number | null
  condition?: string | null
  type: VehicleType | string
  price: number
  weeklyPrice?: number | null
  monthlyPrice?: number | null
  deposit?: number | null
  bookingFee?: number | null
  monthlyInstallment?: number | null
  remainingMonths?: number | null
  remainingBalance?: number | null
  takeoverAmount?: number | null
  bankName?: string | null
  auctionStartBid?: number | null
  auctionReserve?: number | null
  currentBid?: number | null
  auctionEnd?: string | null
  conditionCategory?: string | null
  runningStatus?: string | null
  salvageStatus?: string | null
  damageDescription?: string | null
  repairEstimate?: number | null
  auctionActive?: boolean
  location?: string | null
  city?: string | null
  state?: string | null
  description?: string | null
  features?: string | null
  status: string
  photos?: string
  dealer?: { id?: string; companyName: string; city?: string | null; verified: boolean; rating?: number; totalListings?: number }
  dealerName?: string
  dealerUser?: { name: string; email?: string }
  approvedAt?: string | null
  rejectedAt?: string | null
  rejectionReason?: string | null
  views?: number
  enquiries?: number
  createdAt?: string
  _count?: { bookings?: number; reviews?: number; auctionBids?: number; continueLoanEnquiries?: number }
}

interface PaginationState {
  total: number
  page: number
  limit: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
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
  receiptUrl?: string | null
  createdAt?: string
  booking?: {
    id?: string
    type?: string
    status?: string
    car?: { brand?: string; model?: string; year?: number }
  } | null
}

interface LoanItem {
  id: string
  user?: { name: string; email?: string; phone?: string | null; whatsapp?: string | null; address?: string | null; icNumber?: string | null }
  applicantName?: string
  car?: { brand: string; model: string }
  carName?: string
  bankName?: string
  bank?: string
  loanAmount?: number
  amount?: number
  tenure?: number | null
  monthlyIncome?: number | null
  employmentType?: string | null
  employerName?: string | null
  documents?: string | null
  payslipUrls?: string | null
  bankStatementUrls?: string | null
  epfStatementUrl?: string | null
  approvedAmount?: number | null
  approvedTenure?: number | null
  interestRate?: number | null
  monthlyRepayment?: number | null
  rejectionReason?: string | null
  reviewedAt?: string | null
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

function parseJsonObject(val: unknown): Record<string, unknown> {
  if (typeof val !== 'string') return {}
  try {
    const parsed = JSON.parse(val)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {}
  } catch {
    return {}
  }
}

function getFileName(url: string): string {
  return url.split('/').pop() || 'Document'
}

function asDisplayString(value: unknown): string {
  return typeof value === 'string' || typeof value === 'number' ? String(value) : ''
}

function getCarPhoto(car: CarItem): string {
  const photos = parseJsonField(car.photos)
  return photos[0] || ''
}

function getCarBrand(car: CarItem): string {
  return car.brand && car.model ? `${car.brand} ${car.model}` : car.brand || 'Unknown'
}

function normalizeAdminStats(data: AdminStats | AdminStatsResponse): AdminStats {
  if ('totalUsers' in data) return data as AdminStats

  const nested = data as AdminStatsResponse
  const pendingPayments = (nested.paymentBreakdown?.byStatus?.pending ?? 0) + (nested.paymentBreakdown?.byStatus?.uploaded ?? 0)

  return {
    totalUsers: nested.totals?.users ?? 0,
    totalDealers: nested.totals?.dealers ?? 0,
    totalCars: nested.totals?.cars ?? 0,
    totalRevenue: nested.revenue?.total ?? 0,
    totalPayments: nested.totals?.payments ?? 0,
    totalLoans: nested.totals?.loanApplications ?? 0,
    pendingDealers: nested.dealerVerification?.pending ?? 0,
    pendingCars: nested.carBreakdown?.byStatus?.pending ?? 0,
    pendingPayments,
    rejectedDealers: nested.dealerVerification?.rejected ?? 0,
    rejectedCars: nested.carBreakdown?.byStatus?.rejected ?? 0,
    rejectedPayments: nested.paymentBreakdown?.byStatus?.rejected ?? 0,
  }
}

function normalizeDealer(dealer: DealerItem): DealerItem {
  const status = dealer.rejectedAt ? 'rejected' : dealer.verified ? 'verified' : 'pending'

  return {
    ...dealer,
    status,
    totalListings: dealer.totalListings ?? dealer._count?.cars ?? dealer.listings ?? 0,
  }
}

function DetailItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-secondary/40 p-3">
      <p className="text-overline text-muted-foreground">{label}</p>
      <div className="mt-1 text-body-sm text-foreground break-words">{value || 'N/A'}</div>
    </div>
  )
}

function PaginationControls({
  pagination,
  onPageChange,
}: {
  pagination: PaginationState
  onPageChange: (page: number) => void
}) {
  if (pagination.totalPages <= 1) return null

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-border bg-card p-3">
      <p className="text-caption text-muted-foreground">
        Showing page <span className="text-foreground">{pagination.page}</span> of{' '}
        <span className="text-foreground">{pagination.totalPages}</span> ({pagination.total} total)
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={!pagination.hasPrev}
          onClick={() => onPageChange(pagination.page - 1)}
          className="border-border text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4 mr-1" /> Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={!pagination.hasNext}
          onClick={() => onPageChange(pagination.page + 1)}
          className="border-border text-muted-foreground hover:text-foreground"
        >
          Next <ChevronRight className="size-4 ml-1" />
        </Button>
      </div>
    </div>
  )
}

// ===== SIDEBAR CONFIG =====

const sidebarItems = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'dealers', label: 'Dealers', icon: Users },
  { id: 'cars', label: 'Cars', icon: Car },
  { id: 'bookings', label: 'Bookings', icon: CalendarCheck },
  { id: 'loans', label: 'Loans', icon: Banknote },
  { id: 'payments', label: 'Payments', icon: Wallet },
  // { id: 'disputes', label: 'Disputes', icon: AlertTriangle },
  // { id: 'fraud', label: 'Fraud', icon: ShieldAlert },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
] as const

type AdminTab = (typeof sidebarItems)[number]['id']

// ===== COMPONENT =====

export default function AdminDashboard() {
  const { user } = useAppStore()
  const logout = useAppStore((state) => state.logout)
  const router = useRouter()
  const userName = user?.name
  const [activeTab, setActiveTab] = useState<AdminTab>('overview')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [dealerFilter, setDealerFilter] = useState('all')
  const [dealerSearch, setDealerSearch] = useState('')
  const [debouncedDealerSearch, setDebouncedDealerSearch] = useState('')
  const [loanFilter, setLoanFilter] = useState('all')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [carStatusFilter, setCarStatusFilter] = useState('all')
  const [carSearch, setCarSearch] = useState('')
  const [debouncedCarSearch, setDebouncedCarSearch] = useState('')

  // API data states
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [dealers, setDealers] = useState<DealerItem[]>([])
  const [dealersLoading, setDealersLoading] = useState(true)
  const [dealerPage, setDealerPage] = useState(1)
  const [dealerPagination, setDealerPagination] = useState<PaginationState | null>(null)
  const [selectedDealer, setSelectedDealer] = useState<DealerItem | null>(null)
  const [cars, setCars] = useState<CarItem[]>([])
  const [carsLoading, setCarsLoading] = useState(true)
  const [carPage, setCarPage] = useState(1)
  const [carPagination, setCarPagination] = useState<PaginationState | null>(null)
  const [selectedCar, setSelectedCar] = useState<CarItem | null>(null)
  const [payments, setPayments] = useState<PaymentItem[]>([])
  const [paymentsLoading, setPaymentsLoading] = useState(true)
  const [paymentPage, setPaymentPage] = useState(1)
  const [paymentPagination, setPaymentPagination] = useState<PaginationState | null>(null)
  const [bookingPage, setBookingPage] = useState(1)
  const [bookingPagination, setBookingPagination] = useState<PaginationState | null>(null)
  const [loans, setLoans] = useState<LoanItem[]>([])
  const [loansLoading, setLoansLoading] = useState(true)
  const [selectedLoan, setSelectedLoan] = useState<LoanItem | null>(null)
  const [bookings, setBookings] = useState<BookingItem[]>([])
  const [bookingsLoading, setBookingsLoading] = useState(false)

  // Action states
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [rejectDialog, setRejectDialog] = useState<{ type: 'dealer' | 'car' | 'payment' | 'loan'; id: string } | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [approveCarDialog, setApproveCarDialog] = useState<{ id: string; carName: string; carType?: string } | null>(null)
  const [approveBookingFee, setApproveBookingFee] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedDealerSearch(dealerSearch.trim())
    }, 350)

    return () => clearTimeout(timer)
  }, [dealerSearch])

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedCarSearch(carSearch.trim())
    }, 350)

    return () => clearTimeout(timer)
  }, [carSearch])

  // Fetch stats
  const fetchStats = useCallback(async () => {
    setStatsLoading(true)
    try {
      const result = await adminApi.getStats()
      setStats(normalizeAdminStats((result.data ?? result) as AdminStats | AdminStatsResponse))
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
      const params: Record<string, string> = { page: String(dealerPage), limit: '10' }
      if (dealerFilter !== 'all') params.status = dealerFilter
      if (debouncedDealerSearch) params.search = debouncedDealerSearch
      const result = await adminApi.getDealers(params)
      setDealers(((result.data ?? []) as DealerItem[]).map(normalizeDealer))
      setDealerPagination(result.pagination ?? null)
    } catch {
      setDealers([])
      setDealerPagination(null)
    } finally {
      setDealersLoading(false)
    }
  }, [dealerFilter, debouncedDealerSearch, dealerPage])

  // Fetch cars
  const fetchCars = useCallback(async () => {
    setCarsLoading(true)
    try {
      const params: Record<string, string> = { page: String(carPage), limit: '10' }
      if (carStatusFilter !== 'all') params.status = carStatusFilter
      if (debouncedCarSearch) params.search = debouncedCarSearch
      const result = await adminApi.getCars(params)
      setCars((result.data ?? []) as CarItem[])
      setCarPagination(result.pagination ?? null)
    } catch {
      setCars([])
      setCarPagination(null)
    } finally {
      setCarsLoading(false)
    }
  }, [carStatusFilter, debouncedCarSearch, carPage])

  // Fetch payments
  const fetchPayments = useCallback(async () => {
    setPaymentsLoading(true)
    try {
      const params: Record<string, string> = { page: String(paymentPage), limit: '10' }
      if (paymentFilter !== 'all') params.status = paymentFilter
      const result = await adminApi.getPayments(params)
      setPayments((result.data ?? []) as PaymentItem[])
      setPaymentPagination(result.pagination ?? null)
    } catch {
      setPayments([])
      setPaymentPagination(null)
    } finally {
      setPaymentsLoading(false)
    }
  }, [paymentFilter, paymentPage])

  // Fetch loans
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

  // Fetch bookings
  const fetchBookings = useCallback(async () => {
    setBookingsLoading(true)
    try {
      const result = await bookingsApi.list({ page: String(bookingPage), limit: '10' })
      const data = result.data as { bookings?: BookingItem[] } | BookingItem[]
      setBookings(Array.isArray(data) ? data : (data?.bookings ?? []))
      setBookingPagination(result.pagination ?? null)
    } catch {
      // silent
      setBookingPagination(null)
    } finally {
      setBookingsLoading(false)
    }
  }, [bookingPage])

  useEffect(() => {
    queueMicrotask(() => { void fetchStats() })
  }, [fetchStats])

  useEffect(() => {
    if (activeTab === 'dealers') queueMicrotask(() => { void fetchDealers() })
  }, [activeTab, fetchDealers])

  useEffect(() => {
    if (activeTab === 'cars') queueMicrotask(() => { void fetchCars() })
  }, [activeTab, fetchCars])

  useEffect(() => {
    if (activeTab === 'payments') queueMicrotask(() => { void fetchPayments() })
  }, [activeTab, fetchPayments])

  useEffect(() => {
    if (activeTab === 'loans') queueMicrotask(() => { void fetchLoans() })
    if (activeTab === 'bookings') queueMicrotask(() => { void fetchBookings() })
  }, [activeTab, fetchLoans, fetchBookings])

  // Action handlers
  const handleVerifyDealer = async (dealerId: string, action: 'verify' | 'reject') => {
    setActionLoading(dealerId)
    try {
      await adminApi.verifyDealer(dealerId, action, action === 'reject' ? rejectReason : undefined)
      await fetchDealers()
      await fetchStats()
      if (selectedDealer?.id === dealerId) {
        setSelectedDealer({
          ...selectedDealer,
          verified: action === 'verify',
          status: action === 'verify' ? 'verified' : 'rejected',
          rejectedAt: action === 'reject' ? new Date().toISOString() : null,
          rejectionReason: action === 'reject' ? rejectReason : null,
        })
      }
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
      const fee = action === 'approve' && approveBookingFee ? Number(approveBookingFee) : undefined
      await adminApi.approveCar(carId, action, action === 'reject' ? rejectReason : undefined, fee)
      await fetchCars()
      await fetchStats()
      if (selectedCar?.id === carId) {
        setSelectedCar({
          ...selectedCar,
          status: action === 'approve' ? 'approved' : 'rejected',
          bookingFee: action === 'approve' && fee ? fee : selectedCar.bookingFee,
          approvedAt: action === 'approve' ? new Date().toISOString() : selectedCar.approvedAt,
          rejectedAt: action === 'reject' ? new Date().toISOString() : null,
          rejectionReason: action === 'reject' ? rejectReason : null,
        })
      }
      setApproveCarDialog(null)
      setApproveBookingFee('')
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

  const handleUpdateLoan = async (loanId: string, status: 'reviewing' | 'approved' | 'rejected' | 'disbursed') => {
    setActionLoading(loanId)
    try {
      const loan = selectedLoan || loans.find((item) => item.id === loanId)
      const payload: Record<string, unknown> = { status }
      if (status === 'approved') {
        payload.approvedAmount = loan?.approvedAmount || loan?.amount || loan?.loanAmount || 0
        payload.approvedTenure = loan?.approvedTenure || loan?.tenure || 60
        payload.interestRate = loan?.interestRate || 3.5
        payload.monthlyRepayment = loan?.monthlyRepayment || Math.round(((Number(payload.approvedAmount) || 0) * 1.035) / ((Number(payload.approvedTenure) || 60)))
        payload.bankName = loan?.bankName || loan?.bank || 'Partner Bank'
        payload.bankResponse = 'Approved by admin review'
      }
      if (status === 'rejected') payload.rejectionReason = rejectReason

      const result = await loansApi.update(loanId, payload)
      const updated = (result.data ?? null) as LoanItem | null
      await fetchLoans()
      await fetchStats()
      if (selectedLoan?.id === loanId && updated) setSelectedLoan({ ...selectedLoan, ...updated })
      setRejectDialog(null)
      setRejectReason('')
      toast.success(`Loan marked as ${status}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update loan')
    } finally {
      setActionLoading(null)
    }
  }

  const handleTabChange = (tab: AdminTab) => {
    setActiveTab(tab)
    setMobileSidebarOpen(false)
    setSelectedDealer(null)
    setSelectedCar(null)
    setSelectedLoan(null)
  }

  const renderDealerDetails = (dealer: DealerItem) => (
    <div className="space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        <div>
          <Button variant="ghost" onClick={() => setSelectedDealer(null)} className="mb-3 text-muted-foreground hover:text-gold">
            <ChevronLeft className="size-4 mr-1" /> Back to dealers
          </Button>
          <div className="flex items-center gap-3">
            <Avatar className="size-12 border border-gold/30">
              <AvatarFallback className="bg-gold/10 text-gold font-bold">
                {(dealer.companyName || dealer.company || 'D').charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="dash-heading-lg">{dealer.companyName || dealer.company}</h2>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <StatusBadge status={dealer.status} />
                <Badge variant="outline" className="border-border text-muted-foreground">{dealer.dealerType || 'dealer'}</Badge>
                <span className="text-caption text-muted-foreground">{dealer.city || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {dealer.status !== 'verified' && (
            <Button
              disabled={actionLoading === dealer.id}
              onClick={() => handleVerifyDealer(dealer.id, 'verify')}
              className="bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              {actionLoading === dealer.id ? <Loader2 className="size-4 animate-spin mr-1" /> : <CheckCircle className="size-4 mr-1" />}
              Verify Dealer
            </Button>
          )}
          {dealer.status !== 'rejected' && (
            <Button
              variant="outline"
              onClick={() => setRejectDialog({ type: 'dealer', id: dealer.id })}
              className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
            >
              <XCircle className="size-4 mr-1" /> Reject Dealer
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 bg-card border-border">
          <CardHeader>
            <CardTitle className="dash-heading-sm">Business Review</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <DetailItem label="Company" value={dealer.companyName || dealer.company} />
            <DetailItem label="Contact Person" value={dealer.contactPerson || dealer.user?.name} />
            <DetailItem label="Registration No." value={dealer.registrationNo} />
            <DetailItem label="Dealer Type" value={dealer.dealerType} />
            <DetailItem label="Phone" value={dealer.phone || dealer.user?.phone} />
            <DetailItem label="WhatsApp" value={dealer.whatsapp} />
            <DetailItem label="Email" value={dealer.user?.email} />
            <DetailItem label="Address" value={[dealer.address, dealer.city, dealer.state].filter(Boolean).join(', ')} />
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="dash-heading-sm">Platform Signals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <DetailItem label="Rating" value={dealer.rating?.toFixed(1) || 'N/A'} />
            <DetailItem label="Listings" value={dealer.totalListings ?? 0} />
            <DetailItem label="Bookings" value={dealer._count?.bookings ?? 0} />
            <DetailItem label="Joined" value={dealer.createdAt ? formatDate(dealer.createdAt) : 'N/A'} />
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="dash-heading-sm">Registration Documents</CardTitle>
        </CardHeader>
        <CardContent>
          {dealer.registrationDocUrl ? (
            <a href={dealer.registrationDocUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="border-border text-muted-foreground hover:text-gold">
                <FileText className="size-4 mr-2" />
                View SSM / Registration Document
              </Button>
            </a>
          ) : (
            <p className="text-body-sm text-muted-foreground">No registration document uploaded.</p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="dash-heading-sm">Bank & Payout Details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <DetailItem label="Bank Name" value={dealer.bankName} />
            <DetailItem label="Account Holder" value={dealer.bankAccountHolder} />
            <DetailItem label="Account Number" value={dealer.bankAccountNumber} />
            <DetailItem label="Subscription" value={dealer.subscriptionTier || 'basic'} />
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="dash-heading-sm">Verification Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <DetailItem label="Verified At" value={dealer.verifiedAt ? formatDate(dealer.verifiedAt) : 'Not verified'} />
            <DetailItem label="Rejected At" value={dealer.rejectedAt ? formatDate(dealer.rejectedAt) : 'Not rejected'} />
            <DetailItem label="Rejection Reason" value={dealer.rejectionReason || 'None'} />
          </CardContent>
        </Card>
      </div>
    </div>
  )

  const renderCarDetails = (car: CarItem) => {
    const photos = parseJsonField(car.photos)
    const features = parseJsonField(car.features)

    return (
      <div className="space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div>
            <Button variant="ghost" onClick={() => setSelectedCar(null)} className="mb-3 text-muted-foreground hover:text-gold">
              <ChevronLeft className="size-4 mr-1" /> Back to cars
            </Button>
            <h2 className="dash-heading-lg">{getCarBrand(car)} {car.year ? `(${car.year})` : ''}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <VehicleTypeBadge type={car.type} />
              <StatusBadge status={car.status} />
              <span className="text-caption text-muted-foreground">{car.dealer?.companyName || car.dealerName || 'Unknown dealer'}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {car.status !== 'approved' && (
              <Button
                disabled={actionLoading === car.id}
                onClick={() => setApproveCarDialog({ id: car.id, carName: `${car.brand} ${car.model} ${car.year ?? ''}`.trim(), carType: car.type })}
                className="bg-emerald-500 hover:bg-emerald-600 text-white"
              >
                <CheckCircle className="size-4 mr-1" />
                Approve Car
              </Button>
            )}
            {car.status !== 'rejected' && (
              <Button
                variant="outline"
                onClick={() => setRejectDialog({ type: 'car', id: car.id })}
                className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
              >
                <XCircle className="size-4 mr-1" /> Reject Car
              </Button>
            )}
          </div>
        </div>

        <Card className="bg-card border-border overflow-hidden">
          <CardContent className="p-0">
            <div className="grid grid-cols-1 lg:grid-cols-[1.25fr_0.75fr]">
              <div className="bg-secondary/40">
                {photos[0] ? (
                  <img src={photos[0]} alt={getCarBrand(car)} className="h-72 w-full object-cover" />
                ) : (
                  <div className="h-72 flex items-center justify-center">
                    <Car className="size-12 text-muted-foreground/30" />
                  </div>
                )}
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <p className="text-overline text-muted-foreground">Listed Price</p>
                  <p className="dash-heading-lg text-gold">{formatPrice(car.price ?? 0, car.type)}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <DetailItem label="Views" value={car.views ?? 0} />
                  <DetailItem label="Enquiries" value={car.enquiries ?? 0} />
                  <DetailItem label="Bookings" value={car._count?.bookings ?? 0} />
                  <DetailItem label="Reviews" value={car._count?.reviews ?? 0} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2 bg-card border-border">
            <CardHeader>
              <CardTitle className="dash-heading-sm">Vehicle Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <DetailItem label="Brand" value={car.brand} />
              <DetailItem label="Model" value={car.model} />
              <DetailItem label="Year" value={car.year} />
              <DetailItem label="Color" value={car.color} />
              <DetailItem label="Mileage" value={car.mileage ? `${car.mileage.toLocaleString()} km` : 'N/A'} />
              <DetailItem label="Fuel" value={car.fuelType} />
              <DetailItem label="Transmission" value={car.transmission} />
              <DetailItem label="Seats" value={car.seats} />
              <DetailItem label="Condition" value={car.condition || car.conditionCategory} />
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="dash-heading-sm">Dealer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <DetailItem label="Company" value={car.dealer?.companyName || car.dealerName} />
              <DetailItem label="Dealer Contact" value={car.dealerUser?.name} />
              <DetailItem label="Email" value={car.dealerUser?.email} />
              <DetailItem label="Verified" value={car.dealer?.verified ? 'Yes' : 'No'} />
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="dash-heading-sm">Pricing & Module Fields</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <DetailItem label="Weekly Price" value={car.weeklyPrice ? formatPrice(car.weeklyPrice) : 'N/A'} />
              <DetailItem label="Monthly Price" value={car.monthlyPrice ? formatPrice(car.monthlyPrice) : 'N/A'} />
              <DetailItem label="Deposit" value={car.deposit ? formatPrice(car.deposit) : 'N/A'} />
              <DetailItem label="Booking Fee" value={car.bookingFee ? formatPrice(car.bookingFee) : 'N/A'} />
              <DetailItem label="Auction Start Bid" value={car.auctionStartBid ? formatPrice(car.auctionStartBid) : 'N/A'} />
              <DetailItem label="Auction Reserve" value={car.auctionReserve ? formatPrice(car.auctionReserve) : 'N/A'} />
              <DetailItem label="Current Bid" value={car.currentBid ? formatPrice(car.currentBid) : 'N/A'} />
              <DetailItem label="Auction End" value={car.auctionEnd ? formatDate(car.auctionEnd) : 'N/A'} />
              <DetailItem label="Auction Active" value={car.auctionActive ? 'Yes' : 'No'} />
              <DetailItem label="Condition Category" value={car.conditionCategory || 'N/A'} />
              <DetailItem label="Running Status" value={car.runningStatus || 'N/A'} />
              <DetailItem label="Salvage Status" value={car.salvageStatus || 'N/A'} />
              <DetailItem label="Repair Estimate" value={car.repairEstimate ? formatPrice(car.repairEstimate) : 'N/A'} />
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="dash-heading-sm">Moderation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <DetailItem label="Submitted" value={car.createdAt ? formatDate(car.createdAt) : 'N/A'} />
              <DetailItem label="Approved At" value={car.approvedAt ? formatDate(car.approvedAt) : 'Not approved'} />
              <DetailItem label="Rejected At" value={car.rejectedAt ? formatDate(car.rejectedAt) : 'Not rejected'} />
              <DetailItem label="Rejection Reason" value={car.rejectionReason || 'None'} />
            </CardContent>
          </Card>
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="dash-heading-sm">Description & Review Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-body-sm text-muted-foreground leading-relaxed">{car.description || 'No description provided.'}</p>
            {car.damageDescription && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
                <p className="text-overline text-red-400 mb-1">Damage Description</p>
                <p className="text-body-sm text-muted-foreground">{car.damageDescription}</p>
              </div>
            )}
            {features.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {features.map((feature) => (
                  <Badge key={feature} variant="outline" className="border-border text-muted-foreground">{feature}</Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderLoanDetails = (loan: LoanItem) => {
    const documents = parseJsonObject(loan.documents)
    const vehicle = parseJsonObject(documents.vehicle)
    const applicant = parseJsonObject(documents.applicant)
    const fileMap = parseJsonObject(documents.files)
    const documentLinks = [
      ...parseJsonField(loan.payslipUrls).map((url, index) => ({ label: `Payslip ${index + 1}`, url })),
      ...parseJsonField(loan.bankStatementUrls).map((url, index) => ({ label: `Bank Statement ${index + 1}`, url })),
      ...(loan.epfStatementUrl ? [{ label: 'EPF Statement', url: loan.epfStatementUrl }] : []),
      ...Object.entries(fileMap)
        .filter((entry): entry is [string, string] => typeof entry[1] === 'string' && Boolean(entry[1]))
        .map(([key, url]) => ({ label: key.replace(/([A-Z])/g, ' $1').replace(/\b\w/g, (char) => char.toUpperCase()), url })),
    ]

    return (
      <div className="space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div>
            <Button variant="ghost" onClick={() => setSelectedLoan(null)} className="mb-3 text-muted-foreground hover:text-gold">
              <ChevronLeft className="size-4 mr-1" /> Back to loans
            </Button>
            <h2 className="dash-heading-lg">Loan Application</h2>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StatusBadge status={loan.status} />
              <Badge variant="outline" className="border-border text-muted-foreground">{loan.id.slice(0, 8)}</Badge>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {loan.status === 'pending' && (
              <Button onClick={() => handleUpdateLoan(loan.id, 'reviewing')} disabled={actionLoading === loan.id} className="bg-yellow-500 hover:bg-yellow-600 text-black">
                {actionLoading === loan.id ? <Loader2 className="size-4 animate-spin mr-1" /> : <Clock className="size-4 mr-1" />} Mark Reviewing
              </Button>
            )}
            {loan.status !== 'approved' && loan.status !== 'disbursed' && (
              <Button onClick={() => handleUpdateLoan(loan.id, 'approved')} disabled={actionLoading === loan.id} className="bg-emerald-500 hover:bg-emerald-600 text-white">
                <CheckCircle className="size-4 mr-1" /> Approve
              </Button>
            )}
            {loan.status === 'approved' && (
              <Button onClick={() => handleUpdateLoan(loan.id, 'disbursed')} disabled={actionLoading === loan.id} className="bg-gold hover:bg-gold-dark text-primary-foreground">
                <Banknote className="size-4 mr-1" /> Mark Disbursed
              </Button>
            )}
            {loan.status !== 'rejected' && (
              <Button variant="outline" onClick={() => setRejectDialog({ type: 'loan', id: loan.id })} className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300">
                <XCircle className="size-4 mr-1" /> Reject
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2 bg-card border-border">
            <CardHeader><CardTitle className="dash-heading-sm">Applicant & Vehicle</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <DetailItem label="Applicant" value={loan.user?.name || asDisplayString(applicant.fullName) || loan.applicantName} />
              <DetailItem label="Email" value={loan.user?.email || asDisplayString(applicant.email)} />
              <DetailItem label="Phone" value={loan.user?.phone || asDisplayString(applicant.phone)} />
              <DetailItem label="IC Number" value={loan.user?.icNumber || asDisplayString(applicant.icNumber)} />
              <DetailItem label="Vehicle" value={loan.car ? `${loan.car.brand} ${loan.car.model}` : `${asDisplayString(vehicle.brand) || 'N/A'} ${asDisplayString(vehicle.model)}`} />
              <DetailItem label="Vehicle Year" value={asDisplayString(vehicle.year) || 'N/A'} />
              <DetailItem label="Requested Amount" value={formatPrice(loan.loanAmount ?? loan.amount ?? 0)} />
              <DetailItem label="Tenure" value={loan.tenure ? `${loan.tenure} months` : 'N/A'} />
              <DetailItem label="Monthly Income" value={loan.monthlyIncome ? formatPrice(loan.monthlyIncome) : 'N/A'} />
              <DetailItem label="Employment" value={[loan.employmentType, loan.employerName].filter(Boolean).join(' - ')} />
              <DetailItem label="Preferred Bank" value={loan.bankName || loan.bank} />
              <DetailItem label="Submitted" value={loan.createdAt ? formatDate(loan.createdAt) : 'N/A'} />
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader><CardTitle className="dash-heading-sm">Decision</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <DetailItem label="Approved Amount" value={loan.approvedAmount ? formatPrice(loan.approvedAmount) : 'N/A'} />
              <DetailItem label="Approved Tenure" value={loan.approvedTenure ? `${loan.approvedTenure} months` : 'N/A'} />
              <DetailItem label="Interest Rate" value={loan.interestRate ? `${loan.interestRate}%` : 'N/A'} />
              <DetailItem label="Monthly Repayment" value={loan.monthlyRepayment ? formatPrice(loan.monthlyRepayment) : 'N/A'} />
              <DetailItem label="Reviewed At" value={loan.reviewedAt ? formatDate(loan.reviewedAt) : 'Not reviewed'} />
              <DetailItem label="Rejection Reason" value={loan.rejectionReason || 'None'} />
            </CardContent>
          </Card>
        </div>

        <Card className="bg-card border-border">
          <CardHeader><CardTitle className="dash-heading-sm">Uploaded Documents</CardTitle></CardHeader>
          <CardContent>
            {documentLinks.length === 0 ? (
              <p className="text-body-sm text-muted-foreground">No documents uploaded.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {documentLinks.map((doc) => (
                  <a key={`${doc.label}-${doc.url}`} href={doc.url} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-border bg-secondary/40 p-3 hover:border-gold/40 transition-colors">
                    <FileText className="size-5 text-gold mb-2" />
                    <p className="text-body-sm text-foreground">{doc.label}</p>
                    <p className="text-caption text-muted-foreground truncate">{getFileName(doc.url)}</p>
                  </a>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // ===== RENDER =====
  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Sidebar - Desktop */}
      <aside className={`hidden lg:flex sticky top-0 h-screen shrink-0 flex-col overflow-y-auto border-r border-border bg-sidebar transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-60'}`}>
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
        {!sidebarCollapsed && (
          <div className="p-4 border-t border-border space-y-2">
            <Button variant="ghost" onClick={() => router.push('/')} className="w-full text-muted-foreground hover:text-gold hover:bg-gold/10 text-sm">
              <ChevronLeft className="size-4 mr-1" />
              Back to Site
            </Button>
            <Button variant="ghost" onClick={() => { logout(); router.push('/') }} className="w-full text-red-400/80 hover:text-red-400 hover:bg-red-500/10 text-sm">
              <LogOut className="size-4 mr-1" />
              Sign Out
            </Button>
          </div>
        )}
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60 cursor-pointer" onClick={() => setMobileSidebarOpen(false)} />
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
            <div className="p-4 border-t border-border space-y-2">
              <Button variant="ghost" onClick={() => { setMobileSidebarOpen(false); router.push('/') }} className="w-full text-muted-foreground hover:text-gold hover:bg-gold/10 text-sm">
                <ChevronLeft className="size-4 mr-1" />
                Back to Site
              </Button>
              <Button variant="ghost" onClick={() => { logout(); router.push('/') }} className="w-full text-red-400/80 hover:text-red-400 hover:bg-red-500/10 text-sm">
                <LogOut className="size-4 mr-1" />
                Sign Out
              </Button>
            </div>
          </aside>
        </div>
      )}

      {/* Approve Car Dialog */}
      {approveCarDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <Card className="bg-card border-border w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="dash-heading-sm flex items-center gap-2">
                <CheckCircle className="size-5 text-emerald-400" />
                Approve Car Listing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-body-sm text-muted-foreground">{approveCarDialog.carName}</p>
              <div className="space-y-2">
                <label className="text-caption text-muted-foreground">{getFeeLabel(approveCarDialog.carType ?? 'sale')} (RM) <span className="text-muted-foreground/50">— leave blank for none</span></label>
                <Input
                  type="number"
                  min="0"
                  value={approveBookingFee}
                  onChange={(e) => setApproveBookingFee(e.target.value)}
                  placeholder="e.g. 200"
                  className="bg-secondary border-border text-foreground placeholder:text-muted-foreground/50 focus-visible:border-gold"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => handleApproveCar(approveCarDialog.id, 'approve')}
                  disabled={actionLoading !== null}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold flex-1"
                >
                  {actionLoading ? <Loader2 className="size-4 animate-spin mr-1" /> : null}
                  Approve
                </Button>
                <Button
                  variant="outline"
                  onClick={() => { setApproveCarDialog(null); setApproveBookingFee('') }}
                  className="border-border text-muted-foreground hover:text-foreground flex-1"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Reject Reason Dialog */}
      {rejectDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <Card className="bg-card border-border w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="dash-heading-sm flex items-center gap-2">
                <XCircle className="size-5 text-red-400" />
                Reject {rejectDialog.type === 'dealer' ? 'Dealer' : rejectDialog.type === 'car' ? 'Car' : rejectDialog.type === 'loan' ? 'Loan' : 'Payment'}
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
                    else if (rejectDialog.type === 'loan') handleUpdateLoan(rejectDialog.id, 'rejected')
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
              <h1 className="dash-heading-sm">{sidebarItems.find((i) => i.id === activeTab)?.label || 'Dashboard'}</h1>
            </div>
            <div className="flex items-center gap-3">
              <NotificationDropdown />
              <Separator orientation="vertical" className="h-6 bg-border" />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2">
                    <Avatar className="size-8 border border-red-500/30">
                      <AvatarFallback className="bg-red-500/10 text-red-400 text-xs font-bold">
                        {userName?.charAt(0) || 'A'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden sm:flex flex-col items-start">
                      <span className="text-body-sm font-medium">{userName || 'Admin'}</span>
                      <span className="text-overline text-red-400 font-medium">Super Admin</span>
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => { logout(); router.push('/') }} className="cursor-pointer">
                    <LogOut className="size-4 mr-2" />Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
          {selectedLoan ? (
            renderLoanDetails(selectedLoan)
          ) : (
            <>

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
                          <div className="dash-heading-md">{stat.value}</div>
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
                    <CardTitle className="dash-heading-sm">Platform Overview</CardTitle>
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
                            <div className="dash-heading-md">{item.value}</div>
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
                    <CardTitle className="dash-heading-sm">Platform Status</CardTitle>
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
                          <p className={`dash-heading-md ${alert.textColor}`}>{alert.value}</p>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}

          {/* ===== DEALERS ===== */}
          {activeTab === 'dealers' && selectedDealer && renderDealerDetails(selectedDealer)}

          {activeTab === 'dealers' && !selectedDealer && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2 flex-1 max-w-md">
                  <Search className="size-4 text-muted-foreground shrink-0" />
                  <Input
                    value={dealerSearch}
                    onChange={(e) => {
                      setDealerSearch(e.target.value)
                      setDealerPage(1)
                    }}
                    placeholder="Search dealers..."
                    className="bg-secondary border-border text-foreground placeholder:text-muted-foreground/50 focus-visible:border-gold"
                  />
                </div>
                <Tabs value={dealerFilter} onValueChange={(value) => {
                  setDealerFilter(value)
                  setDealerPage(1)
                }}>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i} className="bg-card border-border animate-pulse">
                      <CardContent className="p-4 space-y-3">
                        <div className="h-5 bg-secondary rounded w-3/4" />
                        <div className="h-4 bg-secondary rounded w-1/2" />
                        <div className="h-4 bg-secondary rounded w-2/3" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
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
                              <th className="text-left py-3 px-4 text-muted-foreground font-medium">ID</th>
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
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-1.5">
                                    <code className="text-caption text-muted-foreground bg-secondary px-1.5 py-0.5 rounded font-mono">
                                      {dealer.id.slice(0, 8)}
                                    </code>
                                     <button
                                       onClick={() => { navigator.clipboard.writeText(dealer.id); toast.success('ID copied!') }}
                                       className="text-muted-foreground hover:text-gold transition-colors cursor-pointer"
                                       title="Copy full ID"
                                     >
                                       <Copy className="size-3" />
                                     </button>
                                  </div>
                                </td>
                                <td className="py-3 px-4 font-medium">{dealer.companyName || dealer.company}</td>
                                <td className="py-3 px-4 text-muted-foreground">{dealer.city}</td>
                                <td className="py-3 px-4"><StatusBadge status={dealer.verified ? 'verified' : dealer.status || 'pending'} /></td>
                                <td className="py-3 px-4">{dealer.totalListings || dealer.listings || 0}</td>
                                <td className="py-3 px-4 text-gold font-medium">{dealer.rating?.toFixed(1) || 'N/A'}</td>
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setSelectedDealer(dealer)}
                                      className="h-7 text-muted-foreground hover:text-gold text-xs"
                                    >
                                      <Eye className="size-3.5 mr-1" />View
                                    </Button>
                                    {dealer.status !== 'verified' && (
                                      <Button variant="ghost" size="sm" className="h-7 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 text-xs"
                                        disabled={actionLoading === dealer.id} onClick={() => handleVerifyDealer(dealer.id, 'verify')}>
                                        {actionLoading === dealer.id ? <Loader2 className="size-3.5 mr-1 animate-spin" /> : <CheckCircle className="size-3.5 mr-1" />}
                                        Verify
                                      </Button>
                                    )}
                                    {dealer.status !== 'rejected' && (
                                      <Button variant="ghost" size="sm" className="h-7 text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs"
                                        onClick={() => setRejectDialog({ type: 'dealer', id: dealer.id })}>
                                        <XCircle className="size-3.5 mr-1" />Reject
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
                          <div className="flex items-center gap-2 mt-3 flex-wrap">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedDealer(dealer)}
                              className="text-muted-foreground hover:text-gold text-xs"
                            >
                              <Eye className="size-3.5 mr-1" />View
                            </Button>
                            {dealer.status !== 'verified' && (
                              <Button variant="ghost" size="sm" className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 text-xs"
                                disabled={actionLoading === dealer.id} onClick={() => handleVerifyDealer(dealer.id, 'verify')}>
                                <CheckCircle className="size-3.5 mr-1" />Verify
                              </Button>
                            )}
                            {dealer.status !== 'rejected' && (
                              <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs"
                                onClick={() => setRejectDialog({ type: 'dealer', id: dealer.id })}>
                                <XCircle className="size-3.5 mr-1" />Reject
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  {dealerPagination && (
                    <PaginationControls pagination={dealerPagination} onPageChange={setDealerPage} />
                  )}
                </>
              )}
            </div>
          )}

          {/* ===== CARS ===== */}
          {activeTab === 'cars' && selectedCar && renderCarDetails(selectedCar)}

          {activeTab === 'cars' && !selectedCar && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2 flex-1 max-w-md">
                  <Search className="size-4 text-muted-foreground shrink-0" />
                  <Input
                    value={carSearch}
                    onChange={(e) => {
                      setCarSearch(e.target.value)
                      setCarPage(1)
                    }}
                    placeholder="Search cars, dealers, city..."
                    className="bg-secondary border-border text-foreground placeholder:text-muted-foreground/50 focus-visible:border-gold"
                  />
                </div>
                <Tabs value={carStatusFilter} onValueChange={(value) => {
                  setCarStatusFilter(value)
                  setCarPage(1)
                }}>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i} className="bg-card border-border animate-pulse">
                      <CardContent className="p-4 space-y-3">
                        <div className="h-14 bg-secondary rounded w-20" />
                        <div className="h-5 bg-secondary rounded w-3/4" />
                        <div className="h-4 bg-secondary rounded w-1/2" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
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
                              <th className="text-left py-3 px-4 text-muted-foreground font-medium">ID</th>
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
                                    <div className="flex items-center gap-1.5">
                                      <code className="text-caption text-muted-foreground bg-secondary px-1.5 py-0.5 rounded font-mono">
                                        {car.id.slice(0, 8)}
                                      </code>
                                      <button
                                         onClick={() => { navigator.clipboard.writeText(car.id); toast.success('ID copied!') }}
                                         className="text-muted-foreground hover:text-gold transition-colors cursor-pointer"
                                         title="Copy full ID"
                                       >
                                         <Copy className="size-3" />
                                       </button>
                                    </div>
                                  </td>
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
                                    <div className="flex items-center gap-1">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setSelectedCar(car)}
                                        className="h-7 text-muted-foreground hover:text-gold text-xs"
                                      >
                                        <Eye className="size-3.5 mr-1" />View
                                      </Button>
                                      {car.status !== 'approved' && (
                                        <Button variant="ghost" size="sm" className="h-7 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 text-xs"
                                          disabled={actionLoading === car.id} onClick={() => setApproveCarDialog({ id: car.id, carName: `${car.brand} ${car.model} ${car.year ?? ''}`.trim(), carType: car.type })}>
                                          <CheckCircle className="size-3.5 mr-1" />
                                          Approve
                                        </Button>
                                      )}
                                      {car.status !== 'rejected' && (
                                        <Button variant="ghost" size="sm" className="h-7 text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs"
                                          onClick={() => setRejectDialog({ type: 'car', id: car.id })}>
                                          <XCircle className="size-3.5 mr-1" />Reject
                                        </Button>
                                      )}
                                    </div>
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
                                <div className="flex items-center gap-2 mt-2 flex-wrap">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedCar(car)}
                                    className="text-muted-foreground hover:text-gold text-xs h-7"
                                  >
                                    <Eye className="size-3.5 mr-1" />View
                                  </Button>
                                  {car.status !== 'approved' && (
                                    <Button variant="ghost" size="sm" className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 text-xs h-7"
                                      disabled={actionLoading === car.id} onClick={() => setApproveCarDialog({ id: car.id, carName: `${car.brand} ${car.model} ${car.year ?? ''}`.trim(), carType: car.type })}>
                                      <CheckCircle className="size-3.5 mr-1" />Approve
                                    </Button>
                                  )}
                                  {car.status !== 'rejected' && (
                                    <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs h-7"
                                      onClick={() => setRejectDialog({ type: 'car', id: car.id })}>
                                      <XCircle className="size-3.5 mr-1" />Reject
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                  {carPagination && (
                    <PaginationControls pagination={carPagination} onPageChange={setCarPage} />
                  )}
                </>
              )}
            </div>
          )}

          {/* ===== BOOKINGS ===== */}
          {activeTab === 'bookings' && (
            <div className="space-y-4">
              {bookingsLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i} className="bg-card border-border animate-pulse">
                      <CardContent className="p-4 space-y-3">
                        <div className="h-5 bg-secondary rounded w-3/4" />
                        <div className="h-4 bg-secondary rounded w-1/2" />
                        <div className="h-4 bg-secondary rounded w-2/3" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
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
              {bookingPagination && (
                <PaginationControls pagination={bookingPagination} onPageChange={setBookingPage} />
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
                    {['all', 'pending', 'reviewing', 'approved', 'rejected'].map((status) => (
                      <TabsTrigger key={status} value={status} className="text-xs data-[state=active]:bg-gold data-[state=active]:text-primary-foreground">
                        {status === 'all' ? 'All' : status === 'underReview' ? 'Under Review' : status.charAt(0).toUpperCase() + status.slice(1)}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>
              </Tabs>

              {loansLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i} className="bg-card border-border animate-pulse">
                      <CardContent className="p-4 space-y-3">
                        <div className="h-5 bg-secondary rounded w-3/4" />
                        <div className="h-4 bg-secondary rounded w-1/2" />
                        <div className="h-4 bg-secondary rounded w-2/3" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
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
                              <th className="text-left py-3 px-4 text-muted-foreground font-medium">ID</th>
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
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-1.5">
                                    <code className="text-caption text-muted-foreground bg-secondary px-1.5 py-0.5 rounded font-mono">
                                      {loan.id.slice(0, 8)}
                                    </code>
                                     <button
                                       onClick={() => { navigator.clipboard.writeText(loan.id); toast.success('ID copied!') }}
                                       className="text-muted-foreground hover:text-gold transition-colors cursor-pointer"
                                       title="Copy full ID"
                                     >
                                       <Copy className="size-3" />
                                     </button>
                                  </div>
                                </td>
                                <td className="py-3 px-4 font-medium">{loan.user?.name || loan.applicantName || 'N/A'}</td>
                                <td className="py-3 px-4 text-muted-foreground">{loan.car?.brand} {loan.car?.model || loan.carName || 'N/A'}</td>
                                <td className="py-3 px-4 text-muted-foreground">{loan.bankName || loan.bank || 'N/A'}</td>
                                <td className="py-3 px-4 font-medium text-gold">{formatPrice(loan.loanAmount ?? loan.amount ?? 0)}</td>
                                <td className="py-3 px-4"><StatusBadge status={loan.status} /></td>
                                <td className="py-3 px-4 text-muted-foreground">{loan.createdAt ? formatDate(loan.createdAt) : 'N/A'}</td>
                                <td className="py-3 px-4">
                                  <Button variant="ghost" size="sm" onClick={() => setSelectedLoan(loan)} className="h-7 text-muted-foreground hover:text-gold text-xs">
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
                          <Button variant="outline" size="sm" onClick={() => setSelectedLoan(loan)} className="mt-4 w-full border-border text-muted-foreground hover:text-gold">
                            <Eye className="size-3.5 mr-1" /> View Application
                          </Button>
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
                      <div className="dash-heading-sm text-gold mt-1">{stat.value}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Tabs value={paymentFilter} onValueChange={setPaymentFilter}>
                <div className="flex items-center gap-2 flex-wrap">
                  <Filter className="size-4 text-muted-foreground" />
                  <TabsList className="bg-secondary">
                    {['all', 'pending', 'uploaded', 'verified', 'rejected'].map((status) => (
                      <TabsTrigger key={status} value={status} className="text-xs data-[state=active]:bg-gold data-[state=active]:text-primary-foreground">
                        {status === 'all' ? 'All Status' : status.charAt(0).toUpperCase() + status.slice(1)}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>
              </Tabs>

              {paymentsLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i} className="bg-card border-border animate-pulse">
                      <CardContent className="p-4 space-y-3">
                        <div className="h-5 bg-secondary rounded w-3/4" />
                        <div className="h-4 bg-secondary rounded w-1/2" />
                        <div className="h-4 bg-secondary rounded w-2/3" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
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
                              <th className="text-left py-3 px-4 text-muted-foreground font-medium">ID</th>
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
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-1.5">
                                    <code className="text-caption text-muted-foreground bg-secondary px-1.5 py-0.5 rounded font-mono">
                                      {txn.id.slice(0, 8)}
                                    </code>
                                     <button
                                       onClick={() => { navigator.clipboard.writeText(txn.id); toast.success('ID copied!') }}
                                       className="text-muted-foreground hover:text-gold transition-colors cursor-pointer"
                                       title="Copy full ID"
                                     >
                                       <Copy className="size-3" />
                                     </button>
                                  </div>
                                </td>
                                <td className="py-3 px-4">{txn.user?.name || txn.userName || 'N/A'}</td>
                                <td className="py-3 px-4 text-muted-foreground">
                                  <div>{txn.dealer?.companyName || txn.dealerName || 'N/A'}</div>
                                  {txn.booking?.car && (
                                    <div className="text-caption text-muted-foreground/70">
                                      {txn.booking.car.brand} {txn.booking.car.model} {txn.booking.type ? `(${txn.booking.type})` : ''}
                                    </div>
                                  )}
                                </td>
                                <td className="py-3 px-4 font-medium text-gold">{formatPrice(txn.amount ?? 0)}</td>
                                <td className="py-3 px-4">
                                  <Badge variant="outline" className="border-border text-muted-foreground text-xs">{txn.paymentMethod || txn.method || 'N/A'}</Badge>
                                </td>
                                <td className="py-3 px-4"><StatusBadge status={txn.status} /></td>
                                <td className="py-3 px-4 text-muted-foreground">{txn.createdAt ? formatDate(txn.createdAt) : 'N/A'}</td>
                                <td className="py-3 px-4">
                                  {txn.status === 'uploaded' ? (
                                    <div className="flex items-center gap-1">
                                      {txn.receiptUrl && (
                                        <Button variant="ghost" size="sm" className="h-7 text-muted-foreground hover:text-gold text-xs" asChild>
                                          <a href={txn.receiptUrl} target="_blank" rel="noopener noreferrer">
                                            <FileText className="size-3.5 mr-1" />Receipt
                                          </a>
                                        </Button>
                                      )}
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
                                  ) : txn.status === 'pending' ? (
                                    <span className="text-caption text-muted-foreground">Awaiting customer receipt</span>
                                  ) : (
                                    txn.receiptUrl ? (
                                      <Button variant="ghost" size="sm" className="h-7 text-muted-foreground hover:text-gold text-xs" asChild>
                                        <a href={txn.receiptUrl} target="_blank" rel="noopener noreferrer">
                                          <Eye className="size-3.5 mr-1" />View Receipt
                                        </a>
                                      </Button>
                                    ) : (
                                      <span className="text-caption text-muted-foreground">No receipt</span>
                                    )
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
                          {txn.booking?.car && (
                            <p className="text-caption text-muted-foreground mt-2">
                              {txn.booking.car.brand} {txn.booking.car.model} {txn.booking.type ? `(${txn.booking.type})` : ''}
                            </p>
                          )}
                          {txn.status === 'uploaded' && (
                            <div className="flex items-center gap-2 mt-3">
                              {txn.receiptUrl && (
                                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-gold text-xs h-7" asChild>
                                  <a href={txn.receiptUrl} target="_blank" rel="noopener noreferrer">
                                    <FileText className="size-3.5 mr-1" />Receipt
                                  </a>
                                </Button>
                              )}
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
                          {txn.status === 'pending' && (
                            <p className="text-caption text-muted-foreground mt-3">Awaiting customer receipt.</p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  {paymentPagination && (
                    <PaginationControls pagination={paymentPagination} onPageChange={setPaymentPage} />
                  )}
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
                  <CardTitle className="dash-heading-sm">Platform Statistics</CardTitle>
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
                        <p className="dash-heading-sm text-gold mt-1">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="dash-heading-sm">Top Dealers</CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-2 space-y-3">
                  {dealersLoading ? (
                    <div className="space-y-3">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-3 py-2 animate-pulse">
                          <div className="h-5 w-6 bg-secondary rounded" />
                          <div className="space-y-2 flex-1">
                            <div className="h-4 bg-secondary rounded w-1/2" />
                            <div className="h-3 bg-secondary rounded w-1/3" />
                          </div>
                        </div>
                      ))}
                    </div>
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
                  <CardTitle className="dash-heading-sm">Platform Settings</CardTitle>
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
            </>
          )}
        </main>
      </div>
    </div>
  )
}
