'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/lib/store'
import { dealerApi, carsApi, bookingsApi, uploadApi } from '@/lib/api'
import {
  formatPrice,
  formatDate,
  VEHICLE_TYPE_CONFIG,
  CONDITION_CATEGORIES,
  RUNNING_STATUS,
  SALVAGE_STATUS,
  type VehicleType,
} from '@/lib/constants'
import {
  LoadingState,
  EmptyState,
  StatusBadge,
  VehicleTypeBadge,
  NotificationDropdown,
} from '@/components/shared'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { toast } from 'sonner'
import {
  LayoutDashboard,
  Car,
  PlusCircle,
  CalendarCheck,
  MessageSquare,
  BarChart3,
  Wallet,
  Settings,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Star,
  Edit,
  Trash2,
  StarOff,
  Upload,
  X,
  CheckCircle,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Menu,
  Phone,
  ImagePlus,
  MapPin,
  Truck,
  AlertTriangle,
  Gavel,
  Handshake,
  Loader2,
  MoreVertical,
  LogOut,
} from 'lucide-react'

// ===== TYPES =====

interface DealerStats {
  listings?: { total: number; pending: number; active: number }
  bookings?: { total: number; active: number; completed: number }
  revenue?: { total: number; monthly: number }
  engagement?: { averageRating: number; totalReviews: number; totalViews: number; totalEnquiries: number }
  profile?: { rating: number; totalSales: number }
  recentBookings?: BookingItem[]
  topCars?: CarItem[]
}

interface BookingItem {
  id: string
  user?: { name: string; phone?: string }
  car?: { brand: string; model: string }
  totalAmount?: number
  status: string
  type?: string
  startDate?: string
  endDate?: string
  createdAt?: string
  payments?: { status: string }[]
}

interface CarItem {
  id: string
  brand: string
  model: string
  year?: number
  price: number
  type: VehicleType | string
  status: string
  photos?: string
  featured: boolean
  location?: string
  city?: string
  views?: number
  mileage?: number | null
}

// ===== HELPERS =====

function parseJsonField(val: unknown, fallback: string[] = []): string[] {
  if (typeof val === 'string') {
    try { return JSON.parse(val) } catch { return fallback }
  }
  return Array.isArray(val) ? val : fallback
}

const INPUT_CLS = 'bg-secondary border-border text-foreground placeholder:text-muted-foreground/50 focus-visible:border-gold h-10'

// ===== SIDEBAR CONFIG =====

const sidebarItems = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'listings', label: 'My Listings', icon: Car },
  { id: 'addCar', label: 'Add Car', icon: PlusCircle },
  { id: 'bookings', label: 'Bookings', icon: CalendarCheck },
  { id: 'enquiries', label: 'Enquiries', icon: MessageSquare },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'payments', label: 'Payments', icon: Wallet },
  { id: 'settings', label: 'Settings', icon: Settings },
] as const

type DealerTab = (typeof sidebarItems)[number]['id']

// ===== COMPONENT =====

export default function DealerDashboard() {
  const router = useRouter()
  const { user, logout } = useAppStore()
  const userName = user?.name || null
  const [activeTab, setActiveTab] = useState<DealerTab>('overview')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [listingFilter, setListingFilter] = useState('all')
  const [bookingFilter, setBookingFilter] = useState('all')

  // API data state
  const [stats, setStats] = useState<DealerStats | null>(null)
  const [listings, setListings] = useState<CarItem[]>([])
  const [bookings, setBookings] = useState<BookingItem[]>([])
  const [statsLoading, setStatsLoading] = useState(true)
  const [listingsLoading, setListingsLoading] = useState(true)
  const [bookingsLoading, setBookingsLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Fetch stats
  const fetchStats = useCallback(async () => {
    setStatsLoading(true)
    try {
      const result = await dealerApi.getStats()
      setStats(result.data as DealerStats)
    } catch {
      // silent
    } finally {
      setStatsLoading(false)
    }
  }, [])

  // Fetch listings
  const fetchListings = useCallback(async () => {
    setListingsLoading(true)
    try {
      const params: Record<string, string> = { includeInactive: 'true' }
      if (listingFilter !== 'all') params.type = listingFilter
      const result = await dealerApi.getCars(params)
      const data = result.data as { cars?: CarItem[] } | CarItem[]
      setListings(Array.isArray(data) ? data : (data?.cars ?? []))
    } catch {
      // silent
    } finally {
      setListingsLoading(false)
    }
  }, [listingFilter])

  // Fetch bookings
  const fetchBookings = useCallback(async () => {
    setBookingsLoading(true)
    try {
      const params: Record<string, string> = {}
      if (bookingFilter !== 'all') params.status = bookingFilter
      const result = await dealerApi.getBookings(params)
      const data = result.data as { bookings?: BookingItem[] } | BookingItem[]
      setBookings(Array.isArray(data) ? data : (data?.bookings ?? []))
    } catch {
      // silent
    } finally {
      setBookingsLoading(false)
    }
  }, [bookingFilter])

  useEffect(() => { queueMicrotask(() => fetchStats()) }, [fetchStats])
  useEffect(() => { queueMicrotask(() => fetchListings()) }, [fetchListings])
  useEffect(() => { queueMicrotask(() => fetchBookings()) }, [fetchBookings])

  // ===== ADD CAR FORM STATE =====
  const [carType, setCarType] = useState<VehicleType>('rent')
  const [carBrand, setCarBrand] = useState('')
  const [carModel, setCarModel] = useState('')
  const [carYear, setCarYear] = useState('')
  const [carLocation, setCarLocation] = useState('')
  const [carDescription, setCarDescription] = useState('')
  const [carPhotos, setCarPhotos] = useState<Array<{ url: string; name: string }>>([])
  const [uploadingPhotos, setUploadingPhotos] = useState(false)
  const [deleteCarId, setDeleteCarId] = useState<string | null>(null)
  const [editingCarId, setEditingCarId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Rental specific
  const [carDailyPrice, setCarDailyPrice] = useState('')
  const [carWeeklyPrice, setCarWeeklyPrice] = useState('')
  const [carMonthlyPrice, setCarMonthlyPrice] = useState('')
  const [carRentDeposit, setCarRentDeposit] = useState('')
  const [carAvailability, setCarAvailability] = useState(true)
  const [carRentalTerms, setCarRentalTerms] = useState('')
  const [carSelfPickup, setCarSelfPickup] = useState(true)
  const [carDeliveryAvailable, setCarDeliveryAvailable] = useState(false)
  const [carPickupLocation, setCarPickupLocation] = useState('')
  const [carDeliveryFee, setCarDeliveryFee] = useState('')

  // Sale specific
  const [carSalePrice, setCarSalePrice] = useState('')
  const [carBookingFee, setCarBookingFee] = useState('')
  const [carSaleCondition, setCarSaleCondition] = useState('')
  const [carMileage, setCarMileage] = useState('')
  const [carFeatures, setCarFeatures] = useState('')

  // Continue Loan specific
  const [carMonthlyInstallment, setCarMonthlyInstallment] = useState('')
  const [carRemainingMonths, setCarRemainingMonths] = useState('')
  const [carTakeoverAmount, setCarTakeoverAmount] = useState('')
  const [carVehicleCondition, setCarVehicleCondition] = useState('')
  const [carBankName, setCarBankName] = useState('')

  // Auction specific
  const [carStartingBid, setCarStartingBid] = useState('')
  const [carAuctionEndDate, setCarAuctionEndDate] = useState('')
  const [carReservePrice, setCarReservePrice] = useState('')
  const [carAuctionCondition, setCarAuctionCondition] = useState('')
  const [carAuctionConditionCategory, setCarAuctionConditionCategory] = useState('')
  const [carAuctionRunningStatus, setCarAuctionRunningStatus] = useState('')
  const [carAuctionSalvageStatus, setCarAuctionSalvageStatus] = useState('')
  const [carDamageDescription, setCarDamageDescription] = useState('')
  const [carRepairEstimate, setCarRepairEstimate] = useState('')

  const handleTabChange = (tab: DealerTab) => {
    setActiveTab(tab)
    setMobileSidebarOpen(false)
  }

  // Reset form helper
  const resetForm = () => {
    setCarBrand(''); setCarModel(''); setCarYear(''); setCarLocation('')
    setCarDescription(''); setCarPhotos([]); setUploadingPhotos(false)
    setCarDailyPrice(''); setCarWeeklyPrice(''); setCarMonthlyPrice('')
    setCarRentDeposit(''); setCarRentalTerms('')
    setCarSalePrice(''); setCarBookingFee(''); setCarSaleCondition('')
    setCarMileage(''); setCarFeatures('')
    setCarMonthlyInstallment(''); setCarRemainingMonths('')
    setCarTakeoverAmount(''); setCarVehicleCondition(''); setCarBankName('')
    setCarStartingBid(''); setCarAuctionEndDate('')
    setCarReservePrice(''); setCarAuctionCondition('')
    setCarAuctionConditionCategory(''); setCarAuctionRunningStatus('')
    setCarAuctionSalvageStatus(''); setCarDamageDescription(''); setCarRepairEstimate('')
    setEditingCarId(null)
  }

  const handleAddCar = async () => {
    setSubmitting(true)
    try {
      const requirePositiveNumber = (value: string, label: string) => {
        const parsed = parseFloat(value)
        if (!Number.isFinite(parsed) || parsed <= 0) {
          throw new Error(`${label} must be a positive number`)
        }
        return parsed
      }

      if (!carBrand.trim()) throw new Error('Brand is required')
      if (!carModel.trim()) throw new Error('Model is required')

      const year = parseInt(carYear, 10)
      const currentYear = new Date().getFullYear()
      if (!Number.isInteger(year) || year < 1900 || year > currentYear + 1) {
        throw new Error('Enter a valid vehicle year')
      }

      const price =
        carType === 'rent'
          ? requirePositiveNumber(carDailyPrice, 'Daily price')
          : carType === 'sale'
            ? requirePositiveNumber(carSalePrice, 'Sale price')
            : carType === 'auction'
              ? requirePositiveNumber(carStartingBid, 'Starting bid')
              : requirePositiveNumber(carMonthlyInstallment, 'Monthly installment')

      const carData: Record<string, unknown> = {
        type: carType,
        brand: carBrand.trim(),
        model: carModel.trim(),
        year,
        price,
        description: carDescription.trim(),
        location: carType === 'rent' && carSelfPickup && carPickupLocation ? carPickupLocation.trim() : carLocation.trim(),
        city: carLocation.trim(),
        photos: JSON.stringify(carPhotos.map(p => p.url)),
        features: carFeatures ? JSON.stringify(carFeatures.split(',').map(f => f.trim()).filter(Boolean)) : undefined,
      }

      if (carType === 'rent') {
        carData.weeklyPrice = carWeeklyPrice ? parseFloat(carWeeklyPrice) : undefined
        carData.monthlyPrice = carMonthlyPrice ? parseFloat(carMonthlyPrice) : undefined
        carData.deposit = carRentDeposit ? parseFloat(carRentDeposit) : undefined
        carData.rentalTerms = carRentalTerms || undefined
        carData.pickupAvailable = carSelfPickup
        carData.deliveryAvailable = carDeliveryAvailable
        carData.deliveryFee = carDeliveryFee ? parseFloat(carDeliveryFee) : undefined
        carData.transmission = 'auto'
        carData.fuelType = 'petrol'
        carData.condition = 'certified'
      }

      if (carType === 'sale') {
        carData.price = parseFloat(carSalePrice)
        carData.bookingFee = carBookingFee ? parseFloat(carBookingFee) : undefined
        carData.condition = carSaleCondition || undefined
        carData.mileage = carMileage ? parseInt(carMileage) : undefined
        carData.transmission = 'auto'
        carData.fuelType = 'petrol'
      }

      if (carType === 'continueLoan') {
        carData.monthlyInstallment = carMonthlyInstallment ? parseFloat(carMonthlyInstallment) : price
        carData.remainingMonths = carRemainingMonths ? parseInt(carRemainingMonths) : undefined
        carData.takeoverAmount = carTakeoverAmount ? parseFloat(carTakeoverAmount) : undefined
        carData.bankName = carBankName || undefined
        carData.vehicleCondition = carVehicleCondition || undefined
        carData.deposit = carTakeoverAmount ? parseFloat(carTakeoverAmount) : undefined
        carData.transmission = 'auto'
        carData.fuelType = 'petrol'
        carData.condition = 'used'
      }

      if (carType === 'auction') {
        carData.auctionStartBid = price
        carData.auctionEnd = carAuctionEndDate || undefined
        carData.auctionReserve = carReservePrice ? parseFloat(carReservePrice) : undefined
        carData.condition = carAuctionCondition || undefined
        carData.conditionCategory = carAuctionConditionCategory || undefined
        carData.runningStatus = carAuctionRunningStatus || undefined
        carData.salvageStatus = carAuctionSalvageStatus || undefined
        carData.damageDescription = carDamageDescription || undefined
        carData.repairEstimate = carRepairEstimate ? parseFloat(carRepairEstimate) : undefined
        carData.transmission = 'auto'
        carData.fuelType = 'petrol'
        carData.auctionActive = true
      }

      if (editingCarId) {
        await carsApi.update(editingCarId, carData)
      } else {
        await carsApi.create(carData)
      }
      resetForm()
      setEditingCarId(null)
      fetchListings()
      fetchStats()
      handleTabChange('listings')
      toast.success(editingCarId ? 'Car listing updated for admin review' : 'Car listing submitted for admin review')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save car listing'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  // Handle photo upload
  const handlePhotoUpload = async (files: FileList) => {
    const remaining = 10 - carPhotos.length
    const filesToUpload = Array.from(files).slice(0, remaining)
    if (filesToUpload.length === 0) return

    setUploadingPhotos(true)
    try {
      const uploadedPhotos: Array<{ url: string; name: string }> = []
      for (const file of filesToUpload) {
        try {
          const result = await uploadApi.upload(file, 'vehicle_photos')
          const url = (result as { url?: string }).url || ''
          if (url) {
            uploadedPhotos.push({ url, name: file.name })
          }
        } catch {
          // Skip failed uploads
        }
      }
      setCarPhotos(prev => [...prev, ...uploadedPhotos])
    } finally {
      setUploadingPhotos(false)
    }
  }

  // Set a photo as cover (move to index 0)
  const setAsCover = (idx: number) => {
    setCarPhotos(prev => {
      const photo = prev[idx]
      const rest = prev.filter((_, i) => i !== idx)
      return [photo, ...rest]
    })
  }

  // Remove a photo
  const removePhoto = (idx: number) => {
    setCarPhotos(prev => prev.filter((_, i) => i !== idx))
  }

  // Handle delete car
  const handleDeleteCar = async () => {
    if (!deleteCarId) return
    try {
      await carsApi.delete(deleteCarId)
      fetchListings()
      fetchStats()
    } catch {
      // silent
    } finally {
      setDeleteCarId(null)
    }
  }

  // Handle edit car - populate form with car data and switch to addCar tab
  const handleEditCar = (car: CarItem & {
    weeklyPrice?: number | null; monthlyPrice?: number | null; deposit?: number | null;
    rentalTerms?: string | null; pickupAvailable?: boolean; deliveryAvailable?: boolean; deliveryFee?: number | null;
    conditionCategory?: string | null; runningStatus?: string | null; salvageStatus?: string | null;
    damageDescription?: string | null; repairEstimate?: number | null;
    auctionEnd?: string | null; auctionReserve?: number | null; condition?: string | null;
  }) => {
    setEditingCarId(car.id)
    setCarType(car.type as VehicleType)
    setCarBrand(car.brand)
    setCarModel(car.model)
    setCarYear(car.year?.toString() || '')
    setCarLocation(car.city || car.location || '')
    setCarDescription('')
    const photos = parseJsonField(car.photos)
    setCarPhotos(photos.map(url => ({ url, name: url.split('/').pop() || 'photo' })))
    setCarSalePrice(car.type === 'sale' ? car.price.toString() : '')
    setCarDailyPrice(car.type === 'rent' ? car.price.toString() : '')
    setCarWeeklyPrice(car.type === 'rent' && car.weeklyPrice ? car.weeklyPrice.toString() : '')
    setCarMonthlyPrice(car.type === 'rent' && car.monthlyPrice ? car.monthlyPrice.toString() : '')
    setCarRentDeposit(car.type === 'rent' && car.deposit ? car.deposit.toString() : '')
    setCarRentalTerms(car.type === 'rent' && car.rentalTerms ? car.rentalTerms : '')
    setCarSelfPickup(car.type === 'rent' ? (car.pickupAvailable ?? true) : true)
    setCarDeliveryAvailable(car.type === 'rent' ? (car.deliveryAvailable ?? false) : false)
    setCarDeliveryFee(car.type === 'rent' && car.deliveryFee ? car.deliveryFee.toString() : '')
    setCarStartingBid(car.type === 'auction' ? car.price.toString() : '')
    setCarAuctionEndDate(car.type === 'auction' && car.auctionEnd ? car.auctionEnd : '')
    setCarReservePrice(car.type === 'auction' && car.auctionReserve ? car.auctionReserve.toString() : '')
    setCarAuctionCondition(car.type === 'auction' && car.condition ? car.condition : '')
    setCarAuctionConditionCategory(car.type === 'auction' && car.conditionCategory ? car.conditionCategory : '')
    setCarAuctionRunningStatus(car.type === 'auction' && car.runningStatus ? car.runningStatus : '')
    setCarAuctionSalvageStatus(car.type === 'auction' && car.salvageStatus ? car.salvageStatus : '')
    setCarDamageDescription(car.type === 'auction' && car.damageDescription ? car.damageDescription : '')
    setCarRepairEstimate(car.type === 'auction' && car.repairEstimate ? car.repairEstimate.toString() : '')
    setCarMileage(car.mileage?.toString() || '')
    handleTabChange('addCar')
  }

  // Handle booking action (approve/reject) for dealer
  const handleBookingAction = async (bookingId: string, action: 'confirmed' | 'cancelled') => {
    setActionLoading(bookingId)
    try {
      await bookingsApi.update(bookingId, {
        status: action,
        cancellationReason: action === 'cancelled' ? 'Cancelled by dealer' : undefined,
      })
      fetchBookings()
      fetchStats()
      toast.success(action === 'confirmed' ? 'Booking confirmed' : 'Booking cancelled')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update booking'
      toast.error(message)
    } finally {
      setActionLoading(null)
    }
  }

  // Handle toggle featured
  const handleToggleFeatured = async (carId: string, currentFeatured: boolean) => {
    try {
      await carsApi.update(carId, { featured: !currentFeatured })
      fetchListings()
      fetchStats()
    } catch {
      // silent
    }
  }

  // Derived stats
  const totalListings = stats?.listings?.total ?? 0
  const activeBookings = stats?.bookings?.active ?? 0
  const monthlyRevenue = stats?.revenue?.monthly ?? 0
  const rating = stats?.engagement?.averageRating ?? stats?.profile?.rating ?? 0
  const recentBookings = stats?.recentBookings ?? []

  // ===== RENDER =====
  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Sidebar - Desktop */}
      <aside className={`hidden lg:flex flex-col border-r border-border bg-sidebar transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-60'}`}>
        <div className="flex items-center justify-between p-4 border-b border-border">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center">
                <Car className="size-4 text-gold" />
              </div>
              <span className="text-sm font-bold gold-text">DK Vroom</span>
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
          <div className="p-4 border-t border-border space-y-1">
            <Button variant="ghost" onClick={() => router.push('/')} className="w-full text-muted-foreground hover:text-gold hover:bg-gold/10 text-sm">
              <ChevronLeft className="size-4 mr-1" />
              Back to Site
            </Button>
            <Button variant="ghost" onClick={logout} className="w-full text-red-400/80 hover:text-red-400 hover:bg-red-500/10 text-sm">
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
                <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center">
                  <Car className="size-4 text-gold" />
                </div>
                <span className="text-sm font-bold gold-text">DK Vroom</span>
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
            <div className="p-4 border-t border-border space-y-1">
              <Button variant="ghost" onClick={() => { setMobileSidebarOpen(false); router.push('/') }} className="w-full text-muted-foreground hover:text-gold hover:bg-gold/10 text-sm">
                <ChevronLeft className="size-4 mr-1" />
                Back to Site
              </Button>
              <Button variant="ghost" onClick={logout} className="w-full text-red-400/80 hover:text-red-400 hover:bg-red-500/10 text-sm">
                <LogOut className="size-4 mr-1" />
                Sign Out
              </Button>
            </div>
          </aside>
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
                  <div className="flex items-center gap-2 cursor-pointer">
                    <Avatar className="size-8 border border-gold/30">
                      <AvatarFallback className="bg-gold/10 text-gold text-xs font-bold">
                        {userName?.charAt(0) || 'D'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-body-sm font-medium hidden sm:inline">{userName || 'Dealer'}</span>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-card border-border" align="end">
                  <DropdownMenuItem onClick={logout} className="text-red-400 focus:bg-red-500/10 focus:text-red-400 cursor-pointer">
                    <LogOut className="size-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">

          {/* ===== OVERVIEW TAB ===== */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total Listings', value: statsLoading ? '...' : String(totalListings), icon: Car, change: `+${stats?.listings?.pending ?? 0} pending`, up: true },
                  { label: 'Active Bookings', value: statsLoading ? '...' : String(activeBookings), icon: CalendarCheck, change: `${stats?.bookings?.total ?? 0} total`, up: true },
                  { label: 'Revenue This Month', value: statsLoading ? '...' : formatPrice(monthlyRevenue), icon: DollarSign, change: `${formatPrice(stats?.revenue?.total ?? 0)} total`, up: true },
                  { label: 'Rating', value: statsLoading ? '...' : rating.toFixed(1), icon: Star, change: `${stats?.engagement?.totalReviews ?? 0} reviews`, up: true },
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
                })}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Revenue Overview */}
                <Card className="lg:col-span-2 bg-card border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="dash-heading-sm">Revenue Overview</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 pt-0">
                    <div className="flex items-center justify-center h-48 text-muted-foreground text-body-sm">
                      {statsLoading ? (
                        <Loader2 className="size-6 animate-spin text-gold" />
                      ) : (
                        <div className="text-center">
                          <DollarSign className="size-8 text-gold mx-auto mb-2" />
                          <p className="text-body">Total Revenue: {formatPrice(stats?.revenue?.total ?? 0)}</p>
                          <p className="text-body-sm text-muted-foreground mt-1">This Month: {formatPrice(monthlyRevenue)}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Bookings */}
                <Card className="bg-card border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="dash-heading-sm">Recent Bookings</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 pt-2 space-y-3 max-h-72 overflow-y-auto">
                    {statsLoading ? (
                      <LoadingState message="Loading bookings..." />
                    ) : recentBookings.length > 0 ? (
                      recentBookings.map((booking) => (
                        <div key={booking.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                          <div className="min-w-0">
                            <p className="text-body-sm font-medium truncate">{booking.user?.name || 'Customer'}</p>
                            <p className="text-caption text-muted-foreground truncate">{booking.car?.brand} {booking.car?.model}</p>
                          </div>
                          <div className="text-right shrink-0 ml-2">
                            <p className="text-body-sm font-semibold text-gold">{formatPrice(booking.totalAmount || 0)}</p>
                            <StatusBadge status={booking.status} />
                          </div>
                        </div>
                      ))
                    ) : (
                      <EmptyState title="No bookings yet" description="Bookings will appear here once customers start booking your cars." />
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: 'Add New Car', icon: PlusCircle, tab: 'addCar' as DealerTab },
                  { label: 'View Enquiries', icon: MessageSquare, tab: 'enquiries' as DealerTab },
                  { label: 'Update Profile', icon: Settings, tab: 'settings' as DealerTab },
                ].map((action) => {
                  const Icon = action.icon
                  return (
                    <Card key={action.label} className="bg-card border-border cursor-pointer hover:border-gold/50 transition-all" onClick={() => handleTabChange(action.tab)}>
                      <CardContent className="p-4 sm:p-6 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center">
                          <Icon className="size-6 text-gold" />
                        </div>
                        <div>
                          <p className="text-body-sm font-semibold">{action.label}</p>
                          <p className="text-caption text-muted-foreground">Quick access</p>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}

          {/* ===== MY LISTINGS TAB ===== */}
          {activeTab === 'listings' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <Filter className="size-4 text-muted-foreground" />
                  {(['all', ...Object.keys(VEHICLE_TYPE_CONFIG)] as const).map((type) => (
                    <Button
                      key={type}
                      variant={listingFilter === type ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setListingFilter(type)}
                      className={listingFilter === type
                        ? 'bg-gold text-primary-foreground hover:bg-gold-dark text-xs'
                        : 'text-muted-foreground hover:text-foreground text-xs'
                      }
                    >
                      {type === 'all' ? 'All' : VEHICLE_TYPE_CONFIG[type as VehicleType]?.label ?? type}
                    </Button>
                  ))}
                </div>
                <Button onClick={() => handleTabChange('addCar')} className="bg-gold hover:bg-gold-dark text-primary-foreground font-semibold">
                  <PlusCircle className="size-4 mr-1" />
                  Add New Car
                </Button>
              </div>

              {listingsLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i} className="bg-card border-border overflow-hidden animate-pulse">
                      <div className="aspect-[16/10] bg-secondary" />
                      <CardContent className="p-4 space-y-3">
                        <div className="h-5 bg-secondary rounded w-3/4" />
                        <div className="h-4 bg-secondary rounded w-1/2" />
                        <div className="h-7 bg-secondary rounded w-1/3" />
                        <div className="h-4 bg-secondary rounded w-2/3" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : listings.length === 0 ? (
                <EmptyState title="No listings found" description="Add your first car listing to get started." action={
                  <Button onClick={() => handleTabChange('addCar')} className="bg-gold hover:bg-gold-dark text-primary-foreground">Add New Car</Button>
                } />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {listings.map((car) => {
                    const photos = parseJsonField(car.photos)
                    const photoUrl = photos[0] || ''
                    return (
                      <Card key={car.id} className="bg-card border-border overflow-hidden">
                        {/* Car photo */}
                        <div className="relative aspect-[16/10] overflow-hidden bg-secondary">
                          {photoUrl ? (
                            <img src={photoUrl} alt={car.brand} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Car className="size-8 text-muted-foreground/30" />
                            </div>
                          )}
                          <div className="absolute top-2 left-2"><VehicleTypeBadge type={car.type} /></div>
                          <div className="absolute top-2 right-2"><StatusBadge status={car.status} /></div>
                          {car.featured && (
                            <div className="absolute bottom-2 left-2">
                              <Badge className="bg-gold text-black border-0 text-xs font-bold"><Star className="size-3 mr-0.5" />Featured</Badge>
                            </div>
                          )}
                        </div>
                        <CardContent className="p-4 space-y-3">
                          <div>
                            <h3 className="font-semibold text-foreground">{car.brand} {car.model}</h3>
                            {car.year && <p className="text-caption text-muted-foreground">{car.year}</p>}
                          </div>
                          <p className="text-lg font-bold text-gold">{formatPrice(car.price || 0, car.type)}</p>
                          {car.city && (
                            <div className="flex items-center gap-1 text-caption text-muted-foreground">
                              <MapPin className="size-3" />{car.city}
                            </div>
                          )}
                          <div className="flex items-center gap-1 pt-2 border-t border-border">
                            <Button variant="ghost" size="sm" className="h-7 text-muted-foreground hover:text-gold text-xs" onClick={() => handleEditCar(car)}>
                              <Edit className="size-3.5 mr-1" />Edit
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 text-muted-foreground hover:text-red-400 text-xs" onClick={() => setDeleteCarId(car.id)}>
                              <Trash2 className="size-3.5 mr-1" />Delete
                            </Button>
                            <Button variant="ghost" size="sm" className={`h-7 ${car.featured ? 'text-gold' : 'text-muted-foreground'} hover:text-gold text-xs ml-auto`} onClick={() => handleToggleFeatured(car.id, car.featured)}>
                              {car.featured ? <Star className="size-3.5 mr-1" /> : <StarOff className="size-3.5 mr-1" />}
                              {car.featured ? 'Featured' : 'Feature'}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ===== ADD CAR TAB ===== */}
          {activeTab === 'addCar' && (
            <div className="max-w-3xl mx-auto space-y-6">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="dash-heading-md"><span className="gold-text">{editingCarId ? 'Edit Car' : 'Add New Car'}</span></CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 space-y-6">
                  {/* Listing Type */}
                  <div className="space-y-2">
                    <Label className="text-muted-foreground text-body-sm font-medium">Listing Type</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {Object.entries(VEHICLE_TYPE_CONFIG).map(([type, config]) => (
                        <Button
                          key={type}
                          variant={carType === type ? 'default' : 'outline'}
                          onClick={() => setCarType(type as VehicleType)}
                          className={carType === type
                            ? 'bg-gold text-primary-foreground hover:bg-gold-dark h-auto py-3 flex flex-col gap-1'
                            : 'border-border text-muted-foreground hover:border-gold/50 hover:text-gold h-auto py-3 flex flex-col gap-1'
                          }
                        >
                          <span className="text-xs">{config.label}</span>
                        </Button>
                      ))}
                    </div>
                  </div>

                  <Separator className="bg-border" />

                  {/* Car Photos */}
                  <div className="space-y-3">
                    <Label className="text-muted-foreground text-body-sm font-medium flex items-center gap-2">
                      <ImagePlus className="size-4 text-gold" />
                      Car Photos
                    </Label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          handlePhotoUpload(e.target.files)
                          e.target.value = ''
                        }
                      }}
                    />
                    <div
                      className={`border-2 border-dashed border-border rounded-xl p-6 sm:p-8 text-center hover:border-gold/50 transition-colors cursor-pointer group ${uploadingPhotos ? 'pointer-events-none opacity-60' : ''}`}
                      onClick={() => {
                        if (!uploadingPhotos && carPhotos.length < 10) {
                          fileInputRef.current?.click()
                        }
                      }}
                    >
                      {uploadingPhotos ? (
                        <>
                          <Loader2 className="size-8 text-gold mx-auto mb-2 animate-spin" />
                          <p className="text-body-sm text-muted-foreground">Uploading photos...</p>
                          <p className="text-caption text-muted-foreground/50 mt-1">Please wait while your photos are being uploaded</p>
                        </>
                      ) : (
                        <>
                          <Upload className="size-8 text-muted-foreground mx-auto mb-2 group-hover:text-gold transition-colors" />
                          <p className="text-body-sm text-muted-foreground">Click to upload photos</p>
                          <p className="text-caption text-muted-foreground/50 mt-1">PNG, JPG, WebP up to 5MB each. Max 10 photos.</p>
                        </>
                      )}
                      {carPhotos.length > 0 && (
                        <Badge className="mt-2 bg-gold/20 text-gold border-gold/30 text-xs">
                          {carPhotos.length}/10 photos added
                        </Badge>
                      )}
                    </div>
                    {carPhotos.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        {carPhotos.map((photo, idx) => (
                          <div key={idx} className="relative group/photo bg-secondary border border-border rounded-lg overflow-hidden">
                            <div className="aspect-video flex items-center justify-center overflow-hidden">
                              <img src={photo.url} alt={photo.name} className="w-full h-full object-cover" />
                            </div>
                            {/* Three-dot menu on hover */}
                            <div className="absolute top-1 right-1 opacity-0 group-hover/photo:opacity-100 transition-opacity z-10">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-6 w-6 bg-black/60 hover:bg-black/80 text-white rounded-full">
                                    <MoreVertical className="size-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="bg-card border-border">
                                  {idx !== 0 && (
                                    <DropdownMenuItem onClick={() => setAsCover(idx)} className="text-foreground focus:bg-gold/10 focus:text-gold cursor-pointer">
                                      <Star className="size-3 mr-2" /> Set as Cover
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem onClick={() => removePhoto(idx)} className="text-red-400 focus:bg-red-500/10 cursor-pointer">
                                    <Trash2 className="size-3 mr-2" /> Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                            {idx === 0 && (
                              <Badge className="absolute top-1 left-1 bg-gold text-primary-foreground text-[9px] px-1.5 py-0">Cover</Badge>
                            )}
                          </div>
                        ))}
                        {carPhotos.length < 10 && !uploadingPhotos && (
                          <div
                            className="aspect-video border-2 border-dashed border-border rounded-lg flex items-center justify-center cursor-pointer hover:border-gold/50 transition-colors"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <PlusCircle className="size-5 text-muted-foreground/30" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <Separator className="bg-border" />

                  {/* Vehicle Details */}
                  <div className="space-y-4">
                    <p className="text-body-sm font-medium text-gold flex items-center gap-2">
                      <Car className="size-4" />
                      Vehicle Details
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="text-muted-foreground text-caption">Brand</Label>
                        <Input value={carBrand} onChange={(e) => setCarBrand(e.target.value)} placeholder="e.g. BMW" className={INPUT_CLS} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-muted-foreground text-caption">Model</Label>
                        <Input value={carModel} onChange={(e) => setCarModel(e.target.value)} placeholder="e.g. M4 Competition" className={INPUT_CLS} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-muted-foreground text-caption">Year</Label>
                        <Input value={carYear} onChange={(e) => setCarYear(e.target.value)} placeholder="e.g. 2024" className={INPUT_CLS} />
                      </div>
                    </div>
                  </div>

                  <Separator className="bg-border" />

                  {/* Location */}
                  <div className="space-y-4">
                    <p className="text-body-sm font-medium text-gold flex items-center gap-2">
                      <MapPin className="size-4" />
                      Location
                    </p>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground text-caption">Location</Label>
                      <Input value={carLocation} onChange={(e) => setCarLocation(e.target.value)} placeholder="e.g. KLCC, Kuala Lumpur" className={INPUT_CLS} />
                    </div>
                  </div>

                  <Separator className="bg-border" />

                  {/* ===== RENTAL SPECIFIC FIELDS ===== */}
                  {carType === 'rent' && (
                    <div className="p-4 rounded-lg bg-gold/5 border border-gold/20 space-y-4">
                      <p className="text-body-sm font-medium text-gold flex items-center gap-2">
                        <Car className="size-4" />
                        Rental Pricing & Details
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label className="text-muted-foreground text-caption">Daily Price (RM)</Label>
                          <Input type="number" value={carDailyPrice} onChange={(e) => setCarDailyPrice(e.target.value)} placeholder="e.g. 680" className={INPUT_CLS} />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-muted-foreground text-caption">Weekly Price (RM)</Label>
                          <Input type="number" value={carWeeklyPrice} onChange={(e) => setCarWeeklyPrice(e.target.value)} placeholder="e.g. 4200" className={INPUT_CLS} />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-muted-foreground text-caption">Monthly Price (RM)</Label>
                          <Input type="number" value={carMonthlyPrice} onChange={(e) => setCarMonthlyPrice(e.target.value)} placeholder="e.g. 15000" className={INPUT_CLS} />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-muted-foreground text-caption">Deposit (RM)</Label>
                          <Input type="number" value={carRentDeposit} onChange={(e) => setCarRentDeposit(e.target.value)} placeholder="e.g. 5000" className={INPUT_CLS} />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-muted-foreground text-caption">Availability</Label>
                          <div className="flex items-center gap-3 h-10">
                            <Switch checked={carAvailability} onCheckedChange={setCarAvailability} className="data-[state=checked]:bg-gold" />
                            <span className={`text-body-sm font-medium ${carAvailability ? 'text-emerald-400' : 'text-red-400'}`}>
                              {carAvailability ? 'Available' : 'Unavailable'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Separator className="bg-border/50" />
                      <div className="space-y-2">
                        <Label className="text-muted-foreground text-caption">Rental Terms & Conditions</Label>
                        <Textarea value={carRentalTerms} onChange={(e) => setCarRentalTerms(e.target.value)} placeholder="Enter rental terms and conditions..." rows={4} className="bg-secondary border-border text-foreground placeholder:text-muted-foreground/50 focus-visible:border-gold" />
                      </div>
                      <Separator className="bg-border/50" />
                      <div className="space-y-3">
                        <p className="text-caption font-medium text-muted-foreground flex items-center gap-2">
                          <Truck className="size-3.5" />
                          Pickup / Delivery Options
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary border border-border">
                            <Checkbox checked={carSelfPickup} onCheckedChange={(checked) => setCarSelfPickup(checked === true)} className="data-[state=checked]:bg-gold data-[state=checked]:border-gold" />
                            <Label className="text-body-sm text-foreground cursor-pointer">Self Pickup</Label>
                          </div>
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary border border-border">
                            <Checkbox checked={carDeliveryAvailable} onCheckedChange={(checked) => setCarDeliveryAvailable(checked === true)} className="data-[state=checked]:bg-gold data-[state=checked]:border-gold" />
                            <Label className="text-body-sm text-foreground cursor-pointer">Delivery Available</Label>
                          </div>
                        </div>
                        {carSelfPickup && (
                          <div className="space-y-2">
                            <Label className="text-muted-foreground text-caption">Pickup Location</Label>
                            <Input value={carPickupLocation} onChange={(e) => setCarPickupLocation(e.target.value)} placeholder="e.g. DK Vroom Hub, Jalan Ampang, KL" className={INPUT_CLS} />
                          </div>
                        )}
                        {carDeliveryAvailable && (
                          <div className="space-y-2">
                            <Label className="text-muted-foreground text-caption">Delivery Fee (RM)</Label>
                            <Input type="number" value={carDeliveryFee} onChange={(e) => setCarDeliveryFee(e.target.value)} placeholder="e.g. 50" className={INPUT_CLS} />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ===== SALE SPECIFIC FIELDS ===== */}
                  {carType === 'sale' && (
                    <div className="p-4 rounded-lg bg-gold/5 border border-gold/20 space-y-4">
                      <p className="text-body-sm font-medium text-gold flex items-center gap-2">
                        <DollarSign className="size-4" />
                        Sale Pricing & Details
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-muted-foreground text-caption">Sale Price (RM)</Label>
                          <Input type="number" value={carSalePrice} onChange={(e) => setCarSalePrice(e.target.value)} placeholder="e.g. 298000" className={INPUT_CLS} />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-muted-foreground text-caption">Deposit / Booking Fee (RM)</Label>
                          <Input type="number" value={carBookingFee} onChange={(e) => setCarBookingFee(e.target.value)} placeholder="e.g. 5000" className={INPUT_CLS} />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-muted-foreground text-caption">Condition</Label>
                          <Select value={carSaleCondition} onValueChange={setCarSaleCondition}>
                            <SelectTrigger className="bg-secondary border-border text-foreground h-10">
                              <SelectValue placeholder="Select Condition" />
                            </SelectTrigger>
                            <SelectContent className="bg-card border-border">
                              {['New', 'Certified Pre-Owned', 'Used'].map((c) => (
                                <SelectItem key={c} value={c.toLowerCase().replace(/\s+/g, '_')} className="text-foreground focus:bg-secondary focus:text-gold">{c}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-muted-foreground text-caption">Mileage (km)</Label>
                          <Input type="number" value={carMileage} onChange={(e) => setCarMileage(e.target.value)} placeholder="e.g. 12000" className={INPUT_CLS} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-muted-foreground text-caption">Features (comma-separated)</Label>
                        <Input value={carFeatures} onChange={(e) => setCarFeatures(e.target.value)} placeholder="e.g. M Sport Package, Harman Kardon, Sunroof" className={INPUT_CLS} />
                      </div>
                    </div>
                  )}

                  {/* ===== CONTINUE LOAN SPECIFIC FIELDS ===== */}
                  {carType === 'continueLoan' && (
                    <div className="space-y-4">
                      <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="size-5 text-amber-400 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-body-sm font-medium text-amber-300 mb-1">Continue Loan / Sambung Bayar</p>
                            <p className="text-caption text-amber-200/80 leading-relaxed">
                              You are listing a vehicle with an existing loan for takeover. DK Vroom acts as marketplace platform only.
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="p-4 rounded-lg bg-gold/5 border border-gold/20 space-y-4">
                        <p className="text-body-sm font-medium text-gold flex items-center gap-2">
                          <Handshake className="size-4" />
                          Loan Transfer Details
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-muted-foreground text-caption">Monthly Installment (RM)</Label>
                            <Input type="number" value={carMonthlyInstallment} onChange={(e) => setCarMonthlyInstallment(e.target.value)} placeholder="e.g. 698" className={INPUT_CLS} />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-muted-foreground text-caption">Remaining Loan Period (months)</Label>
                            <Input type="number" value={carRemainingMonths} onChange={(e) => setCarRemainingMonths(e.target.value)} placeholder="e.g. 60" className={INPUT_CLS} />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-muted-foreground text-caption">Deposit / Takeover Amount (RM)</Label>
                            <Input type="number" value={carTakeoverAmount} onChange={(e) => setCarTakeoverAmount(e.target.value)} placeholder="e.g. 5000" className={INPUT_CLS} />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-muted-foreground text-caption">Bank Name</Label>
                            <Select value={carBankName} onValueChange={setCarBankName}>
                              <SelectTrigger className="bg-secondary border-border text-foreground h-10">
                                <SelectValue placeholder="Select Bank" />
                              </SelectTrigger>
                              <SelectContent className="bg-card border-border">
                                {['Maybank', 'CIMB', 'Hong Leong Bank', 'Public Bank', 'RHB', 'AmBank', 'Bank Islam', 'Bank Rakyat', 'BSN', 'UOB'].map((bank) => (
                                  <SelectItem key={bank} value={bank} className="text-foreground focus:bg-secondary focus:text-gold">{bank}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-muted-foreground text-caption">Vehicle Condition</Label>
                          <Textarea value={carVehicleCondition} onChange={(e) => setCarVehicleCondition(e.target.value)} placeholder="Provide detailed description of the vehicle condition..." rows={4} className="bg-secondary border-border text-foreground placeholder:text-muted-foreground/50 focus-visible:border-gold" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ===== AUCTION SPECIFIC FIELDS ===== */}
                  {carType === 'auction' && (
                    <div className="p-4 rounded-lg bg-gold/5 border border-gold/20 space-y-4">
                      <p className="text-body-sm font-medium text-gold flex items-center gap-2">
                        <Gavel className="size-4" />
                        Auction Details
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-muted-foreground text-caption">Starting Bid Price (RM)</Label>
                          <Input type="number" value={carStartingBid} onChange={(e) => setCarStartingBid(e.target.value)} placeholder="e.g. 880000" className={INPUT_CLS} />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-muted-foreground text-caption">Auction End Date/Time</Label>
                          <Input type="datetime-local" value={carAuctionEndDate} onChange={(e) => setCarAuctionEndDate(e.target.value)} className={`${INPUT_CLS} [color-scheme:dark]`} />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-muted-foreground text-caption">Reserve Price (RM) <span className="text-muted-foreground/50">— optional</span></Label>
                          <Input type="number" value={carReservePrice} onChange={(e) => setCarReservePrice(e.target.value)} placeholder="e.g. 950000" className={INPUT_CLS} />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-muted-foreground text-caption">General Condition</Label>
                          <Select value={carAuctionCondition} onValueChange={setCarAuctionCondition}>
                            <SelectTrigger className="bg-secondary border-border text-foreground h-10">
                              <SelectValue placeholder="Select Condition" />
                            </SelectTrigger>
                            <SelectContent className="bg-card border-border">
                              {['New', 'Certified Pre-Owned', 'Used'].map((c) => (
                                <SelectItem key={c} value={c.toLowerCase().replace(/\s+/g, '_')} className="text-foreground focus:bg-secondary focus:text-gold">{c}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-muted-foreground text-caption">Condition Category</Label>
                          <Select value={carAuctionConditionCategory} onValueChange={setCarAuctionConditionCategory}>
                            <SelectTrigger className="bg-secondary border-border text-foreground h-10">
                              <SelectValue placeholder="Select Category" />
                            </SelectTrigger>
                            <SelectContent className="bg-card border-border">
                              {CONDITION_CATEGORIES.map((cat) => (
                                <SelectItem key={cat.key} value={cat.key} className="text-foreground focus:bg-secondary focus:text-gold">
                                  {cat.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-muted-foreground text-caption">Running Status</Label>
                          <Select value={carAuctionRunningStatus} onValueChange={setCarAuctionRunningStatus}>
                            <SelectTrigger className="bg-secondary border-border text-foreground h-10">
                              <SelectValue placeholder="Select Status" />
                            </SelectTrigger>
                            <SelectContent className="bg-card border-border">
                              {Object.entries(RUNNING_STATUS).map(([key, val]) => (
                                <SelectItem key={key} value={key} className="text-foreground focus:bg-secondary focus:text-gold">
                                  {val.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-muted-foreground text-caption">Salvage Status</Label>
                          <Select value={carAuctionSalvageStatus} onValueChange={setCarAuctionSalvageStatus}>
                            <SelectTrigger className="bg-secondary border-border text-foreground h-10">
                              <SelectValue placeholder="Select Status" />
                            </SelectTrigger>
                            <SelectContent className="bg-card border-border">
                              {Object.entries(SALVAGE_STATUS).map(([key, val]) => (
                                <SelectItem key={key} value={key} className="text-foreground focus:bg-secondary focus:text-gold">
                                  {val.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-muted-foreground text-caption">Repair Estimate (RM) <span className="text-muted-foreground/50">— optional</span></Label>
                          <Input type="number" value={carRepairEstimate} onChange={(e) => setCarRepairEstimate(e.target.value)} placeholder="e.g. 50000" className={INPUT_CLS} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-muted-foreground text-caption">Damage Description <span className="text-muted-foreground/50">— optional</span></Label>
                        <Textarea value={carDamageDescription} onChange={(e) => setCarDamageDescription(e.target.value)} placeholder="Describe any damage, accident history, or special conditions..." rows={3} className="bg-secondary border-border text-foreground placeholder:text-muted-foreground/50 focus-visible:border-gold" />
                      </div>
                    </div>
                  )}

                  <Separator className="bg-border" />

                  {/* Description */}
                  <div className="space-y-2">
                    <Label className="text-muted-foreground text-body-sm font-medium">Description</Label>
                    <Textarea
                      value={carDescription}
                      onChange={(e) => setCarDescription(e.target.value)}
                      placeholder={carType === 'continueLoan' ? 'Describe the vehicle, reason for loan transfer...' : carType === 'rent' ? 'Describe the vehicle, rental inclusions...' : carType === 'auction' ? 'Describe the vehicle, its history, and auction terms...' : 'Describe the vehicle, its features, and any special notes...'}
                      rows={4}
                      className="bg-secondary border-border text-foreground placeholder:text-muted-foreground/50 focus-visible:border-gold"
                    />
                  </div>

                  {/* Submit */}
                  <div className="flex gap-3">
                    <Button className="flex-1 bg-gold hover:bg-gold-dark text-primary-foreground font-semibold h-12 text-base" onClick={handleAddCar} disabled={submitting}>
                      {submitting ? (
                        <><Loader2 className="size-5 mr-2 animate-spin" />Submitting...</>
                      ) : (
                        <><PlusCircle className="size-5 mr-2" />{editingCarId ? 'Update' : 'Add'} {VEHICLE_TYPE_CONFIG[carType]?.label ?? 'Car'} Listing</>
                      )}
                    </Button>
                    {editingCarId && (
                      <Button variant="outline" className="h-12 text-base border-border text-muted-foreground hover:text-foreground" onClick={() => { resetForm(); setEditingCarId(null) }}>
                        Cancel
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ===== BOOKINGS TAB ===== */}
          {activeTab === 'bookings' && (
            <div className="space-y-4">
              <Tabs value={bookingFilter} onValueChange={setBookingFilter}>
                <div className="flex items-center gap-2 flex-wrap">
                  <Filter className="size-4 text-muted-foreground" />
                  <TabsList className="bg-secondary">
                    {['all', 'pending', 'confirmed', 'completed'].map((status) => (
                      <TabsTrigger key={status} value={status} className="text-xs data-[state=active]:bg-gold data-[state=active]:text-primary-foreground">
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>
              </Tabs>

              {bookingsLoading ? (
                <LoadingState message="Loading bookings..." />
              ) : bookings.length === 0 ? (
                <EmptyState title="No bookings found" description="Bookings will appear here when customers book your cars." />
              ) : (
                <>
                  {/* Desktop table */}
                  <Card className="bg-card border-border hidden md:block">
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <table className="w-full text-body-sm">
                          <thead>
                            <tr className="border-b border-border">
                              <th className="text-left py-3 px-4 text-muted-foreground font-medium">Customer</th>
                              <th className="text-left py-3 px-4 text-muted-foreground font-medium">Car</th>
                              <th className="text-left py-3 px-4 text-muted-foreground font-medium">Dates</th>
                              <th className="text-left py-3 px-4 text-muted-foreground font-medium">Status</th>
                              <th className="text-left py-3 px-4 text-muted-foreground font-medium">Amount</th>
                              <th className="text-left py-3 px-4 text-muted-foreground font-medium">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {bookings.map((booking) => {
                              const startDate = booking.startDate ? formatDate(booking.startDate) : ''
                              const endDate = booking.endDate ? formatDate(booking.endDate) : ''
                              const dates = startDate && endDate ? `${startDate} - ${endDate}` : 'N/A'
                              return (
                                <tr key={booking.id} className="border-b border-border/50 hover:bg-secondary/50">
                                  <td className="py-3 px-4 font-medium">{booking.user?.name || 'Customer'}</td>
                                  <td className="py-3 px-4 text-muted-foreground">{booking.car?.brand} {booking.car?.model}</td>
                                  <td className="py-3 px-4 text-muted-foreground">{dates}</td>
                                  <td className="py-3 px-4"><StatusBadge status={booking.status} /></td>
                                  <td className="py-3 px-4 font-medium text-gold">{formatPrice(booking.totalAmount || 0)}</td>
                                  <td className="py-3 px-4">
                                    {booking.status === 'pending' || booking.status === 'payment_pending' ? (
                                      <div className="flex items-center gap-1">
                                        <Button
                                          variant="ghost" size="sm"
                                          className="h-7 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 text-xs"
                                          onClick={() => handleBookingAction(booking.id, 'confirmed')}
                                          disabled={actionLoading === booking.id}
                                        >
                                          <CheckCircle className="size-3.5 mr-1" />Approve
                                        </Button>
                                        <Button
                                          variant="ghost" size="sm"
                                          className="h-7 text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs"
                                          onClick={() => handleBookingAction(booking.id, 'cancelled')}
                                          disabled={actionLoading === booking.id}
                                        >
                                          <X className="size-3.5 mr-1" />Reject
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
                    {bookings.map((booking) => (
                      <Card key={booking.id} className="bg-card border-border">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-medium">{booking.user?.name || 'Customer'}</p>
                              <p className="text-caption text-muted-foreground">{booking.car?.brand} {booking.car?.model}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-gold">{formatPrice(booking.totalAmount || 0)}</p>
                              <StatusBadge status={booking.status} />
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

          {/* ===== ENQUIRIES TAB ===== */}
          {activeTab === 'enquiries' && (
            <div className="space-y-4">
              {bookingsLoading ? (
                <LoadingState message="Loading enquiries..." />
              ) : bookings.length > 0 ? (
                bookings.slice(0, 10).map((booking) => (
                  <Card key={booking.id} className="bg-card border-border">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold">{booking.user?.name || 'Customer'}</p>
                          <p className="text-body-sm text-gold">{booking.car?.brand} {booking.car?.model}</p>
                        </div>
                        <span className="text-caption text-muted-foreground">{booking.createdAt ? formatDate(booking.createdAt) : ''}</span>
                      </div>
                      <p className="text-body-sm text-muted-foreground mb-3">{booking.type} booking — {formatPrice(booking.totalAmount || 0)}</p>
                      <div className="flex items-center gap-2">
                        <Button size="sm" className="bg-gold hover:bg-gold-dark text-primary-foreground text-xs">
                          <MessageSquare className="size-3.5 mr-1" />Reply
                        </Button>
                        <Button variant="outline" size="sm" className="border-border text-muted-foreground hover:text-foreground text-xs">
                          <Phone className="size-3.5 mr-1" />{booking.user?.phone || 'N/A'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <EmptyState icon={<MessageSquare className="size-8" />} title="No enquiries yet" description="Enquiries will appear here when customers reach out about your cars." />
              )}
            </div>
          )}

          {/* ===== ANALYTICS TAB ===== */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total Views', value: statsLoading ? '...' : (stats?.engagement?.totalViews ?? 0).toLocaleString(), change: 'All time' },
                  { label: 'Total Enquiries', value: statsLoading ? '...' : (stats?.engagement?.totalEnquiries ?? 0).toLocaleString(), change: 'All time' },
                  { label: 'Avg. Rating', value: statsLoading ? '...' : rating.toFixed(1), change: `${stats?.engagement?.totalReviews ?? 0} reviews` },
                  { label: 'Total Sales', value: statsLoading ? '...' : String(stats?.profile?.totalSales ?? 0), change: 'All time' },
                ].map((stat) => (
                  <Card key={stat.label} className="bg-card border-border">
                    <CardContent className="p-4 sm:p-6">
                      <div className="text-overline text-muted-foreground mb-1">{stat.label}</div>
                      <div className="dash-heading-md">{stat.value}</div>
                      <span className="flex items-center text-overline text-emerald-400">
                        <ArrowUpRight className="size-3" />{stat.change}
                      </span>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-card border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="dash-heading-sm">Top Cars by Views</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 pt-2 space-y-3">
                    {statsLoading ? (
                      <LoadingState message="Loading..." />
                    ) : (stats?.topCars ?? []).length > 0 ? (
                      (stats?.topCars ?? []).map((car, idx) => (
                        <div key={car.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                          <div className="flex items-center gap-3">
                            <span className="text-body-sm font-bold text-gold w-6">#{idx + 1}</span>
                            <span className="text-body-sm">{car.brand} {car.model}</span>
                          </div>
                          <span className="text-body-sm text-muted-foreground">{car.views} views</span>
                        </div>
                      ))
                    ) : (
                      <EmptyState title="No data yet" />
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-card border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="dash-heading-sm">Revenue Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 pt-2 space-y-4">
                    {[
                      { label: 'Total Revenue', value: stats?.revenue?.total ?? 0, color: 'bg-gold', percent: 100 },
                      { label: 'This Month', value: monthlyRevenue, color: 'bg-emerald-500', percent: stats?.revenue?.total ? Math.round((monthlyRevenue / stats.revenue.total) * 100) : 0 },
                    ].map((item) => (
                      <div key={item.label}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-body-sm">{item.label}</span>
                          <span className="text-body-sm font-semibold text-gold">{formatPrice(item.value)}</span>
                        </div>
                        <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                          <div className={`h-full ${item.color} rounded-full transition-all duration-500`} style={{ width: `${Math.min(item.percent, 100)}%` }} />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* ===== PAYMENTS TAB ===== */}
          {activeTab === 'payments' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total Earned', value: formatPrice(stats?.revenue?.total ?? 0) },
                  { label: 'This Month', value: formatPrice(monthlyRevenue) },
                  { label: 'Active Bookings', value: String(activeBookings) },
                  { label: 'Total Listings', value: String(totalListings) },
                ].map((stat) => (
                  <Card key={stat.label} className="bg-card border-border">
                    <CardContent className="p-4">
                      <div className="text-overline text-muted-foreground">{stat.label}</div>
                      <div className="dash-heading-sm text-gold mt-1">{statsLoading ? '...' : stat.value}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {bookingsLoading ? (
                <LoadingState message="Loading payments..." />
              ) : bookings.length === 0 ? (
                <EmptyState title="No payments found" description="Payment records will appear here once bookings are processed." />
              ) : (
                <>
                  {/* Desktop */}
                  <Card className="bg-card border-border hidden md:block">
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <table className="w-full text-body-sm">
                          <thead>
                            <tr className="border-b border-border">
                              <th className="text-left py-3 px-4 text-muted-foreground font-medium">Booking ID</th>
                              <th className="text-left py-3 px-4 text-muted-foreground font-medium">Customer</th>
                              <th className="text-left py-3 px-4 text-muted-foreground font-medium">Amount</th>
                              <th className="text-left py-3 px-4 text-muted-foreground font-medium">Status</th>
                              <th className="text-left py-3 px-4 text-muted-foreground font-medium">Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {bookings.map((booking) => {
                              const payment = booking.payments?.[0]
                              return (
                                <tr key={booking.id} className="border-b border-border/50 hover:bg-secondary/50">
                                  <td className="py-3 px-4 font-mono text-caption">{booking.id.slice(0, 8)}...</td>
                                  <td className="py-3 px-4">{booking.user?.name || 'Customer'}</td>
                                  <td className="py-3 px-4 font-medium text-gold">{formatPrice(booking.totalAmount || 0)}</td>
                                  <td className="py-3 px-4"><StatusBadge status={payment ? payment.status : booking.status} /></td>
                                  <td className="py-3 px-4 text-muted-foreground">{booking.createdAt ? formatDate(booking.createdAt) : 'N/A'}</td>
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
                    {bookings.map((booking) => {
                      const payment = booking.payments?.[0]
                      return (
                        <Card key={booking.id} className="bg-card border-border">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="font-medium">{booking.user?.name || 'Customer'}</p>
                                <p className="text-caption text-muted-foreground font-mono">{booking.id.slice(0, 8)}...</p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-gold">{formatPrice(booking.totalAmount || 0)}</p>
                                <StatusBadge status={payment ? payment.status : booking.status} />
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

          {/* ===== SETTINGS TAB ===== */}
          {activeTab === 'settings' && (
            <div className="max-w-2xl mx-auto space-y-6">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="dash-heading-sm">Profile Settings</CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-muted-foreground text-caption">Company Name</Label>
                      <Input defaultValue={user?.dealer?.companyName as string || ''} className={INPUT_CLS} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground text-caption">Contact Email</Label>
                      <Input defaultValue={user?.email || ''} className={INPUT_CLS} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground text-caption">Phone</Label>
                      <Input defaultValue={user?.phone || ''} className={INPUT_CLS} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground text-caption">Location / City</Label>
                      <Input className={INPUT_CLS} />
                    </div>
                  </div>
                  <Button className="bg-gold hover:bg-gold-dark text-primary-foreground font-semibold">
                    Save Changes
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>

      {/* Delete Car Confirmation Dialog */}
      <AlertDialog open={!!deleteCarId} onOpenChange={(open) => { if (!open) setDeleteCarId(null) }}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Delete Car Listing</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to delete this car listing? This action cannot be undone and the listing will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border text-muted-foreground hover:bg-secondary hover:text-foreground">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCar} className="bg-red-500 hover:bg-red-600 text-white">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
