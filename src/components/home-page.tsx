'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { carsApi } from '@/lib/api'
import { cities } from '@/lib/mock-data'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import {
  Car,
  ShoppingCart,
  Wrench,
  Shield,
  Gavel,
  Banknote,
  FileText,
  Star,
  Search,
  MapPin,
  ChevronRight,
  CheckCircle,
  Users,
  Clock,
  Phone,
  Mail,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Headphones,
  Heart,
  Eye,
  Fuel,
  Gauge,
  Calendar,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  ExternalLink,
  Award,
  TrendingUp,
  Zap,
  MapPinned,
} from 'lucide-react'

const services = [
  {
    icon: Car,
    title: 'Rent',
    description: 'Premium car rentals by the hour, day, or week. From daily drivers to luxury exotics, find your perfect ride.',
    view: 'rent' as const,
  },
  {
    icon: ShoppingCart,
    title: 'Buy',
    description: 'Browse certified pre-owned and brand-new vehicles from verified dealers across Malaysia. Best prices guaranteed.',
    view: 'buy' as const,
  },
  {
    icon: Wrench,
    title: 'Repair',
    description: 'Connect with trusted workshops and certified mechanics. Get transparent quotes and track your repairs in real time.',
    view: 'repair' as const,
  },
  {
    icon: Shield,
    title: 'Insure',
    description: 'Compare comprehensive motor insurance plans from top providers. Protect your investment with the right coverage.',
    view: 'insurance' as const,
  },
  {
    icon: Gavel,
    title: 'Auction',
    description: 'Bid on exclusive and rare vehicles in our live auctions. Find unique deals you won\'t see anywhere else.',
    view: 'auction' as const,
  },
  {
    icon: Banknote,
    title: 'Loan',
    description: 'Apply for competitive car loans with fast approval from partner banks. Flexible terms and low interest rates.',
    view: 'loan' as const,
  },
  {
    icon: FileText,
    title: 'Continue Loan',
    description: 'Take over existing car loans with easy bank approval. Lower deposits, transparent terms, and a smoother process.',
    view: 'continueLoan' as const,
  },
]

const whyChoose = [
  {
    icon: ShieldCheck,
    title: 'Trusted Dealers',
    description: 'Every dealer on our platform undergoes a rigorous verification process. We check licenses, inspect inventory quality, and monitor customer reviews to ensure you deal with only the most reputable partners in Malaysia.',
  },
  {
    icon: CreditCard,
    title: 'Easy Financing',
    description: 'Our partnerships with Maybank, CIMB, Hong Leong, and other leading banks give you access to the most competitive rates in the market. Apply online, get approved in 24 hours, and drive away sooner.',
  },
  {
    icon: Shield,
    title: 'Secure Platform',
    description: 'Your transactions are protected with bank-grade encryption and escrow services. Every payment goes through our secure channel, and your personal data is safeguarded with industry-leading security protocols.',
  },
  {
    icon: Headphones,
    title: '24/7 Support',
    description: 'Our dedicated support team is available around the clock to assist you. Whether it\'s a question about a listing, a financing query, or after-sales support, we\'re just a call or message away.',
  },
]

const footerLinks = {
  about: [
    { label: 'About DK Vroom', href: '#' },
    { label: 'Our Story', href: '#' },
    { label: 'Careers', href: '#' },
    { label: 'Press & Media', href: '#' },
    { label: 'Investor Relations', href: '#' },
  ],
  services: [
    { label: 'Car Rental', href: '#' },
    { label: 'Buy a Car', href: '#' },
    { label: 'Car Repair', href: '#' },
    { label: 'Insurance', href: '#' },
    { label: 'Auction', href: '#' },
    { label: 'Car Loan', href: '#' },
  ],
  support: [
    { label: 'Help Center', href: '#' },
    { label: 'Safety Guidelines', href: '#' },
    { label: 'Terms of Service', href: '#' },
    { label: 'Privacy Policy', href: '#' },
    { label: 'Refund Policy', href: '#' },
  ],
}

function formatPrice(price: number, type: string) {
  if (type === 'rent') {
    return `RM ${price.toLocaleString()}/day`
  }
  return `RM ${price.toLocaleString()}`
}

function getTypeBadgeColor(type: string) {
  switch (type) {
    case 'rent':
      return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
    case 'sale':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    case 'auction':
      return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
    case 'continueLoan':
      return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
    default:
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  }
}

function getTypeLabel(type: string) {
  switch (type) {
    case 'rent':
      return 'For Rent'
    case 'sale':
      return 'For Sale'
    case 'auction':
      return 'Auction'
    case 'continueLoan':
      return 'Continue Loan'
    default:
      return type
  }
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`size-3.5 ${
            star <= Math.floor(rating)
              ? 'fill-[#c9a84c] text-[#c9a84c]'
              : star <= rating
                ? 'fill-[#c9a84c]/50 text-[#c9a84c]'
                : 'fill-muted text-muted'
          }`}
        />
      ))}
      <span className="ml-1 text-xs text-muted-foreground">{rating.toFixed(1)}</span>
    </div>
  )
}

export default function HomePage() {
  const { navigate, selectCar, setSearch, setCity, isLoggedIn, user, searchQuery, selectedCity } = useAppStore()
  const [localSearch, setLocalSearch] = useState(searchQuery)
  const [localCity, setLocalCity] = useState(selectedCity || 'All Cities')
  const [featuredCars, setFeaturedCars] = useState<any[]>([])
  const [carsLoading, setCarsLoading] = useState(true)
  const [dealers, setDealers] = useState<any[]>([])
  const [dealersLoading, setDealersLoading] = useState(true)

  useEffect(() => {
    async function fetchFeaturedCars() {
      try {
        const result = await carsApi.list({ featured: 'true', status: 'approved' })
        const cars = result.data || result
        const mapped = cars.map((car: any) => ({
          ...car,
          photos: typeof car.photos === 'string' ? JSON.parse(car.photos || '[]') : (car.photos || []),
          features: typeof car.features === 'string' ? JSON.parse(car.features || '[]') : (car.features || []),
          dealerName: car.dealer?.companyName || car.dealerUser?.name || 'DK Vroom Dealer',
          dealerVerified: car.dealer?.verified || false,
          rating: car.dealer?.rating || 4.5,
        }))
        setFeaturedCars(mapped)
      } catch (e) {
        console.error('Failed to fetch featured cars:', e)
      } finally {
        setCarsLoading(false)
      }
    }
    fetchFeaturedCars()
  }, [])

  useEffect(() => {
    async function fetchDealers() {
      try {
        const result = await carsApi.list({ status: 'approved', limit: 100 })
        const cars = result.data || result
        // Group cars by dealer to create dealer list
        const dealerMap = new Map<string, any>()
        cars.forEach((car: any) => {
          if (car.dealer && !dealerMap.has(car.dealer.id)) {
            dealerMap.set(car.dealer.id, {
              id: car.dealer.id,
              companyName: car.dealer.companyName || 'Dealer',
              logo: car.dealer.companyName?.charAt(0) || '🏎️',
              city: car.dealer.city || car.city || 'Malaysia',
              verified: car.dealer.verified || false,
              rating: car.dealer.rating || 4.5,
              totalListings: car.dealer.totalListings || 0,
              specialization: [car.type === 'rent' ? 'Luxury Rentals' : car.type === 'sale' ? 'Used Cars' : car.type === 'auction' ? 'Auction' : 'Continue Loan'],
            })
          }
        })
        setDealers(Array.from(dealerMap.values()).slice(0, 8))
      } catch (e) {
        console.error('Failed to fetch dealers:', e)
      } finally {
        setDealersLoading(false)
      }
    }
    fetchDealers()
  }, [])

  const handleSearch = () => {
    setSearch(localSearch)
    setCity(localCity === 'All Cities' ? '' : localCity)
    navigate('buy')
  }

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5f0e8]">
      {/* ===== HERO SECTION ===== */}
      <section className="relative w-full min-h-[90vh] flex items-center overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=1600&q=80)',
          }}
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 hero-gradient" />
        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#0a0a0a] to-transparent" />

        {/* Content */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-32">
          <div className="max-w-3xl">
            {/* Eyebrow */}
            <div className="flex items-center gap-2 mb-6">
              <div className="h-px w-8 bg-[#c9a84c]" />
              <span className="text-[#c9a84c] text-sm font-medium tracking-widest uppercase">
                Malaysia&apos;s Premium Automotive Marketplace
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-5xl sm:text-6xl lg:text-8xl font-bold leading-[0.95] mb-6">
              <span className="gold-shimmer">Drive</span>{' '}
              <span className="text-white">Extraordinary.</span>
            </h1>

            {/* Subtext */}
            <p className="text-lg sm:text-xl text-[#f5f0e8]/70 mb-10 max-w-xl leading-relaxed">
              Drive. Rent. Buy. Own. All in One Platform. Discover Malaysia&apos;s most trusted automotive marketplace
              for premium vehicles, seamless financing, and verified dealers.
            </p>

            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3 mb-8 max-w-2xl">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-[#c9a84c]" />
                <Input
                  type="text"
                  placeholder="Search car, brand, city…"
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  className="pl-12 h-13 bg-[#111111]/90 border-[#c9a84c]/40 text-[#f5f0e8] placeholder:text-[#8a8578] focus-visible:border-[#c9a84c] focus-visible:ring-[#c9a84c]/30 text-base rounded-lg"
                />
              </div>
              <Select value={localCity} onValueChange={setLocalCity}>
                <SelectTrigger className="w-full sm:w-48 h-13 bg-[#111111]/90 border-[#c9a84c]/40 text-[#f5f0e8] rounded-lg">
                  <MapPin className="size-4 text-[#c9a84c] mr-1" />
                  <SelectValue placeholder="Select City" />
                </SelectTrigger>
                <SelectContent className="bg-[#111111] border-[#2a2a2a]">
                  {cities.map((city) => (
                    <SelectItem key={city} value={city} className="text-[#f5f0e8] focus:bg-[#1a1a1a] focus:text-[#c9a84c]">
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleSearch}
                className="h-13 px-8 bg-[#c9a84c] hover:bg-[#b8963e] text-[#0a0a0a] font-semibold rounded-lg"
              >
                <Search className="size-4" />
                Search
              </Button>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={() => navigate('buy')}
                size="lg"
                className="bg-[#c9a84c] hover:bg-[#b8963e] text-[#0a0a0a] font-semibold px-8 h-12 rounded-lg"
              >
                Explore Now
                <ArrowRight className="size-4 ml-1" />
              </Button>
              <Button
                onClick={() => navigate('register')}
                size="lg"
                variant="outline"
                className="border-[#c9a84c] text-[#c9a84c] hover:bg-[#c9a84c]/10 font-semibold px-8 h-12 rounded-lg"
              >
                Partner With Us
                <ExternalLink className="size-4 ml-1" />
              </Button>
            </div>
          </div>

          {/* Stats Row */}
          <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-2xl">
            {[
              { value: '2,500+', label: 'Vehicles Listed' },
              { value: '180+', label: 'Verified Dealers' },
              { value: '15K+', label: 'Happy Customers' },
              { value: '98%', label: 'Satisfaction Rate' },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-2xl sm:text-3xl font-bold gold-text">{stat.value}</div>
                <div className="text-sm text-[#f5f0e8]/50 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== SERVICE CARDS SECTION ===== */}
      <section className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-14">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="h-px w-12 bg-[#c9a84c]" />
              <span className="text-[#c9a84c] text-sm font-medium tracking-widest uppercase">What We Offer</span>
              <div className="h-px w-12 bg-[#c9a84c]" />
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Our <span className="gold-text">Services</span>
            </h2>
            <div className="w-20 h-1 bg-gradient-to-r from-[#c9a84c] to-[#e8d48b] mx-auto rounded-full" />
            <p className="text-[#8a8578] mt-6 max-w-2xl mx-auto text-lg">
              From renting your dream car for the weekend to securing financing for your next purchase — DK Vroom covers every aspect of your automotive journey.
            </p>
          </div>

          {/* Service Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {services.map((service) => {
              const Icon = service.icon
              return (
                <Card
                  key={service.title}
                  className="luxury-card bg-[#111111] border-[#2a2a2a] cursor-pointer group rounded-xl overflow-hidden"
                  onClick={() => navigate(service.view)}
                >
                  <CardContent className="p-6">
                    <div className="w-14 h-14 rounded-xl bg-[#c9a84c]/10 flex items-center justify-center mb-5 group-hover:bg-[#c9a84c]/20 transition-colors">
                      <Icon className="size-7 text-[#c9a84c]" />
                    </div>
                    <h3 className="text-xl font-semibold text-[#f5f0e8] mb-3">{service.title}</h3>
                    <p className="text-[#8a8578] text-sm leading-relaxed mb-5">{service.description}</p>
                    <div className="flex items-center gap-1 text-[#c9a84c] text-sm font-medium group-hover:gap-2 transition-all">
                      <span>Explore</span>
                      <ChevronRight className="size-4" />
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* ===== FEATURED VEHICLES SECTION ===== */}
      <section className="py-20 sm:py-28 bg-[#080808]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-14">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="h-px w-12 bg-[#c9a84c]" />
              <span className="text-[#c9a84c] text-sm font-medium tracking-widest uppercase">Hand-Picked For You</span>
              <div className="h-px w-12 bg-[#c9a84c]" />
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Featured <span className="gold-text">Vehicles</span>
            </h2>
            <div className="w-20 h-1 bg-gradient-to-r from-[#c9a84c] to-[#e8d48b] mx-auto rounded-full" />
            <p className="text-[#8a8578] mt-6 max-w-2xl mx-auto text-lg">
              Explore our curated selection of premium vehicles, from daily rentals to exclusive auction pieces. Each listing is verified for quality and transparency.
            </p>
          </div>

          {/* Featured Cars Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {carsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="bg-[#111111] border-[#2a2a2a] overflow-hidden rounded-xl">
                  <div className="h-52 bg-[#1a1a1a] animate-pulse" />
                  <CardContent className="p-5">
                    <div className="h-5 bg-[#1a1a1a] rounded animate-pulse mb-3 w-3/4" />
                    <div className="h-4 bg-[#1a1a1a] rounded animate-pulse mb-2 w-1/2" />
                    <div className="h-4 bg-[#1a1a1a] rounded animate-pulse w-1/3" />
                  </CardContent>
                </Card>
              ))
            ) : featuredCars.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <p className="text-[#8a8578] text-lg">No featured vehicles available at the moment.</p>
                <p className="text-[#8a8578]/60 text-sm mt-2">Check back soon for new listings!</p>
              </div>
            ) : null}
            {featuredCars.map((car) => (
              <Card
                key={car.id}
                className="luxury-card bg-[#111111] border-[#2a2a2a] overflow-hidden group cursor-pointer rounded-xl"
                onClick={() => selectCar(car.id, car.type)}
              >
                {/* Car Image */}
                <div className="relative h-52 overflow-hidden">
                  <img
                    src={car.photos[0]}
                    alt={`${car.brand} ${car.model}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* Gradient overlay on image */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#111111] via-transparent to-transparent" />
                  {/* Type Badge */}
                  <Badge className={`absolute top-3 left-3 ${getTypeBadgeColor(car.type)} text-xs font-medium border`}>
                    {getTypeLabel(car.type)}
                  </Badge>
                  {/* Quick Actions */}
                  <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="icon" variant="ghost" className="size-8 bg-[#0a0a0a]/70 hover:bg-[#0a0a0a]/90 text-[#f5f0e8] rounded-full">
                      <Heart className="size-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="size-8 bg-[#0a0a0a]/70 hover:bg-[#0a0a0a]/90 text-[#f5f0e8] rounded-full">
                      <Eye className="size-4" />
                    </Button>
                  </div>
                  {/* Price on image */}
                  <div className="absolute bottom-3 left-3">
                    <span className="text-xl font-bold text-[#c9a84c]">{formatPrice(car.price, car.type)}</span>
                  </div>
                </div>

                <CardContent className="p-5">
                  {/* Brand & Model */}
                  <h3 className="text-lg font-semibold text-[#f5f0e8] mb-2 group-hover:text-[#c9a84c] transition-colors">
                    {car.brand} {car.model}
                  </h3>

                  {/* Key Specs */}
                  <div className="flex items-center gap-4 text-xs text-[#8a8578] mb-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="size-3.5" />
                      {car.year}
                    </span>
                    <span className="flex items-center gap-1">
                      <Gauge className="size-3.5" />
                      {(car.mileage / 1000).toFixed(0)}K km
                    </span>
                    <span className="flex items-center gap-1">
                      <Fuel className="size-3.5" />
                      {car.fuelType.charAt(0).toUpperCase() + car.fuelType.slice(1)}
                    </span>
                  </div>

                  {/* Location */}
                  <div className="flex items-center gap-1 text-sm text-[#8a8578] mb-3">
                    <MapPin className="size-3.5 text-[#c9a84c]" />
                    {car.city}
                  </div>

                  <Separator className="bg-[#2a2a2a] my-3" />

                  {/* Dealer & Rating */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="size-7 border border-[#2a2a2a]">
                        <AvatarFallback className="bg-[#1a1a1a] text-[#c9a84c] text-xs">
                          {car.dealerName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-[#8a8578] truncate max-w-[120px]">{car.dealerName}</span>
                      {car.dealerVerified && (
                        <CheckCircle className="size-3.5 text-[#c9a84c] shrink-0" />
                      )}
                    </div>
                    <StarRating rating={car.rating} />
                  </div>

                  {/* View Details Button (visible on hover) */}
                  <Button
                    className="w-full mt-4 bg-[#c9a84c] hover:bg-[#b8963e] text-[#0a0a0a] font-semibold opacity-0 group-hover:opacity-100 transition-opacity h-9 rounded-lg"
                    onClick={(e) => {
                      e.stopPropagation()
                      selectCar(car.id, car.type)
                    }}
                  >
                    View Details
                    <ArrowRight className="size-4 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* View All Button */}
          <div className="text-center mt-12">
            <Button
              onClick={() => navigate('buy')}
              variant="outline"
              size="lg"
              className="border-[#c9a84c] text-[#c9a84c] hover:bg-[#c9a84c]/10 font-semibold px-10 h-12 rounded-lg"
            >
              View All Vehicles
              <ArrowRight className="size-4 ml-1" />
            </Button>
          </div>
        </div>
      </section>

      {/* ===== VERIFIED DEALERS SECTION ===== */}
      <section className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-14">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="h-px w-12 bg-[#c9a84c]" />
              <span className="text-[#c9a84c] text-sm font-medium tracking-widest uppercase">Trusted Partners</span>
              <div className="h-px w-12 bg-[#c9a84c]" />
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Verified <span className="gold-text">Dealers</span>
            </h2>
            <div className="w-20 h-1 bg-gradient-to-r from-[#c9a84c] to-[#e8d48b] mx-auto rounded-full" />
            <p className="text-[#8a8578] mt-6 max-w-2xl mx-auto text-lg">
              Our network of thoroughly vetted dealers ensures every transaction is safe, transparent, and backed by quality guarantees.
            </p>
          </div>

          {/* Horizontal Scroll */}
          <div className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
            {dealersLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="bg-[#111111] border-[#2a2a2a] min-w-[280px] sm:min-w-[300px] snap-start shrink-0 rounded-xl">
                  <CardContent className="p-6">
                    <div className="h-10 bg-[#1a1a1a] rounded animate-pulse mb-3 w-3/4" />
                    <div className="h-4 bg-[#1a1a1a] rounded animate-pulse w-1/2" />
                  </CardContent>
                </Card>
              ))
            ) : dealers.length === 0 ? (
              <p className="text-[#8a8578] py-8">No dealers available yet.</p>
            ) : dealers.map((dealer) => (
              <Card
                key={dealer.id}
                className="luxury-card bg-[#111111] border-[#2a2a2a] min-w-[280px] sm:min-w-[300px] snap-start shrink-0 rounded-xl"
              >
                <CardContent className="p-6">
                  {/* Dealer Logo & Name */}
                  <div className="flex items-start gap-4 mb-4">
                    <Avatar className="size-14 border-2 border-[#c9a84c]/30 shrink-0">
                      <AvatarFallback className="bg-[#1a1a1a] text-2xl">
                        {dealer.logo}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-[#f5f0e8] truncate">{dealer.companyName}</h3>
                        {dealer.verified && (
                          <Badge className="bg-[#c9a84c]/20 text-[#c9a84c] border-[#c9a84c]/30 text-[10px] px-1.5 py-0 shrink-0">
                            <CheckCircle className="size-3 mr-0.5" />
                            Verified
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-[#8a8578] mt-1">
                        <MapPin className="size-3.5 text-[#c9a84c]" />
                        {dealer.city}
                      </div>
                    </div>
                  </div>

                  {/* Rating */}
                  <StarRating rating={dealer.rating} />

                  {/* Specializations */}
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {dealer.specialization.map((spec) => (
                      <Badge key={spec} variant="outline" className="text-[10px] border-[#2a2a2a] text-[#8a8578]">
                        {spec}
                      </Badge>
                    ))}
                  </div>

                  {/* Listings Count */}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#2a2a2a]">
                    <span className="text-sm text-[#8a8578]">
                      <span className="text-[#c9a84c] font-semibold">{dealer.totalListings}</span> listings
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-[#c9a84c] hover:text-[#e8d48b] hover:bg-[#c9a84c]/10 text-xs h-7 px-2"
                    >
                      View All
                      <ChevronRight className="size-3 ml-0.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ===== WHY CHOOSE DK VROOM SECTION ===== */}
      <section className="py-20 sm:py-28 bg-[#080808]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-14">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="h-px w-12 bg-[#c9a84c]" />
              <span className="text-[#c9a84c] text-sm font-medium tracking-widest uppercase">The DK Vroom Difference</span>
              <div className="h-px w-12 bg-[#c9a84c]" />
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Why Choose <span className="gold-text">DK Vroom</span>?
            </h2>
            <div className="w-20 h-1 bg-gradient-to-r from-[#c9a84c] to-[#e8d48b] mx-auto rounded-full" />
            <p className="text-[#8a8578] mt-6 max-w-2xl mx-auto text-lg">
              We&apos;re not just another car marketplace. DK Vroom is built on trust, transparency, and a commitment to making your automotive experience exceptional.
            </p>
          </div>

          {/* Feature Blocks */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {whyChoose.map((feature, index) => {
              const Icon = feature.icon
              return (
                <Card
                  key={feature.title}
                  className="luxury-card bg-[#111111] border-[#2a2a2a] rounded-xl group"
                >
                  <CardContent className="p-8">
                    <div className="flex items-start gap-5">
                      <div className="w-16 h-16 rounded-2xl bg-[#c9a84c]/10 flex items-center justify-center shrink-0 group-hover:bg-[#c9a84c]/20 transition-colors">
                        <Icon className="size-8 text-[#c9a84c]" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-[#f5f0e8] mb-3">{feature.title}</h3>
                        <p className="text-[#8a8578] leading-relaxed">{feature.description}</p>
                      </div>
                    </div>
                    {/* Decorative number */}
                    <div className="absolute top-4 right-6 text-6xl font-bold text-[#c9a84c]/5 select-none">
                      {String(index + 1).padStart(2, '0')}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Trust Indicators Row */}
          <div className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { icon: Award, value: 'SIRIM Certified', label: 'Platform Security' },
              { icon: TrendingUp, value: 'RM 50M+', label: 'Total Transactions' },
              { icon: Zap, value: '< 24 Hours', label: 'Loan Approval' },
              { icon: MapPinned, value: '10 States', label: 'Nationwide Coverage' },
            ].map((item) => {
              const ItemIcon = item.icon
              return (
                <div key={item.label} className="text-center p-6 rounded-xl bg-[#111111]/50 border border-[#2a2a2a]/50">
                  <ItemIcon className="size-8 text-[#c9a84c] mx-auto mb-3" />
                  <div className="text-lg font-semibold text-[#f5f0e8]">{item.value}</div>
                  <div className="text-sm text-[#8a8578]">{item.label}</div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ===== PARTNER WITH US SECTION ===== */}
      <section className="py-20 sm:py-28 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#c9a84c]/5 via-transparent to-[#c9a84c]/3" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#c9a84c]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#c9a84c]/3 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            {/* Section Header */}
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="h-px w-12 bg-[#c9a84c]" />
              <span className="text-[#c9a84c] text-sm font-medium tracking-widest uppercase">Grow Your Business</span>
              <div className="h-px w-12 bg-[#c9a84c]" />
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Partner With <span className="gold-text">Us</span>
            </h2>
            <div className="w-20 h-1 bg-gradient-to-r from-[#c9a84c] to-[#e8d48b] mx-auto rounded-full" />

            <p className="text-[#8a8578] mt-6 text-lg leading-relaxed">
              Join Malaysia&apos;s fastest-growing automotive marketplace and unlock access to thousands of qualified buyers.
              As a DK Vroom dealer, you&apos;ll benefit from premium visibility, advanced analytics, and a streamlined
              lead management system that converts browsers into buyers.
            </p>

            {/* Benefits list */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-10 text-left max-w-2xl mx-auto">
              {[
                'Premium listing placement and featured spots',
                'Real-time analytics and lead tracking dashboard',
                'Dedicated account manager for support',
                'Zero commission on your first 10 sales',
                'Access to exclusive dealer financing partners',
                'Marketing and promotional support from DK Vroom',
              ].map((benefit) => (
                <div key={benefit} className="flex items-start gap-3">
                  <CheckCircle className="size-5 text-[#c9a84c] shrink-0 mt-0.5" />
                  <span className="text-[#f5f0e8]/80 text-sm">{benefit}</span>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12">
              {isLoggedIn && user?.role === 'dealer' ? (
                <Button
                  onClick={() => navigate('dealerDashboard')}
                  size="lg"
                  className="bg-[#c9a84c] hover:bg-[#b8963e] text-[#0a0a0a] font-semibold px-10 h-12 rounded-lg"
                >
                  Go to Dashboard
                  <ArrowRight className="size-4 ml-1" />
                </Button>
              ) : (
                <>
                  <Button
                    onClick={() => navigate('register')}
                    size="lg"
                    className="bg-[#c9a84c] hover:bg-[#b8963e] text-[#0a0a0a] font-semibold px-10 h-12 rounded-lg"
                  >
                    Register as Dealer
                    <ArrowRight className="size-4 ml-1" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-[#c9a84c] text-[#c9a84c] hover:bg-[#c9a84c]/10 font-semibold px-10 h-12 rounded-lg"
                  >
                    Learn More
                    <ExternalLink className="size-4 ml-1" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="bg-[#060606] border-t border-[#2a2a2a] pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Main Footer Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 mb-14">
            {/* Brand Column */}
            <div className="lg:col-span-2">
              <h3 className="text-2xl font-bold gold-text mb-4">DK Vroom</h3>
              <p className="text-[#8a8578] leading-relaxed mb-6 max-w-sm">
                Malaysia&apos;s premier automotive marketplace. Whether you&apos;re looking to rent, buy, sell, or service
                your vehicle, we bring trust, transparency, and convenience to every journey.
              </p>
              {/* Social Links */}
              <div className="flex gap-3">
                {[
                  { icon: Facebook, label: 'Facebook' },
                  { icon: Twitter, label: 'Twitter' },
                  { icon: Instagram, label: 'Instagram' },
                  { icon: Youtube, label: 'YouTube' },
                ].map((social) => {
                  const SocialIcon = social.icon
                  return (
                    <Button
                      key={social.label}
                      variant="ghost"
                      size="icon"
                      className="size-10 rounded-full border border-[#2a2a2a] text-[#8a8578] hover:text-[#c9a84c] hover:border-[#c9a84c]/50 hover:bg-[#c9a84c]/10"
                    >
                      <SocialIcon className="size-4" />
                      <span className="sr-only">{social.label}</span>
                    </Button>
                  )
                })}
              </div>
            </div>

            {/* About Column */}
            <div>
              <h4 className="text-[#c9a84c] font-semibold mb-4 text-sm uppercase tracking-wider">About</h4>
              <ul className="space-y-3">
                {footerLinks.about.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-[#8a8578] hover:text-[#c9a84c] text-sm transition-colors">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Services Column */}
            <div>
              <h4 className="text-[#c9a84c] font-semibold mb-4 text-sm uppercase tracking-wider">Services</h4>
              <ul className="space-y-3">
                {footerLinks.services.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-[#8a8578] hover:text-[#c9a84c] text-sm transition-colors">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support Column */}
            <div>
              <h4 className="text-[#c9a84c] font-semibold mb-4 text-sm uppercase tracking-wider">Support</h4>
              <ul className="space-y-3">
                {footerLinks.support.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-[#8a8578] hover:text-[#c9a84c] text-sm transition-colors">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
              {/* Contact Info */}
              <div className="mt-6 space-y-2">
                <div className="flex items-center gap-2 text-sm text-[#8a8578]">
                  <Phone className="size-3.5 text-[#c9a84c]" />
                  +60 3-8888 9999
                </div>
                <div className="flex items-center gap-2 text-sm text-[#8a8578]">
                  <Mail className="size-3.5 text-[#c9a84c]" />
                  hello@dkvroom.com
                </div>
                <div className="flex items-center gap-2 text-sm text-[#8a8578]">
                  <Clock className="size-3.5 text-[#c9a84c]" />
                  24/7 Customer Support
                </div>
              </div>
            </div>
          </div>

          {/* Payment Icons Row */}
          <div className="border-t border-[#2a2a2a] pt-8 mb-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-xs text-[#8a8578] uppercase tracking-wider mb-3 block">Accepted Payments</span>
                <div className="flex gap-3">
                  {['FPX', 'TNG', 'Billplz', 'Stripe'].map((payment) => (
                    <div
                      key={payment}
                      className="px-3 py-1.5 rounded bg-[#111111] border border-[#2a2a2a] text-xs text-[#8a8578] font-medium"
                    >
                      {payment}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-xs text-[#8a8578] uppercase tracking-wider mb-3 block block text-right">Regulated By</span>
                <div className="flex gap-3">
                  {['BNM', 'SC'].map((reg) => (
                    <div
                      key={reg}
                      className="px-3 py-1.5 rounded bg-[#111111] border border-[#2a2a2a] text-xs text-[#8a8578] font-medium"
                    >
                      {reg}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Copyright Row */}
          <div className="border-t border-[#2a2a2a] pt-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-[#8a8578]">
                &copy; 2026 DK Vroom. All Rights Reserved.
              </p>
              <div className="flex gap-6 text-sm text-[#8a8578]">
                <a href="#" className="hover:text-[#c9a84c] transition-colors">Privacy</a>
                <a href="#" className="hover:text-[#c9a84c] transition-colors">Terms</a>
                <a href="#" className="hover:text-[#c9a84c] transition-colors">Cookies</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
