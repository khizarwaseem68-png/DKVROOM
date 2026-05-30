'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/lib/store'
import { loansApi } from '@/lib/api'
import { formatPrice } from '@/lib/constants'
import { LoadingState, EmptyState } from '@/components/shared'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Banknote,
  Calculator,
  ArrowRight,
  FileText,
  ShieldCheck,
  Calendar,
  CreditCard,
  Building2,
  TrendingDown,
  Zap,
  UserCheck,
  Car,
  Search,
} from 'lucide-react'

// ===== LOCAL TYPES =====

interface LoanRecord {
  id: string
  loanAmount: number
  amount?: number
  monthlyInstallment: number
  status: string
  bankName?: string
  bank?: string
  createdAt?: string
}

// ===== STATIC DATA =====

const LOAN_FEATURES = [
  { icon: TrendingDown, title: 'Low Interest Rates', description: 'Starting from 3.5% per annum with our partner banks.' },
  { icon: Zap, title: 'Fast Approval', description: 'Get approved within 24 hours with minimal documentation.' },
  { icon: Calendar, title: 'Flexible Tenure', description: 'Choose repayment periods of 5, 7, or 9 years.' },
  { icon: ShieldCheck, title: 'No Hidden Fees', description: 'Transparent pricing with zero processing or hidden charges.' },
]

const LOAN_STEPS = [
  { step: 1, icon: FileText, title: 'Apply Online', description: 'Fill in your details and submit your loan application in minutes.' },
  { step: 2, icon: UserCheck, title: 'Document Verification', description: 'Our team verifies your documents and income details.' },
  { step: 3, icon: Building2, title: 'Bank Approval', description: 'Partner bank reviews and approves your loan application.' },
  { step: 4, icon: Car, title: 'Drive Home', description: 'Sign the agreement and collect your new car!' },
]

const PARTNER_BANKS = [
  { name: 'Maybank', abbr: 'MBB' },
  { name: 'CIMB', abbr: 'CIMB' },
  { name: 'Hong Leong', abbr: 'HLB' },
  { name: 'Public Bank', abbr: 'PBB' },
  { name: 'RHB', abbr: 'RHB' },
  { name: 'AmBank', abbr: 'AM' },
]

const TENURE_YEARS = [5, 7, 9]

// ===== HELPERS =====

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="section-divider">
      <span className="text-overline text-gold">{children}</span>
    </div>
  )
}

// ===== MAIN COMPONENT =====

export default function LoanPage() {
  const { user } = useAppStore()
  const router = useRouter()
  const [carPrice, setCarPrice] = useState('100000')
  const [downPaymentPercent, setDownPaymentPercent] = useState([30])
  const [tenure, setTenure] = useState('7')
  const [interestRate, setInterestRate] = useState('4.0')
  const [userLoans, setUserLoans] = useState<LoanRecord[]>([])
  const [loansLoading, setLoansLoading] = useState(false)

  const calculation = useMemo(() => {
    const price = parseFloat(carPrice) || 0
    const dpPercent = downPaymentPercent[0]
    const downPayment = price * (dpPercent / 100)
    const loanAmount = price - downPayment
    const years = parseInt(tenure)
    const rate = parseFloat(interestRate) / 100

    const totalInterest = loanAmount * rate * years
    const totalPayment = loanAmount + totalInterest
    const monthlyInstallment = totalPayment / (years * 12)

    return { downPayment, loanAmount, totalInterest, totalPayment, monthlyInstallment, years }
  }, [carPrice, downPaymentPercent, tenure, interestRate])

  useEffect(() => {
    async function fetchLoans() {
      if (!user?.id) return
      try {
        setLoansLoading(true)
        const result = await loansApi.list()
        const data = result.data || []
        if (Array.isArray(data)) {
          setUserLoans(data as LoanRecord[])
        }
      } catch {
        setUserLoans([])
      } finally {
        setLoansLoading(false)
      }
    }
    fetchLoans()
  }, [user?.id])

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ===== HERO SECTION ===== */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gold/10 via-transparent to-gold/5" />
        <div className="absolute top-0 left-0 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-px w-8 bg-gold" />
            <span className="text-overline text-gold">Financing Made Easy</span>
          </div>
          <h1 className="heading-lg mb-4">
            Car <span className="gold-text">Loan</span>
          </h1>
          <p className="text-body-lg text-muted-foreground max-w-xl">
            Drive Now, Pay Later
          </p>
          <div className="accent-bar mt-6" />
        </div>
      </section>

      {/* ===== LOAN CALCULATOR ===== */}
      <section className="py-12 sm:py-16 bg-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <SectionLabel>Plan Your Budget</SectionLabel>
            <h2 className="heading-md mt-3">
              Loan <span className="gold-text">Calculator</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Calculator Input */}
            <Card className="bg-card border-border rounded-xl">
              <CardContent className="p-6 space-y-6">
                {/* Car Price */}
                <div className="space-y-2">
                  <Label className="text-body-sm text-muted-foreground">Car Price (RM)</Label>
                  <Input
                    type="number"
                    value={carPrice}
                    onChange={(e) => setCarPrice(e.target.value)}
                    className="bg-background border-border text-foreground text-lg font-semibold focus-visible:border-gold focus-visible:ring-gold/30"
                  />
                </div>

                {/* Down Payment Slider */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-body-sm text-muted-foreground">Down Payment</Label>
                    <span className="text-body-sm font-semibold text-gold">{downPaymentPercent[0]}%</span>
                  </div>
                  <Slider
                    value={downPaymentPercent}
                    onValueChange={setDownPaymentPercent}
                    min={10}
                    max={90}
                    step={5}
                    className="[&_[role=slider]]:border-gold [&_[role=slider]]:bg-background [&_[data-slot=slider-range]]:bg-gold"
                  />
                  <div className="flex justify-between text-caption text-muted-foreground">
                    <span>10%</span>
                    <span>{formatPrice(calculation.downPayment)}</span>
                    <span>90%</span>
                  </div>
                </div>

                {/* Loan Tenure */}
                <div className="space-y-2">
                  <Label className="text-body-sm text-muted-foreground">Loan Tenure</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {TENURE_YEARS.map((year) => (
                      <Button
                        key={year}
                        variant={tenure === String(year) ? 'default' : 'outline'}
                        className={
                          tenure === String(year)
                            ? 'bg-gold text-primary-foreground hover:bg-gold-dark font-semibold h-11 rounded-lg'
                            : 'border-border text-muted-foreground hover:border-gold hover:text-gold h-11 rounded-lg'
                        }
                        onClick={() => setTenure(String(year))}
                      >
                        {year} Years
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Interest Rate */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-body-sm text-muted-foreground">Interest Rate (p.a.)</Label>
                    <span className="text-body-sm font-semibold text-gold">{interestRate}%</span>
                  </div>
                  <Select value={interestRate} onValueChange={setInterestRate}>
                    <SelectTrigger className="bg-background border-border text-foreground">
                      <SelectValue placeholder="Select rate" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="3.5" className="text-foreground focus:bg-secondary focus:text-gold">3.5% — Best Rate</SelectItem>
                      <SelectItem value="4.0" className="text-foreground focus:bg-secondary focus:text-gold">4.0% — Standard</SelectItem>
                      <SelectItem value="4.5" className="text-foreground focus:bg-secondary focus:text-gold">4.5% — Used Car</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Calculation Result */}
            <Card className="bg-card border-gold/30 rounded-xl gold-glow">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Calculator className="size-5 text-gold" />
                  <h3 className="text-body font-semibold text-foreground">Calculation Summary</h3>
                </div>

                {/* Monthly Installment — Highlight */}
                <div className="bg-gradient-to-br from-gold/10 to-gold/5 rounded-xl p-6 mb-6 text-center border border-gold/20">
                  <p className="text-body-sm text-muted-foreground mb-1">Monthly Installment</p>
                  <p className="text-4xl sm:text-5xl font-bold gold-text">
                    {formatPrice(calculation.monthlyInstallment)}
                  </p>
                  <p className="text-caption text-muted-foreground mt-1">per month for {calculation.years} years</p>
                </div>

                <Separator className="bg-border my-5" />

                {/* Breakdown */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-body-sm text-muted-foreground">Car Price</span>
                    <span className="text-body-sm font-medium text-foreground">{formatPrice(parseFloat(carPrice) || 0)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-body-sm text-muted-foreground">Down Payment ({downPaymentPercent[0]}%)</span>
                    <span className="text-body-sm font-medium text-foreground">{formatPrice(calculation.downPayment)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-body-sm text-muted-foreground">Loan Amount</span>
                    <span className="text-body-sm font-medium text-foreground">{formatPrice(calculation.loanAmount)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-body-sm text-muted-foreground">Total Interest</span>
                    <span className="text-body-sm font-medium text-gold">{formatPrice(calculation.totalInterest)}</span>
                  </div>
                  <Separator className="bg-border" />
                  <div className="flex items-center justify-between">
                    <span className="text-body-sm font-semibold text-foreground">Total Payment</span>
                    <span className="text-base font-bold gold-text">{formatPrice(calculation.totalPayment)}</span>
                  </div>
                </div>

                <Button
                  onClick={() => router.push('/apply-loan')}
                  className="w-full mt-6 bg-gold hover:bg-gold-dark text-primary-foreground font-semibold h-11 rounded-lg"
                >
                  Apply Now
                  <ArrowRight className="size-4 ml-1" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ===== USER'S LOAN APPLICATIONS ===== */}
      {user?.id && (
        <section className="py-12 sm:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <SectionLabel>Your Applications</SectionLabel>
              <h2 className="heading-md mt-3">
                My <span className="gold-text">Loans</span>
              </h2>
            </div>

            {loansLoading ? (
              <LoadingState message="Loading your loans…" />
            ) : userLoans.length === 0 ? (
              <EmptyState
                icon={<Search className="size-6" />}
                title="No loan applications yet"
                description="Apply for a car loan using the calculator above."
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {userLoans.map((loan) => (
                  <Card key={loan.id} className="bg-card border-border rounded-xl">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <Badge className={
                          loan.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs' :
                          loan.status === 'rejected' ? 'bg-red-500/20 text-red-400 border-red-500/30 text-xs' :
                          loan.status === 'underReview' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs' :
                          'bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs'
                        }>
                          {loan.status === 'underReview' ? 'Under Review' : loan.status?.charAt(0).toUpperCase() + loan.status?.slice(1) || 'Pending'}
                        </Badge>
                        <span className="text-caption text-muted-foreground">{loan.createdAt ? new Date(loan.createdAt).toLocaleDateString() : ''}</span>
                      </div>
                      <div className="text-body font-bold text-gold">{formatPrice(loan.loanAmount || loan.amount || 0)}</div>
                      <div className="text-caption text-muted-foreground mt-1">{loan.bankName || loan.bank || 'Processing'}</div>
                      <div className="text-caption text-muted-foreground mt-1">Monthly: {formatPrice(loan.monthlyInstallment || 0)}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ===== LOAN FEATURES ===== */}
      <section className="py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <SectionLabel>Why Choose Us</SectionLabel>
            <h2 className="heading-md mt-3">
              Loan <span className="gold-text">Features</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {LOAN_FEATURES.map((feature) => {
              const Icon = feature.icon
              return (
                <Card key={feature.title} className="luxury-card bg-card border-border rounded-xl text-center">
                  <CardContent className="p-6">
                    <div className="w-14 h-14 rounded-xl bg-gold/10 flex items-center justify-center mx-auto mb-4">
                      <Icon className="size-7 text-gold" />
                    </div>
                    <h3 className="text-body-sm font-semibold text-foreground mb-2">{feature.title}</h3>
                    <p className="text-body-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* ===== STEPS ===== */}
      <section className="py-12 sm:py-16 bg-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <SectionLabel>Simple Process</SectionLabel>
            <h2 className="heading-md mt-3">
              How It <span className="gold-text">Works</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {LOAN_STEPS.map((item, index) => {
              const Icon = item.icon
              return (
                <Card key={item.step} className="luxury-card bg-card border-border rounded-xl relative overflow-hidden">
                  <CardContent className="p-6 text-center">
                    <div className="absolute top-2 right-4 text-6xl font-bold text-gold/5 select-none">
                      {String(index + 1).padStart(2, '0')}
                    </div>
                    <div className="w-14 h-14 rounded-xl bg-gold/10 flex items-center justify-center mx-auto mb-4">
                      <Icon className="size-7 text-gold" />
                    </div>
                    <div className="inline-flex items-center justify-center size-8 rounded-full bg-gold text-primary-foreground font-bold text-sm mb-3">
                      {item.step}
                    </div>
                    <h3 className="text-body-sm font-semibold text-foreground mb-2">{item.title}</h3>
                    <p className="text-body-sm text-muted-foreground leading-relaxed">{item.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* ===== PARTNER BANKS ===== */}
      <section className="py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <SectionLabel>Trusted Financial Partners</SectionLabel>
            <h2 className="heading-md mt-3">
              Partner <span className="gold-text">Banks</span>
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {PARTNER_BANKS.map((bank) => (
              <Card key={bank.name} className="luxury-card bg-card border-border rounded-xl">
                <CardContent className="p-5 flex flex-col items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center mb-2">
                    <Building2 className="size-5 text-gold" />
                  </div>
                  <span className="text-body-sm font-medium text-foreground">{bank.name}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CONTINUE LOAN SECTION ===== */}
      <section className="py-12 sm:py-16 bg-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="bg-gradient-to-r from-card to-secondary border-border rounded-xl overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gold/5 rounded-full blur-3xl" />
            <CardContent className="p-8 sm:p-10 relative z-10">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <Badge className="bg-gold/20 text-gold border-gold/30 mb-3">
                    <CreditCard className="size-3 mr-1" />
                    Sambung Bayar
                  </Badge>
                  <h3 className="text-heading-sm text-foreground mb-2">
                    Continue Loan / <span className="gold-text">Sambung Bayar</span>
                  </h3>
                  <p className="text-muted-foreground max-w-lg leading-relaxed text-body-sm">
                    Looking to take over an existing car loan? Browse available vehicles with active loans
                    and enjoy lower deposits with easy bank approval.
                  </p>
                </div>
                <Button
                  onClick={() => router.push('/continue-loan')}
                  size="lg"
                  className="bg-gold hover:bg-gold-dark text-primary-foreground font-semibold px-8 h-12 rounded-lg shrink-0"
                >
                  Browse Vehicles
                  <ArrowRight className="size-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="py-16 sm:py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gold/5 via-transparent to-gold/3" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="heading-md">
            Ready to <span className="gold-text">Drive</span>?
          </h2>
          <div className="accent-bar mb-6" />
          <p className="text-body-lg text-muted-foreground leading-relaxed mb-8">
            Apply for your car loan today and get behind the wheel sooner. Fast approval, competitive rates,
            and flexible repayment options tailored to your needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => router.push('/apply-loan')}
              size="lg"
              className="bg-gold hover:bg-gold-dark text-primary-foreground font-semibold px-8 h-12 rounded-lg"
            >
              Apply Now
              <ArrowRight className="size-4 ml-1" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-gold text-gold hover:bg-gold/10 font-semibold px-8 h-12 rounded-lg"
            >
              <Banknote className="size-4 mr-2" />
              Talk to a Financial Advisor
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
