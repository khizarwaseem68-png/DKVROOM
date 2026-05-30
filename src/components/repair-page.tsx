'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  Search,
  MapPin,
  Star,
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
  ChevronRight,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react'

const serviceCategories = [
  { id: 'engine', icon: Wrench, name: 'Engine', description: 'Engine repair, overhaul & maintenance' },
  { id: 'transmission', icon: Cog, name: 'Transmission', description: 'Gearbox, clutch & drivetrain services' },
  { id: 'body-paint', icon: Paintbrush, name: 'Body & Paint', description: 'Bodywork, respray & accident repair' },
  { id: 'electrical', icon: Zap, name: 'Electrical', description: 'Wiring, ECU & electronics diagnosis' },
  { id: 'tyres', icon: CircleDot, name: 'Tyres & Alignment', description: 'Tyre replacement, balancing & alignment' },
  { id: 'ac', icon: Snowflake, name: 'Air Conditioning', description: 'AC repair, gas refill & servicing' },
  { id: 'detailing', icon: Sparkles, name: 'Detailing', description: 'Ceramic coating, polishing & interior care' },
  { id: 'inspection', icon: ClipboardCheck, name: 'Inspection', description: 'Pre-purchase checks & full inspection' },
]

const workshops = [
  { id: 'w1', name: 'AutoPrestige Service Center', logo: '🔧', city: 'Kuala Lumpur', rating: 4.9, specialization: ['European Cars', 'Engine Repair'], hours: 'Mon-Sat 8AM-6PM', services: ['Engine Overhaul', 'Oil Change', 'Brake Service', 'Diagnostics'], verified: true },
  { id: 'w2', name: 'TurboFix Motors', logo: '⚡', city: 'Selangor', rating: 4.7, specialization: ['Japanese Cars', 'Performance'], hours: 'Mon-Fri 9AM-7PM', services: ['Turbo Installation', 'ECU Tuning', 'Exhaust System', 'Suspension'], verified: true },
  { id: 'w3', name: 'CrystalClear Detailing', logo: '✨', city: 'Penang', rating: 4.8, specialization: ['Detailing', 'Body & Paint'], hours: 'Mon-Sun 10AM-8PM', services: ['Ceramic Coating', 'Paint Protection', 'Interior Detailing', 'Window Tinting'], verified: true },
  { id: 'w4', name: 'QuickStop Auto', logo: '🏎️', city: 'Johor', rating: 4.5, specialization: ['General Repair', 'Tyres'], hours: 'Mon-Sat 8:30AM-5:30PM', services: ['Tyre Replacement', 'Alignment', 'Battery', 'General Service'], verified: true },
  { id: 'w5', name: 'Volt Auto Electrical', logo: '💡', city: 'Kuala Lumpur', rating: 4.6, specialization: ['Electrical', 'Diagnostics'], hours: 'Mon-Fri 9AM-6PM', services: ['Electrical Diagnosis', 'AC Repair', 'Audio System', 'Lighting'], verified: true },
  { id: 'w6', name: 'ProTech Inspection', logo: '🔍', city: 'Selangor', rating: 4.8, specialization: ['Inspection', 'Pre-Purchase'], hours: 'Mon-Sat 9AM-5PM', services: ['Full Inspection', 'Pre-Purchase Check', 'Accident Assessment', 'Valuation'], verified: true },
]

const howItWorksSteps = [
  { step: 1, title: 'Choose Service', description: 'Select the type of service or repair your vehicle needs from our categories.', icon: Search },
  { step: 2, title: 'Get Quote', description: 'Receive transparent quotes from verified workshops in your area instantly.', icon: ClipboardCheck },
  { step: 3, title: 'Book Appointment', description: 'Schedule your visit, drop off your car, and track repairs in real time.', icon: CheckCircle },
]

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
              : 'text-[#2a2a2a]'
          }`}
        />
      ))}
      <span className="ml-1 text-xs text-[#8a8578]">{rating.toFixed(1)}</span>
    </div>
  )
}

export default function RepairPage() {
  const { navigate } = useAppStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

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
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5f0e8]">
      {/* ===== HERO SECTION ===== */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#c9a84c]/10 via-transparent to-[#c9a84c]/5" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#c9a84c]/5 rounded-full blur-3xl" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-px w-8 bg-[#c9a84c]" />
            <span className="text-[#c9a84c] text-sm font-medium tracking-widest uppercase">Service & Maintenance</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">
            Repair & <span className="gold-text">Workshop</span>
          </h1>
          <p className="text-lg sm:text-xl text-[#8a8578] mb-8 max-w-xl">
            Keep Your Ride in Premium Condition
          </p>

          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row gap-3 max-w-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-[#c9a84c]" />
              <Input
                type="text"
                placeholder="Search workshops by location or service…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 bg-[#111111]/90 border-[#c9a84c]/40 text-[#f5f0e8] placeholder:text-[#8a8578] focus-visible:border-[#c9a84c] focus-visible:ring-[#c9a84c]/30 rounded-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ===== SERVICE CATEGORIES ===== */}
      <section className="py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="h-px w-12 bg-[#c9a84c]" />
              <span className="text-[#c9a84c] text-sm font-medium tracking-widest uppercase">What Do You Need?</span>
              <div className="h-px w-12 bg-[#c9a84c]" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold">
              Service <span className="gold-text">Categories</span>
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {serviceCategories.map((cat) => {
              const Icon = cat.icon
              const isSelected = selectedCategory === cat.id
              return (
                <Card
                  key={cat.id}
                  className={`luxury-card bg-[#111111] border-[#2a2a2a] cursor-pointer rounded-xl ${
                    isSelected ? 'border-[#c9a84c] gold-glow' : ''
                  }`}
                  onClick={() => setSelectedCategory(isSelected ? null : cat.id)}
                >
                  <CardContent className="p-5 text-center">
                    <div className={`w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center ${
                      isSelected ? 'bg-[#c9a84c]/20' : 'bg-[#c9a84c]/10'
                    }`}>
                      <Icon className={`size-6 ${isSelected ? 'text-[#e8d48b]' : 'text-[#c9a84c]'}`} />
                    </div>
                    <h3 className="text-sm font-semibold text-[#f5f0e8] mb-1">{cat.name}</h3>
                    <p className="text-xs text-[#8a8578] leading-relaxed">{cat.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {selectedCategory && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <span className="text-sm text-[#8a8578]">Filtering by:</span>
              <Badge className="bg-[#c9a84c]/20 text-[#c9a84c] border-[#c9a84c]/30">
                {serviceCategories.find((c) => c.id === selectedCategory)?.name}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-[#8a8578] h-6 px-2"
                onClick={() => setSelectedCategory(null)}
              >
                Clear
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* ===== FEATURED WORKSHOPS ===== */}
      <section className="py-12 sm:py-16 bg-[#080808]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="h-px w-12 bg-[#c9a84c]" />
              <span className="text-[#c9a84c] text-sm font-medium tracking-widest uppercase">Trusted Professionals</span>
              <div className="h-px w-12 bg-[#c9a84c]" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold">
              Featured <span className="gold-text">Workshops</span>
            </h2>
            <p className="text-[#8a8578] mt-2 text-sm">
              {filteredWorkshops.length} workshop{filteredWorkshops.length !== 1 ? 's' : ''} found
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWorkshops.map((workshop) => (
              <Card key={workshop.id} className="luxury-card bg-[#111111] border-[#2a2a2a] rounded-xl">
                <CardContent className="p-6">
                  {/* Header */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-14 h-14 rounded-xl bg-[#c9a84c]/10 flex items-center justify-center text-2xl shrink-0">
                      {workshop.logo}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-[#f5f0e8] truncate">{workshop.name}</h3>
                        {workshop.verified && (
                          <ShieldCheck className="size-4 text-[#c9a84c] shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-[#8a8578] mt-1">
                        <MapPin className="size-3.5 text-[#c9a84c]" />
                        {workshop.city}
                      </div>
                    </div>
                  </div>

                  {/* Rating */}
                  <StarRating rating={workshop.rating} />

                  {/* Specialization Tags */}
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {workshop.specialization.map((spec) => (
                      <Badge key={spec} className="bg-[#c9a84c]/15 text-[#c9a84c] border-[#c9a84c]/25 text-[10px] px-2 py-0.5">
                        {spec}
                      </Badge>
                    ))}
                  </div>

                  <Separator className="bg-[#2a2a2a] my-4" />

                  {/* Hours */}
                  <div className="flex items-center gap-2 text-sm text-[#8a8578] mb-3">
                    <Clock className="size-3.5 text-[#c9a84c]" />
                    {workshop.hours}
                  </div>

                  {/* Services */}
                  <div className="mb-4">
                    <span className="text-xs text-[#8a8578] uppercase tracking-wider mb-2 block">Services</span>
                    <div className="flex flex-wrap gap-1.5">
                      {workshop.services.map((service) => (
                        <Badge key={service} variant="outline" className="text-[10px] border-[#2a2a2a] text-[#8a8578]">
                          {service}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button className="flex-1 bg-[#c9a84c] hover:bg-[#b8963e] text-[#0a0a0a] font-semibold h-9 rounded-lg text-sm">
                      <Phone className="size-3.5 mr-1" />
                      Book Now
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 border-[#25D366]/50 text-[#25D366] hover:bg-[#25D366]/10 font-semibold h-9 rounded-lg text-sm"
                    >
                      <MessageCircle className="size-3.5 mr-1" />
                      WhatsApp
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredWorkshops.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="size-16 rounded-full bg-[#111111] flex items-center justify-center mb-4">
                <Search className="size-6 text-[#8a8578]" />
              </div>
              <h3 className="text-lg font-semibold text-[#f5f0e8]">No workshops found</h3>
              <p className="text-sm text-[#8a8578] mt-1">Try adjusting your search or category filter.</p>
              <Button
                variant="outline"
                className="mt-4 border-[#c9a84c] text-[#c9a84c] hover:bg-[#c9a84c]/10"
                onClick={() => { setSearchQuery(''); setSelectedCategory(null) }}
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="h-px w-12 bg-[#c9a84c]" />
              <span className="text-[#c9a84c] text-sm font-medium tracking-widest uppercase">Simple Process</span>
              <div className="h-px w-12 bg-[#c9a84c]" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold">
              How It <span className="gold-text">Works</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {howItWorksSteps.map((item, index) => {
              const Icon = item.icon
              return (
                <Card key={item.step} className="luxury-card bg-[#111111] border-[#2a2a2a] rounded-xl relative overflow-hidden">
                  <CardContent className="p-8 text-center">
                    {/* Step number background */}
                    <div className="absolute top-2 right-4 text-7xl font-bold text-[#c9a84c]/5 select-none">
                      {String(index + 1).padStart(2, '0')}
                    </div>
                    <div className="w-16 h-16 rounded-2xl bg-[#c9a84c]/10 flex items-center justify-center mx-auto mb-5">
                      <Icon className="size-8 text-[#c9a84c]" />
                    </div>
                    <div className="inline-flex items-center justify-center size-8 rounded-full bg-[#c9a84c] text-[#0a0a0a] font-bold text-sm mb-3">
                      {item.step}
                    </div>
                    <h3 className="text-lg font-semibold text-[#f5f0e8] mb-2">{item.title}</h3>
                    <p className="text-sm text-[#8a8578] leading-relaxed">{item.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* ===== CTA: REGISTER YOUR WORKSHOP ===== */}
      <section className="py-16 sm:py-20 bg-[#080808] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#c9a84c]/5 via-transparent to-[#c9a84c]/3" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#c9a84c]/5 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-px w-12 bg-[#c9a84c]" />
            <span className="text-[#c9a84c] text-sm font-medium tracking-widest uppercase">For Workshop Owners</span>
            <div className="h-px w-12 bg-[#c9a84c]" />
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">
            Register Your <span className="gold-text">Workshop</span>
          </h2>
          <div className="w-20 h-1 bg-gradient-to-r from-[#c9a84c] to-[#e8d48b] mx-auto rounded-full mb-6" />
          <p className="text-[#8a8578] text-lg leading-relaxed mb-8">
            Join DK Vroom&apos;s network of trusted workshops. Get access to thousands of customers, manage bookings online, and grow your business with our platform.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
            {[
              { value: '500+', label: 'Workshops Onboard' },
              { value: '10K+', label: 'Jobs Completed' },
              { value: '4.8★', label: 'Avg. Customer Rating' },
            ].map((stat) => (
              <div key={stat.label} className="p-4 rounded-xl bg-[#111111]/50 border border-[#2a2a2a]/50">
                <div className="text-xl font-bold gold-text">{stat.value}</div>
                <div className="text-sm text-[#8a8578]">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => navigate('register')}
              size="lg"
              className="bg-[#c9a84c] hover:bg-[#b8963e] text-[#0a0a0a] font-semibold px-8 h-12 rounded-lg"
            >
              Register Your Workshop
              <ArrowRight className="size-4 ml-1" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-[#c9a84c] text-[#c9a84c] hover:bg-[#c9a84c]/10 font-semibold px-8 h-12 rounded-lg"
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
