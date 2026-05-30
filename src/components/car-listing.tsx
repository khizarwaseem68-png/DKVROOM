'use client'

import { useState, useMemo, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { sampleCars, cities, brands, type CarData } from '@/lib/mock-data'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  MapPin,
  Star,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Search,
  SlidersHorizontal,
  Gavel,
  Clock,
  Banknote,
  FileText,
  Calendar,
  Fuel,
  Car,
  X,
} from 'lucide-react'

interface CarListingProps {
  type: 'rent' | 'sale' | 'auction' | 'continueLoan' | 'all'
}

const PAGE_SIZE = 6

const typeConfig: Record<string, { title: string; subtitle: string; priceLabel: string }> = {
  rent: {
    title: 'Rent a Car',
    subtitle: 'Premium vehicles available for daily, weekly, or monthly rental',
    priceLabel: '/day',
  },
  sale: {
    title: 'Buy & Sell Cars',
    subtitle: 'Find your perfect ride from verified dealers across Malaysia',
    priceLabel: '',
  },
  auction: {
    title: 'Live Auctions',
    subtitle: 'Bid on exclusive vehicles — highest bidder wins',
    priceLabel: '',
  },
  continueLoan: {
    title: 'Continue Loan / Sambung Bayar',
    subtitle: 'Take over existing car loans with easy approval process',
    priceLabel: '',
  },
  all: {
    title: 'All Vehicles',
    subtitle: 'Browse our complete collection of vehicles across all categories',
    priceLabel: '',
  },
}

function formatPrice(amount: number): string {
  return `RM ${amount.toLocaleString('en-MY')}`
}

function formatMileage(km: number): string {
  return `${km.toLocaleString('en-MY')} km`
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`size-3 ${
            star <= Math.floor(rating)
              ? 'fill-gold text-gold'
              : star <= rating
              ? 'fill-gold/50 text-gold'
              : 'text-muted-foreground/30'
          }`}
        />
      ))}
      <span className="ml-1 text-xs text-muted-foreground">{rating.toFixed(1)}</span>
    </div>
  )
}

function CountdownTimer({ endDate }: { endDate: string }) {
  const [timeLeft, setTimeLeft] = useState('')

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date().getTime()
      const end = new Date(endDate).getTime()
      const diff = end - now

      if (diff <= 0) {
        setTimeLeft('Ended')
        return
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`)
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [endDate])

  return <span>{timeLeft}</span>
}

function TypeBadge({ type }: { type: string }) {
  const config: Record<string, { label: string; icon: React.ReactNode }> = {
    rent: { label: 'For Rent', icon: <Car className="size-3" /> },
    sale: { label: 'For Sale', icon: <Banknote className="size-3" /> },
    auction: { label: 'Auction', icon: <Gavel className="size-3" /> },
    continueLoan: { label: 'Sambung Bayar', icon: <FileText className="size-3" /> },
  }

  const item = config[type]
  if (!item) return null

  return (
    <Badge className="bg-gold/20 text-gold border-gold/30 gap-1">
      {item.icon}
      {item.label}
    </Badge>
  )
}

function CarCard({ car, type }: { car: CarData; type: string }) {
  const { selectCar } = useAppStore()
  const isContinueLoan = car.type === 'continueLoan'
  const isAuction = car.type === 'auction'

  return (
    <Card
      className="luxury-card cursor-pointer overflow-hidden bg-card py-0 gap-0"
      onClick={() => selectCar(car.id, car.type)}
    >
      {/* Image */}
      <div className="relative aspect-[16/10] overflow-hidden">
        <img
          src={car.photos[0]}
          alt={`${car.brand} ${car.model}`}
          className="h-full w-full object-cover transition-transform duration-500 hover:scale-110"
        />
        {/* Type badge overlay */}
        <div className="absolute top-3 left-3">
          <TypeBadge type={car.type} />
        </div>
        {/* Featured badge */}
        {car.featured && (
          <div className="absolute top-3 right-3">
            <Badge className="bg-gold text-gold-dark border-0 text-xs font-bold">
              ⭐ Featured
            </Badge>
          </div>
        )}
        {/* Auction countdown overlay */}
        {isAuction && car.auctionEnd && (
          <div className="absolute bottom-3 left-3 right-3">
            <div className="flex items-center gap-1.5 rounded-md bg-black/80 backdrop-blur-sm px-2.5 py-1.5 text-xs">
              <Clock className="size-3.5 text-gold" />
              <span className="text-gold font-medium">
                <CountdownTimer endDate={car.auctionEnd} />
              </span>
            </div>
          </div>
        )}
      </div>

      <CardContent className="p-4 space-y-3">
        {/* Brand + Model + Year */}
        <div>
          <h3 className="font-semibold text-foreground text-base leading-tight">
            {car.brand} {car.model}
          </h3>
          <p className="text-sm text-muted-foreground">{car.year} · {car.color}</p>
        </div>

        {/* Price section */}
        {isContinueLoan ? (
          <div className="rounded-lg border border-gold/30 bg-gold/5 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Takeover / Deposit</span>
              <span className="text-sm font-semibold text-gold">
                {formatPrice(car.deposit || 0)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Monthly Installment</span>
              <span className="text-sm font-semibold text-foreground">
                {formatPrice(car.monthlyInstallment || 0)}/mo
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Remaining</span>
              <span className="text-xs text-muted-foreground">
                {car.remainingMonths} months · {formatPrice(car.remainingBalance || 0)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Bank</span>
              <span className="text-xs font-medium text-foreground">{car.bankName}</span>
            </div>
          </div>
        ) : isAuction ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Current Bid</span>
              <span className="text-lg font-bold gold-text">
                {formatPrice(car.currentBid || 0)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Starting Bid</span>
              <span className="text-sm text-muted-foreground">
                {formatPrice(car.auctionStartBid || 0)}
              </span>
            </div>
            <Button
              className="w-full bg-gold text-gold-dark hover:bg-gold-light font-semibold"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                selectCar(car.id, car.type)
              }}
            >
              <Gavel className="size-4" />
              Place Bid
            </Button>
          </div>
        ) : (
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold gold-text">
              {formatPrice(car.price)}
            </span>
            {type === 'rent' && (
              <span className="text-sm text-muted-foreground">/day</span>
            )}
          </div>
        )}

        {/* Location */}
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <MapPin className="size-3.5 shrink-0" />
          <span className="text-xs truncate">{car.location}</span>
        </div>

        <div className="h-px bg-border" />

        {/* Dealer + Rating */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{car.dealerName}</span>
            {car.dealerVerified && (
              <ShieldCheck className="size-3.5 text-gold" />
            )}
          </div>
          <StarRating rating={car.rating} />
        </div>
      </CardContent>
    </Card>
  )
}

export default function CarListing({ type }: CarListingProps) {
  const { searchQuery, selectedCity, selectCar } = useAppStore()
  const [brandFilter, setBrandFilter] = useState('All Brands')
  const [cityFilter, setCityFilter] = useState('All Cities')
  const [transmissionFilter, setTransmissionFilter] = useState('all')
  const [fuelFilter, setFuelFilter] = useState('all')
  const [priceRange, setPriceRange] = useState<'all' | 'low' | 'mid' | 'high'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)

  // Helper to set filter and reset page
  const updateFilter = (setter: (val: string) => void, value: string) => {
    setter(value)
    setCurrentPage(1)
  }

  const config = typeConfig[type] || typeConfig.all

  const filteredCars = useMemo(() => {
    let cars = sampleCars

    // Filter by type
    if (type !== 'all') {
      cars = cars.filter((car) => car.type === type)
    }

    // Filter by brand
    if (brandFilter !== 'All Brands') {
      cars = cars.filter((car) => car.brand === brandFilter)
    }

    // Filter by city
    if (cityFilter !== 'All Cities') {
      cars = cars.filter((car) => car.city === cityFilter)
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      cars = cars.filter(
        (car) =>
          car.brand.toLowerCase().includes(query) ||
          car.model.toLowerCase().includes(query) ||
          car.description.toLowerCase().includes(query)
      )
    }

    // Filter by transmission
    if (transmissionFilter !== 'all') {
      cars = cars.filter((car) => car.transmission === transmissionFilter)
    }

    // Filter by fuel type
    if (fuelFilter !== 'all') {
      cars = cars.filter((car) => car.fuelType === fuelFilter)
    }

    // Filter by price range
    if (priceRange !== 'all') {
      cars = cars.filter((car) => {
        const price = car.type === 'auction' ? (car.currentBid || 0) : car.price
        switch (priceRange) {
          case 'low':
            return price < 100000
          case 'mid':
            return price >= 100000 && price < 500000
          case 'high':
            return price >= 500000
          default:
            return true
        }
      })
    }

    return cars
  }, [type, brandFilter, cityFilter, searchQuery, transmissionFilter, fuelFilter, priceRange])

  const totalPages = Math.max(1, Math.ceil(filteredCars.length / PAGE_SIZE))
  const paginatedCars = filteredCars.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  )

  const hasActiveFilters =
    brandFilter !== 'All Brands' ||
    cityFilter !== 'All Cities' ||
    transmissionFilter !== 'all' ||
    fuelFilter !== 'all' ||
    priceRange !== 'all'

  const clearFilters = () => {
    setBrandFilter('All Brands')
    setCityFilter('All Cities')
    setTransmissionFilter('all')
    setFuelFilter('all')
    setPriceRange('all')
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold gold-text sm:text-4xl">{config.title}</h1>
          <p className="mt-2 text-muted-foreground text-sm sm:text-base">{config.subtitle}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {filteredCars.length} vehicle{filteredCars.length !== 1 ? 's' : ''} available
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Filter toggle for mobile */}
        <div className="flex items-center justify-between mb-4 lg:hidden">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <SlidersHorizontal className="size-4" />
            Filters
            {hasActiveFilters && (
              <span className="size-2 rounded-full bg-gold" />
            )}
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
            showFilters ? 'grid-cols-1 sm:grid-cols-2' : 'hidden lg:grid lg:grid-cols-5'
          }`}
        >
          {/* Brand */}
          <Select value={brandFilter} onValueChange={(v) => updateFilter(setBrandFilter, v)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All Brands" />
            </SelectTrigger>
            <SelectContent>
              {brands.map((brand) => (
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
              {cities.map((city) => (
                <SelectItem key={city} value={city}>
                  {city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Price Range */}
          <Select value={priceRange} onValueChange={(v) => updateFilter((val) => setPriceRange(val as typeof priceRange), v)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Price Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Prices</SelectItem>
              <SelectItem value="low">Under RM 100K</SelectItem>
              <SelectItem value="mid">RM 100K - 500K</SelectItem>
              <SelectItem value="high">Above RM 500K</SelectItem>
            </SelectContent>
          </Select>

          {/* Transmission */}
          <Select value={transmissionFilter} onValueChange={(v) => updateFilter(setTransmissionFilter, v)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Transmission" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Transmissions</SelectItem>
              <SelectItem value="auto">Automatic</SelectItem>
              <SelectItem value="manual">Manual</SelectItem>
            </SelectContent>
          </Select>

          {/* Fuel Type */}
          <Select value={fuelFilter} onValueChange={(v) => updateFilter(setFuelFilter, v)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Fuel Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Fuel Types</SelectItem>
              <SelectItem value="petrol">Petrol</SelectItem>
              <SelectItem value="diesel">Diesel</SelectItem>
              <SelectItem value="hybrid">Hybrid</SelectItem>
              <SelectItem value="electric">Electric</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Active filters indicators */}
        {hasActiveFilters && (
          <div className="hidden lg:flex items-center gap-2 mb-4">
            <span className="text-xs text-muted-foreground">Active filters:</span>
            {brandFilter !== 'All Brands' && (
              <Badge variant="secondary" className="gap-1 text-xs">
                {brandFilter}
                <X className="size-3 cursor-pointer" onClick={() => updateFilter(setBrandFilter, 'All Brands')} />
              </Badge>
            )}
            {cityFilter !== 'All Cities' && (
              <Badge variant="secondary" className="gap-1 text-xs">
                {cityFilter}
                <X className="size-3 cursor-pointer" onClick={() => updateFilter(setCityFilter, 'All Cities')} />
              </Badge>
            )}
            {transmissionFilter !== 'all' && (
              <Badge variant="secondary" className="gap-1 text-xs">
                {transmissionFilter === 'auto' ? 'Automatic' : 'Manual'}
                <X className="size-3 cursor-pointer" onClick={() => updateFilter(setTransmissionFilter, 'all')} />
              </Badge>
            )}
            {fuelFilter !== 'all' && (
              <Badge variant="secondary" className="gap-1 text-xs capitalize">
                {fuelFilter}
                <X className="size-3 cursor-pointer" onClick={() => updateFilter(setFuelFilter, 'all')} />
              </Badge>
            )}
            {priceRange !== 'all' && (
              <Badge variant="secondary" className="gap-1 text-xs">
                {priceRange === 'low' ? '< RM 100K' : priceRange === 'mid' ? 'RM 100K-500K' : '> RM 500K'}
                <X className="size-3 cursor-pointer" onClick={() => updateFilter((val) => setPriceRange(val as typeof priceRange), 'all')} />
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-xs text-muted-foreground h-6 px-2"
            >
              Clear all
            </Button>
          </div>
        )}

        {/* Car grid */}
        {paginatedCars.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2">
            {paginatedCars.map((car) => (
              <CarCard key={car.id} car={car} type={type} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="size-20 rounded-full bg-muted flex items-center justify-center mb-4">
              <Search className="size-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">No vehicles found</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Try adjusting your filters or search criteria to find what you&apos;re looking for.
            </p>
            {hasActiveFilters && (
              <Button
                variant="outline"
                className="mt-4 gap-2"
                onClick={clearFilters}
              >
                <X className="size-4" />
                Clear all filters
              </Button>
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="size-9"
            >
              <ChevronLeft className="size-4" />
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? 'default' : 'outline'}
                size="icon"
                onClick={() => setCurrentPage(page)}
                className={`size-9 ${
                  currentPage === page
                    ? 'bg-gold text-gold-dark hover:bg-gold-light'
                    : ''
                }`}
              >
                {page}
              </Button>
            ))}
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="size-9"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
