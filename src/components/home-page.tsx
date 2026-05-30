'use client'

import { useState, useEffect } from 'react'
import { useAppStore, type View } from '@/lib/store'
import { carsApi } from '@/lib/api'
import { CITIES, formatPrice, formatMileage, type VehicleType } from '@/lib/constants'
import { StarRating, EmptyState, VehicleTypeBadge } from '@/components/shared'
import { Card, CardContent } from '@/components/ui/card'
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
  Search,
  MapPin,
  ChevronRight,
  CheckCircle,
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
  Clock,
  LucideIcon,
} from 'lucide-react'

// ===== TYPES =====

interface FeaturedCar {
  id: string
  brand: string
  model: string
  year: number
  price: number
  mileage: number
  fuelType: string
  city: string
  type: string
  photos: string[]
  features: string[]
  dealerName: string
  dealerVerified: boolean
  rating: number
}

interface Dealer {
  id: string
  companyName: string
  logo: string
  city: string
  verified: boolean
  rating: number
  totalListings: number
  specialization: string[]
}

interface ServiceItem {
  icon: LucideIcon
  title: string
  description: string
  view: View
}

interface WhyChooseItem {
  icon: LucideIcon
  title: string
  description: string
}

interface TrustIndicator {
  icon: LucideIcon
  value: string
  label: string
}

// ===== STATIC DATA =====

const services: ServiceItem[] = [
  {
    icon: Car,
    title: 'Rent',
    description: 'Premium car rentals by the hour, day, or week. From daily drivers to luxury exotics, find your perfect ride.',
    view: 'rent',
  },
  {
    icon: ShoppingCart,
    title: 'Buy',
    description: 'Browse certified pre-owned and brand-new vehicles from verified dealers across Malaysia. Best prices guaranteed.',
    view: 'buy',
  },
  {
    icon: Wrench,
    title: 'Repair',
    description: 'Connect with trusted workshops and certified mechanics. Get transparent quotes and track your repairs in real time.',
    view: 'repair',
  },
  {
    icon: Shield,
    title: 'Insure',
    description: 'Compare comprehensive motor insurance plans from top providers. Protect your investment with the right coverage.',
    view: 'insurance',
  },
  {
    icon: Gavel,
    title: 'Auction',
    description: 'Bid on exclusive and rare vehicles in our live auctions. Find unique deals you won\'t see anywhere else.',
    view: 'auction',
  },
  {
    icon: Banknote,
    title: 'Loan',
    description: 'Apply for competitive car loans with fast approval from partner banks. Flexible terms and low interest rates.',
    view: 'loan',
  },
  {
    icon: FileText,
    title: 'Continue Loan',
    description: 'Take over existing car loans with easy bank approval. Lower deposits, transparent terms, and a smoother process.',
    view: 'continueLoan',
  },
]

const whyChoose: WhyChooseItem[] = [
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

const trustIndicators: TrustIndicator[] = [
  { icon: Award, value: 'SIRIM Certified', label: 'Platform Security' },
  { icon: TrendingUp, value: 'RM 50M+', label: 'Total Transactions' },
  { icon: Zap, value: '< 24 Hours', label: 'Loan Approval' },
  { icon: MapPinned, value: '10 States', label: 'Nationwide Coverage' },
]

const partnerBenefits = [
  'Premium listing placement and featured spots',
  'Real-time analytics and lead tracking dashboard',
  'Dedicated account manager for support',
  'Zero commission on your first 10 sales',
  'Access to exclusive dealer financing partners',
  'Marketing and promotional support from DK Vroom',
]

const heroStats = [
  { value: '2,500+', label: 'Vehicles Listed' },
  { value: '180+', label: 'Verified Dealers' },
  { value: '15K+', label: 'Happy Customers' },
  { value: '98%', label: 'Satisfaction Rate' },
]

const footerLinks = {
  about: [
    { label: 'About DK Vroom', view: 'home' as View },
    { label: 'Our Story', view: 'home' as View },
    { label: 'Careers', view: 'home' as View },
    { label: 'Press & Media', view: 'home' as View },
    { label: 'Investor Relations', view: 'home' as View },
  ],
  services: [
    { label: 'Car Rental', view: 'rent' as View },
    { label: 'Buy a Car', view: 'buy' as View },
    { label: 'Car Repair', view: 'repair' as View },
    { label: 'Insurance', view: 'insurance' as View },
    { label: 'Auction', view: 'auction' as View },
    { label: 'Car Loan', view: 'loan' as View },
  ],
  support: [
    { label: 'Help Center', view: 'home' as View },
    { label: 'Safety Guidelines', view: 'home' as View },
    { label: 'Terms of Service', view: 'home' as View },
    { label: 'Privacy Policy', view: 'home' as View },
    { label: 'Refund Policy', view: 'home' as View },
  ],
}

const socialLinks = [
  { icon: Facebook, label: 'Facebook' },
  { icon: Twitter, label: 'Twitter' },
  { icon: Instagram, label: 'Instagram' },
  { icon: Youtube, label: 'YouTube' },
]

// ===== SKELETON COMPONENTS =====

function VehicleCardSkeleton() {
  return (
    <Card className="bg-card border-border overflow-hidden rounded-xl">
      <div className="h-52 skeleton" />
      <CardContent className="p-5">
        <div className="h-5 skeleton rounded mb-3 w-3/4" />
        <div className="h-4 skeleton rounded mb-2 w-1/2" />
        <div className="h-4 skeleton rounded mb-2 w-2/3" />
        <div className="h-4 skeleton rounded w-1/3" />
      </CardContent>
    </Card>
  )
}

function DealerCardSkeleton() {
  return (
    <Card className="bg-card border-border min-w-[280px] sm:min-w-[300px] snap-start shrink-0 rounded-xl">
      <CardContent className="p-6">
        <div className="flex items-start gap-4 mb-4">
          <div className="size-14 skeleton rounded-full shrink-0" />
          <div className="flex-1">
            <div className="h-5 skeleton rounded mb-2 w-3/4" />
            <div className="h-4 skeleton rounded w-1/2" />
          </div>
        </div>
        <div className="h-4 skeleton rounded mb-3 w-1/3" />
        <div className="flex gap-1.5">
          <div className="h-5 skeleton rounded w-20" />
          <div className="h-5 skeleton rounded w-16" />
        </div>
      </CardContent>
    </Card>
  )
}

// ===== SECTION HEADER COMPONENT =====

function SectionHeader({ overline, titlePrefix, titleAccent, description }: {
  overline: string
  titlePrefix: string
  titleAccent: string
  description: string
}) {
  return (
    <div className="text-center mb-14">
      <div className="section-divider mb-4">
        <span className="text-gold text-overline">{overline}</span>
      </div>
      <h2 className="heading-lg mb-4">
        {titlePrefix}{' '}
        <span className="gold-text">{titleAccent}</span>
      </h2>
      <div className="accent-bar" />
      <p className="text-muted-foreground mt-6 max-w-2xl mx-auto text-body">
        {description}
      </p>
    </div>
  )
}

// ===== MAIN COMPONENT =====

export default function HomePage() {
  const { navigate, selectCar, setSearch, setCity, isLoggedIn, user, searchQuery, selectedCity } = useAppStore()
  const [localSearch, setLocalSearch] = useState(searchQuery)
  const [localCity, setLocalCity] = useState(selectedCity || 'All Cities')
  const [featuredCars, setFeaturedCars] = useState<FeaturedCar[]>([])
  const [carsLoading, setCarsLoading] = useState(true)
  const [dealers, setDealers] = useState<Dealer[]>([])
  const [dealersLoading, setDealersLoading] = useState(true)

  useEffect(() => {
    async function fetchFeaturedCars() {
      try {
        const result = await carsApi.list({ featured: 'true', status: 'approved' })
        const cars = result.data || result
        const mapped: FeaturedCar[] = (Array.isArray(cars) ? cars : []).map((car: Record<string, unknown>) => ({
          id: String(car.id ?? ''),
          brand: String(car.brand ?? ''),
          model: String(car.model ?? ''),
          year: Number(car.year ?? 0),
          price: Number(car.price ?? 0),
          mileage: Number(car.mileage ?? 0),
          fuelType: String(car.fuelType ?? ''),
          city: String(car.city ?? ''),
          type: String(car.type ?? ''),
          photos: typeof car.photos === 'string' ? JSON.parse(car.photos || '[]') : (Array.isArray(car.photos) ? car.photos : []),
          features: typeof car.features === 'string' ? JSON.parse(car.features || '[]') : (Array.isArray(car.features) ? car.features : []),
          dealerName: (car.dealer as Record<string, unknown>)?.companyName
            ? String((car.dealer as Record<string, unknown>).companyName)
            : (car.dealerUser as Record<string, unknown>)?.name
              ? String((car.dealerUser as Record<string, unknown>).name)
              : 'DK Vroom Dealer',
          dealerVerified: Boolean((car.dealer as Record<string, unknown>)?.verified ?? false),
          rating: Number((car.dealer as Record<string, unknown>)?.rating ?? 4.5),
        }))
        setFeaturedCars(mapped)
      } catch {
        // Silent error handling — feature section gracefully degrades
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
        const dealerMap = new Map<string, Dealer>()
        ;(Array.isArray(cars) ? cars : []).forEach((car: Record<string, unknown>) => {
          const dealer = car.dealer as Record<string, unknown> | undefined
          if (dealer && !dealerMap.has(String(dealer.id))) {
            const carType = String(car.type ?? '')
            const specializationLabel = carType === 'rent'
              ? 'Luxury Rentals'
              : carType === 'sale'
                ? 'Used Cars'
                : carType === 'auction'
                  ? 'Auction'
                  : 'Continue Loan'
            dealerMap.set(String(dealer.id), {
              id: String(dealer.id),
              companyName: String(dealer.companyName ?? 'Dealer'),
              logo: String(dealer.companyName?.toString().charAt(0) ?? 'D'),
              city: String(dealer.city ?? car.city ?? 'Malaysia'),
              verified: Boolean(dealer.verified ?? false),
              rating: Number(dealer.rating ?? 4.5),
              totalListings: Number(dealer.totalListings ?? 0),
              specialization: [specializationLabel],
            })
          }
        })
        setDealers(Array.from(dealerMap.values()).slice(0, 8))
      } catch {
        // Silent error handling — dealers section gracefully degrades
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
    <div className="min-h-screen bg-background text-foreground">
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
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-background to-transparent" />

        {/* Content */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-32">
          <div className="max-w-3xl">
            {/* Eyebrow */}
            <div className="flex items-center gap-2 mb-6">
              <div className="h-px w-8 bg-gold" />
              <span className="text-gold text-overline">
                Malaysia&apos;s Premium Automotive Marketplace
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="heading-xl mb-6">
              <span className="gold-shimmer">Drive</span>{' '}
              <span className="text-white">Extraordinary.</span>
            </h1>

            {/* Subtext */}
            <p className="text-body-lg text-foreground/70 mb-10 max-w-xl">
              Drive. Rent. Buy. Own. All in One Platform. Discover Malaysia&apos;s most trusted automotive marketplace
              for premium vehicles, seamless financing, and verified dealers.
            </p>

            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3 mb-8 max-w-2xl">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-gold" />
                <Input
                  type="text"
                  placeholder="Search car, brand, city…"
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  className="pl-12 h-12 bg-card/90 border-gold/40 text-foreground placeholder:text-muted-foreground focus-visible:border-gold focus-visible:ring-gold/30 text-base rounded-lg"
                />
              </div>
              <Select value={localCity} onValueChange={setLocalCity}>
                <SelectTrigger className="w-full sm:w-48 h-12 bg-card/90 border-gold/40 text-foreground rounded-lg">
                  <MapPin className="size-4 text-gold mr-1" />
                  <SelectValue placeholder="Select City" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {CITIES.map((city) => (
                    <SelectItem key={city} value={city} className="text-foreground focus:bg-secondary focus:text-gold">
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleSearch}
                className="h-12 px-8 bg-gold hover:bg-gold-dark text-primary-foreground font-semibold rounded-lg"
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
                className="bg-gold hover:bg-gold-dark text-primary-foreground font-semibold px-8 h-12 rounded-lg"
              >
                Explore Now
                <ArrowRight className="size-4 ml-1" />
              </Button>
              <Button
                onClick={() => navigate('register')}
                size="lg"
                variant="outline"
                className="border-gold text-gold hover:bg-gold/10 font-semibold px-8 h-12 rounded-lg"
              >
                Partner With Us
                <ExternalLink className="size-4 ml-1" />
              </Button>
            </div>
          </div>

          {/* Stats Row */}
          <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-2xl">
            {heroStats.map((stat) => (
              <div key={stat.label}>
                <div className="text-2xl sm:text-3xl font-bold gold-text">{stat.value}</div>
                <div className="text-body-sm text-foreground/50 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== SERVICE CARDS SECTION ===== */}
      <section className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            overline="What We Offer"
            titlePrefix="Our"
            titleAccent="Services"
            description="From renting your dream car for the weekend to securing financing for your next purchase — DK Vroom covers every aspect of your automotive journey."
          />

          {/* Service Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {services.map((service) => {
              const Icon = service.icon
              return (
                <Card
                  key={service.title}
                  className="luxury-card bg-card border-border cursor-pointer group rounded-xl overflow-hidden"
                  onClick={() => navigate(service.view)}
                >
                  <CardContent className="p-6">
                    <div className="w-14 h-14 rounded-xl bg-gold/10 flex items-center justify-center mb-5 group-hover:bg-gold/20 transition-colors">
                      <Icon className="size-7 text-gold" />
                    </div>
                    <h3 className="heading-sm text-foreground mb-3">{service.title}</h3>
                    <p className="text-muted-foreground text-body-sm leading-relaxed mb-5">{service.description}</p>
                    <div className="flex items-center gap-1 text-gold text-body-sm font-medium group-hover:gap-2 transition-all">
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
      <section className="py-20 sm:py-28 bg-background/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            overline="Hand-Picked For You"
            titlePrefix="Featured"
            titleAccent="Vehicles"
            description="Explore our curated selection of premium vehicles, from daily rentals to exclusive auction pieces. Each listing is verified for quality and transparency."
          />

          {/* Featured Cars Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {carsLoading ? (
              Array.from({ length: 3 }).map((_, i) => <VehicleCardSkeleton key={i} />)
            ) : featuredCars.length === 0 ? (
              <div className="col-span-full">
                <EmptyState
                  icon={<Car className="size-12" />}
                  title="No featured vehicles available"
                  description="Check back soon for new listings!"
                  action={
                    <Button
                      onClick={() => navigate('buy')}
                      variant="outline"
                      className="border-gold text-gold hover:bg-gold/10"
                    >
                      Browse All Vehicles
                    </Button>
                  }
                />
              </div>
            ) : (
              featuredCars.map((car) => (
                <Card
                  key={car.id}
                  className="luxury-card bg-card border-border overflow-hidden group cursor-pointer rounded-xl"
                  onClick={() => selectCar(car.id, car.type)}
                >
                  {/* Car Image */}
                  <div className="relative h-52 overflow-hidden">
                    <img
                      src={car.photos[0]}
                      alt={`${car.brand} ${car.model} — ${car.type === 'rent' ? 'rental' : car.type === 'sale' ? 'for sale' : car.type} in ${car.city}`}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {/* Gradient overlay on image */}
                    <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
                    {/* Type Badge */}
                    <div className="absolute top-3 left-3">
                      <VehicleTypeBadge type={car.type as VehicleType} />
                    </div>
                    {/* Quick Actions */}
                    <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="icon" variant="ghost" className="size-8 bg-background/70 hover:bg-background/90 text-foreground rounded-full">
                        <Heart className="size-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="size-8 bg-background/70 hover:bg-background/90 text-foreground rounded-full">
                        <Eye className="size-4" />
                      </Button>
                    </div>
                    {/* Price on image */}
                    <div className="absolute bottom-3 left-3">
                      <span className="text-xl font-bold text-gold">{formatPrice(car.price, car.type)}</span>
                    </div>
                  </div>

                  <CardContent className="p-5">
                    {/* Brand & Model */}
                    <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-gold transition-colors">
                      {car.brand} {car.model}
                    </h3>

                    {/* Key Specs */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                      <span className="flex items-center gap-1">
                        <Calendar className="size-3.5" />
                        {car.year}
                      </span>
                      <span className="flex items-center gap-1">
                        <Gauge className="size-3.5" />
                        {formatMileage(car.mileage)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Fuel className="size-3.5" />
                        {car.fuelType.charAt(0).toUpperCase() + car.fuelType.slice(1)}
                      </span>
                    </div>

                    {/* Location */}
                    <div className="flex items-center gap-1 text-body-sm text-muted-foreground mb-3">
                      <MapPin className="size-3.5 text-gold" />
                      {car.city}
                    </div>

                    <Separator className="bg-border my-3" />

                    {/* Dealer & Rating */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar className="size-7 border border-border">
                          <AvatarFallback className="bg-secondary text-gold text-xs">
                            {car.dealerName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-muted-foreground truncate max-w-[120px]">{car.dealerName}</span>
                        {car.dealerVerified && (
                          <CheckCircle className="size-3.5 text-gold shrink-0" />
                        )}
                      </div>
                      <StarRating rating={car.rating} />
                    </div>

                    {/* View Details Button (visible on hover) */}
                    <Button
                      className="w-full mt-4 bg-gold hover:bg-gold-dark text-primary-foreground font-semibold opacity-0 group-hover:opacity-100 transition-opacity h-9 rounded-lg"
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
              ))
            )}
          </div>

          {/* View All Button */}
          <div className="text-center mt-12">
            <Button
              onClick={() => navigate('buy')}
              variant="outline"
              size="lg"
              className="border-gold text-gold hover:bg-gold/10 font-semibold px-10 h-12 rounded-lg"
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
          <SectionHeader
            overline="Trusted Partners"
            titlePrefix="Verified"
            titleAccent="Dealers"
            description="Our network of thoroughly vetted dealers ensures every transaction is safe, transparent, and backed by quality guarantees."
          />

          {/* Horizontal Scroll */}
          <div className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
            {dealersLoading ? (
              Array.from({ length: 4 }).map((_, i) => <DealerCardSkeleton key={i} />)
            ) : dealers.length === 0 ? (
              <div className="w-full">
                <EmptyState
                  icon={<MapPin className="size-12" />}
                  title="No dealers available yet"
                  description="Dealer listings will appear here once available."
                />
              </div>
            ) : (
              dealers.map((dealer) => (
                <Card
                  key={dealer.id}
                  className="luxury-card bg-card border-border min-w-[280px] sm:min-w-[300px] snap-start shrink-0 rounded-xl"
                >
                  <CardContent className="p-6">
                    {/* Dealer Logo & Name */}
                    <div className="flex items-start gap-4 mb-4">
                      <Avatar className="size-14 border-2 border-gold/30 shrink-0">
                        <AvatarFallback className="bg-secondary text-2xl">
                          {dealer.logo}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground truncate">{dealer.companyName}</h3>
                          {dealer.verified && (
                            <Badge className="bg-gold/20 text-gold border-gold/30 text-[10px] px-1.5 py-0 shrink-0">
                              <CheckCircle className="size-3 mr-0.5" />
                              Verified
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-body-sm text-muted-foreground mt-1">
                          <MapPin className="size-3.5 text-gold" />
                          {dealer.city}
                        </div>
                      </div>
                    </div>

                    {/* Rating */}
                    <StarRating rating={dealer.rating} />

                    {/* Specializations */}
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {dealer.specialization.map((spec) => (
                        <Badge key={spec} variant="outline" className="text-[10px] border-border text-muted-foreground">
                          {spec}
                        </Badge>
                      ))}
                    </div>

                    {/* Listings Count */}
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                      <span className="text-body-sm text-muted-foreground">
                        <span className="text-gold font-semibold">{dealer.totalListings}</span> listings
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gold hover:text-gold-light hover:bg-gold/10 text-xs h-7 px-2"
                      >
                        View All
                        <ChevronRight className="size-3 ml-0.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </section>

      {/* ===== WHY CHOOSE DK VROOM SECTION ===== */}
      <section className="py-20 sm:py-28 bg-background/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            overline="The DK Vroom Difference"
            titlePrefix="Why Choose"
            titleAccent="DK Vroom?"
            description="We're not just another car marketplace. DK Vroom is built on trust, transparency, and a commitment to making your automotive experience exceptional."
          />

          {/* Feature Blocks */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {whyChoose.map((feature, index) => {
              const Icon = feature.icon
              return (
                <Card
                  key={feature.title}
                  className="luxury-card bg-card border-border rounded-xl group relative overflow-hidden"
                >
                  <CardContent className="p-8">
                    <div className="flex items-start gap-5">
                      <div className="w-16 h-16 rounded-2xl bg-gold/10 flex items-center justify-center shrink-0 group-hover:bg-gold/20 transition-colors">
                        <Icon className="size-8 text-gold" />
                      </div>
                      <div>
                        <h3 className="heading-sm text-foreground mb-3">{feature.title}</h3>
                        <p className="text-muted-foreground text-body-sm leading-relaxed">{feature.description}</p>
                      </div>
                    </div>
                    {/* Decorative number */}
                    <div className="absolute top-4 right-6 text-6xl font-bold text-gold/5 select-none" aria-hidden="true">
                      {String(index + 1).padStart(2, '0')}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Trust Indicators Row */}
          <div className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {trustIndicators.map((item) => {
              const ItemIcon = item.icon
              return (
                <div key={item.label} className="text-center p-6 rounded-xl bg-card/50 border border-border/50">
                  <ItemIcon className="size-8 text-gold mx-auto mb-3" />
                  <div className="text-lg font-semibold text-foreground">{item.value}</div>
                  <div className="text-body-sm text-muted-foreground">{item.label}</div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ===== PARTNER WITH US SECTION ===== */}
      <section className="py-20 sm:py-28 relative overflow-hidden">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            {/* Section Header */}
            <div className="section-divider mb-4">
              <span className="text-gold text-overline">Grow Your Business</span>
            </div>
            <h2 className="heading-lg mb-4">
              Partner With <span className="gold-text">Us</span>
            </h2>
            <div className="accent-bar" />

            <p className="text-muted-foreground mt-6 text-body leading-relaxed">
              Join Malaysia&apos;s fastest-growing automotive marketplace and unlock access to thousands of qualified buyers.
              As a DK Vroom dealer, you&apos;ll benefit from premium visibility, advanced analytics, and a streamlined
              lead management system that converts browsers into buyers.
            </p>

            {/* Benefits list */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-10 text-left max-w-2xl mx-auto">
              {partnerBenefits.map((benefit) => (
                <div key={benefit} className="flex items-start gap-3">
                  <CheckCircle className="size-5 text-gold shrink-0 mt-0.5" />
                  <span className="text-foreground/80 text-body-sm">{benefit}</span>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12">
              {isLoggedIn && user?.role === 'dealer' ? (
                <Button
                  onClick={() => navigate('dealerDashboard')}
                  size="lg"
                  className="bg-gold hover:bg-gold-dark text-primary-foreground font-semibold px-10 h-12 rounded-lg"
                >
                  Go to Dashboard
                  <ArrowRight className="size-4 ml-1" />
                </Button>
              ) : (
                <>
                  <Button
                    onClick={() => navigate('register')}
                    size="lg"
                    className="bg-gold hover:bg-gold-dark text-primary-foreground font-semibold px-10 h-12 rounded-lg"
                  >
                    Register as Dealer
                    <ArrowRight className="size-4 ml-1" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-gold text-gold hover:bg-gold/10 font-semibold px-10 h-12 rounded-lg"
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
      <footer className="bg-background border-t border-border pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Main Footer Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 mb-14">
            {/* Brand Column */}
            <div className="lg:col-span-2">
              <h3 className="text-2xl font-bold gold-text mb-4">DK Vroom</h3>
              <p className="text-muted-foreground text-body leading-relaxed mb-6 max-w-sm">
                Malaysia&apos;s premier automotive marketplace. Whether you&apos;re looking to rent, buy, sell, or service
                your vehicle, we bring trust, transparency, and convenience to every journey.
              </p>
              {/* Social Links */}
              <div className="flex gap-3">
                {socialLinks.map((social) => {
                  const SocialIcon = social.icon
                  return (
                    <Button
                      key={social.label}
                      variant="ghost"
                      size="icon"
                      className="size-10 rounded-full border border-border text-muted-foreground hover:text-gold hover:border-gold/50 hover:bg-gold/10"
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
              <h4 className="text-gold font-semibold mb-4 text-overline">About</h4>
              <ul className="space-y-3">
                {footerLinks.about.map((link) => (
                  <li key={link.label}>
                    <button
                      onClick={() => navigate(link.view)}
                      className="text-muted-foreground hover:text-gold text-body-sm transition-colors text-left"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Services Column */}
            <div>
              <h4 className="text-gold font-semibold mb-4 text-overline">Services</h4>
              <ul className="space-y-3">
                {footerLinks.services.map((link) => (
                  <li key={link.label}>
                    <button
                      onClick={() => navigate(link.view)}
                      className="text-muted-foreground hover:text-gold text-body-sm transition-colors text-left"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support Column */}
            <div>
              <h4 className="text-gold font-semibold mb-4 text-overline">Support</h4>
              <ul className="space-y-3">
                {footerLinks.support.map((link) => (
                  <li key={link.label}>
                    <button
                      onClick={() => navigate(link.view)}
                      className="text-muted-foreground hover:text-gold text-body-sm transition-colors text-left"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
              {/* Contact Info */}
              <div className="mt-6 space-y-2">
                <div className="flex items-center gap-2 text-body-sm text-muted-foreground">
                  <Phone className="size-3.5 text-gold" />
                  +60 3-8888 9999
                </div>
                <div className="flex items-center gap-2 text-body-sm text-muted-foreground">
                  <Mail className="size-3.5 text-gold" />
                  hello@dkvroom.com
                </div>
                <div className="flex items-center gap-2 text-body-sm text-muted-foreground">
                  <Clock className="size-3.5 text-gold" />
                  24/7 Customer Support
                </div>
              </div>
            </div>
          </div>

          {/* Payment Icons Row */}
          <div className="border-t border-border pt-8 mb-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-overline text-muted-foreground mb-3 block">Accepted Payments</span>
                <div className="flex gap-3">
                  {['FPX', 'TNG', 'Billplz', 'Stripe'].map((payment) => (
                    <div
                      key={payment}
                      className="px-3 py-1.5 rounded bg-card border border-border text-xs text-muted-foreground font-medium"
                    >
                      {payment}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-overline text-muted-foreground mb-3 block text-right">Regulated By</span>
                <div className="flex gap-3">
                  {['BNM', 'SC'].map((reg) => (
                    <div
                      key={reg}
                      className="px-3 py-1.5 rounded bg-card border border-border text-xs text-muted-foreground font-medium"
                    >
                      {reg}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Copyright Row */}
          <div className="border-t border-border pt-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-body-sm text-muted-foreground">
                &copy; {new Date().getFullYear()} DK Vroom. All Rights Reserved.
              </p>
              <div className="flex gap-6 text-body-sm text-muted-foreground">
                <button onClick={() => navigate('home')} className="hover:text-gold transition-colors">Privacy</button>
                <button onClick={() => navigate('home')} className="hover:text-gold transition-colors">Terms</button>
                <button onClick={() => navigate('home')} className="hover:text-gold transition-colors">Cookies</button>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
