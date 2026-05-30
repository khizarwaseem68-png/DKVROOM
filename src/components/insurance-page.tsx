'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  Car,
  Calculator,
  CheckCircle,
  ArrowRight,
  Star,
  Zap,
  Phone,
  Users,
  FileText,
  Clock,
  Headphones,
  ExternalLink,
} from 'lucide-react'

const insuranceTypes = [
  {
    id: 'comprehensive',
    icon: ShieldCheck,
    title: 'Comprehensive',
    description: 'Full coverage for your vehicle including own damage, theft, third-party liability, and natural disasters.',
    benefits: ['Own damage coverage', 'Theft protection', 'Third-party liability', 'Natural disaster coverage', 'Windscreen protection', 'Personal accident cover'],
    color: 'from-[#c9a84c] to-[#e8d48b]',
    popular: true,
  },
  {
    id: 'third-party',
    icon: Shield,
    title: 'Third Party',
    description: 'Basic mandatory coverage protecting you against liability to third parties for injury or property damage.',
    benefits: ['Third-party injury', 'Third-party property damage', 'Legal liability coverage', 'Basic protection'],
    color: 'from-[#8a8578] to-[#b0a998]',
    popular: false,
  },
  {
    id: 'tpft',
    icon: Flame,
    title: 'Third Party Fire & Theft',
    description: 'Enhanced third-party coverage with added protection against fire damage and vehicle theft.',
    benefits: ['Third-party injury', 'Third-party property damage', 'Fire damage coverage', 'Theft protection'],
    color: 'from-[#c9a84c]/80 to-[#8b7532]',
    popular: false,
  },
]

const insurancePartners = [
  { name: 'Allianz', color: '#003781' },
  { name: 'AIA', color: '#CC0000' },
  { name: 'Etiqa', color: '#003B6F' },
  { name: 'Tokio Marine', color: '#E60012' },
  { name: 'MSIG', color: '#002E5F' },
  { name: 'Zurich', color: '#0066B3' },
]

const dkVroomBenefits = [
  { icon: Zap, title: 'Instant Quotes', description: 'Get instant premium quotes from multiple insurers in seconds.' },
  { icon: Users, title: 'Multiple Insurers', description: 'Compare plans from 6+ leading Malaysian insurance providers.' },
  { icon: FileText, title: 'Easy Claims', description: 'Hassle-free claims process with dedicated support every step.' },
  { icon: Headphones, title: 'Expert Support', description: 'Our insurance specialists help you choose the right coverage.' },
]

const faqItems = [
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

export default function InsurancePage() {
  const { navigate } = useAppStore()
  const [carBrand, setCarBrand] = useState('')
  const [carModel, setCarModel] = useState('')
  const [carYear, setCarYear] = useState('')
  const [sumInsured, setSumInsured] = useState('')
  const [ncd, setNcd] = useState('0')
  const [driverAge, setDriverAge] = useState('')
  const [coverageType, setCoverageType] = useState('comprehensive')
  const [showResult, setShowResult] = useState(false)
  const [estimatedPremium, setEstimatedPremium] = useState(0)

  const calculatePremium = () => {
    const sum = parseFloat(sumInsured) || 0
    const ncdPercent = parseFloat(ncd) || 0
    const age = parseInt(driverAge) || 30

    // Mock calculation
    let baseRate = coverageType === 'comprehensive' ? 0.045 : coverageType === 'tpft' ? 0.025 : 0.015
    let ageFactor = age < 25 ? 1.3 : age < 30 ? 1.1 : age > 60 ? 1.15 : 1.0

    const grossPremium = sum * baseRate * ageFactor
    const ncdAmount = grossPremium * (ncdPercent / 100)
    const netPremium = grossPremium - ncdAmount
    const stampDuty = 10
    const totalPremium = netPremium + stampDuty

    setEstimatedPremium(totalPremium)
    setShowResult(true)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5f0e8]">
      {/* ===== HERO SECTION ===== */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#c9a84c]/10 via-transparent to-[#c9a84c]/5" />
        <div className="absolute top-0 left-0 w-96 h-96 bg-[#c9a84c]/5 rounded-full blur-3xl" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-px w-8 bg-[#c9a84c]" />
            <span className="text-[#c9a84c] text-sm font-medium tracking-widest uppercase">Protection & Coverage</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">
            Car <span className="gold-text">Insurance</span>
          </h1>
          <p className="text-lg sm:text-xl text-[#8a8578] max-w-xl">
            Protect What Matters Most
          </p>
          <div className="w-20 h-1 bg-gradient-to-r from-[#c9a84c] to-[#e8d48b] mt-6 rounded-full" />
        </div>
      </section>

      {/* ===== INSURANCE TYPES ===== */}
      <section className="py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="h-px w-12 bg-[#c9a84c]" />
              <span className="text-[#c9a84c] text-sm font-medium tracking-widest uppercase">Choose Your Plan</span>
              <div className="h-px w-12 bg-[#c9a84c]" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold">
              Insurance <span className="gold-text">Types</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {insuranceTypes.map((type) => {
              const Icon = type.icon
              return (
                <Card key={type.id} className="luxury-card bg-[#111111] border-[#2a2a2a] rounded-xl relative overflow-hidden">
                  {type.popular && (
                    <div className="absolute top-0 right-0">
                      <Badge className="rounded-none rounded-bl-lg bg-[#c9a84c] text-[#0a0a0a] font-semibold text-xs">
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  <CardContent className="p-6">
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${type.color} flex items-center justify-center mb-5`}>
                      <Icon className="size-7 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-[#f5f0e8] mb-2">{type.title}</h3>
                    <p className="text-sm text-[#8a8578] leading-relaxed mb-4">{type.description}</p>

                    <Separator className="bg-[#2a2a2a] my-4" />

                    <div className="space-y-2 mb-6">
                      {type.benefits.map((benefit) => (
                        <div key={benefit} className="flex items-center gap-2">
                          <CheckCircle className="size-4 text-[#c9a84c] shrink-0" />
                          <span className="text-sm text-[#8a8578]">{benefit}</span>
                        </div>
                      ))}
                    </div>

                    <Button
                      className="w-full bg-[#c9a84c] hover:bg-[#b8963e] text-[#0a0a0a] font-semibold h-10 rounded-lg"
                      onClick={() => { setCoverageType(type.id) }}
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
      <section className="py-12 sm:py-16 bg-[#080808]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="h-px w-12 bg-[#c9a84c]" />
              <span className="text-[#c9a84c] text-sm font-medium tracking-widest uppercase">Instant Estimate</span>
              <div className="h-px w-12 bg-[#c9a84c]" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold">
              Quick Quote <span className="gold-text">Calculator</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Form */}
            <Card className="bg-[#111111] border-[#2a2a2a] rounded-xl">
              <CardContent className="p-6 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm text-[#8a8578]">Car Brand</Label>
                    <Input
                      placeholder="e.g. Honda"
                      value={carBrand}
                      onChange={(e) => setCarBrand(e.target.value)}
                      className="bg-[#0a0a0a] border-[#2a2a2a] text-[#f5f0e8] placeholder:text-[#8a8578]/50 focus-visible:border-[#c9a84c] focus-visible:ring-[#c9a84c]/30"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-[#8a8578]">Car Model</Label>
                    <Input
                      placeholder="e.g. Civic"
                      value={carModel}
                      onChange={(e) => setCarModel(e.target.value)}
                      className="bg-[#0a0a0a] border-[#2a2a2a] text-[#f5f0e8] placeholder:text-[#8a8578]/50 focus-visible:border-[#c9a84c] focus-visible:ring-[#c9a84c]/30"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm text-[#8a8578]">Year</Label>
                    <Input
                      type="number"
                      placeholder="e.g. 2023"
                      value={carYear}
                      onChange={(e) => setCarYear(e.target.value)}
                      className="bg-[#0a0a0a] border-[#2a2a2a] text-[#f5f0e8] placeholder:text-[#8a8578]/50 focus-visible:border-[#c9a84c] focus-visible:ring-[#c9a84c]/30"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-[#8a8578]">Driver Age</Label>
                    <Input
                      type="number"
                      placeholder="e.g. 30"
                      value={driverAge}
                      onChange={(e) => setDriverAge(e.target.value)}
                      className="bg-[#0a0a0a] border-[#2a2a2a] text-[#f5f0e8] placeholder:text-[#8a8578]/50 focus-visible:border-[#c9a84c] focus-visible:ring-[#c9a84c]/30"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm text-[#8a8578]">Sum Insured (RM)</Label>
                  <Input
                    type="number"
                    placeholder="e.g. 120000"
                    value={sumInsured}
                    onChange={(e) => setSumInsured(e.target.value)}
                    className="bg-[#0a0a0a] border-[#2a2a2a] text-[#f5f0e8] placeholder:text-[#8a8578]/50 focus-visible:border-[#c9a84c] focus-visible:ring-[#c9a84c]/30"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm text-[#8a8578]">NCD Percentage</Label>
                    <Select value={ncd} onValueChange={setNcd}>
                      <SelectTrigger className="bg-[#0a0a0a] border-[#2a2a2a] text-[#f5f0e8]">
                        <SelectValue placeholder="Select NCD" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#111111] border-[#2a2a2a]">
                        <SelectItem value="0" className="text-[#f5f0e8] focus:bg-[#1a1a1a] focus:text-[#c9a84c]">0%</SelectItem>
                        <SelectItem value="25" className="text-[#f5f0e8] focus:bg-[#1a1a1a] focus:text-[#c9a84c]">25%</SelectItem>
                        <SelectItem value="30" className="text-[#f5f0e8] focus:bg-[#1a1a1a] focus:text-[#c9a84c]">30%</SelectItem>
                        <SelectItem value="38.3" className="text-[#f5f0e8] focus:bg-[#1a1a1a] focus:text-[#c9a84c]">38.3%</SelectItem>
                        <SelectItem value="45" className="text-[#f5f0e8] focus:bg-[#1a1a1a] focus:text-[#c9a84c]">45%</SelectItem>
                        <SelectItem value="55" className="text-[#f5f0e8] focus:bg-[#1a1a1a] focus:text-[#c9a84c]">55%</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-[#8a8578]">Coverage Type</Label>
                    <Select value={coverageType} onValueChange={setCoverageType}>
                      <SelectTrigger className="bg-[#0a0a0a] border-[#2a2a2a] text-[#f5f0e8]">
                        <SelectValue placeholder="Select coverage" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#111111] border-[#2a2a2a]">
                        <SelectItem value="comprehensive" className="text-[#f5f0e8] focus:bg-[#1a1a1a] focus:text-[#c9a84c]">Comprehensive</SelectItem>
                        <SelectItem value="tpft" className="text-[#f5f0e8] focus:bg-[#1a1a1a] focus:text-[#c9a84c]">Third Party Fire & Theft</SelectItem>
                        <SelectItem value="third-party" className="text-[#f5f0e8] focus:bg-[#1a1a1a] focus:text-[#c9a84c]">Third Party</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  onClick={calculatePremium}
                  className="w-full bg-[#c9a84c] hover:bg-[#b8963e] text-[#0a0a0a] font-semibold h-11 rounded-lg"
                >
                  <Calculator className="size-4 mr-2" />
                  Calculate Premium
                </Button>
              </CardContent>
            </Card>

            {/* Result */}
            <Card className={`bg-[#111111] border-[#2a2a2a] rounded-xl ${showResult ? 'gold-glow border-[#c9a84c]' : ''}`}>
              <CardContent className="p-6 flex flex-col items-center justify-center min-h-[400px]">
                {showResult ? (
                  <div className="w-full text-center">
                    <div className="w-16 h-16 rounded-full bg-[#c9a84c]/10 flex items-center justify-center mx-auto mb-4">
                      <ShieldCheck className="size-8 text-[#c9a84c]" />
                    </div>
                    <h3 className="text-lg font-semibold text-[#f5f0e8] mb-1">Estimated Annual Premium</h3>
                    <p className="text-4xl font-bold gold-text mb-2">
                      RM {estimatedPremium.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-sm text-[#8a8578] mb-6">Per year, inclusive of stamp duty</p>

                    <Separator className="bg-[#2a2a2a] my-4" />

                    <div className="grid grid-cols-2 gap-4 text-left">
                      <div>
                        <p className="text-xs text-[#8a8578]">Coverage Type</p>
                        <p className="text-sm font-medium text-[#f5f0e8] capitalize">{coverageType === 'tpft' ? 'TP Fire & Theft' : coverageType}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[#8a8578]">Sum Insured</p>
                        <p className="text-sm font-medium text-[#f5f0e8]">RM {parseFloat(sumInsured || '0').toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[#8a8578]">NCD Discount</p>
                        <p className="text-sm font-medium text-[#c9a84c]">{ncd}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-[#8a8578]">Monthly Equivalent</p>
                        <p className="text-sm font-medium text-[#f5f0e8]">RM {(estimatedPremium / 12).toFixed(2)}</p>
                      </div>
                    </div>

                    <Button
                      className="w-full mt-6 bg-[#c9a84c] hover:bg-[#b8963e] text-[#0a0a0a] font-semibold h-11 rounded-lg"
                    >
                      Get Protected Now
                      <ArrowRight className="size-4 ml-1" />
                    </Button>
                    <p className="text-xs text-[#8a8578] mt-3">
                      *This is an estimate only. Actual premium may vary.
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-full bg-[#c9a84c]/5 flex items-center justify-center mx-auto mb-4">
                      <Calculator className="size-10 text-[#8a8578]/50" />
                    </div>
                    <h3 className="text-lg font-semibold text-[#8a8578]">Premium Calculator</h3>
                    <p className="text-sm text-[#8a8578]/60 mt-2 max-w-xs">
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
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="h-px w-12 bg-[#c9a84c]" />
              <span className="text-[#c9a84c] text-sm font-medium tracking-widest uppercase">Trusted Providers</span>
              <div className="h-px w-12 bg-[#c9a84c]" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold">
              Insurance <span className="gold-text">Partners</span>
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {insurancePartners.map((partner) => (
              <Card key={partner.name} className="luxury-card bg-[#111111] border-[#2a2a2a] rounded-xl">
                <CardContent className="p-5 flex flex-col items-center justify-center">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mb-2" style={{ backgroundColor: partner.color + '20' }}>
                    <Shield className="size-5" style={{ color: partner.color }} />
                  </div>
                  <span className="text-sm font-medium text-[#f5f0e8]">{partner.name}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ===== BENEFITS OF DK VROOM INSURANCE ===== */}
      <section className="py-12 sm:py-16 bg-[#080808]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="h-px w-12 bg-[#c9a84c]" />
              <span className="text-[#c9a84c] text-sm font-medium tracking-widest uppercase">The DK Vroom Advantage</span>
              <div className="h-px w-12 bg-[#c9a84c]" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold">
              Why Use Our <span className="gold-text">Insurance</span>?
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {dkVroomBenefits.map((benefit) => {
              const Icon = benefit.icon
              return (
                <Card key={benefit.title} className="luxury-card bg-[#111111] border-[#2a2a2a] rounded-xl text-center">
                  <CardContent className="p-6">
                    <div className="w-14 h-14 rounded-xl bg-[#c9a84c]/10 flex items-center justify-center mx-auto mb-4">
                      <Icon className="size-7 text-[#c9a84c]" />
                    </div>
                    <h3 className="text-base font-semibold text-[#f5f0e8] mb-2">{benefit.title}</h3>
                    <p className="text-sm text-[#8a8578] leading-relaxed">{benefit.description}</p>
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
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="h-px w-12 bg-[#c9a84c]" />
              <span className="text-[#c9a84c] text-sm font-medium tracking-widest uppercase">Got Questions?</span>
              <div className="h-px w-12 bg-[#c9a84c]" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold">
              Frequently Asked <span className="gold-text">Questions</span>
            </h2>
          </div>

          <Card className="bg-[#111111] border-[#2a2a2a] rounded-xl">
            <CardContent className="p-6">
              <Accordion type="single" collapsible className="w-full">
                {faqItems.map((faq, index) => (
                  <AccordionItem key={index} value={`faq-${index}`} className="border-[#2a2a2a]">
                    <AccordionTrigger className="text-[#f5f0e8] hover:text-[#c9a84c] text-left text-sm font-medium">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-[#8a8578] text-sm leading-relaxed">
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
      <section className="py-16 sm:py-20 bg-[#080808] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#c9a84c]/5 via-transparent to-[#c9a84c]/3" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#c9a84c]/5 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">
            Get <span className="gold-text">Protected</span> Now
          </h2>
          <div className="w-20 h-1 bg-gradient-to-r from-[#c9a84c] to-[#e8d48b] mx-auto rounded-full mb-6" />
          <p className="text-[#8a8578] text-lg leading-relaxed mb-8">
            Don&apos;t wait until it&apos;s too late. Compare quotes from Malaysia&apos;s top insurers and find the perfect coverage for your vehicle today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-[#c9a84c] hover:bg-[#b8963e] text-[#0a0a0a] font-semibold px-8 h-12 rounded-lg"
            >
              Get Protected Now
              <ArrowRight className="size-4 ml-1" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-[#c9a84c] text-[#c9a84c] hover:bg-[#c9a84c]/10 font-semibold px-8 h-12 rounded-lg"
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
