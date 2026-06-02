'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/lib/store'
import { insuranceApi } from '@/lib/api'
import { INSURANCE_COVERAGE_TYPES } from '@/lib/constants'
import { LoadingState, EmptyState } from '@/components/shared'
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Shield,
  ShieldCheck,
  Flame,
  Calculator,
  CheckCircle,
  ArrowRight,
  Zap,
  Phone,
  Users,
  FileText,
  Headphones,
  Loader2,
} from 'lucide-react'

// ===== LOCAL TYPES =====

interface InsurancePartner {
  name: string
  color: string
}

interface CoverageTypeConfig {
  key: string
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  benefits: string[]
  popular: boolean
}

// ===== COVERAGE TYPE CONFIG =====

const COVERAGE_CONFIG: CoverageTypeConfig[] = [
  {
    key: 'comprehensive',
    icon: ShieldCheck,
    title: 'Comprehensive',
    description: 'Full coverage for your vehicle including own damage, theft, third-party liability, and natural disasters.',
    benefits: ['Own damage coverage', 'Theft protection', 'Third-party liability', 'Natural disaster coverage', 'Windscreen protection', 'Personal accident cover'],
    popular: true,
  },
  {
    key: 'third_party',
    icon: Shield,
    title: 'Third Party',
    description: 'Basic mandatory coverage protecting you against liability to third parties for injury or property damage.',
    benefits: ['Third-party injury', 'Third-party property damage', 'Legal liability coverage', 'Basic protection'],
    popular: false,
  },
  {
    key: 'third_party_fire_theft',
    icon: Flame,
    title: 'Third Party Fire & Theft',
    description: 'Enhanced third-party coverage with added protection against fire damage and vehicle theft.',
    benefits: ['Third-party injury', 'Third-party property damage', 'Fire damage coverage', 'Theft protection'],
    popular: false,
  },
]

const DK_VROOM_BENEFITS = [
  { icon: Zap, title: 'Instant Quotes', description: 'Get instant premium quotes from multiple insurers in seconds.' },
  { icon: Users, title: 'Multiple Insurers', description: 'Compare plans from 6+ leading Malaysian insurance providers.' },
  { icon: FileText, title: 'Easy Claims', description: 'Hassle-free claims process with dedicated support every step.' },
  { icon: Headphones, title: 'Expert Support', description: 'Our insurance specialists help you choose the right coverage.' },
]

const FAQ_ITEMS = [
  {
    question: 'What is the minimum coverage required in Malaysia?',
    answer: 'Under Malaysian law, all motor vehicles must have at least Third-Party insurance coverage. This protects you against liability for injury or death to third parties and damage to their property. Comprehensive coverage is recommended but not mandatory.',
  },
  {
    question: 'How is my insurance premium calculated?',
    answer: 'Your premium is calculated based on several factors: the sum insured (market value of your car), your NCD (No Claim Discount) entitlement, the engine capacity, driver age, and the coverage type selected. Higher NCD and lower engine capacity typically result in lower premiums.',
  },
  {
    question: 'What is NCD and how does it work?',
    answer: 'NCD (No Claim Discount) is a discount on your premium rewarded for each claim-free year. It starts at 0% and increases progressively: 25% after 1 year, 30% after 2 years, 38.3% after 3 years, 45% after 4 years, and 55% after 5+ years of no claims.',
  },
  {
    question: 'Can I transfer my NCD to a new car?',
    answer: 'Yes, your NCD is transferable when you sell your old car and purchase a new one. You can transfer the NCD to the new vehicle upon renewal. The NCD follows the policyholder, not the vehicle.',
  },
  {
    question: 'What does comprehensive insurance cover?',
    answer: 'Comprehensive insurance covers own vehicle damage, theft, fire, natural disasters (flood, landslide), third-party liability, personal accident for driver and passengers, and windscreen damage. Optional add-ons include flood cover, special perils, and legal liability to passengers.',
  },
  {
    question: 'How do I make a claim?',
    answer: 'To make a claim, report the incident to us within 24 hours, submit the required documents (police report, photos, repair estimate), and our claims team will guide you through the process. Most claims are processed within 7-14 working days.',
  },
]

const DEFAULT_PARTNERS: InsurancePartner[] = [
  { name: 'Allianz', color: '#003781' },
  { name: 'AIA', color: '#CC0000' },
  { name: 'Etiqa', color: '#003B6F' },
  { name: 'Tokio Marine', color: '#E60012' },
  { name: 'MSIG', color: '#002E5F' },
  { name: 'Zurich', color: '#0066B3' },
]

const NCD_OPTIONS = [
  { value: '0', label: '0%' },
  { value: '25', label: '25%' },
  { value: '30', label: '30%' },
  { value: '38.3', label: '38.3%' },
  { value: '45', label: '45%' },
  { value: '55', label: '55%' },
]

// ===== HELPERS =====

function getPartnerName(partner: InsurancePartner | Record<string, unknown>): string {
  if ('name' in partner && typeof partner.name === 'string') return partner.name
  return String((partner as Record<string, unknown>).companyName || (partner as Record<string, unknown>).partnerName || 'Insurance')
}

function getPartnerColor(partner: InsurancePartner | Record<string, unknown>): string {
  if ('color' in partner && typeof partner.color === 'string') return partner.color
  return '#c9a84c'
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="section-divider">
      <span className="text-overline text-gold">{children}</span>
    </div>
  )
}

// ===== MAIN COMPONENT =====

export default function InsurancePage() {
  const { user, startBooking } = useAppStore()
  const router = useRouter()
  const [carBrand, setCarBrand] = useState('')
  const [carModel, setCarModel] = useState('')
  const [carYear, setCarYear] = useState('')
  const [sumInsured, setSumInsured] = useState('')
  const [ncd, setNcd] = useState('0')
  const [driverAge, setDriverAge] = useState('')
  const [coverageType, setCoverageType] = useState('comprehensive')
  const [showResult, setShowResult] = useState(false)
  const [estimatedPremium, setEstimatedPremium] = useState(0)

  const [insurancePartners, setInsurancePartners] = useState<InsurancePartner[]>(DEFAULT_PARTNERS)
  const [partnersLoading, setPartnersLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    async function fetchPartners() {
      try {
        setPartnersLoading(true)
        const result = await insuranceApi.list()
        const partners = result.data || []
        if (Array.isArray(partners) && partners.length > 0) {
          setInsurancePartners(partners.map((p: Record<string, unknown>) => ({
            name: String(p.name || p.companyName || p.partnerName || 'Insurance'),
            color: String(p.color || '#c9a84c'),
          })))
        }
      } catch {
        // Keep default partners
      } finally {
        setPartnersLoading(false)
      }
    }
    fetchPartners()
  }, [])

  const calculatePremium = () => {
    const sum = parseFloat(sumInsured) || 0
    const ncdPercent = parseFloat(ncd) || 0
    const age = parseInt(driverAge) || 30

    const baseRate = coverageType === 'comprehensive' ? 0.045 : coverageType === 'third_party_fire_theft' ? 0.025 : 0.015
    const ageFactor = age < 25 ? 1.3 : age < 30 ? 1.1 : age > 60 ? 1.15 : 1.0

    const grossPremium = sum * baseRate * ageFactor
    const ncdAmount = grossPremium * (ncdPercent / 100)
    const netPremium = grossPremium - ncdAmount
    const stampDuty = 10
    const totalPremium = netPremium + stampDuty

    setEstimatedPremium(totalPremium)
    setShowResult(true)
  }

  const handleCreateEnquiry = async () => {
    try {
      setSubmitting(true)
      const result = await insuranceApi.createEnquiry({
        carBrand,
        carModel,
        carYear: parseInt(carYear) || 0,
        sumInsured: parseFloat(sumInsured) || 0,
        ncd: parseFloat(ncd) || 0,
        driverAge: parseInt(driverAge) || 0,
        coverageType,
        estimatedPremium,
        userId: user?.id,
      })
      const d = (result.data ?? result) as Record<string, unknown>
      const pay = d.payment as Record<string, unknown> | undefined
      const enq = d.enquiry as Record<string, unknown> | undefined
      if (pay) {
        const pid = pay.id as string
        const eid = enq?.id as string | undefined
        const amt = (pay.amount as number) || estimatedPremium
        startBooking('insurance', amt, eid, pid)
        const params = new URLSearchParams()
        params.set('paymentId', pid)
        if (eid) params.set('bookingId', eid)
        params.set('amount', String(amt))
        params.set('type', 'insurance')
        router.push(`/payment?${params.toString()}`)
      }
    } catch {
      // Silently fail — UI stays functional
    } finally {
      setSubmitting(false)
    }
  }

  const coverageLabel = coverageType === 'third_party_fire_theft'
    ? 'TP Fire & Theft'
    : INSURANCE_COVERAGE_TYPES.find((t) => t.key === coverageType)?.label ?? coverageType

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ===== HERO SECTION ===== */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gold/10 via-transparent to-gold/5" />
        <div className="absolute top-0 left-0 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-px w-8 bg-gold" />
            <span className="text-overline text-gold">Protection &amp; Coverage</span>
          </div>
          <h1 className="heading-lg mb-4">
            Car <span className="gold-text">Insurance</span>
          </h1>
          <p className="text-body-lg text-muted-foreground max-w-xl">
            Protect What Matters Most
          </p>
          <div className="accent-bar mt-6" />
        </div>
      </section>

      {/* ===== INSURANCE TYPES ===== */}
      <section className="py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <SectionLabel>Choose Your Plan</SectionLabel>
            <h2 className="heading-md mt-3">
              Insurance <span className="gold-text">Types</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {COVERAGE_CONFIG.map((type) => {
              const Icon = type.icon
              return (
                <Card key={type.key} className="luxury-card bg-card border-border rounded-xl relative overflow-hidden">
                  {type.popular && (
                    <div className="absolute top-0 right-0">
                      <Badge className="rounded-none rounded-bl-lg bg-gold text-primary-foreground font-semibold text-xs">
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  <CardContent className="p-6">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-gold to-gold-light flex items-center justify-center mb-5">
                      <Icon className="size-7 text-white" />
                    </div>
                    <h3 className="text-body font-semibold text-foreground mb-2">{type.title}</h3>
                    <p className="text-body-sm text-muted-foreground leading-relaxed mb-4">{type.description}</p>

                    <Separator className="bg-border my-4" />

                    <div className="space-y-2 mb-6">
                      {type.benefits.map((benefit) => (
                        <div key={benefit} className="flex items-center gap-2">
                          <CheckCircle className="size-4 text-gold shrink-0" />
                          <span className="text-body-sm text-muted-foreground">{benefit}</span>
                        </div>
                      ))}
                    </div>

                    <Button
                      className="w-full bg-gold hover:bg-gold-dark text-primary-foreground font-semibold h-10 rounded-lg"
                      onClick={() => setCoverageType(type.key)}
                    >
                      Get Quote
                      <ArrowRight className="size-4 ml-1" />
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* ===== QUICK QUOTE CALCULATOR ===== */}
      <section className="py-12 sm:py-16 bg-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <SectionLabel>Instant Estimate</SectionLabel>
            <h2 className="heading-md mt-3">
              Quick Quote <span className="gold-text">Calculator</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Enquiry Form */}
            <Card className="bg-card border-border rounded-xl">
              <CardContent className="p-6 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-body-sm text-muted-foreground">Car Brand</Label>
                    <Input
                      placeholder="e.g. Honda"
                      value={carBrand}
                      onChange={(e) => setCarBrand(e.target.value)}
                      className="bg-background border-border text-foreground placeholder:text-muted-foreground/50 focus-visible:border-gold focus-visible:ring-gold/30"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-body-sm text-muted-foreground">Car Model</Label>
                    <Input
                      placeholder="e.g. Civic"
                      value={carModel}
                      onChange={(e) => setCarModel(e.target.value)}
                      className="bg-background border-border text-foreground placeholder:text-muted-foreground/50 focus-visible:border-gold focus-visible:ring-gold/30"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-body-sm text-muted-foreground">Year</Label>
                    <Input
                      type="number"
                      placeholder="e.g. 2023"
                      value={carYear}
                      onChange={(e) => setCarYear(e.target.value)}
                      className="bg-background border-border text-foreground placeholder:text-muted-foreground/50 focus-visible:border-gold focus-visible:ring-gold/30"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-body-sm text-muted-foreground">Driver Age</Label>
                    <Input
                      type="number"
                      placeholder="e.g. 30"
                      value={driverAge}
                      onChange={(e) => setDriverAge(e.target.value)}
                      className="bg-background border-border text-foreground placeholder:text-muted-foreground/50 focus-visible:border-gold focus-visible:ring-gold/30"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-body-sm text-muted-foreground">Sum Insured (RM)</Label>
                  <Input
                    type="number"
                    placeholder="e.g. 120000"
                    value={sumInsured}
                    onChange={(e) => setSumInsured(e.target.value)}
                    className="bg-background border-border text-foreground placeholder:text-muted-foreground/50 focus-visible:border-gold focus-visible:ring-gold/30"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-body-sm text-muted-foreground">NCD Percentage</Label>
                    <Select value={ncd} onValueChange={setNcd}>
                      <SelectTrigger className="bg-background border-border text-foreground">
                        <SelectValue placeholder="Select NCD" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {NCD_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value} className="text-foreground focus:bg-secondary focus:text-gold">
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-body-sm text-muted-foreground">Coverage Type</Label>
                    <Select value={coverageType} onValueChange={setCoverageType}>
                      <SelectTrigger className="bg-background border-border text-foreground">
                        <SelectValue placeholder="Select coverage" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {INSURANCE_COVERAGE_TYPES.map((ct) => (
                          <SelectItem key={ct.key} value={ct.key} className="text-foreground focus:bg-secondary focus:text-gold">
                            {ct.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  onClick={calculatePremium}
                  className="w-full bg-gold hover:bg-gold-dark text-primary-foreground font-semibold h-11 rounded-lg"
                >
                  <Calculator className="size-4 mr-2" />
                  Calculate Premium
                </Button>
              </CardContent>
            </Card>

            {/* Result */}
            <Card className={`bg-card border-border rounded-xl ${showResult ? 'gold-glow border-gold' : ''}`}>
              <CardContent className="p-6 flex flex-col items-center justify-center min-h-[400px]">
                {showResult ? (
                  <div className="w-full text-center">
                    <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-4">
                      <ShieldCheck className="size-8 text-gold" />
                    </div>
                    <h3 className="text-body font-semibold text-foreground mb-1">Estimated Annual Premium</h3>
                    <p className="text-4xl font-bold gold-text mb-2">
                      RM {estimatedPremium.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-body-sm text-muted-foreground mb-6">Per year, inclusive of stamp duty</p>

                    <Separator className="bg-border my-4" />

                    <div className="grid grid-cols-2 gap-4 text-left">
                      <div>
                        <p className="text-caption text-muted-foreground">Coverage Type</p>
                        <p className="text-body-sm font-medium text-foreground">{coverageLabel}</p>
                      </div>
                      <div>
                        <p className="text-caption text-muted-foreground">Sum Insured</p>
                        <p className="text-body-sm font-medium text-foreground">RM {parseFloat(sumInsured || '0').toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-caption text-muted-foreground">NCD Discount</p>
                        <p className="text-body-sm font-medium text-gold">{ncd}%</p>
                      </div>
                      <div>
                        <p className="text-caption text-muted-foreground">Monthly Equivalent</p>
                        <p className="text-body-sm font-medium text-foreground">RM {(estimatedPremium / 12).toFixed(2)}</p>
                      </div>
                    </div>

                    <Button
                      className="w-full mt-6 bg-gold hover:bg-gold-dark text-primary-foreground font-semibold h-11 rounded-lg"
                      onClick={handleCreateEnquiry}
                      disabled={submitting}
                    >
                      {submitting ? <Loader2 className="size-4 mr-2 animate-spin" /> : null}
                      Get Protected Now
                      <ArrowRight className="size-4 ml-1" />
                    </Button>
                    <p className="text-caption text-muted-foreground mt-3">
                      *This is an estimate only. Actual premium may vary.
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-full bg-gold/5 flex items-center justify-center mx-auto mb-4">
                      <Calculator className="size-10 text-muted-foreground/50" />
                    </div>
                    <h3 className="text-body font-semibold text-muted-foreground">Premium Calculator</h3>
                    <p className="text-body-sm text-muted-foreground/60 mt-2 max-w-xs">
                      Fill in your vehicle details and click &quot;Calculate Premium&quot; to get an instant estimate.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ===== INSURANCE PARTNERS ===== */}
      <section className="py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <SectionLabel>Trusted Providers</SectionLabel>
            <h2 className="heading-md mt-3">
              Insurance <span className="gold-text">Partners</span>
            </h2>
          </div>

          {partnersLoading ? (
            <LoadingState message="Loading partners…" />
          ) : insurancePartners.length === 0 ? (
            <EmptyState
              icon={<Shield className="size-6" />}
              title="No partners available"
              description="Insurance partner information is currently unavailable."
            />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {insurancePartners.map((partner, idx) => (
                <Card key={getPartnerName(partner) + idx} className="luxury-card bg-card border-border rounded-xl">
                  <CardContent className="p-5 flex flex-col items-center justify-center">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center mb-2" style={{ backgroundColor: getPartnerColor(partner) + '20' }}>
                      <Shield className="size-5" style={{ color: getPartnerColor(partner) }} />
                    </div>
                    <span className="text-body-sm font-medium text-foreground">{getPartnerName(partner)}</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ===== BENEFITS OF DK VROOM INSURANCE ===== */}
      <section className="py-12 sm:py-16 bg-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <SectionLabel>The DK Vroom Advantage</SectionLabel>
            <h2 className="heading-md mt-3">
              Why Use Our <span className="gold-text">Insurance</span>?
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {DK_VROOM_BENEFITS.map((benefit) => {
              const Icon = benefit.icon
              return (
                <Card key={benefit.title} className="luxury-card bg-card border-border rounded-xl text-center">
                  <CardContent className="p-6">
                    <div className="w-14 h-14 rounded-xl bg-gold/10 flex items-center justify-center mx-auto mb-4">
                      <Icon className="size-7 text-gold" />
                    </div>
                    <h3 className="text-body-sm font-semibold text-foreground mb-2">{benefit.title}</h3>
                    <p className="text-body-sm text-muted-foreground leading-relaxed">{benefit.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* ===== FAQ SECTION ===== */}
      <section className="py-12 sm:py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <SectionLabel>Got Questions?</SectionLabel>
            <h2 className="heading-md mt-3">
              Frequently Asked <span className="gold-text">Questions</span>
            </h2>
          </div>

          <Card className="bg-card border-border rounded-xl">
            <CardContent className="p-6">
              <Accordion type="single" collapsible className="w-full">
                {FAQ_ITEMS.map((faq, index) => (
                  <AccordionItem key={index} value={`faq-${index}`} className="border-border">
                    <AccordionTrigger className="text-foreground hover:text-gold text-left text-body-sm font-medium">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground text-body-sm leading-relaxed">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="py-16 sm:py-20 bg-muted relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gold/5 via-transparent to-gold/3" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="heading-md">
            Get <span className="gold-text">Protected</span> Now
          </h2>
          <div className="accent-bar mb-6" />
          <p className="text-body-lg text-muted-foreground leading-relaxed mb-8">
            Don&apos;t wait until it&apos;s too late. Compare quotes from Malaysia&apos;s top insurers and find the perfect coverage for your vehicle today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-gold hover:bg-gold-dark text-primary-foreground font-semibold px-8 h-12 rounded-lg"
              onClick={handleCreateEnquiry}
              disabled={submitting}
            >
              {submitting ? <Loader2 className="size-4 mr-2 animate-spin" /> : null}
              Get Protected Now
              <ArrowRight className="size-4 ml-1" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-gold text-gold hover:bg-gold/10 font-semibold px-8 h-12 rounded-lg"
            >
              <Phone className="size-4 mr-2" />
              Talk to an Expert
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
