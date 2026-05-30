'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/lib/store'
import { workshopsApi } from '@/lib/api'
import { CITIES, SERVICE_TYPES } from '@/lib/constants'
import { LoadingState, EmptyState, StarRating } from '@/components/shared'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Search,
  MapPin,
  Clock,
  Wrench,
  Cog,
  Paintbrush,
  Zap,
  CircleDot,
  Snowflake,
  Sparkles,
  ClipboardCheck,
  Phone,
  MessageCircle,
  CheckCircle,
  ArrowRight,
  ShieldCheck,
  ExternalLink,
  Loader2,
} from 'lucide-react'

// ===== LOCAL TYPES =====

interface WorkshopData {
  id: string
  name: string
  logo: string
  city: string
  rating: number
  specialization: string[]
  hours: string
  services: string[]
  verified: boolean
}

interface BookingFormState {
  serviceType: string
  city: string
  vehicleBrand: string
  notes: string
  date: string
}

// ===== SERVICE CATEGORY CONFIG =====

const SERVICE_CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  general_service: Wrench,
  engine_repair: Cog,
  bodywork: Paintbrush,
  electrical: Zap,
  tire_battery: CircleDot,
  ac_service: Snowflake,
  others: Sparkles,
}

const HOW_IT_WORKS_STEPS = [
  { step: 1, title: 'Choose Service', description: 'Select the type of service or repair your vehicle needs from our categories.', icon: Search },
  { step: 2, title: 'Get Quote', description: 'Receive transparent quotes from verified workshops in your area instantly.', icon: ClipboardCheck },
  { step: 3, title: 'Book Appointment', description: 'Schedule your visit, drop off your car, and track repairs in real time.', icon: CheckCircle },
]

const DEFAULT_WORKSHOPS: WorkshopData[] = [
  { id: 'w1', name: 'AutoPrestige Service Center', logo: '🔧', city: 'Kuala Lumpur', rating: 4.9, specialization: ['European Cars', 'Engine Repair'], hours: 'Mon-Sat 8AM-6PM', services: ['Engine Overhaul', 'Oil Change', 'Brake Service', 'Diagnostics'], verified: true },
  { id: 'w2', name: 'TurboFix Motors', logo: '⚡', city: 'Selangor', rating: 4.7, specialization: ['Japanese Cars', 'Performance'], hours: 'Mon-Fri 9AM-7PM', services: ['Turbo Installation', 'ECU Tuning', 'Exhaust System', 'Suspension'], verified: true },
  { id: 'w3', name: 'CrystalClear Detailing', logo: '✨', city: 'Penang', rating: 4.8, specialization: ['Detailing', 'Body & Paint'], hours: 'Mon-Sun 10AM-8PM', services: ['Ceramic Coating', 'Paint Protection', 'Interior Detailing', 'Window Tinting'], verified: true },
  { id: 'w4', name: 'QuickStop Auto', logo: '🏎️', city: 'Johor', rating: 4.5, specialization: ['General Repair', 'Tyres'], hours: 'Mon-Sat 8:30AM-5:30PM', services: ['Tyre Replacement', 'Alignment', 'Battery', 'General Service'], verified: true },
  { id: 'w5', name: 'Volt Auto Electrical', logo: '💡', city: 'Kuala Lumpur', rating: 4.6, specialization: ['Electrical', 'Diagnostics'], hours: 'Mon-Fri 9AM-6PM', services: ['Electrical Diagnosis', 'AC Repair', 'Audio System', 'Lighting'], verified: true },
  { id: 'w6', name: 'ProTech Inspection', logo: '🔍', city: 'Selangor', rating: 4.8, specialization: ['Inspection', 'Pre-Purchase'], hours: 'Mon-Sat 9AM-5PM', services: ['Full Inspection', 'Pre-Purchase Check', 'Accident Assessment', 'Valuation'], verified: true },
]

// ===== HELPERS =====

function normalizeWorkshop(apiWorkshop: Record<string, unknown>): WorkshopData {
  const parseField = (field: unknown): string[] => {
    if (typeof field === 'string') {
      try { return JSON.parse(field) } catch { return [] }
    }
    return Array.isArray(field) ? field as string[] : []
  }

  const specialization = parseField(apiWorkshop.specialization)
  const services = parseField(apiWorkshop.services)

  return {
    id: String(apiWorkshop.id ?? ''),
    name: String(apiWorkshop.companyName || apiWorkshop.name || 'Workshop'),
    logo: String(apiWorkshop.logo || '🔧'),
    city: String(apiWorkshop.city || 'Kuala Lumpur'),
    rating: Number(apiWorkshop.rating) || 4.5,
    specialization: specialization.length > 0 ? specialization : ['General Repair'],
    hours: String(apiWorkshop.operatingHours || apiWorkshop.hours || 'Mon-Sat 9AM-6PM'),
    services: services.length > 0 ? services : ['General Service'],
    verified: Boolean(apiWorkshop.verified ?? true),
  }
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="section-divider">
      <span className="text-overline text-gold">{children}</span>
    </div>
  )
}

// ===== MAIN COMPONENT =====

export default function RepairPage() {
  const { user } = useAppStore()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [workshops, setWorkshops] = useState<WorkshopData[]>(DEFAULT_WORKSHOPS)
  const [workshopsLoading, setWorkshopsLoading] = useState(true)
  const [bookingWorkshop, setBookingWorkshop] = useState<string | null>(null)
  const [bookingSubmitting, setBookingSubmitting] = useState(false)
  const [showBookingForm, setShowBookingForm] = useState(false)
  const [bookingForm, setBookingForm] = useState<BookingFormState>({
    serviceType: SERVICE_TYPES[0].key,
    city: 'Kuala Lumpur',
    vehicleBrand: '',
    notes: '',
    date: '',
  })

  useEffect(() => {
    async function fetchWorkshops() {
      try {
        setWorkshopsLoading(true)
        const result = await workshopsApi.list()
        const data = result.data || []
        if (Array.isArray(data) && data.length > 0) {
          setWorkshops(data.map((w: Record<string, unknown>) => normalizeWorkshop(w)))
        }
      } catch {
        // Keep default workshops on error
      } finally {
        setWorkshopsLoading(false)
      }
    }
    fetchWorkshops()
  }, [])

  const handleBookAppointment = async (workshopId: string) => {
    try {
      setBookingWorkshop(workshopId)
      setBookingSubmitting(true)
      await workshopsApi.createAppointment({
        workshopId,
        userId: user?.id,
        customerName: user?.name,
        customerPhone: user?.phone,
        customerEmail: user?.email,
        serviceType: bookingForm.serviceType,
        city: bookingForm.city,
        vehicleBrand: bookingForm.vehicleBrand,
        preferredDate: bookingForm.date,
        notes: bookingForm.notes,
      })
      setShowBookingForm(false)
      setBookingForm({ serviceType: SERVICE_TYPES[0].key, city: 'Kuala Lumpur', vehicleBrand: '', notes: '', date: '' })
    } catch {
      // Silently fail — UI stays functional
    } finally {
      setBookingSubmitting(false)
      setBookingWorkshop(null)
    }
  }

  const filteredWorkshops = workshops.filter((w) => {
    const matchesSearch = searchQuery
      ? w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.services.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()))
      : true
    const matchesCategory = selectedCategory
      ? w.specialization.some((s) => s.toLowerCase().includes(selectedCategory.toLowerCase())) ||
        w.services.some((s) => s.toLowerCase().includes(selectedCategory.toLowerCase()))
      : true
    return matchesSearch && matchesCategory
  })

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ===== HERO SECTION ===== */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gold/10 via-transparent to-gold/5" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-px w-8 bg-gold" />
            <span className="text-overline text-gold">Service &amp; Maintenance</span>
          </div>
          <h1 className="heading-lg mb-4">
            Repair &amp; <span className="gold-text">Workshop</span>
          </h1>
          <p className="text-body-lg text-muted-foreground mb-8 max-w-xl">
            Keep Your Ride in Premium Condition
          </p>

          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row gap-3 max-w-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-gold" />
              <Input
                type="text"
                placeholder="Search workshops by location or service…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 bg-card/90 border-gold/40 text-foreground placeholder:text-muted-foreground focus-visible:border-gold focus-visible:ring-gold/30 rounded-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ===== SERVICE CATEGORIES ===== */}
      <section className="py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <SectionLabel>What Do You Need?</SectionLabel>
            <h2 className="heading-md mt-3">
              Service <span className="gold-text">Categories</span>
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {SERVICE_TYPES.map((cat) => {
              const Icon = SERVICE_CATEGORY_ICONS[cat.key] || Wrench
              const isSelected = selectedCategory === cat.key
              return (
                <Card
                  key={cat.key}
                  className={`luxury-card bg-card border-border cursor-pointer rounded-xl ${
                    isSelected ? 'border-gold gold-glow' : ''
                  }`}
                  onClick={() => setSelectedCategory(isSelected ? null : cat.key)}
                >
                  <CardContent className="p-5 text-center">
                    <div className={`w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center ${
                      isSelected ? 'bg-gold/20' : 'bg-gold/10'
                    }`}>
                      <Icon className={`size-6 ${isSelected ? 'text-gold-light' : 'text-gold'}`} />
                    </div>
                    <h3 className="text-body-sm font-semibold text-foreground mb-1">{cat.label}</h3>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {selectedCategory && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <span className="text-body-sm text-muted-foreground">Filtering by:</span>
              <Badge className="bg-gold/20 text-gold border-gold/30">
                {SERVICE_TYPES.find((c) => c.key === selectedCategory)?.label}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground h-6 px-2"
                onClick={() => setSelectedCategory(null)}
              >
                Clear
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* ===== FEATURED WORKSHOPS ===== */}
      <section className="py-12 sm:py-16 bg-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <SectionLabel>Trusted Professionals</SectionLabel>
            <h2 className="heading-md mt-3">
              Featured <span className="gold-text">Workshops</span>
            </h2>
            <p className="text-muted-foreground mt-2 text-body-sm">
              {filteredWorkshops.length} workshop{filteredWorkshops.length !== 1 ? 's' : ''} found
            </p>
          </div>

          {workshopsLoading ? (
            <LoadingState message="Loading workshops…" />
          ) : filteredWorkshops.length === 0 ? (
            <EmptyState
              icon={<Search className="size-6" />}
              title="No workshops found"
              description="Try adjusting your search or category filter."
              action={
                <Button
                  variant="outline"
                  className="mt-2 border-gold text-gold hover:bg-gold/10"
                  onClick={() => { setSearchQuery(''); setSelectedCategory(null) }}
                >
                  Clear Filters
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredWorkshops.map((workshop) => (
                <Card key={workshop.id} className="luxury-card bg-card border-border rounded-xl">
                  <CardContent className="p-6">
                    {/* Header */}
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-14 h-14 rounded-xl bg-gold/10 flex items-center justify-center text-2xl shrink-0">
                        {workshop.logo}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground truncate">{workshop.name}</h3>
                          {workshop.verified && (
                            <ShieldCheck className="size-4 text-gold shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-body-sm text-muted-foreground mt-1">
                          <MapPin className="size-3.5 text-gold" />
                          {workshop.city}
                        </div>
                      </div>
                    </div>

                    {/* Rating */}
                    <StarRating rating={workshop.rating} />

                    {/* Specialization Tags */}
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {workshop.specialization.map((spec) => (
                        <Badge key={spec} className="bg-gold/15 text-gold border-gold/25 text-[10px] px-2 py-0.5">
                          {spec}
                        </Badge>
                      ))}
                    </div>

                    <Separator className="bg-border my-4" />

                    {/* Hours */}
                    <div className="flex items-center gap-2 text-body-sm text-muted-foreground mb-3">
                      <Clock className="size-3.5 text-gold" />
                      {workshop.hours}
                    </div>

                    {/* Services */}
                    <div className="mb-4">
                      <span className="text-overline text-muted-foreground mb-2 block">Services</span>
                      <div className="flex flex-wrap gap-1.5">
                        {workshop.services.map((service) => (
                          <Badge key={service} variant="outline" className="text-[10px] border-border text-muted-foreground">
                            {service}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button
                        className="flex-1 bg-gold hover:bg-gold-dark text-primary-foreground font-semibold h-9 rounded-lg text-body-sm"
                        disabled={bookingSubmitting && bookingWorkshop === workshop.id}
                        onClick={() => {
                          setShowBookingForm(true)
                          setBookingWorkshop(workshop.id)
                        }}
                      >
                        {bookingSubmitting && bookingWorkshop === workshop.id ? (
                          <Loader2 className="size-3.5 mr-1 animate-spin" />
                        ) : (
                          <Phone className="size-3.5 mr-1" />
                        )}
                        Book Now
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10 font-semibold h-9 rounded-lg text-body-sm"
                      >
                        <MessageCircle className="size-3.5 mr-1" />
                        WhatsApp
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ===== BOOKING FORM MODAL ===== */}
      {showBookingForm && bookingWorkshop && (
        <section className="py-12 sm:py-16">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <Card className="bg-card border-gold/30 gold-glow rounded-xl">
              <CardContent className="p-6">
                <h3 className="heading-sm text-foreground mb-6">Book Appointment</h3>

                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-body-sm text-muted-foreground">Service Type</Label>
                      <Select value={bookingForm.serviceType} onValueChange={(v) => setBookingForm((f) => ({ ...f, serviceType: v }))}>
                        <SelectTrigger className="bg-background border-border text-foreground">
                          <SelectValue placeholder="Select service" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border">
                          {SERVICE_TYPES.map((st) => (
                            <SelectItem key={st.key} value={st.key} className="text-foreground focus:bg-secondary focus:text-gold">
                              {st.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-body-sm text-muted-foreground">City</Label>
                      <Select value={bookingForm.city} onValueChange={(v) => setBookingForm((f) => ({ ...f, city: v }))}>
                        <SelectTrigger className="bg-background border-border text-foreground">
                          <SelectValue placeholder="Select city" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border">
                          {CITIES.map((city) => (
                            <SelectItem key={city} value={city} className="text-foreground focus:bg-secondary focus:text-gold">
                              {city}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-body-sm text-muted-foreground">Vehicle Brand</Label>
                      <Input
                        placeholder="e.g. Honda"
                        value={bookingForm.vehicleBrand}
                        onChange={(e) => setBookingForm((f) => ({ ...f, vehicleBrand: e.target.value }))}
                        className="bg-background border-border text-foreground placeholder:text-muted-foreground/50 focus-visible:border-gold focus-visible:ring-gold/30"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-body-sm text-muted-foreground">Preferred Date</Label>
                      <Input
                        type="date"
                        value={bookingForm.date}
                        onChange={(e) => setBookingForm((f) => ({ ...f, date: e.target.value }))}
                        className="bg-background border-border text-foreground placeholder:text-muted-foreground/50 focus-visible:border-gold focus-visible:ring-gold/30"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-body-sm text-muted-foreground">Notes</Label>
                    <Input
                      placeholder="Describe the issue…"
                      value={bookingForm.notes}
                      onChange={(e) => setBookingForm((f) => ({ ...f, notes: e.target.value }))}
                      className="bg-background border-border text-foreground placeholder:text-muted-foreground/50 focus-visible:border-gold focus-visible:ring-gold/30"
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      className="flex-1 bg-gold hover:bg-gold-dark text-primary-foreground font-semibold h-11 rounded-lg"
                      disabled={bookingSubmitting}
                      onClick={() => handleBookAppointment(bookingWorkshop)}
                    >
                      {bookingSubmitting ? <Loader2 className="size-4 mr-2 animate-spin" /> : null}
                      Confirm Booking
                    </Button>
                    <Button
                      variant="outline"
                      className="border-border text-muted-foreground hover:text-foreground h-11 rounded-lg"
                      onClick={() => setShowBookingForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* ===== HOW IT WORKS ===== */}
      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <SectionLabel>Simple Process</SectionLabel>
            <h2 className="heading-md mt-3">
              How It <span className="gold-text">Works</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {HOW_IT_WORKS_STEPS.map((item, index) => {
              const Icon = item.icon
              return (
                <Card key={item.step} className="luxury-card bg-card border-border rounded-xl relative overflow-hidden">
                  <CardContent className="p-8 text-center">
                    <div className="absolute top-2 right-4 text-7xl font-bold text-gold/5 select-none">
                      {String(index + 1).padStart(2, '0')}
                    </div>
                    <div className="w-16 h-16 rounded-2xl bg-gold/10 flex items-center justify-center mx-auto mb-5">
                      <Icon className="size-8 text-gold" />
                    </div>
                    <div className="inline-flex items-center justify-center size-8 rounded-full bg-gold text-primary-foreground font-bold text-sm mb-3">
                      {item.step}
                    </div>
                    <h3 className="text-body font-semibold text-foreground mb-2">{item.title}</h3>
                    <p className="text-body-sm text-muted-foreground leading-relaxed">{item.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* ===== CTA: REGISTER YOUR WORKSHOP ===== */}
      <section className="py-16 sm:py-20 bg-muted relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gold/5 via-transparent to-gold/3" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <SectionLabel>For Workshop Owners</SectionLabel>
          <h2 className="heading-md mt-3">
            Register Your <span className="gold-text">Workshop</span>
          </h2>
          <div className="accent-bar mb-6" />
          <p className="text-body-lg text-muted-foreground leading-relaxed mb-8">
            Join DK Vroom&apos;s network of trusted workshops. Get access to thousands of customers, manage bookings online, and grow your business with our platform.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
            {[
              { value: '500+', label: 'Workshops Onboard' },
              { value: '10K+', label: 'Jobs Completed' },
              { value: '4.8★', label: 'Avg. Customer Rating' },
            ].map((stat) => (
              <div key={stat.label} className="p-4 rounded-xl bg-card/50 border border-border/50">
                <div className="text-xl font-bold gold-text">{stat.value}</div>
                <div className="text-body-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => router.push('/register')}
              size="lg"
              className="bg-gold hover:bg-gold-dark text-primary-foreground font-semibold px-8 h-12 rounded-lg"
            >
              Register Your Workshop
              <ArrowRight className="size-4 ml-1" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-gold text-gold hover:bg-gold/10 font-semibold px-8 h-12 rounded-lg"
            >
              Learn More
              <ExternalLink className="size-4 ml-1" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
