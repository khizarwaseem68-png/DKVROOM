'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAppStore } from '@/lib/store'
import { carsApi, bookingsApi } from '@/lib/api'
import { type CarData } from '@/lib/mock-data'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import {
  ArrowLeft,
  MapPin,
  Star,
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
  AlertCircle,
  ExternalLink,
  Lock,
  Unlock,
  Eye,
  Info,
  Handshake,
  Wallet,
  CircleDollarSign,
  Car,
  AlertTriangle,
  Shield,
  Send,
  Loader2,
} from 'lucide-react'

// Normalize API car data to CarData shape
function normalizeCar(apiCar: any): CarData {
  const photos = typeof apiCar.photos === 'string'
    ? (() => { try { return JSON.parse(apiCar.photos) } catch { return [] } })()
    : Array.isArray(apiCar.photos) ? apiCar.photos : []
  const features = typeof apiCar.features === 'string'
    ? (() => { try { return JSON.parse(apiCar.features) } catch { return [] } })()
    : Array.isArray(apiCar.features) ? apiCar.features : []

  return {
    id: apiCar.id,
    brand: apiCar.brand,
    model: apiCar.model,
    year: apiCar.year,
    color: apiCar.color || 'N/A',
    mileage: apiCar.mileage || 0,
    fuelType: apiCar.fuelType || 'petrol',
    transmission: apiCar.transmission || 'auto',
    seats: apiCar.seats || 5,
    condition: apiCar.condition || 'used',
    price: apiCar.price || 0,
    deposit: apiCar.deposit ?? undefined,
    monthlyInstallment: apiCar.monthlyInstallment ?? undefined,
    remainingMonths: apiCar.remainingMonths ?? undefined,
    remainingBalance: apiCar.remainingBalance ?? undefined,
    bankName: apiCar.bankName ?? undefined,
    location: apiCar.location || apiCar.city || '',
    city: apiCar.city || '',
    description: apiCar.description || '',
    features,
    photos,
    featured: apiCar.featured || false,
    type: apiCar.type,
    dealerName: apiCar.dealer?.companyName || '',
    dealerId: apiCar.dealer?.id || apiCar.dealerId || '',
    dealerVerified: apiCar.dealer?.verified || false,
    rating: apiCar.dealer?.rating || 0,
    vehicleCondition: apiCar.vehicleCondition ?? undefined,
    requiredDocs: typeof apiCar.requiredDocs === 'string'
      ? (() => { try { return JSON.parse(apiCar.requiredDocs) } catch { return undefined } })()
      : Array.isArray(apiCar.requiredDocs) ? apiCar.requiredDocs : undefined,
    auctionEnd: apiCar.auctionEnd ? new Date(apiCar.auctionEnd).toISOString() : undefined,
    auctionStartBid: apiCar.auctionStartBid ?? undefined,
    currentBid: apiCar.currentBid ?? undefined,
  }
}

function formatPrice(amount: number): string {
  return `RM ${amount.toLocaleString('en-MY')}`
}

function formatMileage(km: number): string {
  return `${km.toLocaleString('en-MY')} km`
}

// Generate a deterministic mock phone number from dealer ID
function getDealerPhone(dealerId: string): string {
  const seed = dealerId.charCodeAt(1) || 1
  const prefix = '01'
  const mid = String(2 + (seed % 8)).padStart(2, '0')
  const suffix = String(10000 + ((seed * 137) % 89999))
  return `${prefix}${mid}-${suffix.slice(0, 4)} ${suffix.slice(4)}`
}

// Generate a deterministic WhatsApp link
function getWhatsAppLink(dealerId: string, carName: string): string {
  const phone = getDealerPhone(dealerId).replace(/[-\s]/g, '')
  const message = encodeURIComponent(`Hi, I'm interested in the ${carName} listed on DK Vroom. Is it still available?`)
  return `https://wa.me/6${phone}?text=${message}`
}

function CountdownTimer({ endDate }: { endDate: string }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, ended: false })

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date().getTime()
      const end = new Date(endDate).getTime()
      const diff = end - now

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, ended: true })
        return
      }

      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
        ended: false,
      })
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [endDate])

  if (timeLeft.ended) {
    return <span className="text-destructive font-semibold">Auction Ended</span>
  }

  return (
    <div className="grid grid-cols-4 gap-2">
      {[
        { value: timeLeft.days, label: 'Days' },
        { value: timeLeft.hours, label: 'Hours' },
        { value: timeLeft.minutes, label: 'Mins' },
        { value: timeLeft.seconds, label: 'Secs' },
      ].map((item) => (
        <div key={item.label} className="text-center rounded-lg bg-background/60 p-2">
          <div className="text-2xl font-bold gold-text">{String(item.value).padStart(2, '0')}</div>
          <div className="text-xs text-muted-foreground">{item.label}</div>
        </div>
      ))}
    </div>
  )
}

// ─── Dealer Info Card with Unlock Logic ────────────────────────────────────────
function DealerInfoCard({ car, contactUnlocked }: { car: CarData; contactUnlocked: boolean }) {
  const carName = `${car.brand} ${car.model}`
  const dealerInitials = car.dealerName.split(' ').map((n) => n[0]).join('').slice(0, 2)

  return (
    <Card className="border-gold/20 bg-card overflow-hidden">
      {/* Dealer header */}
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-4">
          <Avatar className="size-12 border border-gold/30">
            <AvatarFallback className="bg-gold/10 text-gold font-bold text-sm">
              {dealerInitials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground truncate">{car.dealerName}</span>
              {car.dealerVerified && (
                <ShieldCheck className="size-4 text-gold shrink-0" />
              )}
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`size-3 ${
                    star <= Math.floor(car.rating)
                      ? 'fill-gold text-gold'
                      : star <= car.rating
                      ? 'fill-gold/50 text-gold'
                      : 'text-muted-foreground/30'
                  }`}
                />
              ))}
              <span className="text-xs text-muted-foreground ml-1">{car.rating.toFixed(1)}</span>
            </div>
          </div>
        </div>

        {/* Contact Section - with unlock logic */}
        <div className="space-y-3">
          {/* Section label */}
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-foreground">Contact Information</h4>
            {contactUnlocked ? (
              <Badge className="bg-green-600/20 text-green-400 border-green-600/30 gap-1 text-[10px] px-2 py-0.5">
                <Unlock className="size-3" />
                Unlocked
              </Badge>
            ) : (
              <Badge className="bg-gold/10 text-gold border-gold/30 gap-1 text-[10px] px-2 py-0.5">
                <Lock className="size-3" />
                Locked
              </Badge>
            )}
          </div>

          <Separator className="bg-border/50" />

          {/* Phone */}
          <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
            {contactUnlocked ? (
              <>
                <div className="flex size-8 items-center justify-center rounded-full bg-green-600/20 shrink-0">
                  <Phone className="size-4 text-green-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="text-sm font-semibold text-foreground">{getDealerPhone(car.dealerId)}</p>
                </div>
              </>
            ) : (
              <>
                <div className="flex size-8 items-center justify-center rounded-full bg-gold/10 shrink-0">
                  <Phone className="size-4 text-gold/50" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold text-muted-foreground/60 blur-[3px] select-none">
                      012-3456 7890
                    </span>
                    <Lock className="size-3 text-gold/60" />
                  </div>
                  <p className="text-[10px] text-gold/70 mt-0.5">Unlocked after payment verification</p>
                </div>
              </>
            )}
          </div>

          {/* WhatsApp */}
          <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
            {contactUnlocked ? (
              <>
                <div className="flex size-8 items-center justify-center rounded-full bg-green-600/20 shrink-0">
                  <MessageCircle className="size-4 text-green-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">WhatsApp</p>
                  <p className="text-sm font-semibold text-foreground">{getDealerPhone(car.dealerId)}</p>
                </div>
                <a
                  href={getWhatsAppLink(car.dealerId, carName)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white gap-1.5 shrink-0">
                    <MessageCircle className="size-4" />
                    Chat Now
                  </Button>
                </a>
              </>
            ) : (
              <>
                <div className="flex size-8 items-center justify-center rounded-full bg-gray-600/20 shrink-0">
                  <MessageCircle className="size-4 text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">WhatsApp</p>
                  <p className="text-[10px] text-gold/70">Unlock WhatsApp after payment verification</p>
                </div>
                <Button size="sm" disabled className="bg-gray-700/50 text-gray-500 gap-1.5 shrink-0 cursor-not-allowed">
                  <Lock className="size-3.5" />
                  Unlock
                </Button>
              </>
            )}
          </div>

          {/* Location */}
          <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
            {contactUnlocked ? (
              <>
                <div className="flex size-8 items-center justify-center rounded-full bg-green-600/20 shrink-0">
                  <MapPin className="size-4 text-green-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Exact Location</p>
                  <p className="text-sm font-semibold text-foreground">{car.location}</p>
                </div>
              </>
            ) : (
              <>
                <div className="flex size-8 items-center justify-center rounded-full bg-gold/10 shrink-0">
                  <MapPin className="size-4 text-gold/50" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Location</p>
                  <p className="text-sm font-semibold text-foreground">{car.city}</p>
                  <p className="text-[10px] text-gold/70 mt-0.5">
                    Exact location unlocked after payment
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* View Profile button - always visible */}
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

// ─── Rental Pricing Card ───────────────────────────────────────────────────────
function RentalPricingCard({ car }: { car: CarData }) {
  const daily = car.price
  const weekly = Math.round(daily * 6.5)
  const monthly = Math.round(daily * 25)

  return (
    <Card className="border-gold/40 gold-glow bg-gold/5 overflow-hidden">
      <CardHeader className="pb-0 pt-4 px-4 sm:px-6">
        <CardTitle className="text-gold flex items-center gap-2 text-lg">
          <Calendar className="size-5" />
          Rental Pricing
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-4 sm:p-6 pt-3">
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div className="rounded-lg bg-background/60 p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Daily</p>
            <p className="text-base sm:text-lg font-bold gold-text">{formatPrice(daily)}</p>
          </div>
          <div className="rounded-lg bg-background/60 p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Weekly</p>
            <p className="text-base sm:text-lg font-bold text-foreground">{formatPrice(weekly)}</p>
          </div>
          <div className="rounded-lg bg-background/60 p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Monthly</p>
            <p className="text-base sm:text-lg font-bold text-foreground">{formatPrice(monthly)}</p>
          </div>
        </div>
        {(car.deposit ?? 0) > 0 && (
          <div className="flex items-center justify-between rounded-lg bg-background/60 p-3">
            <div className="flex items-center gap-2">
              <Wallet className="size-4 text-gold" />
              <span className="text-sm text-muted-foreground">Security Deposit</span>
            </div>
            <span className="text-sm font-bold text-foreground">{formatPrice(car.deposit ?? 0)}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Sale Pricing Card ──────────────────────────────────────────────────────────
function SalePricingCard({ car }: { car: CarData }) {
  return (
    <Card className="border-gold/40 gold-glow bg-gold/5 overflow-hidden">
      <CardHeader className="pb-0 pt-4 px-4 sm:px-6">
        <CardTitle className="text-gold flex items-center gap-2 text-lg">
          <Banknote className="size-5" />
          Purchase Price
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-4 sm:p-6 pt-3">
        <div className="rounded-lg bg-background/60 p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Asking Price</p>
          <p className="text-3xl font-bold gold-text">{formatPrice(car.price)}</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-gold/10 p-3">
          <Info className="size-4 text-gold shrink-0" />
          <p className="text-xs text-gold/80">
            Send an enquiry with a RM 100 booking fee to unlock dealer contact details and WhatsApp.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Continue Loan Card ─────────────────────────────────────────────────────────
function ContinueLoanCard({ car }: { car: CarData }) {
  return (
    <Card className="border-gold/40 gold-glow bg-gold/5 overflow-hidden">
      <CardHeader className="pb-0 pt-4 px-4 sm:px-6">
        <CardTitle className="text-gold flex items-center gap-2 text-lg">
          <FileText className="size-5" />
          Loan Takeover Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-4 sm:p-6 pt-3">
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <div className="rounded-lg bg-background/60 p-3">
            <p className="text-xs text-muted-foreground">Deposit / Takeover</p>
            <p className="text-lg font-bold text-gold">{formatPrice(car.deposit || 0)}</p>
          </div>
          <div className="rounded-lg bg-background/60 p-3">
            <p className="text-xs text-muted-foreground">Monthly Installment</p>
            <p className="text-lg font-bold text-foreground">{formatPrice(car.monthlyInstallment || 0)}</p>
          </div>
          <div className="rounded-lg bg-background/60 p-3">
            <p className="text-xs text-muted-foreground">Remaining Months</p>
            <p className="text-lg font-bold text-foreground">{car.remainingMonths} months</p>
          </div>
          <div className="rounded-lg bg-background/60 p-3">
            <p className="text-xs text-muted-foreground">Remaining Balance</p>
            <p className="text-lg font-bold text-foreground">{formatPrice(car.remainingBalance || 0)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-background/60 p-3">
          <Building2 className="size-4 text-gold shrink-0" />
          <span className="text-xs text-muted-foreground">Bank:</span>
          <span className="text-sm font-semibold text-foreground">{car.bankName}</span>
        </div>
        {/* Loan progress */}
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
            <span>Loan Progress</span>
            <span>{car.remainingMonths ? `${60 - car.remainingMonths} of 60 months paid` : ''}</span>
          </div>
          <Progress
            value={car.remainingMonths ? ((60 - car.remainingMonths) / 60) * 100 : 0}
            className="h-2"
          />
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Auction Card ───────────────────────────────────────────────────────────────
function AuctionCard({ car }: { car: CarData }) {
  const depositAmount = Math.round((car.currentBid || car.auctionStartBid || 0) * 0.1)

  return (
    <Card className="border-gold/40 gold-glow bg-gold/5 overflow-hidden">
      <CardHeader className="pb-0 pt-4 px-4 sm:px-6">
        <CardTitle className="text-gold flex items-center gap-2 text-lg">
          <Gavel className="size-5" />
          Auction Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-4 sm:p-6 pt-3">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Current Bid</p>
          <p className="text-3xl font-bold gold-text">{formatPrice(car.currentBid || 0)}</p>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Starting Bid</span>
          <span className="text-sm font-medium">{formatPrice(car.auctionStartBid || 0)}</span>
        </div>
        <Separator className="bg-border/50" />
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="size-4 text-gold" />
            <span className="text-sm font-medium text-foreground">Time Remaining</span>
          </div>
          {car.auctionEnd && <CountdownTimer endDate={car.auctionEnd} />}
        </div>
        <div className="flex items-center justify-between rounded-lg bg-background/60 p-3">
          <div className="flex items-center gap-2">
            <Wallet className="size-4 text-gold" />
            <span className="text-sm text-muted-foreground">Required Deposit (10%)</span>
          </div>
          <span className="text-sm font-bold text-gold">{formatPrice(depositAmount)}</span>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Booking Confirmed Banner ───────────────────────────────────────────────────
function BookingConfirmedBanner() {
  return (
    <div className="rounded-xl border border-green-600/40 bg-green-600/10 p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-500">
      <div className="flex size-10 items-center justify-center rounded-full bg-green-600/20 shrink-0">
        <CheckCircle2 className="size-5 text-green-400" />
      </div>
      <div>
        <p className="text-sm font-semibold text-green-400">Booking Confirmed</p>
        <p className="text-xs text-green-400/70">Dealer contact details have been unlocked. You can now reach out directly.</p>
      </div>
    </div>
  )
}

// ─── Locked Contact Notice ──────────────────────────────────────────────────────
function LockedContactNotice({ carType }: { carType: string }) {
  const getNoticeText = () => {
    switch (carType) {
      case 'rent':
        return 'Complete your booking payment to unlock the dealer\'s phone number, WhatsApp, and exact location.'
      case 'sale':
        return 'Pay the RM 100 enquiry fee to unlock the dealer\'s phone number, WhatsApp, and exact location.'
      case 'auction':
        return 'Pay the auction deposit to unlock the dealer\'s phone number, WhatsApp, and exact location.'
      case 'continueLoan':
        return 'Submit your enquiry to start the process. Dealer contact will be unlocked after verification.'
      default:
        return 'Complete payment to unlock dealer contact details.'
    }
  }

  return (
    <div className="rounded-xl border border-gold/30 bg-gold/5 p-4 flex items-start gap-3">
      <div className="flex size-8 items-center justify-center rounded-full bg-gold/15 shrink-0 mt-0.5">
        <Lock className="size-4 text-gold" />
      </div>
      <div>
        <p className="text-sm font-semibold text-gold">Contact Details Locked</p>
        <p className="text-xs text-gold/70 mt-0.5">{getNoticeText()}</p>
      </div>
    </div>
  )
}

// ─── Marketplace Disclaimer (Continue Loan) ─────────────────────────────────────
function MarketplaceDisclaimer() {
  return (
    <div className="rounded-xl border border-amber-600/40 bg-amber-600/5 p-4 flex items-start gap-3">
      <div className="flex size-8 items-center justify-center rounded-full bg-amber-600/15 shrink-0 mt-0.5">
        <AlertTriangle className="size-4 text-amber-500" />
      </div>
      <div>
        <p className="text-sm font-semibold text-amber-500">Marketplace Notice</p>
        <p className="text-xs text-amber-500/70 mt-0.5">
          DK Vroom acts as a marketplace platform only. All transactions are between the vehicle owner and the buyer. DK Vroom does not guarantee or assume responsibility for the condition, legality, or completion of any transaction.
        </p>
      </div>
    </div>
  )
}

// ─── Continue Loan Process Flow ──────────────────────────────────────────────────
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
      <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
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
                <span className="text-[10px] font-bold text-gold/70">STEP {index + 1}</span>
                <span className="text-sm font-medium text-foreground">{step.label}</span>
              </div>
              <p className="text-xs text-muted-foreground">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main Car Detail Component ──────────────────────────────────────────────────
export default function CarDetail() {
  const {
    selectedCarId,
    selectedCarType,
    goBack,
    navigate,
    isLoggedIn,
    booking,
    startBooking,
    user,
  } = useAppStore()

  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [isZoomed, setIsZoomed] = useState(false)
  const [car, setCar] = useState<CarData | null>(null)
  const [loading, setLoading] = useState(true)
  const [bookingLoading, setBookingLoading] = useState(false)

  // Fetch car data from API
  useEffect(() => {
    if (!selectedCarId) {
      setLoading(false)
      return
    }

    async function fetchCar() {
      try {
        const result = await carsApi.get(selectedCarId!)
        if (result.data) {
          setCar(normalizeCar(result.data))
        }
      } catch (e) {
        console.error('Failed to fetch car:', e)
      } finally {
        setLoading(false)
      }
    }

    fetchCar()
  }, [selectedCarId])

  // Determine if contact is unlocked for this car
  const contactUnlocked = useMemo(() => {
    if (!car) return false
    return booking.contactUnlocked === true &&
      booking.bookingType === car.type &&
      booking.paymentStatus === 'verified'
  }, [booking, car])

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Loader2 className="size-12 text-gold animate-spin" />
        <p className="text-muted-foreground">Loading vehicle details...</p>
      </div>
    )
  }

  if (!car) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <AlertCircle className="size-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Vehicle not found</h2>
        <p className="text-muted-foreground text-sm">The vehicle you&apos;re looking for doesn&apos;t exist.</p>
        <Button variant="outline" onClick={goBack} className="gap-2">
          <ArrowLeft className="size-4" />
          Go Back
        </Button>
      </div>
    )
  }

  const isContinueLoan = car.type === 'continueLoan'
  const isAuction = car.type === 'auction'
  const isRent = car.type === 'rent'
  const isSale = car.type === 'sale'

  // CTA logic per car type — creates a real booking via API
  const handlePrimaryCta = async () => {
    if (!isLoggedIn) {
      navigate('login')
      return
    }

    setBookingLoading(true)
    try {
      // Determine booking type and amount
      let bookingType: string = car.type
      let amount = car.price

      if (isRent) {
        amount = car.deposit || car.price
      } else if (isSale) {
        bookingType = 'purchase'
        amount = 100 // enquiry fee
      } else if (isAuction) {
        amount = Math.round((car.currentBid || car.auctionStartBid || 0) * 0.1)
      } else if (isContinueLoan) {
        // Continue loan uses different flow
        navigate('continueLoanEnquiry')
        setBookingLoading(false)
        return
      }

      // Create booking via API
      const bookingData: any = {
        carId: car.id,
        type: bookingType,
        totalAmount: amount,
      }

      if (isRent) {
        // For rental, default to 1 day booking
        const today = new Date()
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)
        bookingData.startDate = today.toISOString()
        bookingData.endDate = tomorrow.toISOString()
      }

      const result = await bookingsApi.create(bookingData)
      const newBooking = result.data

      // Extract booking and payment IDs from the response
      const bookingId = newBooking?.id
      const paymentId = newBooking?.payments?.[0]?.id

      // Update store with booking info and navigate to payment
      startBooking(
        bookingType as 'rent' | 'sale' | 'continueLoan' | 'auction',
        amount,
        bookingId,
        paymentId
      )
    } catch (e: any) {
      console.error('Failed to create booking:', e)
      alert(e.message || 'Failed to create booking. Please try again.')
    } finally {
      setBookingLoading(false)
    }
  }

  // CTA label per car type
  const getCtaLabel = () => {
    if (isAuction) return 'Place Bid'
    if (isContinueLoan) return 'Submit Enquiry'
    if (isRent) return 'Book Now'
    if (isSale) return 'Send Enquiry'
    return 'Contact Dealer'
  }

  const getCtaIcon = () => {
    if (bookingLoading) return <Loader2 className="size-5 animate-spin" />
    if (isAuction) return <Gavel className="size-5" />
    if (isContinueLoan) return <Send className="size-5" />
    if (isRent) return <Calendar className="size-5" />
    if (isSale) return <Send className="size-5" />
    return <Phone className="size-5" />
  }

  const specItems = [
    { icon: Calendar, label: 'Year', value: car.year },
    { icon: Palette, label: 'Color', value: car.color },
    { icon: Gauge, label: 'Mileage', value: formatMileage(car.mileage) },
    { icon: Fuel, label: 'Fuel', value: car.fuelType.charAt(0).toUpperCase() + car.fuelType.slice(1) },
    { icon: Settings2, label: 'Transmission', value: car.transmission === 'auto' ? 'Automatic' : 'Manual' },
    { icon: Users, label: 'Seats', value: car.seats },
    { icon: ClipboardCheck, label: 'Condition', value: car.condition.charAt(0).toUpperCase() + car.condition.slice(1) },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <Button variant="ghost" onClick={goBack} className="gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" />
            Back
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* ─── LEFT COLUMN - Images ─── */}
          <div className="space-y-4">
            {/* Main image */}
            <div
              className="relative aspect-[16/10] overflow-hidden rounded-xl border border-border bg-muted cursor-zoom-in"
              onClick={() => setIsZoomed(!isZoomed)}
            >
              {car.photos.length > 0 ? (
                <img
                  src={car.photos[selectedImageIndex]}
                  alt={`${car.brand} ${car.model}`}
                  className={`h-full w-full object-cover transition-transform duration-500 ${
                    isZoomed ? 'scale-150' : 'scale-100'
                  }`}
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                  <Car className="size-16" />
                </div>
              )}
              {/* Image navigation arrows */}
              {car.photos.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white size-8 rounded-full"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedImageIndex((i) => (i > 0 ? i - 1 : car.photos.length - 1))
                    }}
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white size-8 rounded-full"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedImageIndex((i) => (i < car.photos.length - 1 ? i + 1 : 0))
                    }}
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </>
              )}
              {/* Zoom hint */}
              <div className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-md bg-black/60 px-2 py-1 text-xs text-white/80">
                <ZoomIn className="size-3.5" />
                {isZoomed ? 'Click to reset' : 'Click to zoom'}
              </div>
              {/* Image counter */}
              <div className="absolute bottom-3 left-3 rounded-md bg-black/60 px-2 py-1 text-xs text-white/80">
                {selectedImageIndex + 1} / {car.photos.length}
              </div>
            </div>

            {/* Thumbnail gallery */}
            <div className="flex gap-3 overflow-x-auto pb-2">
              {car.photos.map((photo, index) => (
                <button
                  key={index}
                  className={`relative shrink-0 aspect-[16/10] w-24 sm:w-32 overflow-hidden rounded-lg border-2 transition-all ${
                    selectedImageIndex === index
                      ? 'border-gold shadow-md shadow-gold/20'
                      : 'border-border hover:border-gold/50'
                  }`}
                  onClick={() => setSelectedImageIndex(index)}
                >
                  <img
                    src={photo}
                    alt={`${car.brand} ${car.model} - ${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* ─── RIGHT COLUMN - Details ─── */}
          <div className="space-y-6">
            {/* Title + Type Badge */}
            <div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-bold gold-shimmer sm:text-3xl">
                    {car.brand} {car.model}
                  </h1>
                  <p className="text-muted-foreground mt-1">
                    {car.year} · {car.color} · {car.condition.charAt(0).toUpperCase() + car.condition.slice(1)}
                  </p>
                </div>
                <Badge className="bg-gold/20 text-gold border-gold/30 shrink-0">
                  {car.type === 'rent' && 'For Rent'}
                  {car.type === 'sale' && 'For Sale'}
                  {car.type === 'auction' && 'Auction'}
                  {car.type === 'continueLoan' && 'Sambung Bayar'}
                </Badge>
              </div>
            </div>

            {/* Unlock/Booking status banners */}
            {contactUnlocked ? (
              <BookingConfirmedBanner />
            ) : (
              <LockedContactNotice carType={car.type} />
            )}

            {/* Unlock animation overlay - shown once when contactUnlocked transitions */}
            {contactUnlocked && (
              <div key="unlock-banner" className="rounded-xl border border-green-500/50 bg-green-500/10 p-4 text-center animate-in zoom-in-95 fade-in duration-300">
                <Unlock className="size-8 text-green-400 mx-auto mb-2" />
                <p className="text-sm font-bold text-green-400">Contact Details Unlocked!</p>
                <p className="text-xs text-green-400/70 mt-1">You can now view the dealer&apos;s phone, WhatsApp, and exact location.</p>
              </div>
            )}

            {/* ─── Type-specific Pricing Cards ─── */}
            {isRent && <RentalPricingCard car={car} />}
            {isSale && <SalePricingCard car={car} />}
            {isContinueLoan && <ContinueLoanCard car={car} />}
            {isAuction && <AuctionCard car={car} />}

            {/* Location with unlock logic */}
            <div className="flex items-center gap-2">
              {contactUnlocked ? (
                <>
                  <MapPin className="size-4 text-green-400 shrink-0" />
                  <span className="text-sm text-foreground">{car.location}</span>
                </>
              ) : (
                <>
                  <MapPin className="size-4 text-gold/50 shrink-0" />
                  <span className="text-sm text-muted-foreground">{car.city}</span>
                  <span className="text-[10px] text-gold/60 ml-1">(exact location locked)</span>
                </>
              )}
            </div>

            <Separator />

            {/* ─── Dealer Info Card with Unlock Logic ─── */}
            <DealerInfoCard car={car} contactUnlocked={contactUnlocked} />

            <Separator />

            {/* ─── Tabs: Specs / Features / Description ─── */}
            <Tabs defaultValue="specs" className="w-full">
              <TabsList className="w-full bg-muted/50">
                <TabsTrigger value="specs" className="flex-1">Specs</TabsTrigger>
                <TabsTrigger value="features" className="flex-1">Features</TabsTrigger>
                <TabsTrigger value="description" className="flex-1">Description</TabsTrigger>
              </TabsList>

              <TabsContent value="specs" className="mt-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {specItems.map((spec) => (
                    <div key={spec.label} className="flex items-start gap-2.5 rounded-lg bg-muted/50 p-3">
                      <spec.icon className="size-4 text-gold mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">{spec.label}</p>
                        <p className="text-sm font-medium text-foreground truncate">{spec.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="features" className="mt-4">
                <div className="flex flex-wrap gap-2">
                  {car.features.map((feature) => (
                    <Badge key={feature} variant="secondary" className="text-xs gap-1 py-1 px-2.5">
                      <CheckCircle2 className="size-3 text-gold" />
                      {feature}
                    </Badge>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="description" className="mt-4">
                <p className="text-sm text-muted-foreground leading-relaxed">{car.description}</p>
              </TabsContent>
            </Tabs>

            {/* ─── Continue Loan specific sections ─── */}
            {isContinueLoan && (
              <>
                <Separator />

                {/* Marketplace Disclaimer */}
                <MarketplaceDisclaimer />

                {/* Vehicle Condition */}
                {car.vehicleCondition && (
                  <div>
                    <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                      <ClipboardCheck className="size-5 text-gold" />
                      Vehicle Condition
                    </h2>
                    <Card className="border-gold/20 bg-gold/5 overflow-hidden">
                      <CardContent className="p-4">
                        <p className="text-sm text-foreground leading-relaxed">{car.vehicleCondition}</p>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Required Documents */}
                {car.requiredDocs && car.requiredDocs.length > 0 && (
                  <div>
                    <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                      <FileText className="size-5 text-gold" />
                      Required Documents
                    </h2>
                    <div className="space-y-2">
                      {car.requiredDocs.map((doc, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 rounded-lg bg-muted/50 p-3"
                        >
                          <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-gold/10 text-gold text-xs font-bold">
                            {index + 1}
                          </div>
                          <span className="text-sm text-foreground">{doc}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Process Flow */}
                <ContinueLoanProcessFlow />
              </>
            )}

            <Separator />

            {/* ─── CTA Buttons ─── */}
            <div className="flex flex-col gap-3 sm:flex-row">
              {/* Primary CTA */}
              <Button
                className="flex-1 bg-gold text-gold-dark hover:bg-gold-light font-semibold h-12 text-base gap-2"
                onClick={handlePrimaryCta}
                disabled={bookingLoading}
              >
                {getCtaIcon()}
                {getCtaLabel()}
              </Button>

              {/* Secondary CTA - WhatsApp with lock/unlock */}
              {contactUnlocked ? (
                <a
                  href={getWhatsAppLink(car.dealerId, `${car.brand} ${car.model}`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1"
                >
                  <Button className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold h-12 text-base gap-2">
                    <MessageCircle className="size-5" />
                    WhatsApp
                  </Button>
                </a>
              ) : (
                <Button
                  className="flex-1 bg-gray-700/50 text-gray-500 font-semibold h-12 text-base gap-2 cursor-not-allowed"
                  disabled
                >
                  <Lock className="size-5" />
                  Unlock WhatsApp
                </Button>
              )}
            </div>

            {/* Payment info under CTA for sale */}
            {isSale && !contactUnlocked && (
              <p className="text-center text-xs text-muted-foreground">
                <Lock className="size-3 inline mr-1" />
                RM 100 enquiry fee required to unlock dealer contact
              </p>
            )}

            {/* Deposit info under CTA for auction */}
            {isAuction && !contactUnlocked && (
              <p className="text-center text-xs text-muted-foreground">
                <Lock className="size-3 inline mr-1" />
                {formatPrice(Math.round((car.currentBid || car.auctionStartBid || 0) * 0.1))} deposit required to place bid &amp; unlock contact
              </p>
            )}

            {/* Deposit info under CTA for rent */}
            {isRent && !contactUnlocked && (
              <p className="text-center text-xs text-muted-foreground">
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
