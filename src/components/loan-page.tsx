'use client'

import { useState, useMemo, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { loansApi } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  Percent,
  Calendar,
  ArrowRight,
  CheckCircle,
  FileText,
  ShieldCheck,
  Clock,
  CreditCard,
  Building2,
  ExternalLink,
  TrendingDown,
  Zap,
  UserCheck,
  Car,
  Loader2,
} from 'lucide-react'

const loanFeatures = [
  { icon: TrendingDown, title: 'Low Interest Rates', description: 'Starting from 3.5% per annum with our partner banks.' },
  { icon: Zap, title: 'Fast Approval', description: 'Get approved within 24 hours with minimal documentation.' },
  { icon: Calendar, title: 'Flexible Tenure', description: 'Choose repayment periods of 5, 7, or 9 years.' },
  { icon: ShieldCheck, title: 'No Hidden Fees', description: 'Transparent pricing with zero processing or hidden charges.' },
]

const loanSteps = [
  { step: 1, icon: FileText, title: 'Apply Online', description: 'Fill in your details and submit your loan application in minutes.' },
  { step: 2, icon: UserCheck, title: 'Document Verification', description: 'Our team verifies your documents and income details.' },
  { step: 3, icon: Building2, title: 'Bank Approval', description: 'Partner bank reviews and approves your loan application.' },
  { step: 4, icon: Car, title: 'Drive Home', description: 'Sign the agreement and collect your new car!' },
]

const partnerBanks = [
  { name: 'Maybank', abbr: 'MBB' },
  { name: 'CIMB', abbr: 'CIMB' },
  { name: 'Hong Leong', abbr: 'HLB' },
  { name: 'Public Bank', abbr: 'PBB' },
  { name: 'RHB', abbr: 'RHB' },
  { name: 'AmBank', abbr: 'AM' },
]

export default function LoanPage() {
  const { navigate, user } = useAppStore()
  const [carPrice, setCarPrice] = useState('100000')
  const [downPaymentPercent, setDownPaymentPercent] = useState([30])
  const [tenure, setTenure] = useState('7')
  const [interestRate, setInterestRate] = useState('4.0')
  const [applying, setApplying] = useState(false)
  const [userLoans, setUserLoans] = useState<any[]>([])
  const [loansLoading, setLoansLoading] = useState(false)

  const calculation = useMemo(() => {
    const price = parseFloat(carPrice) || 0
    const dpPercent = downPaymentPercent[0]
    const downPayment = price * (dpPercent / 100)
    const loanAmount = price - downPayment
    const years = parseInt(tenure)
    const rate = parseFloat(interestRate) / 100

    // Simple flat rate calculation
    const totalInterest = loanAmount * rate * years
    const totalPayment = loanAmount + totalInterest
    const monthlyInstallment = totalPayment / (years * 12)

    return {
      downPayment,
      loanAmount,
      totalInterest,
      totalPayment,
      monthlyInstallment,
      years,
    }
  }, [carPrice, downPaymentPercent, tenure, interestRate])

  const formatCurrency = (value: number) =>
    `RM ${value.toLocaleString('en-MY', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`

  const tenureYears = [5, 7, 9]

  // Fetch user's existing loans
  useEffect(() => {
    async function fetchLoans() {
      if (!user?.id) return
      try {
        setLoansLoading(true)
        const result = await loansApi.list()
        setUserLoans(result.data || [])
      } catch (e) {
        console.error('Failed to fetch loans:', e)
        setUserLoans([])
      } finally {
        setLoansLoading(false)
      }
    }
    fetchLoans()
  }, [user?.id])

  const handleApplyLoan = async () => {
    try {
      setApplying(true)
      await loansApi.create({
        userId: user?.id,
        loanAmount: calculation.loanAmount,
        tenure: parseInt(tenure),
        interestRate: parseFloat(interestRate),
        monthlyInstallment: calculation.monthlyInstallment,
        carPrice: parseFloat(carPrice),
        downPayment: calculation.downPayment,
      })
      // Refresh loans list
      const result = await loansApi.list()
      setUserLoans(result.data || [])
    } catch (e) {
      console.error('Failed to apply for loan:', e)
    } finally {
      setApplying(false)
    }
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
            <span className="text-[#c9a84c] text-sm font-medium tracking-widest uppercase">Financing Made Easy</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">
            Car <span className="gold-text">Loan</span>
          </h1>
          <p className="text-lg sm:text-xl text-[#8a8578] max-w-xl">
            Drive Now, Pay Later
          </p>
          <div className="w-20 h-1 bg-gradient-to-r from-[#c9a84c] to-[#e8d48b] mt-6 rounded-full" />
        </div>
      </section>

      {/* ===== LOAN CALCULATOR ===== */}
      <section className="py-12 sm:py-16 bg-[#080808]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="h-px w-12 bg-[#c9a84c]" />
              <span className="text-[#c9a84c] text-sm font-medium tracking-widest uppercase">Plan Your Budget</span>
              <div className="h-px w-12 bg-[#c9a84c]" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold">
              Loan <span className="gold-text">Calculator</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Calculator Input */}
            <Card className="bg-[#111111] border-[#2a2a2a] rounded-xl">
              <CardContent className="p-6 space-y-6">
                {/* Car Price */}
                <div className="space-y-2">
                  <Label className="text-sm text-[#8a8578]">Car Price (RM)</Label>
                  <Input
                    type="number"
                    value={carPrice}
                    onChange={(e) => setCarPrice(e.target.value)}
                    className="bg-[#0a0a0a] border-[#2a2a2a] text-[#f5f0e8] text-lg font-semibold focus-visible:border-[#c9a84c] focus-visible:ring-[#c9a84c]/30"
                  />
                </div>

                {/* Down Payment Slider */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm text-[#8a8578]">Down Payment</Label>
                    <span className="text-sm font-semibold text-[#c9a84c]">{downPaymentPercent[0]}%</span>
                  </div>
                  <Slider
                    value={downPaymentPercent}
                    onValueChange={setDownPaymentPercent}
                    min={10}
                    max={90}
                    step={5}
                    className="[&_[role=slider]]:border-[#c9a84c] [&_[role=slider]]:bg-[#0a0a0a] [&_[data-slot=slider-range]]:bg-[#c9a84c]"
                  />
                  <div className="flex justify-between text-xs text-[#8a8578]">
                    <span>10%</span>
                    <span>{formatCurrency(calculation.downPayment)}</span>
                    <span>90%</span>
                  </div>
                </div>

                {/* Loan Tenure */}
                <div className="space-y-2">
                  <Label className="text-sm text-[#8a8578]">Loan Tenure</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {tenureYears.map((year) => (
                      <Button
                        key={year}
                        variant={tenure === String(year) ? 'default' : 'outline'}
                        className={
                          tenure === String(year)
                            ? 'bg-[#c9a84c] text-[#0a0a0a] hover:bg-[#b8963e] font-semibold h-11 rounded-lg'
                            : 'border-[#2a2a2a] text-[#8a8578] hover:border-[#c9a84c] hover:text-[#c9a84c] h-11 rounded-lg'
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
                    <Label className="text-sm text-[#8a8578]">Interest Rate (p.a.)</Label>
                    <span className="text-sm font-semibold text-[#c9a84c]">{interestRate}%</span>
                  </div>
                  <Select value={interestRate} onValueChange={setInterestRate}>
                    <SelectTrigger className="bg-[#0a0a0a] border-[#2a2a2a] text-[#f5f0e8]">
                      <SelectValue placeholder="Select rate" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#111111] border-[#2a2a2a]">
                      <SelectItem value="3.5" className="text-[#f5f0e8] focus:bg-[#1a1a1a] focus:text-[#c9a84c]">3.5% — Best Rate</SelectItem>
                      <SelectItem value="4.0" className="text-[#f5f0e8] focus:bg-[#1a1a1a] focus:text-[#c9a84c]">4.0% — Standard</SelectItem>
                      <SelectItem value="4.5" className="text-[#f5f0e8] focus:bg-[#1a1a1a] focus:text-[#c9a84c]">4.5% — Used Car</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Calculation Result */}
            <Card className="bg-[#111111] border-[#c9a84c]/30 rounded-xl gold-glow">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Calculator className="size-5 text-[#c9a84c]" />
                  <h3 className="text-lg font-semibold text-[#f5f0e8]">Calculation Summary</h3>
                </div>

                {/* Monthly Installment - Highlight */}
                <div className="bg-gradient-to-br from-[#c9a84c]/10 to-[#c9a84c]/5 rounded-xl p-6 mb-6 text-center border border-[#c9a84c]/20">
                  <p className="text-sm text-[#8a8578] mb-1">Monthly Installment</p>
                  <p className="text-4xl sm:text-5xl font-bold gold-text">
                    {formatCurrency(calculation.monthlyInstallment)}
                  </p>
                  <p className="text-xs text-[#8a8578] mt-1">per month for {calculation.years} years</p>
                </div>

                <Separator className="bg-[#2a2a2a] my-5" />

                {/* Breakdown */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#8a8578]">Car Price</span>
                    <span className="text-sm font-medium text-[#f5f0e8]">{formatCurrency(parseFloat(carPrice) || 0)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#8a8578]">Down Payment ({downPaymentPercent[0]}%)</span>
                    <span className="text-sm font-medium text-[#f5f0e8]">{formatCurrency(calculation.downPayment)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#8a8578]">Loan Amount</span>
                    <span className="text-sm font-medium text-[#f5f0e8]">{formatCurrency(calculation.loanAmount)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#8a8578]">Total Interest</span>
                    <span className="text-sm font-medium text-[#c9a84c]">{formatCurrency(calculation.totalInterest)}</span>
                  </div>
                  <Separator className="bg-[#2a2a2a]" />
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-[#f5f0e8]">Total Payment</span>
                    <span className="text-base font-bold gold-text">{formatCurrency(calculation.totalPayment)}</span>
                  </div>
                </div>

                <Button
                  onClick={handleApplyLoan}
                  disabled={applying}
                  className="w-full mt-6 bg-[#c9a84c] hover:bg-[#b8963e] text-[#0a0a0a] font-semibold h-11 rounded-lg"
                >
                  {applying ? <Loader2 className="size-4 mr-2 animate-spin" /> : null}
                  Apply Now
                  <ArrowRight className="size-4 ml-1" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ===== USER'S LOAN APPLICATIONS ===== */}
      {user?.id && userLoans.length > 0 && (
        <section className="py-12 sm:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="h-px w-12 bg-[#c9a84c]" />
                <span className="text-[#c9a84c] text-sm font-medium tracking-widest uppercase">Your Applications</span>
                <div className="h-px w-12 bg-[#c9a84c]" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold">
                My <span className="gold-text">Loans</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userLoans.map((loan: any) => (
                <Card key={loan.id} className="bg-[#111111] border-[#2a2a2a] rounded-xl">
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
                      <span className="text-xs text-[#8a8578]">{loan.createdAt ? new Date(loan.createdAt).toLocaleDateString() : ''}</span>
                    </div>
                    <div className="text-lg font-bold text-[#c9a84c]">RM {loan.loanAmount?.toLocaleString() || loan.amount?.toLocaleString() || 0}</div>
                    <div className="text-xs text-[#8a8578] mt-1">{loan.bankName || loan.bank || 'Processing'}</div>
                    <div className="text-xs text-[#8a8578] mt-1">Monthly: RM {loan.monthlyInstallment?.toLocaleString() || 0}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== LOAN FEATURES ===== */}
      <section className="py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="h-px w-12 bg-[#c9a84c]" />
              <span className="text-[#c9a84c] text-sm font-medium tracking-widest uppercase">Why Choose Us</span>
              <div className="h-px w-12 bg-[#c9a84c]" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold">
              Loan <span className="gold-text">Features</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {loanFeatures.map((feature) => {
              const Icon = feature.icon
              return (
                <Card key={feature.title} className="luxury-card bg-[#111111] border-[#2a2a2a] rounded-xl text-center">
                  <CardContent className="p-6">
                    <div className="w-14 h-14 rounded-xl bg-[#c9a84c]/10 flex items-center justify-center mx-auto mb-4">
                      <Icon className="size-7 text-[#c9a84c]" />
                    </div>
                    <h3 className="text-base font-semibold text-[#f5f0e8] mb-2">{feature.title}</h3>
                    <p className="text-sm text-[#8a8578] leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* ===== STEPS ===== */}
      <section className="py-12 sm:py-16 bg-[#080808]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="h-px w-12 bg-[#c9a84c]" />
              <span className="text-[#c9a84c] text-sm font-medium tracking-widest uppercase">Simple Process</span>
              <div className="h-px w-12 bg-[#c9a84c]" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold">
              How It <span className="gold-text">Works</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {loanSteps.map((item, index) => {
              const Icon = item.icon
              return (
                <Card key={item.step} className="luxury-card bg-[#111111] border-[#2a2a2a] rounded-xl relative overflow-hidden">
                  <CardContent className="p-6 text-center">
                    <div className="absolute top-2 right-4 text-6xl font-bold text-[#c9a84c]/5 select-none">
                      {String(index + 1).padStart(2, '0')}
                    </div>
                    <div className="w-14 h-14 rounded-xl bg-[#c9a84c]/10 flex items-center justify-center mx-auto mb-4">
                      <Icon className="size-7 text-[#c9a84c]" />
                    </div>
                    <div className="inline-flex items-center justify-center size-8 rounded-full bg-[#c9a84c] text-[#0a0a0a] font-bold text-sm mb-3">
                      {item.step}
                    </div>
                    <h3 className="text-base font-semibold text-[#f5f0e8] mb-2">{item.title}</h3>
                    <p className="text-sm text-[#8a8578] leading-relaxed">{item.description}</p>
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
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="h-px w-12 bg-[#c9a84c]" />
              <span className="text-[#c9a84c] text-sm font-medium tracking-widest uppercase">Trusted Financial Partners</span>
              <div className="h-px w-12 bg-[#c9a84c]" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold">
              Partner <span className="gold-text">Banks</span>
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {partnerBanks.map((bank) => (
              <Card key={bank.name} className="luxury-card bg-[#111111] border-[#2a2a2a] rounded-xl">
                <CardContent className="p-5 flex flex-col items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-[#c9a84c]/10 flex items-center justify-center mb-2">
                    <Building2 className="size-5 text-[#c9a84c]" />
                  </div>
                  <span className="text-sm font-medium text-[#f5f0e8]">{bank.name}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CONTINUE LOAN SECTION ===== */}
      <section className="py-12 sm:py-16 bg-[#080808]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="bg-gradient-to-r from-[#111111] to-[#1a1a1a] border-[#2a2a2a] rounded-xl overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#c9a84c]/5 rounded-full blur-3xl" />
            <CardContent className="p-8 sm:p-10 relative z-10">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <Badge className="bg-[#c9a84c]/20 text-[#c9a84c] border-[#c9a84c]/30 mb-3">
                    <CreditCard className="size-3 mr-1" />
                    Sambung Bayar
                  </Badge>
                  <h3 className="text-2xl font-bold text-[#f5f0e8] mb-2">
                    Continue Loan / <span className="gold-text">Sambung Bayar</span>
                  </h3>
                  <p className="text-[#8a8578] max-w-lg leading-relaxed">
                    Looking to take over an existing car loan? Browse available vehicles with active loans 
                    and enjoy lower deposits with easy bank approval.
                  </p>
                </div>
                <Button
                  onClick={() => navigate('continueLoan')}
                  size="lg"
                  className="bg-[#c9a84c] hover:bg-[#b8963e] text-[#0a0a0a] font-semibold px-8 h-12 rounded-lg shrink-0"
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
        <div className="absolute inset-0 bg-gradient-to-br from-[#c9a84c]/5 via-transparent to-[#c9a84c]/3" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#c9a84c]/5 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">
            Ready to <span className="gold-text">Drive</span>?
          </h2>
          <div className="w-20 h-1 bg-gradient-to-r from-[#c9a84c] to-[#e8d48b] mx-auto rounded-full mb-6" />
          <p className="text-[#8a8578] text-lg leading-relaxed mb-8">
            Apply for your car loan today and get behind the wheel sooner. Fast approval, competitive rates, 
            and flexible repayment options tailored to your needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={handleApplyLoan}
              disabled={applying}
              size="lg"
              className="bg-[#c9a84c] hover:bg-[#b8963e] text-[#0a0a0a] font-semibold px-8 h-12 rounded-lg"
            >
              {applying ? <Loader2 className="size-4 mr-2 animate-spin" /> : null}
              Apply Now
              <ArrowRight className="size-4 ml-1" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-[#c9a84c] text-[#c9a84c] hover:bg-[#c9a84c]/10 font-semibold px-8 h-12 rounded-lg"
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
