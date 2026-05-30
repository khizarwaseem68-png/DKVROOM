'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAppStore } from '@/lib/store'
import { carsApi, type CarData } from '@/lib/api'
import {
  formatPrice,
  formatMileage,
  CITIES,
  BRANDS,
  CONDITION_CATEGORIES,
} from '@/lib/constants'
import {
  StarRating,
  EmptyState,
  VehicleTypeBadge,
  ConditionCategoryBadge,
  RunningStatusBadge,
  SalvageStatusBadge,
  CountdownTimer,
} from '@/components/shared'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  MapPin,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Search,
  SlidersHorizontal,
  Gavel,
  Clock,
  X,
  AlertTriangle,
  Wrench,
  Fuel,
} from 'lucide-react'

// ============================================================
// Types
// ============================================================

interface CarListingProps {
  type: 'rent' | 'sale' | 'auction' | 'continueLoan'
  conditionCategory?: string
}

/** Display-ready car with parsed JSON fields */
interface NormalizedCar {
  id: string
  brand: string
  model: string
  year: number
  color: string
  mileage: number
  fuelType: string
  transmission: string
  seats: number
  condition: string
  price: number
  deposit: number | null
  monthlyInstallment: number | null
  remainingMonths: number | null
  remainingBalance: number | null
  takeoverAmount: number | null
  bankName: string | null
  location: string
  city: string
  description: string
  features: string[]
  photos: string[]
  featured: boolean
  type: 'rent' | 'sale' | 'auction' | 'continueLoan'
  dealerName: string
  dealerId: string
  dealerVerified: boolean
  rating: number
  vehicleCondition: string | null
  requiredDocs: string[]
  auctionEnd: string | null
  auctionStartBid: number | null
  currentBid: number | null
  conditionCategory: string | null
  damageDescription: string | null
  runningStatus: string | null
  salvageStatus: string | null
  repairEstimate: number | null
}

type PriceRange = 'all' | 'low' | 'mid' | 'high'

// ============================================================
// Constants
// ============================================================

const PAGE_SIZE = 6

const TYPE_META: Record<string, { title: string; subtitle: string }> = {
  rent: {
    title: 'Rent a Car',
    subtitle: 'Premium vehicles available for daily, weekly, or monthly rental',
  },
  sale: {
    title: 'Buy & Sell Cars',
    subtitle: 'Find your perfect ride from verified dealers across Malaysia',
  },
  auction: {
    title: 'Live Auctions',
    subtitle: 'Bid on exclusive vehicles — highest bidder wins',
  },
  continueLoan: {
    title: 'Continue Loan / Sambung Bayar',
    subtitle: 'Take over existing car loans with easy approval process',
  },
}

const PRICE_RANGES: { key: PriceRange; label: string }[] = [
  { key: 'all', label: 'All Prices' },
  { key: 'low', label: 'Under RM 100K' },
  { key: 'mid', label: 'RM 100K – 500K' },
  { key: 'high', label: 'Above RM 500K' },
]

const TRANSMISSION_OPTIONS = [
  { key: 'all', label: 'All Transmissions' },
  { key: 'auto', label: 'Automatic' },
  { key: 'manual', label: 'Manual' },
]

const FUEL_OPTIONS = [
  { key: 'all', label: 'All Fuel Types' },
  { key: 'petrol', label: 'Petrol' },
  { key: 'diesel', label: 'Diesel' },
  { key: 'hybrid', label: 'Hybrid' },
  { key: 'electric', label: 'Electric' },
]

// ============================================================
// Helpers
// ============================================================

/** Safely parse a JSON string field from the API */
function parseJsonField<T>(value: string | T[] | null | undefined, fallback: T[] = []): T[] {
  if (Array.isArray(value)) return value
  if (typeof value === 'string') {
    try { return JSON.parse(value) as T[] } catch { return fallback }
  }
  return fallback
}

/** Normalize raw API car data into display-ready shape */
function normalizeCar(raw: CarData): NormalizedCar {
  return {
    id: raw.id,
    brand: raw.brand,
    model: raw.model,
    year: raw.year,
    color: raw.color || 'N/A',
    mileage: raw.mileage || 0,
    fuelType: raw.fuelType || 'petrol',
    transmission: raw.transmission || 'auto',
    seats: raw.seats || 5,
    condition: raw.condition || 'used',
    price: raw.price || 0,
    deposit: raw.deposit ?? null,
    monthlyInstallment: raw.monthlyInstallment ?? null,
    remainingMonths: raw.remainingMonths ?? null,
    remainingBalance: raw.remainingBalance ?? null,
    takeoverAmount: raw.takeoverAmount ?? null,
    bankName: raw.bankName ?? null,
    location: raw.location || raw.city || '',
    city: raw.city || '',
    description: raw.description || '',
    features: parseJsonField(raw.features),
    photos: parseJsonField(raw.photos),
    featured: raw.featured || false,
    type: raw.type,
    dealerName: raw.dealer?.companyName || '',
    dealerId: raw.dealer?.id || raw.dealerId || '',
    dealerVerified: raw.dealer?.verified || false,
    rating: raw.dealer?.rating || 0,
    vehicleCondition: raw.vehicleCondition ?? null,
    requiredDocs: parseJsonField<string>(raw.requiredDocs),
    auctionEnd: raw.auctionEnd ?? null,
    auctionStartBid: raw.auctionStartBid ?? null,
    currentBid: raw.currentBid ?? null,
    conditionCategory: raw.conditionCategory ?? null,
    damageDescription: raw.damageDescription ?? null,
    runningStatus: raw.runningStatus ?? null,
    salvageStatus: raw.salvageStatus ?? null,
    repairEstimate: raw.repairEstimate ?? null,
  }
}

// ============================================================
// Sub-components
// ============================================================

function CarCardSkeleton() {
  return (
    <Card className="luxury-card overflow-hidden bg-card py-0 gap-0">
      <Skeleton className="aspect-[16/10] w-full rounded-none" />
      <CardContent className="p-4 space-y-3">
        <div className="space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <Skeleton className="h-7 w-1/3" />
        <Skeleton className="h-4 w-2/3" />
        <div className="h-px bg-border" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>
      </CardContent>
    </Card>
  )
}

function AuctionCardSkeleton() {
  return (
    <Card className="luxury-card overflow-hidden bg-card py-0 gap-0">
      <Skeleton className="aspect-[16/10] w-full rounded-none" />
      <CardContent className="p-4 space-y-3">
        <div className="space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-9 w-full" />
      </CardContent>
    </Card>
  )
}

function ContinueLoanCardSkeleton() {
  return (
    <Card className="luxury-card overflow-hidden bg-card py-0 gap-0">
      <Skeleton className="aspect-[16/10] w-full rounded-none" />
      <CardContent className="p-4 space-y-3">
        <div className="space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <div className="rounded-lg border border-border bg-muted/50 p-3 space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </div>
      </CardContent>
    </Card>
  )
}

/** Auction condition details block */
function AuctionConditionDetails({ car }: { car: NormalizedCar }) {
  return (
    <div className="space-y-1.5 mt-2 p-2.5 rounded-lg border border-border bg-muted/50">
      {/* Badges row */}
      <div className="flex flex-wrap gap-1.5">
        {car.conditionCategory && (
          <ConditionCategoryBadge category={car.conditionCategory} />
        )}
        {car.runningStatus && (
          <RunningStatusBadge status={car.runningStatus} />
        )}
        {car.salvageStatus && (
          <SalvageStatusBadge status={car.salvageStatus} />
        )}
      </div>

      {/* Repair estimate */}
      {car.repairEstimate != null && car.repairEstimate > 0 && (
        <div className="flex items-center justify-between text-body-sm">
          <span className="flex items-center gap-1 text-muted-foreground">
            <Wrench className="size-3" />
            Repair Est.
          </span>
          <span className="text-orange-400 font-medium">
            {formatPrice(car.repairEstimate)}
          </span>
        </div>
      )}

      {/* Damage description */}
      {car.damageDescription && (
        <p className="text-caption text-muted-foreground line-clamp-2 pt-1 border-t border-border">
          <AlertTriangle className="size-3 inline mr-1 shrink-0" />
          {car.damageDescription}
        </p>
      )}
    </div>
  )
}

/** Continue Loan details block */
function ContinueLoanDetails({ car }: { car: NormalizedCar }) {
  return (
    <div className="rounded-lg border border-gold/30 bg-gold/5 p-3 space-y-2">
      {car.takeoverAmount != null && car.takeoverAmount > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-overline text-muted-foreground">Takeover Amount</span>
          <span className="text-body-sm font-semibold text-gold">
            {formatPrice(car.takeoverAmount)}
          </span>
        </div>
      )}
      {car.deposit != null && car.deposit > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-overline text-muted-foreground">Deposit</span>
          <span className="text-body-sm font-semibold text-gold">
            {formatPrice(car.deposit)}
          </span>
        </div>
      )}
      <div className="flex items-center justify-between">
        <span className="text-overline text-muted-foreground">Monthly Installment</span>
        <span className="text-body-sm font-semibold text-foreground">
          {formatPrice(car.monthlyInstallment || 0)}/mo
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-overline text-muted-foreground">Remaining</span>
        <span className="text-caption text-muted-foreground">
          {car.remainingMonths ?? 0} months &middot; {formatPrice(car.remainingBalance || 0)}
        </span>
      </div>
      {car.bankName && (
        <div className="flex items-center justify-between">
          <span className="text-overline text-muted-foreground">Bank</span>
          <span className="text-caption font-medium text-foreground">{car.bankName}</span>
        </div>
      )}
    </div>
  )
}

/** Single car card in the grid */
function CarCard({ car, type }: { car: NormalizedCar; type: CarListingProps['type'] }) {
  const { selectCar } = useAppStore()
  const isAuction = car.type === 'auction'
  const isContinueLoan = car.type === 'continueLoan'

  return (
    <Card
      className="luxury-card cursor-pointer overflow-hidden bg-card py-0 gap-0"
      onClick={() => selectCar(car.id, car.type)}
    >
      {/* Image */}
      <div className="relative aspect-[16/10] overflow-hidden">
        <img
          src={car.photos[0] || '/placeholder-car.png'}
          alt={`${car.brand} ${car.model}`}
          className="h-full w-full object-cover transition-transform duration-500 hover:scale-110"
          loading="lazy"
        />

        {/* Top-left badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          <VehicleTypeBadge type={car.type} />
          {isAuction && car.conditionCategory && (
            <ConditionCategoryBadge category={car.conditionCategory} />
          )}
        </div>

        {/* Featured badge */}
        {car.featured && (
          <div className="absolute top-3 right-3">
            <Badge className="bg-gold text-black border-0 text-xs font-bold">
              &#9733; Featured
            </Badge>
          </div>
        )}

        {/* Auction countdown overlay */}
        {isAuction && car.auctionEnd && (
          <div className="absolute bottom-3 left-3 right-3">
            <div className="flex items-center gap-1.5 rounded-md bg-black/80 backdrop-blur-sm px-2.5 py-1.5">
              <Clock className="size-3.5 text-gold shrink-0" />
              <span className="text-gold font-medium text-xs">
                <CountdownTimer targetDate={car.auctionEnd} />
              </span>
            </div>
          </div>
        )}
      </div>

      <CardContent className="p-4 space-y-3">
        {/* Brand + Model + Year */}
        <div>
          <h3 className="heading-sm text-foreground leading-tight">
            {car.brand} {car.model}
          </h3>
          <p className="text-body-sm text-muted-foreground">
            {car.year} &middot; {car.color} &middot; {formatMileage(car.mileage)}
          </p>
        </div>

        {/* Quick spec pills */}
        <div className="flex items-center gap-2 flex-wrap">
          {car.fuelType && (
            <span className="inline-flex items-center gap-1 text-caption text-muted-foreground bg-muted px-2 py-0.5 rounded">
              <Fuel className="size-3" />
              {car.fuelType.charAt(0).toUpperCase() + car.fuelType.slice(1)}
            </span>
          )}
          {car.transmission && (
            <span className="inline-flex items-center gap-1 text-caption text-muted-foreground bg-muted px-2 py-0.5 rounded">
              {car.transmission === 'auto' ? 'Automatic' : 'Manual'}
            </span>
          )}
        </div>

        {/* Price section — type-specific */}
        {isContinueLoan ? (
          <ContinueLoanDetails car={car} />
        ) : isAuction ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-overline text-muted-foreground">Current Bid</span>
              <span className="heading-sm gold-text">
                {formatPrice(car.currentBid || 0)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-overline text-muted-foreground">Starting Bid</span>
              <span className="text-body-sm text-muted-foreground">
                {formatPrice(car.auctionStartBid || 0)}
              </span>
            </div>
            <Button
              className="w-full bg-gold text-black hover:bg-gold-light font-bold"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                selectCar(car.id, car.type)
              }}
            >
              <Gavel className="size-4" />
              Place Bid
            </Button>
            <AuctionConditionDetails car={car} />
          </div>
        ) : (
          <div className="flex items-baseline gap-1">
            <span className="heading-md gold-text">
              {formatPrice(car.price)}
            </span>
            {type === 'rent' && (
              <span className="text-body-sm text-muted-foreground">/day</span>
            )}
          </div>
        )}

        {/* Location */}
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <MapPin className="size-3.5 shrink-0" />
          <span className="text-caption truncate">{car.location || car.city}</span>
        </div>

        <div className="h-px bg-border" />

        {/* Dealer + Rating */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-caption text-muted-foreground truncate">
              {car.dealerName}
            </span>
            {car.dealerVerified && (
              <ShieldCheck className="size-3.5 text-gold shrink-0" />
            )}
          </div>
          <StarRating rating={car.rating} size="sm" />
        </div>
      </CardContent>
    </Card>
  )
}

/** Pagination controls */
function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}) {
  // Build visible page range (max 5 pages shown)
  const pages = useMemo(() => {
    const range: number[] = []
    const maxVisible = 5
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2))
    const end = Math.min(totalPages, start + maxVisible - 1)
    start = Math.max(1, end - maxVisible + 1)
    for (let i = start; i <= end; i++) range.push(i)
    return range
  }, [currentPage, totalPages])

  if (totalPages <= 1) return null

  return (
    <nav
      className="flex items-center justify-center gap-1.5 mt-8"
      aria-label="Pagination"
    >
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="size-9"
        aria-label="Previous page"
      >
        <ChevronLeft className="size-4" />
      </Button>

      {pages[0] > 1 && (
        <>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(1)}
            className="size-9"
          >
            1
          </Button>
          {pages[0] > 2 && (
            <span className="text-muted-foreground px-1 select-none">&hellip;</span>
          )}
        </>
      )}

      {pages.map((page) => (
        <Button
          key={page}
          variant={currentPage === page ? 'default' : 'outline'}
          size="icon"
          onClick={() => onPageChange(page)}
          className={`size-9 ${
            currentPage === page
              ? 'bg-gold text-black hover:bg-gold-light'
              : ''
          }`}
          aria-current={currentPage === page ? 'page' : undefined}
        >
          {page}
        </Button>
      ))}

      {pages[pages.length - 1] < totalPages && (
        <>
          {pages[pages.length - 1] < totalPages - 1 && (
            <span className="text-muted-foreground px-1 select-none">&hellip;</span>
          )}
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(totalPages)}
            className="size-9"
          >
            {totalPages}
          </Button>
        </>
      )}

      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="size-9"
        aria-label="Next page"
      >
        <ChevronRight className="size-4" />
      </Button>
    </nav>
  )
}

/** Active filter badge row */
function ActiveFilterBadge({
  label,
  onRemove,
}: {
  label: string
  onRemove: () => void
}) {
  return (
    <Badge variant="secondary" className="gap-1 text-xs">
      {label}
      <X
        className="size-3 cursor-pointer hover:text-foreground"
        onClick={onRemove}
      />
    </Badge>
  )
}

// ============================================================
// Main Component
// ============================================================

export default function CarListing({ type, conditionCategory }: CarListingProps) {
  const { searchQuery } = useAppStore()

  // Filters
  const [brandFilter, setBrandFilter] = useState('All Brands')
  const [cityFilter, setCityFilter] = useState('All Cities')
  const [transmissionFilter, setTransmissionFilter] = useState('all')
  const [fuelFilter, setFuelFilter] = useState('all')
  const [priceRange, setPriceRange] = useState<PriceRange>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)

  // Data
  const [cars, setCars] = useState<NormalizedCar[]>([])
  const [loading, setLoading] = useState(true)
  const [totalCars, setTotalCars] = useState(0)

  // Derived
  const meta = TYPE_META[type] ?? TYPE_META.sale
  const totalPages = Math.max(1, Math.ceil(totalCars / PAGE_SIZE))

  // Fetch cars from API
  const fetchCars = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string | number | boolean | undefined> = {
        page: currentPage,
        limit: PAGE_SIZE,
        status: 'approved',
        type,
      }

      if (conditionCategory) params.conditionCategory = conditionCategory
      if (brandFilter !== 'All Brands') params.brand = brandFilter
      if (cityFilter !== 'All Cities') params.city = cityFilter
      if (searchQuery) params.search = searchQuery

      if (priceRange === 'low') {
        params.maxPrice = 99999
      } else if (priceRange === 'mid') {
        params.minPrice = 100000
        params.maxPrice = 499999
      } else if (priceRange === 'high') {
        params.minPrice = 500000
      }

      const result = await carsApi.list(params)
      const rawCars = result.data || []
      let normalized = rawCars.map(normalizeCar)

      // Client-side filtering for transmission and fuel
      if (transmissionFilter !== 'all') {
        normalized = normalized.filter((c) => c.transmission === transmissionFilter)
      }
      if (fuelFilter !== 'all') {
        normalized = normalized.filter((c) => c.fuelType === fuelFilter)
      }

      setCars(normalized)
      setTotalCars(result.pagination?.total || 0)
    } catch {
      // Silent error handling — show empty state
      setCars([])
      setTotalCars(0)
    } finally {
      setLoading(false)
    }
  }, [type, currentPage, brandFilter, cityFilter, searchQuery, priceRange, transmissionFilter, fuelFilter, conditionCategory])

  useEffect(() => {
    fetchCars()
  }, [fetchCars])

  /** Update a filter and reset to page 1 */
  const updateFilter = useCallback(
    (setter: (val: string) => void, value: string) => {
      setter(value)
      setCurrentPage(1)
    },
    []
  )

  const clearFilters = useCallback(() => {
    setBrandFilter('All Brands')
    setCityFilter('All Cities')
    setTransmissionFilter('all')
    setFuelFilter('all')
    setPriceRange('all')
    setCurrentPage(1)
  }, [])

  const hasActiveFilters =
    brandFilter !== 'All Brands' ||
    cityFilter !== 'All Cities' ||
    transmissionFilter !== 'all' ||
    fuelFilter !== 'all' ||
    priceRange !== 'all'

  // Choose skeleton variant based on type
  const SkeletonCard = type === 'auction'
    ? AuctionCardSkeleton
    : type === 'continueLoan'
      ? ContinueLoanCardSkeleton
      : CarCardSkeleton

  // Condition category label for the header subtitle
  const conditionLabel = conditionCategory
    ? CONDITION_CATEGORIES.find((c) => c.key === conditionCategory)?.label
    : null

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <h1 className="heading-lg gold-text">{meta.title}</h1>
          <p className="mt-2 text-body-sm text-muted-foreground sm:text-body">
            {conditionLabel ? `${conditionLabel} — ${meta.subtitle}` : meta.subtitle}
          </p>
          <p className="mt-1 text-body-sm text-muted-foreground">
            {totalCars} vehicle{totalCars !== 1 ? 's' : ''} available
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Mobile filter toggle */}
        <div className="flex items-center justify-between mb-4 lg:hidden">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters((v) => !v)}
            className="gap-2"
          >
            <SlidersHorizontal className="size-4" />
            Filters
            {hasActiveFilters && <span className="size-2 rounded-full bg-gold" />}
          </Button>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="gap-1 text-muted-foreground"
            >
              <X className="size-3.5" />
              Clear
            </Button>
          )}
        </div>

        {/* Filter bar */}
        <div
          className={`grid gap-3 mb-6 transition-all duration-300 ${
            showFilters
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-5'
              : 'hidden lg:grid lg:grid-cols-5'
          }`}
        >
          {/* Brand */}
          <Select value={brandFilter} onValueChange={(v) => updateFilter(setBrandFilter, v)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All Brands" />
            </SelectTrigger>
            <SelectContent>
              {BRANDS.map((brand) => (
                <SelectItem key={brand} value={brand}>
                  {brand}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* City */}
          <Select value={cityFilter} onValueChange={(v) => updateFilter(setCityFilter, v)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All Cities" />
            </SelectTrigger>
            <SelectContent>
              {CITIES.map((city) => (
                <SelectItem key={city} value={city}>
                  {city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Price Range */}
          <Select
            value={priceRange}
            onValueChange={(v) => updateFilter((val) => setPriceRange(val as PriceRange), v)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Price Range" />
            </SelectTrigger>
            <SelectContent>
              {PRICE_RANGES.map((pr) => (
                <SelectItem key={pr.key} value={pr.key}>
                  {pr.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Transmission */}
          <Select value={transmissionFilter} onValueChange={(v) => updateFilter(setTransmissionFilter, v)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Transmission" />
            </SelectTrigger>
            <SelectContent>
              {TRANSMISSION_OPTIONS.map((opt) => (
                <SelectItem key={opt.key} value={opt.key}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Fuel Type */}
          <Select value={fuelFilter} onValueChange={(v) => updateFilter(setFuelFilter, v)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Fuel Type" />
            </SelectTrigger>
            <SelectContent>
              {FUEL_OPTIONS.map((opt) => (
                <SelectItem key={opt.key} value={opt.key}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Active filter indicators (desktop) */}
        {hasActiveFilters && (
          <div className="hidden lg:flex items-center gap-2 mb-4 flex-wrap">
            <span className="text-overline text-muted-foreground">Active filters:</span>
            {brandFilter !== 'All Brands' && (
              <ActiveFilterBadge
                label={brandFilter}
                onRemove={() => updateFilter(setBrandFilter, 'All Brands')}
              />
            )}
            {cityFilter !== 'All Cities' && (
              <ActiveFilterBadge
                label={cityFilter}
                onRemove={() => updateFilter(setCityFilter, 'All Cities')}
              />
            )}
            {transmissionFilter !== 'all' && (
              <ActiveFilterBadge
                label={transmissionFilter === 'auto' ? 'Automatic' : 'Manual'}
                onRemove={() => updateFilter(setTransmissionFilter, 'all')}
              />
            )}
            {fuelFilter !== 'all' && (
              <ActiveFilterBadge
                label={fuelFilter.charAt(0).toUpperCase() + fuelFilter.slice(1)}
                onRemove={() => updateFilter(setFuelFilter, 'all')}
              />
            )}
            {priceRange !== 'all' && (
              <ActiveFilterBadge
                label={
                  priceRange === 'low'
                    ? '< RM 100K'
                    : priceRange === 'mid'
                      ? 'RM 100K–500K'
                      : '> RM 500K'
                }
                onRemove={() => {
                  setPriceRange('all')
                  setCurrentPage(1)
                }}
              />
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-caption text-muted-foreground h-6 px-2"
            >
              Clear all
            </Button>
          </div>
        )}

        {/* Content area */}
        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {Array.from({ length: PAGE_SIZE }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : cars.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {cars.map((car) => (
                <CarCard key={car.id} car={car} type={type} />
              ))}
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </>
        ) : (
          <EmptyState
            icon={<Search className="size-8 text-muted-foreground" />}
            title="No vehicles found"
            description="Try adjusting your filters or search criteria to find what you're looking for."
            action={
              hasActiveFilters ? (
                <Button
                  variant="outline"
                  className="mt-2 gap-2"
                  onClick={clearFilters}
                >
                  <X className="size-4" />
                  Clear all filters
                </Button>
              ) : undefined
            }
          />
        )}
      </div>
    </div>
  )
}
