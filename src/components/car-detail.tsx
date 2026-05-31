'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/lib/store'
import { carsApi, bookingsApi } from '@/lib/api'
import { formatPrice, formatMileage, formatDate } from '@/lib/constants'
import {
  StarRating,
  LoadingState,
  EmptyState,
  VehicleTypeBadge,
  ConditionCategoryBadge,
  RunningStatusBadge,
  SalvageStatusBadge,
  CountdownTimer,
} from '@/components/shared'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import {
  ArrowLeft,
  MapPin,
  ShieldCheck,
  Phone,
  MessageCircle,
  Calendar,
  Palette,
  Gauge,
  Fuel,
  Settings2,
  Users,
  ClipboardCheck,
  Clock,
  Gavel,
  Banknote,
  FileText,
  Building2,
  ZoomIn,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  ExternalLink,
  Lock,
  Unlock,
  Info,
  Handshake,
  Wallet,
  CircleDollarSign,
  Car,
  AlertTriangle,
  Shield,
  Send,
  Loader2,
  Truck,
  Wrench,
  X,
} from 'lucide-react'

// ─── Interfaces ────────────────────────────────────────────────────────────────

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
  weeklyPrice: number | null
  monthlyPrice: number | null
  deposit: number | null
  bookingFee: number | null
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
  requiredDocs: string[] | null
  auctionEnd: string | null
  auctionStartBid: number | null
  currentBid: number | null
  conditionCategory: string | null
  damageDescription: string | null
  runningStatus: string | null
  salvageStatus: string | null
  repairEstimate: number | null
  rentalTerms: string | null
  pickupAvailable: boolean
  deliveryAvailable: boolean
  deliveryFee: number | null
  availableFrom: string | null
  availableTo: string | null
}

interface BookingPayload {
  carId: string
  type: string
  totalAmount: number
  startDate?: string
  endDate?: string
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function safeJsonParse<T>(value: unknown, fallback: T): T {
  if (Array.isArray(value)) return value as T
  if (typeof value === 'string') {
    try { return JSON.parse(value) as T } catch { return fallback }
  }
  return fallback
}

function normalizeCar(apiCar: Record<string, unknown>): NormalizedCar {
  const dealer = apiCar.dealer as Record<string, unknown> | undefined
  return {
    id: String(apiCar.id ?? ''),
    brand: String(apiCar.brand ?? ''),
    model: String(apiCar.model ?? ''),
    year: Number(apiCar.year ?? 0),
    color: String(apiCar.color ?? 'N/A'),
    mileage: Number(apiCar.mileage ?? 0),
    fuelType: String(apiCar.fuelType ?? 'petrol'),
    transmission: String(apiCar.transmission ?? 'auto'),
    seats: Number(apiCar.seats ?? 5),
    condition: String(apiCar.condition ?? 'used'),
    price: Number(apiCar.price ?? 0),
    weeklyPrice: apiCar.weeklyPrice != null ? Number(apiCar.weeklyPrice) : null,
    monthlyPrice: apiCar.monthlyPrice != null ? Number(apiCar.monthlyPrice) : null,
    deposit: apiCar.deposit != null ? Number(apiCar.deposit) : null,
    bookingFee: apiCar.bookingFee != null ? Number(apiCar.bookingFee) : null,
    monthlyInstallment: apiCar.monthlyInstallment != null ? Number(apiCar.monthlyInstallment) : null,
    remainingMonths: apiCar.remainingMonths != null ? Number(apiCar.remainingMonths) : null,
    remainingBalance: apiCar.remainingBalance != null ? Number(apiCar.remainingBalance) : null,
    takeoverAmount: apiCar.takeoverAmount != null ? Number(apiCar.takeoverAmount) : null,
    bankName: apiCar.bankName != null ? String(apiCar.bankName) : null,
    location: String(apiCar.location ?? apiCar.city ?? ''),
    city: String(apiCar.city ?? ''),
    description: String(apiCar.description ?? ''),
    features: safeJsonParse<string[]>(apiCar.features, []),
    photos: safeJsonParse<string[]>(apiCar.photos, []),
    featured: Boolean(apiCar.featured ?? false),
    type: String(apiCar.type ?? 'sale') as NormalizedCar['type'],
    dealerName: String(dealer?.companyName ?? ''),
    dealerId: String(dealer?.id ?? apiCar.dealerId ?? ''),
    dealerVerified: Boolean(dealer?.verified ?? false),
    rating: Number(dealer?.rating ?? 0),
    vehicleCondition: apiCar.vehicleCondition != null ? String(apiCar.vehicleCondition) : null,
    requiredDocs: safeJsonParse<string[] | null>(apiCar.requiredDocs, null),
    auctionEnd: apiCar.auctionEnd ? new Date(String(apiCar.auctionEnd)).toISOString() : null,
    auctionStartBid: apiCar.auctionStartBid != null ? Number(apiCar.auctionStartBid) : null,
    currentBid: apiCar.currentBid != null ? Number(apiCar.currentBid) : null,
    conditionCategory: apiCar.conditionCategory != null ? String(apiCar.conditionCategory) : null,
    damageDescription: apiCar.damageDescription != null ? String(apiCar.damageDescription) : null,
    runningStatus: apiCar.runningStatus != null ? String(apiCar.runningStatus) : null,
    salvageStatus: apiCar.salvageStatus != null ? String(apiCar.salvageStatus) : null,
    repairEstimate: apiCar.repairEstimate != null ? Number(apiCar.repairEstimate) : null,
    rentalTerms: apiCar.rentalTerms != null ? String(apiCar.rentalTerms) : null,
    pickupAvailable: Boolean(apiCar.pickupAvailable ?? false),
    deliveryAvailable: Boolean(apiCar.deliveryAvailable ?? false),
    deliveryFee: apiCar.deliveryFee != null ? Number(apiCar.deliveryFee) : null,
    availableFrom: apiCar.availableFrom != null ? String(apiCar.availableFrom) : null,
    availableTo: apiCar.availableTo != null ? String(apiCar.availableTo) : null,
  }
}

function getDealerPhone(dealerId: string): string {
  const seed = dealerId.charCodeAt(1) || 1
  const prefix = '01'
  const mid = String(2 + (seed % 8)).padStart(2, '0')
  const suffix = String(10000 + ((seed * 137) % 89999))
  return `${prefix}${mid}-${suffix.slice(0, 4)} ${suffix.slice(4)}`
}

function getWhatsAppLink(dealerId: string, carName: string): string {
  const phone = getDealerPhone(dealerId).replace(/[-\s]/g, '')
  const message = encodeURIComponent(
    `Hi, I'm interested in the ${carName} listed on DK Vroom. Is it still available?`
  )
  return `https://wa.me/6${phone}?text=${message}`
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

// ─── Image Gallery with Lightbox ───────────────────────────────────────────────

function ImageGallery({ car }: { car: NormalizedCar }) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const photos = car.photos.length > 0 ? car.photos : []

  const openLightbox = useCallback((index: number) => {
    setSelectedIndex(index)
    setLightboxOpen(true)
  }, [])

  const navigateImage = useCallback(
    (direction: 'prev' | 'next') => {
      setSelectedIndex((prev) =>
        direction === 'prev'
          ? prev > 0 ? prev - 1 : photos.length - 1
          : prev < photos.length - 1 ? prev + 1 : 0
      )
    },
    [photos.length]
  )

  return (
    <div className="space-y-4">
      {/* Main image */}
      <div
        className="relative aspect-[16/10] overflow-hidden rounded-xl border border-border bg-muted cursor-pointer group"
        onClick={() => photos.length > 0 && openLightbox(selectedIndex)}
        role={photos.length > 0 ? 'button' : undefined}
        tabIndex={photos.length > 0 ? 0 : undefined}
        aria-label={photos.length > 0 ? 'View full image' : undefined}
      >
        {photos.length > 0 ? (
          <img
            src={photos[selectedIndex]}
            alt={`${car.brand} ${car.model} - photo ${selectedIndex + 1}`}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="h-full w-full flex flex-col items-center justify-center text-muted-foreground gap-2">
            <Car className="size-16" />
            <span className="text-body-sm">No photos available</span>
          </div>
        )}

        {/* Navigation arrows */}
        {photos.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-foreground size-9 rounded-full"
              onClick={(e) => { e.stopPropagation(); navigateImage('prev') }}
              aria-label="Previous image"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-foreground size-9 rounded-full"
              onClick={(e) => { e.stopPropagation(); navigateImage('next') }}
              aria-label="Next image"
            >
              <ChevronRight className="size-4" />
            </Button>
          </>
        )}

        {/* Zoom hint overlay */}
        {photos.length > 0 && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-md bg-black/60 px-2.5 py-1.5 text-xs text-foreground/80">
            <ZoomIn className="size-3.5" />
            View full size
          </div>
        )}

        {/* Image counter */}
        {photos.length > 1 && (
          <div className="absolute bottom-3 left-3 rounded-md bg-black/60 px-2.5 py-1.5 text-xs text-foreground/80">
            {selectedIndex + 1} / {photos.length}
          </div>
        )}
      </div>

      {/* Thumbnail gallery */}
      {photos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {photos.map((photo, index) => (
            <button
              key={index}
              className={`relative shrink-0 aspect-[16/10] w-20 sm:w-28 overflow-hidden rounded-lg border-2 transition-all ${
                selectedIndex === index
                  ? 'border-gold shadow-md shadow-gold/20'
                  : 'border-border hover:border-gold/50 opacity-70 hover:opacity-100'
              }`}
              onClick={() => setSelectedIndex(index)}
              aria-label={`View photo ${index + 1}`}
            >
              <img
                src={photo}
                alt={`${car.brand} ${car.model} - thumbnail ${index + 1}`}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox Dialog */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-5xl w-full bg-background/95 border-border p-0 overflow-hidden" showCloseButton={false}>
          <DialogTitle className="sr-only">
            {car.brand} {car.model} - Photo {selectedIndex + 1}
          </DialogTitle>
          <div className="relative aspect-[16/10] w-full">
            {photos.length > 0 && (
              <img
                src={photos[selectedIndex]}
                alt={`${car.brand} ${car.model} - full size ${selectedIndex + 1}`}
                className="h-full w-full object-contain bg-black/20"
              />
            )}

            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-3 right-3 bg-black/50 hover:bg-black/70 text-foreground size-9 rounded-full"
              onClick={() => setLightboxOpen(false)}
              aria-label="Close lightbox"
            >
              <X className="size-4" />
            </Button>

            {/* Lightbox navigation */}
            {photos.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-foreground size-10 rounded-full"
                  onClick={() => navigateImage('prev')}
                  aria-label="Previous image"
                >
                  <ChevronLeft className="size-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-foreground size-10 rounded-full"
                  onClick={() => navigateImage('next')}
                  aria-label="Next image"
                >
                  <ChevronRight className="size-5" />
                </Button>
                {/* Counter */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-4 py-1.5 text-sm text-foreground/80 font-medium">
                  {selectedIndex + 1} / {photos.length}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Vehicle Specs Section ─────────────────────────────────────────────────────

function VehicleSpecsSection({ car }: { car: NormalizedCar }) {
  const specItems = [
    { icon: Calendar, label: 'Year', value: String(car.year) },
    { icon: Palette, label: 'Color', value: car.color },
    { icon: Gauge, label: 'Mileage', value: formatMileage(car.mileage) },
    { icon: Fuel, label: 'Fuel', value: capitalize(car.fuelType) },
    { icon: Settings2, label: 'Transmission', value: car.transmission === 'auto' ? 'Automatic' : 'Manual' },
    { icon: Users, label: 'Seats', value: String(car.seats) },
    { icon: ClipboardCheck, label: 'Condition', value: capitalize(car.condition) },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {specItems.map((spec) => (
        <div key={spec.label} className="flex items-start gap-2.5 rounded-lg bg-muted/50 p-3">
          <spec.icon className="size-4 text-gold mt-0.5 shrink-0" />
          <div className="min-w-0">
            <p className="text-overline text-muted-foreground">{spec.label}</p>
            <p className="text-body-sm font-medium text-foreground truncate">{spec.value}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Auction Condition Section ─────────────────────────────────────────────────

function AuctionConditionSection({ car }: { car: NormalizedCar }) {
  return (
    <Card className="border-border bg-card overflow-hidden">
      <CardHeader className="pb-0 pt-4 px-4 sm:px-6">
        <CardTitle className="text-foreground flex items-center gap-2 heading-sm">
          <ClipboardCheck className="size-5 text-gold" />
          Vehicle Condition
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-4 sm:p-6 pt-3">
        {/* Badges row */}
        <div className="flex flex-wrap gap-2">
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

        {/* Condition description */}
        {car.vehicleCondition && (
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-overline text-muted-foreground mb-1">Condition Details</p>
            <p className="text-body-sm text-foreground leading-relaxed">{car.vehicleCondition}</p>
          </div>
        )}

        {/* Damage description */}
        {car.damageDescription && (
          <div className="rounded-lg bg-destructive/5 border border-destructive/20 p-3">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="size-4 text-destructive shrink-0" />
              <p className="text-overline text-destructive">Damage Description</p>
            </div>
            <p className="text-body-sm text-foreground leading-relaxed">{car.damageDescription}</p>
          </div>
        )}

        {/* Repair estimate */}
        {car.repairEstimate != null && car.repairEstimate > 0 && (
          <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
            <div className="flex items-center gap-2">
              <Wrench className="size-4 text-gold shrink-0" />
              <span className="text-body-sm text-muted-foreground">Estimated Repair Cost</span>
            </div>
            <span className="text-body-sm font-bold text-gold">{formatPrice(car.repairEstimate)}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Auction Details Card ──────────────────────────────────────────────────────

function AuctionDetailsCard({ car }: { car: NormalizedCar }) {
  const depositAmount = Math.round((car.currentBid || car.auctionStartBid || 0) * 0.1)

  return (
    <Card className="border-gold/40 gold-glow bg-gold/5 overflow-hidden">
      <CardHeader className="pb-0 pt-4 px-4 sm:px-6">
        <CardTitle className="text-gold flex items-center gap-2 heading-sm">
          <Gavel className="size-5" />
          Auction Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-4 sm:p-6 pt-3">
        <div>
          <p className="text-overline text-muted-foreground mb-1">Current Bid</p>
          <p className="heading-lg gold-text">{formatPrice(car.currentBid || 0)}</p>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-body-sm text-muted-foreground">Starting Bid</span>
          <span className="text-body-sm font-medium text-foreground">{formatPrice(car.auctionStartBid || 0)}</span>
        </div>
        <Separator className="bg-border/50" />
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="size-4 text-gold" />
            <span className="text-body-sm font-medium text-foreground">Time Remaining</span>
          </div>
          {car.auctionEnd && <CountdownTimer targetDate={car.auctionEnd} />}
        </div>
        <div className="flex items-center justify-between rounded-lg bg-background/60 p-3">
          <div className="flex items-center gap-2">
            <Wallet className="size-4 text-gold" />
            <span className="text-body-sm text-muted-foreground">Required Deposit (10%)</span>
          </div>
          <span className="text-body-sm font-bold text-gold">{formatPrice(depositAmount)}</span>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Sale Pricing Card ─────────────────────────────────────────────────────────

function SalePricingCard({ car }: { car: NormalizedCar }) {
  return (
    <Card className="border-gold/40 gold-glow bg-gold/5 overflow-hidden">
      <CardHeader className="pb-0 pt-4 px-4 sm:px-6">
        <CardTitle className="text-gold flex items-center gap-2 heading-sm">
          <Banknote className="size-5" />
          Purchase Price
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-4 sm:p-6 pt-3">
        <div className="rounded-lg bg-background/60 p-4 text-center">
          <p className="text-overline text-muted-foreground mb-1">Asking Price</p>
          <p className="heading-lg gold-text">{formatPrice(car.price)}</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-gold/10 p-3">
          <Info className="size-4 text-gold shrink-0" />
          <p className="text-body-sm text-gold/80">
            Send an enquiry with a RM 100 booking fee to unlock dealer contact details and WhatsApp.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Continue Loan Card ────────────────────────────────────────────────────────

function ContinueLoanCard({ car }: { car: NormalizedCar }) {
  const totalMonths = 60
  const paidMonths = car.remainingMonths ? totalMonths - car.remainingMonths : 0
  const progressPercent = car.remainingMonths ? (paidMonths / totalMonths) * 100 : 0

  return (
    <Card className="border-gold/40 gold-glow bg-gold/5 overflow-hidden">
      <CardHeader className="pb-0 pt-4 px-4 sm:px-6">
        <CardTitle className="text-gold flex items-center gap-2 heading-sm">
          <FileText className="size-5" />
          Loan Takeover Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-4 sm:p-6 pt-3">
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <div className="rounded-lg bg-background/60 p-3">
            <p className="text-overline text-muted-foreground">Takeover Amount</p>
            <p className="heading-sm text-gold">{formatPrice(car.takeoverAmount || car.deposit || 0)}</p>
          </div>
          <div className="rounded-lg bg-background/60 p-3">
            <p className="text-overline text-muted-foreground">Monthly Installment</p>
            <p className="heading-sm text-foreground">{formatPrice(car.monthlyInstallment || 0, 'continueLoan')}</p>
          </div>
          <div className="rounded-lg bg-background/60 p-3">
            <p className="text-overline text-muted-foreground">Remaining Months</p>
            <p className="heading-sm text-foreground">{car.remainingMonths ?? '—'} months</p>
          </div>
          <div className="rounded-lg bg-background/60 p-3">
            <p className="text-overline text-muted-foreground">Remaining Balance</p>
            <p className="heading-sm text-foreground">{formatPrice(car.remainingBalance || 0)}</p>
          </div>
        </div>

        {car.bankName && (
          <div className="flex items-center gap-2 rounded-lg bg-background/60 p-3">
            <Building2 className="size-4 text-gold shrink-0" />
            <span className="text-body-sm text-muted-foreground">Bank:</span>
            <span className="text-body-sm font-semibold text-foreground">{car.bankName}</span>
          </div>
        )}

        {/* Loan progress */}
        <div>
          <div className="flex justify-between text-overline text-muted-foreground mb-1.5">
            <span>Loan Progress</span>
            <span>{paidMonths > 0 ? `${paidMonths} of ${totalMonths} months paid` : ''}</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        {/* Required Documents */}
        {car.requiredDocs && car.requiredDocs.length > 0 && (
          <div className="space-y-2">
            <p className="text-overline text-muted-foreground">Required Documents</p>
            {car.requiredDocs.map((doc, index) => (
              <div
                key={index}
                className="flex items-center gap-3 rounded-lg bg-muted/50 p-2.5"
              >
                <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-gold/10 text-gold text-xs font-bold">
                  {index + 1}
                </div>
                <span className="text-body-sm text-foreground">{doc}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Rental Pricing Card ───────────────────────────────────────────────────────

function RentalPricingCard({ car }: { car: NormalizedCar }) {
  const daily = car.price
  const weekly = car.weeklyPrice ?? Math.round(daily * 6.5)
  const monthly = car.monthlyPrice ?? Math.round(daily * 25)

  return (
    <Card className="border-gold/40 gold-glow bg-gold/5 overflow-hidden">
      <CardHeader className="pb-0 pt-4 px-4 sm:px-6">
        <CardTitle className="text-gold flex items-center gap-2 heading-sm">
          <Calendar className="size-5" />
          Rental Pricing
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-4 sm:p-6 pt-3">
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div className="rounded-lg bg-background/60 p-3 text-center">
            <p className="text-overline text-muted-foreground mb-1">Daily</p>
            <p className="heading-sm gold-text">{formatPrice(daily, 'rent')}</p>
          </div>
          <div className="rounded-lg bg-background/60 p-3 text-center">
            <p className="text-overline text-muted-foreground mb-1">Weekly</p>
            <p className="heading-sm text-foreground">{formatPrice(weekly)}</p>
          </div>
          <div className="rounded-lg bg-background/60 p-3 text-center">
            <p className="text-overline text-muted-foreground mb-1">Monthly</p>
            <p className="heading-sm text-foreground">{formatPrice(monthly)}</p>
          </div>
        </div>

        {/* Security deposit */}
        {(car.deposit ?? 0) > 0 && (
          <div className="flex items-center justify-between rounded-lg bg-background/60 p-3">
            <div className="flex items-center gap-2">
              <Wallet className="size-4 text-gold" />
              <span className="text-body-sm text-muted-foreground">Security Deposit</span>
            </div>
            <span className="text-body-sm font-bold text-foreground">{formatPrice(car.deposit ?? 0)}</span>
          </div>
        )}

        {/* Pickup / Delivery */}
        {(car.pickupAvailable || car.deliveryAvailable) && (
          <div className="space-y-2">
            {car.pickupAvailable && (
              <div className="flex items-center gap-2 rounded-lg bg-background/60 p-3">
                <Car className="size-4 text-gold shrink-0" />
                <span className="text-body-sm text-foreground">Self Pickup Available</span>
              </div>
            )}
            {car.deliveryAvailable && (
              <div className="flex items-center justify-between rounded-lg bg-background/60 p-3">
                <div className="flex items-center gap-2">
                  <Truck className="size-4 text-gold shrink-0" />
                  <span className="text-body-sm text-foreground">Delivery Available</span>
                </div>
                {car.deliveryFee != null && car.deliveryFee > 0 && (
                  <span className="text-body-sm font-bold text-foreground">{formatPrice(car.deliveryFee)}</span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Available dates */}
        {(car.availableFrom || car.availableTo) && (
          <div className="flex items-center gap-2 rounded-lg bg-background/60 p-3">
            <Calendar className="size-4 text-gold shrink-0" />
            <span className="text-body-sm text-muted-foreground">Available:</span>
            <span className="text-body-sm font-semibold text-foreground">
              {car.availableFrom && car.availableTo
                ? `${formatDate(car.availableFrom)} — ${formatDate(car.availableTo)}`
                : car.availableFrom
                ? `From ${formatDate(car.availableFrom)}`
                : `Until ${formatDate(car.availableTo!)}`}
            </span>
          </div>
        )}

        {/* Rental terms */}
        {car.rentalTerms && (
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-overline text-muted-foreground mb-1">Rental Terms</p>
            <p className="text-body-sm text-foreground leading-relaxed">{car.rentalTerms}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Dealer Info Card ──────────────────────────────────────────────────────────

function DealerInfoCard({ car, contactUnlocked }: { car: NormalizedCar; contactUnlocked: boolean }) {
  const carName = `${car.brand} ${car.model}`
  const dealerInitials = car.dealerName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <Card className="border-border bg-card overflow-hidden">
      <CardContent className="p-4 sm:p-6">
        {/* Dealer header */}
        <div className="flex items-center gap-3 mb-4">
          <Avatar className="size-12 border border-gold/30">
            <AvatarFallback className="bg-gold/10 text-gold font-bold text-sm">
              {dealerInitials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground truncate text-body">{car.dealerName}</span>
              {car.dealerVerified && <ShieldCheck className="size-4 text-gold shrink-0" />}
            </div>
            <StarRating rating={car.rating} size="sm" />
          </div>
        </div>

        {/* Contact section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-body-sm font-medium text-foreground">Contact Information</h4>
            {contactUnlocked ? (
              <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-600/30 gap-1 text-overline px-2 py-0.5">
                <Unlock className="size-3" />
                Unlocked
              </Badge>
            ) : (
              <Badge className="bg-gold/10 text-gold border-gold/30 gap-1 text-overline px-2 py-0.5">
                <Lock className="size-3" />
                Locked
              </Badge>
            )}
          </div>

          <Separator className="bg-border/50" />

          {/* Phone */}
          <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
            <div className={`flex size-8 items-center justify-center rounded-full shrink-0 ${
              contactUnlocked ? 'bg-emerald-600/20' : 'bg-gold/10'
            }`}>
              <Phone className={`size-4 ${contactUnlocked ? 'text-emerald-400' : 'text-gold/50'}`} />
            </div>
            <div>
              <p className="text-overline text-muted-foreground">Phone</p>
              {contactUnlocked ? (
                <p className="text-body-sm font-semibold text-foreground">{getDealerPhone(car.dealerId)}</p>
              ) : (
                <>
                  <div className="flex items-center gap-1.5">
                    <span className="text-body-sm font-semibold text-muted-foreground/40">
                      01X-XXXX XXXX
                    </span>
                    <Lock className="size-3 text-gold/60" />
                  </div>
                  <p className="text-caption text-gold/70 mt-0.5">Unlocked after payment verification</p>
                </>
              )}
            </div>
          </div>

          {/* WhatsApp */}
          <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
            <div className={`flex size-8 items-center justify-center rounded-full shrink-0 ${
              contactUnlocked ? 'bg-emerald-600/20' : 'bg-muted'
            }`}>
              <MessageCircle className={`size-4 ${contactUnlocked ? 'text-emerald-400' : 'text-muted-foreground/50'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-overline text-muted-foreground">WhatsApp</p>
              {contactUnlocked ? (
                <p className="text-body-sm font-semibold text-foreground">{getDealerPhone(car.dealerId)}</p>
              ) : (
                <p className="text-caption text-gold/70">Unlock after payment verification</p>
              )}
            </div>
            {contactUnlocked ? (
              <a
                href={getWhatsAppLink(car.dealerId, carName)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-foreground gap-1.5 shrink-0">
                  <MessageCircle className="size-4" />
                  Chat
                </Button>
              </a>
            ) : (
              <Button size="sm" disabled className="bg-muted text-muted-foreground gap-1.5 shrink-0">
                <Lock className="size-3.5" />
                Unlock
              </Button>
            )}
          </div>

          {/* Location */}
          <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
            <div className={`flex size-8 items-center justify-center rounded-full shrink-0 ${
              contactUnlocked ? 'bg-emerald-600/20' : 'bg-gold/10'
            }`}>
              <MapPin className={`size-4 ${contactUnlocked ? 'text-emerald-400' : 'text-gold/50'}`} />
            </div>
            <div>
              <p className="text-overline text-muted-foreground">
                {contactUnlocked ? 'Exact Location' : 'Location'}
              </p>
              {contactUnlocked ? (
                <p className="text-body-sm font-semibold text-foreground">{car.location}</p>
              ) : (
                <>
                  <p className="text-body-sm font-semibold text-foreground">{car.city}</p>
                  <p className="text-caption text-gold/70 mt-0.5">Exact location unlocked after payment</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* View Profile */}
        <Button
          variant="outline"
          className="w-full mt-4 border-gold/30 text-gold hover:bg-gold/10 hover:text-gold-light gap-2"
        >
          <ExternalLink className="size-4" />
          View Profile
        </Button>
      </CardContent>
    </Card>
  )
}

// ─── Status Banners ────────────────────────────────────────────────────────────

function BookingConfirmedBanner() {
  return (
    <div className="rounded-xl border border-emerald-600/40 bg-emerald-600/10 p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-500">
      <div className="flex size-10 items-center justify-center rounded-full bg-emerald-600/20 shrink-0">
        <CheckCircle2 className="size-5 text-emerald-400" />
      </div>
      <div>
        <p className="text-body-sm font-semibold text-emerald-400">Booking Confirmed</p>
        <p className="text-caption text-emerald-400/70">Dealer contact details have been unlocked. You can now reach out directly.</p>
      </div>
    </div>
  )
}

function UnlockBanner() {
  return (
    <div className="rounded-xl border border-emerald-500/50 bg-emerald-500/10 p-4 text-center animate-in zoom-in-95 fade-in duration-300">
      <Unlock className="size-8 text-emerald-400 mx-auto mb-2" />
      <p className="text-body-sm font-bold text-emerald-400">Contact Details Unlocked!</p>
      <p className="text-caption text-emerald-400/70 mt-1">
        You can now view the dealer&apos;s phone, WhatsApp, and exact location.
      </p>
    </div>
  )
}

function LockedContactNotice({ carType }: { carType: string }) {
  const noticeText: Record<string, string> = {
    rent: 'Complete your booking payment to unlock the dealer\'s phone number, WhatsApp, and exact location.',
    sale: 'Pay the RM 100 enquiry fee to unlock the dealer\'s phone number, WhatsApp, and exact location.',
    auction: 'Pay the auction deposit to unlock the dealer\'s phone number, WhatsApp, and exact location.',
    continueLoan: 'Submit your enquiry to start the process. Dealer contact will be unlocked after verification.',
  }

  return (
    <div className="rounded-xl border border-gold/30 bg-gold/5 p-4 flex items-start gap-3">
      <div className="flex size-8 items-center justify-center rounded-full bg-gold/15 shrink-0 mt-0.5">
        <Lock className="size-4 text-gold" />
      </div>
      <div>
        <p className="text-body-sm font-semibold text-gold">Contact Details Locked</p>
        <p className="text-caption text-gold/70 mt-0.5">{noticeText[carType] ?? 'Complete payment to unlock dealer contact details.'}</p>
      </div>
    </div>
  )
}

function MarketplaceDisclaimer() {
  return (
    <div className="rounded-xl border border-amber-600/40 bg-amber-600/5 p-4 flex items-start gap-3">
      <div className="flex size-8 items-center justify-center rounded-full bg-amber-600/15 shrink-0 mt-0.5">
        <AlertTriangle className="size-4 text-amber-500" />
      </div>
      <div>
        <p className="text-body-sm font-semibold text-amber-500">Marketplace Notice</p>
        <p className="text-caption text-amber-500/70 mt-0.5">
          DK Vroom acts as a marketplace platform only. All transactions are between the vehicle owner and the buyer. DK Vroom does not guarantee or assume responsibility for the condition, legality, or completion of any transaction.
        </p>
      </div>
    </div>
  )
}

// ─── Continue Loan Process Flow ────────────────────────────────────────────────

function ContinueLoanProcessFlow() {
  const steps = [
    { icon: Car, label: 'Owner Lists', desc: 'Vehicle listed on platform' },
    { icon: Send, label: 'Customer Enquiry', desc: 'Buyer submits interest' },
    { icon: Handshake, label: 'Agreement', desc: 'Terms agreed by both' },
    { icon: Wallet, label: 'Deposit Payment', desc: 'Takeover deposit paid' },
    { icon: CircleDollarSign, label: 'Vehicle Handover', desc: 'Physical handover' },
    { icon: FileText, label: 'Documents Upload', desc: 'Legal docs submitted' },
    { icon: Shield, label: 'Admin Verification', desc: 'DK Vroom verifies' },
  ]

  return (
    <div>
      <h2 className="heading-sm text-foreground mb-3 flex items-center gap-2">
        <Handshake className="size-5 text-gold" />
        How It Works
      </h2>
      <div className="space-y-2">
        {steps.map((step, index) => (
          <div
            key={index}
            className="flex items-center gap-3 rounded-lg bg-muted/50 p-3"
          >
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gold/10 text-gold">
              <step.icon className="size-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-overline text-gold/70">Step {index + 1}</span>
                <span className="text-body-sm font-medium text-foreground">{step.label}</span>
              </div>
              <p className="text-caption text-muted-foreground">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main Car Detail Component ─────────────────────────────────────────────────

export default function CarDetail() {
  const {
    selectedCarId,
    isLoggedIn,
    booking,
    startBooking,
  } = useAppStore()
  const router = useRouter()

  const [car, setCar] = useState<NormalizedCar | null>(null)
  const [loading, setLoading] = useState(true)
  const [bookingLoading, setBookingLoading] = useState(false)
  const [showUnlockBanner, setShowUnlockBanner] = useState(false)
  const [rentStartDate, setRentStartDate] = useState<string>('')
  const [rentEndDate, setRentEndDate] = useState<string>('')

  // Fetch car data
  useEffect(() => {
    if (!selectedCarId) {
      queueMicrotask(() => setLoading(false))
      return
    }

    let cancelled = false

    async function fetchCar() {
      try {
        const result = await carsApi.get(selectedCarId!)
        if (!cancelled && result.data) {
          setCar(normalizeCar(result.data as Record<string, unknown>))
        }
      } catch {
        // Silent error handling — car stays null, empty state shown
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchCar()
    return () => { cancelled = true }
  }, [selectedCarId])

  // Determine if contact is unlocked for this car
  const contactUnlocked = useMemo(() => {
    if (!car) return false
    return (
      booking.contactUnlocked === true &&
      booking.bookingType === car.type &&
      booking.paymentStatus === 'verified'
    )
  }, [booking, car])

  // Show unlock banner once when contact becomes unlocked
  useEffect(() => {
    if (contactUnlocked && !showUnlockBanner) {
      queueMicrotask(() => setShowUnlockBanner(true))
      const timer = setTimeout(() => setShowUnlockBanner(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [contactUnlocked, showUnlockBanner])

  // ─── Loading & Empty States ──────────────────────────────────────────────

  if (loading) {
    return <LoadingState variant="detail" className="min-h-screen" />
  }

  if (!car) {
    return (
      <EmptyState
        icon={<Car className="size-12" />}
        title="Vehicle not found"
        description="The vehicle you're looking for doesn't exist or has been removed."
        action={
          <Button variant="outline" onClick={() => router.back()} className="gap-2">
            <ArrowLeft className="size-4" />
            Go Back
          </Button>
        }
        className="min-h-screen"
      />
    )
  }

  // ─── Derived booleans ────────────────────────────────────────────────────

  const isContinueLoan = car.type === 'continueLoan'
  const isAuction = car.type === 'auction'
  const isRent = car.type === 'rent'
  const isSale = car.type === 'sale'

  // ─── Booking CTA ─────────────────────────────────────────────────────────

  const handlePrimaryCta = async () => {
    if (!isLoggedIn) {
      router.push('/login')
      return
    }

    setBookingLoading(true)
    try {
      let bookingType: string = car.type
      let amount = car.price

      if (isRent) {
        amount = car.deposit || car.price
      } else if (isSale) {
        bookingType = 'purchase'
        amount = 100
      } else if (isAuction) {
        amount = Math.round((car.currentBid || car.auctionStartBid || 0) * 0.1)
      } else if (isContinueLoan) {
        router.push('/continue-loan-enquiry')
        setBookingLoading(false)
        return
      }

      const bookingData: BookingPayload = {
        carId: car.id,
        type: bookingType,
        totalAmount: amount,
      }

      if (isRent) {
        if (!rentStartDate || !rentEndDate) {
          toast.error('Please select rental start and end dates')
          setBookingLoading(false)
          return
        }
        bookingData.startDate = new Date(rentStartDate).toISOString()
        bookingData.endDate = new Date(rentEndDate).toISOString()
      }

      const result = await bookingsApi.create(bookingData)
      const newBooking = result.data as Record<string, unknown> | undefined
      const payments = newBooking?.payments as Array<Record<string, unknown>> | undefined
      const payment = payments?.[0]
      const paymentAmount = typeof payment?.amount === 'number'
        ? payment.amount
        : typeof newBooking?.totalAmount === 'number'
          ? newBooking.totalAmount
          : amount

      startBooking(
        bookingType as 'rent' | 'sale' | 'continueLoan' | 'auction',
        paymentAmount,
        newBooking?.id as string | undefined,
        payment?.id as string | undefined
      )
      router.push('/payment')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create booking. Please try again.'
      toast.error(message)
    } finally {
      setBookingLoading(false)
    }
  }

  const ctaLabel = isAuction
    ? 'Place Bid'
    : isContinueLoan
    ? 'Submit Enquiry'
    : isRent
    ? 'Book Now'
    : isSale
    ? 'Send Enquiry'
    : 'Contact Dealer'

  const ctaIcon = bookingLoading
    ? <Loader2 className="size-5 animate-spin" />
    : isAuction
    ? <Gavel className="size-5" />
    : isContinueLoan
    ? <Send className="size-5" />
    : isRent
    ? <Calendar className="size-5" />
    : isSale
    ? <Send className="size-5" />
    : <Phone className="size-5" />

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky top bar */}
      <div className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <Button variant="ghost" onClick={() => router.back()} className="gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" />
            Back
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* ─── LEFT COLUMN — Images ─── */}
          <ImageGallery car={car} />

          {/* ─── RIGHT COLUMN — Details ─── */}
          <div className="space-y-6">
            {/* Title + Type Badge */}
            <div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h1 className="heading-lg gold-shimmer">
                    {car.brand} {car.model}
                  </h1>
                  <p className="text-body-sm text-muted-foreground mt-1">
                    {car.year} · {car.color} · {capitalize(car.condition)}
                  </p>
                </div>
                <VehicleTypeBadge type={car.type} />
              </div>
            </div>

            {/* Status banners */}
            {contactUnlocked ? (
              <BookingConfirmedBanner />
            ) : (
              <LockedContactNotice carType={car.type} />
            )}

            {showUnlockBanner && <UnlockBanner />}

            {/* ─── Type-specific Pricing Cards ─── */}
            {isRent && <RentalPricingCard car={car} />}
            {isSale && <SalePricingCard car={car} />}
            {isContinueLoan && <ContinueLoanCard car={car} />}
            {isAuction && <AuctionDetailsCard car={car} />}

            {/* Auction Condition Section */}
            {isAuction && <AuctionConditionSection car={car} />}

            {/* Rental Date Selection */}
            {isRent && (
              <Card className="border-border bg-card overflow-hidden">
                <CardHeader className="pb-0 pt-4 px-4 sm:px-6">
                  <CardTitle className="text-foreground flex items-center gap-2 heading-sm">
                    <Calendar className="size-5 text-gold" />
                    Select Rental Dates
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-4 sm:p-6 pt-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="rent-start" className="text-overline text-muted-foreground">
                        Pick-up Date
                      </Label>
                      <Input
                        id="rent-start"
                        type="date"
                        value={rentStartDate}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={(e) => {
                          setRentStartDate(e.target.value)
                          if (rentEndDate && e.target.value > rentEndDate) {
                            setRentEndDate('')
                          }
                        }}
                        className="bg-background border-border"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rent-end" className="text-overline text-muted-foreground">
                        Return Date
                      </Label>
                      <Input
                        id="rent-end"
                        type="date"
                        value={rentEndDate}
                        min={rentStartDate || new Date().toISOString().split('T')[0]}
                        onChange={(e) => setRentEndDate(e.target.value)}
                        className="bg-background border-border"
                      />
                    </div>
                  </div>
                  {rentStartDate && rentEndDate && (
                    <div className="rounded-lg bg-gold/5 border border-gold/20 p-3">
                      <div className="flex items-center justify-between text-body-sm">
                        <span className="text-muted-foreground">Total Days</span>
                        <span className="font-semibold text-foreground">
                          {Math.max(1, Math.ceil(
                            (new Date(rentEndDate).getTime() - new Date(rentStartDate).getTime()) /
                              (1000 * 60 * 60 * 24)
                          ))} day(s)
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-body-sm mt-1">
                        <span className="text-muted-foreground">Estimated Total</span>
                        <span className="font-semibold gold-text">
                          {formatPrice(
                            car.price *
                              Math.max(1, Math.ceil(
                                (new Date(rentEndDate).getTime() - new Date(rentStartDate).getTime()) /
                                  (1000 * 60 * 60 * 24)
                              ))
                          )}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Location with unlock logic */}
            <div className="flex items-center gap-2">
              {contactUnlocked ? (
                <>
                  <MapPin className="size-4 text-emerald-400 shrink-0" />
                  <span className="text-body-sm text-foreground">{car.location}</span>
                </>
              ) : (
                <>
                  <MapPin className="size-4 text-gold/50 shrink-0" />
                  <span className="text-body-sm text-muted-foreground">{car.city}</span>
                  <span className="text-caption text-gold/60 ml-1">(exact location locked)</span>
                </>
              )}
            </div>

            <Separator />

            {/* ─── Dealer Info Card ─── */}
            <DealerInfoCard car={car} contactUnlocked={contactUnlocked} />

            <Separator />

            {/* ─── Tabs: Specs / Features / Description ─── */}
            <Tabs defaultValue="specs" className="w-full">
              <TabsList className="w-full bg-muted/50">
                <TabsTrigger value="specs" className="flex-1">Specs</TabsTrigger>
                <TabsTrigger value="features" className="flex-1">Features</TabsTrigger>
                <TabsTrigger value="description" className="flex-1">Description</TabsTrigger>
              </TabsList>

              <TabsContent value="specs" className="mt-4 min-h-[280px]">
                <VehicleSpecsSection car={car} />
              </TabsContent>

              <TabsContent value="features" className="mt-4 min-h-[280px]">
                {car.features.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {car.features.map((feature) => (
                      <Badge key={feature} variant="secondary" className="text-xs gap-1 py-1 px-2.5">
                        <CheckCircle2 className="size-3 text-gold" />
                        {feature}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-body-sm text-muted-foreground">No features listed.</p>
                )}
              </TabsContent>

              <TabsContent value="description" className="mt-4 min-h-[280px]">
                <p className="text-body-sm text-muted-foreground leading-relaxed">
                  {car.description || 'No description provided.'}
                </p>
              </TabsContent>
            </Tabs>

            {/* ─── Continue Loan specific sections ─── */}
            {isContinueLoan && (
              <>
                <Separator />
                <MarketplaceDisclaimer />

                {/* Vehicle Condition */}
                {car.vehicleCondition && (
                  <Card className="border-border bg-card">
                    <CardHeader className="pb-0 pt-4 px-4 sm:px-6">
                      <CardTitle className="text-foreground flex items-center gap-2 heading-sm">
                        <ClipboardCheck className="size-5 text-gold" />
                        Vehicle Condition
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6 pt-3">
                      <p className="text-body-sm text-foreground leading-relaxed">{car.vehicleCondition}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Process Flow */}
                <ContinueLoanProcessFlow />
              </>
            )}

            <Separator />

            {/* ─── CTA Buttons ─── */}
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                className="flex-1 bg-gold text-black hover:bg-gold-light font-bold h-12 text-base gap-2"
                onClick={handlePrimaryCta}
                disabled={bookingLoading}
              >
                {ctaIcon}
                {ctaLabel}
              </Button>

              {contactUnlocked ? (
                <a
                  href={getWhatsAppLink(car.dealerId, `${car.brand} ${car.model}`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1"
                >
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-foreground font-semibold h-12 text-base gap-2">
                    <MessageCircle className="size-5" />
                    WhatsApp
                  </Button>
                </a>
              ) : (
                <Button
                  className="flex-1 bg-muted text-muted-foreground font-semibold h-12 text-base gap-2"
                  disabled
                >
                  <Lock className="size-5" />
                  Unlock WhatsApp
                </Button>
              )}
            </div>

            {/* Payment info under CTA */}
            {isSale && !contactUnlocked && (
              <p className="text-center text-caption text-muted-foreground">
                <Lock className="size-3 inline mr-1" />
                RM 100 enquiry fee required to unlock dealer contact
              </p>
            )}
            {isAuction && !contactUnlocked && (
              <p className="text-center text-caption text-muted-foreground">
                <Lock className="size-3 inline mr-1" />
                {formatPrice(Math.round((car.currentBid || car.auctionStartBid || 0) * 0.1))} deposit required to place bid &amp; unlock contact
              </p>
            )}
            {isRent && !contactUnlocked && (
              <p className="text-center text-caption text-muted-foreground">
                <Lock className="size-3 inline mr-1" />
                {formatPrice(car.deposit || car.price)} booking deposit required to unlock contact
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
