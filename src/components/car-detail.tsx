'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { sampleCars } from '@/lib/mock-data'
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
  User,
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
} from 'lucide-react'

function formatPrice(amount: number): string {
  return `RM ${amount.toLocaleString('en-MY')}`
}

function formatMileage(km: number): string {
  return `${km.toLocaleString('en-MY')} km`
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
        <div key={item.label} className="text-center">
          <div className="text-2xl font-bold gold-text">{String(item.value).padStart(2, '0')}</div>
          <div className="text-xs text-muted-foreground">{item.label}</div>
        </div>
      ))}
    </div>
  )
}

export default function CarDetail() {
  const { selectedCarId, goBack, navigate } = useAppStore()
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [isZoomed, setIsZoomed] = useState(false)

  const car = sampleCars.find((c) => c.id === selectedCarId)

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

  const ctaLabel = isAuction ? 'Place Bid' : isContinueLoan ? 'Apply Now' : isRent ? 'Book Now' : 'Contact Dealer'

  const handleCtaClick = () => {
    if (isContinueLoan) {
      navigate('applyLoan')
    }
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
          {/* LEFT COLUMN - Images */}
          <div className="space-y-4">
            {/* Main image */}
            <div
              className="relative aspect-[16/10] overflow-hidden rounded-xl border border-border bg-muted cursor-zoom-in"
              onClick={() => setIsZoomed(!isZoomed)}
            >
              <img
                src={car.photos[selectedImageIndex]}
                alt={`${car.brand} ${car.model}`}
                className={`h-full w-full object-cover transition-transform duration-500 ${
                  isZoomed ? 'scale-150' : 'scale-100'
                }`}
              />
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

          {/* RIGHT COLUMN - Details */}
          <div className="space-y-6">
            {/* Title + Type Badge */}
            <div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-bold gold-shimmer sm:text-3xl">
                    {car.brand} {car.model}
                  </h1>
                  <p className="text-muted-foreground mt-1">{car.year} · {car.color} · {car.condition.charAt(0).toUpperCase() + car.condition.slice(1)}</p>
                </div>
                <Badge className="bg-gold/20 text-gold border-gold/30 shrink-0">
                  {car.type === 'rent' && 'For Rent'}
                  {car.type === 'sale' && 'For Sale'}
                  {car.type === 'auction' && 'Auction'}
                  {car.type === 'continueLoan' && 'Sambung Bayar'}
                </Badge>
              </div>
            </div>

            {/* Price */}
            {!isContinueLoan && !isAuction && (
              <div>
                <span className="text-3xl font-bold gold-text">{formatPrice(car.price)}</span>
                {isRent && <span className="text-lg text-muted-foreground">/day</span>}
              </div>
            )}

            {/* Continue Loan specific card */}
            {isContinueLoan && (
              <Card className="border-gold/40 gold-glow bg-gold/5 py-4">
                <CardHeader className="pb-0 pt-0 px-6">
                  <CardTitle className="text-gold flex items-center gap-2 text-lg">
                    <FileText className="size-5" />
                    Loan Takeover Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 px-6">
                  <div className="grid grid-cols-2 gap-3">
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
                    <Building2 className="size-4 text-gold" />
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
            )}

            {/* Auction specific card */}
            {isAuction && (
              <Card className="border-gold/40 gold-glow bg-gold/5 py-4">
                <CardHeader className="pb-0 pt-0 px-6">
                  <CardTitle className="text-gold flex items-center gap-2 text-lg">
                    <Gavel className="size-5" />
                    Auction Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 px-6">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Current Bid</p>
                    <p className="text-3xl font-bold gold-text">{formatPrice(car.currentBid || 0)}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Starting Bid</span>
                    <span className="text-sm font-medium">{formatPrice(car.auctionStartBid || 0)}</span>
                  </div>
                  <Separator />
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Clock className="size-4 text-gold" />
                      <span className="text-sm font-medium text-foreground">Time Remaining</span>
                    </div>
                    {car.auctionEnd && <CountdownTimer endDate={car.auctionEnd} />}
                  </div>
                  <Button className="w-full bg-gold text-gold-dark hover:bg-gold-light font-semibold h-11 text-base gap-2">
                    <Gavel className="size-5" />
                    Place Bid
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Location */}
            <div className="flex items-center gap-2">
              <MapPin className="size-4 text-gold shrink-0" />
              <span className="text-sm text-muted-foreground">{car.location}</span>
            </div>

            <Separator />

            {/* Dealer Info Card */}
            <Card className="bg-card py-4">
              <CardContent className="px-6">
                <div className="flex items-center gap-3">
                  <Avatar className="size-12 border border-gold/30">
                    <AvatarFallback className="bg-gold/10 text-gold font-bold">
                      {car.dealerName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
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
                <div className="flex gap-2 mt-4">
                  <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white gap-2" size="sm">
                    <MessageCircle className="size-4" />
                    WhatsApp
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 gap-2">
                    <ExternalLink className="size-4" />
                    View Profile
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Separator />

            {/* Key Specs Grid */}
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-3">Key Specifications</h2>
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
            </div>

            <Separator />

            {/* Features */}
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-3">Features</h2>
              <div className="flex flex-wrap gap-2">
                {car.features.map((feature) => (
                  <Badge key={feature} variant="secondary" className="text-xs gap-1 py-1 px-2.5">
                    <CheckCircle2 className="size-3 text-gold" />
                    {feature}
                  </Badge>
                ))}
              </div>
            </div>

            <Separator />

            {/* Description */}
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-3">Description</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{car.description}</p>
            </div>

            {/* Continue Loan specific sections */}
            {isContinueLoan && (
              <>
                <Separator />
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

                {/* Vehicle Condition */}
                {car.vehicleCondition && (
                  <div>
                    <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                      <ClipboardCheck className="size-5 text-gold" />
                      Vehicle Condition
                    </h2>
                    <Card className="border-gold/20 bg-gold/5 py-4">
                      <CardContent className="px-6">
                        <p className="text-sm text-foreground leading-relaxed">{car.vehicleCondition}</p>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </>
            )}

            <Separator />

            {/* CTA Buttons */}
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                className="flex-1 bg-gold text-gold-dark hover:bg-gold-light font-semibold h-12 text-base gap-2"
                onClick={handleCtaClick}
              >
                {isAuction && <Gavel className="size-5" />}
                {isContinueLoan && <FileText className="size-5" />}
                {isRent && <Calendar className="size-5" />}
                {!isAuction && !isContinueLoan && !isRent && <Phone className="size-5" />}
                {ctaLabel}
              </Button>
              <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold h-12 text-base gap-2">
                <MessageCircle className="size-5" />
                WhatsApp
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
