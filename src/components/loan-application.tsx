'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  ArrowLeft,
  ArrowRight,
  Upload,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Car,
  Banknote,
  User,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  X,
  CreditCard,
  Loader2,
  CheckCircle2,
  CircleDot,
  Circle,
  AlertTriangle,
} from 'lucide-react'

// Mock applications for tracking
const mockApplications = [
  {
    id: 'LA-2026-001',
    car: 'Perodua Myvi 1.5 AV',
    brand: 'Perodua',
    model: 'Myvi 1.5 AV',
    year: 2023,
    amount: 41880,
    bank: 'Maybank',
    status: 'submitted',
    submittedDate: 'Mar 1, 2026',
    estimatedCompletion: 'Mar 15, 2026',
    timeline: [
      { step: 'Submitted', completed: true, date: 'Mar 1, 2026' },
      { step: 'Under Review', completed: true, date: 'Mar 3, 2026' },
      { step: 'Bank Verification', completed: false, date: '' },
      { step: 'Approved', completed: false, date: '' },
    ],
  },
  {
    id: 'LA-2026-002',
    car: 'BMW X5 xDrive40i',
    brand: 'BMW',
    model: 'X5 xDrive40i',
    year: 2022,
    amount: 153600,
    bank: 'CIMB',
    status: 'underReview',
    submittedDate: 'Feb 25, 2026',
    estimatedCompletion: 'Mar 12, 2026',
    timeline: [
      { step: 'Submitted', completed: true, date: 'Feb 25, 2026' },
      { step: 'Under Review', completed: false, date: '' },
      { step: 'Bank Verification', completed: false, date: '' },
      { step: 'Approved', completed: false, date: '' },
    ],
  },
  {
    id: 'LA-2026-003',
    car: 'Mazda CX-5 Turbo',
    brand: 'Mazda',
    model: 'CX-5 Turbo',
    year: 2023,
    amount: 99900,
    bank: 'Hong Leong Bank',
    status: 'approved',
    submittedDate: 'Feb 10, 2026',
    estimatedCompletion: 'Completed',
    timeline: [
      { step: 'Submitted', completed: true, date: 'Feb 10, 2026' },
      { step: 'Under Review', completed: true, date: 'Feb 14, 2026' },
      { step: 'Bank Verification', completed: true, date: 'Feb 22, 2026' },
      { step: 'Approved', completed: true, date: 'Feb 28, 2026' },
    ],
  },
]

function getStatusInfo(status: string) {
  switch (status) {
    case 'submitted':
      return { label: 'Submitted', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: Clock }
    case 'underReview':
      return { label: 'Under Review', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: Loader2 }
    case 'bankVerification':
      return { label: 'Bank Verification', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', icon: ShieldCheck }
    case 'approved':
      return { label: 'Approved', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: CheckCircle }
    case 'rejected':
      return { label: 'Rejected', color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: AlertCircle }
    default:
      return { label: status, color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', icon: Circle }
  }
}

function getTimelineStepIcon(completed: boolean, isCurrent: boolean) {
  if (completed) return <CheckCircle2 className="size-5 text-[#c9a84c]" />
  if (isCurrent) return <CircleDot className="size-5 text-[#c9a84c] animate-pulse" />
  return <Circle className="size-5 text-[#2a2a2a]" />
}

export default function LoanApplication() {
  const { goBack } = useAppStore()
  const [mainTab, setMainTab] = useState('apply')
  const [currentStep, setCurrentStep] = useState(1)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [expandedApp, setExpandedApp] = useState<string | null>(null)

  // Step 1: Personal Info
  const [fullName, setFullName] = useState('')
  const [icNumber, setIcNumber] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [employmentStatus, setEmploymentStatus] = useState('')
  const [monthlyIncome, setMonthlyIncome] = useState('')
  const [employerName, setEmployerName] = useState('')

  // Step 2: Loan Details
  const [loanType, setLoanType] = useState('')
  const [carBrand, setCarBrand] = useState('')
  const [carModel, setCarModel] = useState('')
  const [carYear, setCarYear] = useState('')
  const [carPrice, setCarPrice] = useState('')
  const [downPayment, setDownPayment] = useState('')
  const [loanTenure, setLoanTenure] = useState('')
  const [preferredBank, setPreferredBank] = useState('')

  // Step 3: Documents
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, boolean>>({
    icFront: false,
    icBack: false,
    payslip1: false,
    payslip2: false,
    payslip3: false,
    bankStatement1: false,
    bankStatement2: false,
    bankStatement3: false,
    epfStatement: false,
    utilityBill: false,
    drivingLicense: false,
  })
  const [termsAccepted, setTermsAccepted] = useState(false)

  const progressValue = (currentStep / 3) * 100

  const handleNext = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1)
  }

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
  }

  const handleSubmit = () => {
    setShowSuccessDialog(true)
  }

  const handleDocUpload = (key: string) => {
    setUploadedDocs((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const toggleExpand = (id: string) => {
    setExpandedApp(expandedApp === id ? null : id)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5f0e8]">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-[#2a2a2a] bg-[#0a0a0a]/95 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={goBack} className="text-[#8a8578] hover:text-[#c9a84c]">
                <ArrowLeft className="size-5" />
              </Button>
              <div>
                <h1 className="text-lg font-semibold">
                  <span className="gold-text">Loan Center</span>
                </h1>
              </div>
            </div>
            <Banknote className="size-5 text-[#c9a84c]" />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Disclaimer */}
        <Card className="bg-[#c9a84c]/5 border-[#c9a84c]/20 mb-6">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="size-5 text-[#c9a84c] shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-[#c9a84c]">Important Disclaimer</p>
              <p className="text-xs text-[#8a8578] mt-1 leading-relaxed">
                Approval is subject to bank/finance partner verification. DK Vroom facilitates the application process but does not guarantee loan approval. 
                All loan terms, interest rates, and conditions are determined solely by the respective financial institutions.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Main Tabs */}
        <Tabs value={mainTab} onValueChange={setMainTab}>
          <TabsList className="bg-[#111111] border border-[#2a2a2a] p-1 h-auto w-full sm:w-auto">
            <TabsTrigger
              value="apply"
              className="data-[state=active]:bg-[#c9a84c] data-[state=active]:text-[#0a0a0a] text-[#8a8578] data-[state=active]:font-semibold px-6 py-2 text-sm"
            >
              <FileText className="size-4 mr-1.5" />
              Apply for Loan
            </TabsTrigger>
            <TabsTrigger
              value="track"
              className="data-[state=active]:bg-[#c9a84c] data-[state=active]:text-[#0a0a0a] text-[#8a8578] data-[state=active]:font-semibold px-6 py-2 text-sm"
            >
              <Clock className="size-4 mr-1.5" />
              Track Application
            </TabsTrigger>
          </TabsList>

          {/* ===== APPLY FOR LOAN TAB ===== */}
          <TabsContent value="apply" className="mt-6">
            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">
                  Step {currentStep} of 3
                </span>
                <span className="text-sm text-[#8a8578]">{Math.round(progressValue)}% complete</span>
              </div>
              <Progress value={progressValue} className="h-2 bg-[#1a1a1a] [&>div]:bg-gradient-to-r [&>div]:from-[#c9a84c] [&>div]:to-[#e8d48b]" />
              <div className="flex items-center justify-between mt-3">
                {[
                  { step: 1, label: 'Personal Info', icon: User },
                  { step: 2, label: 'Loan Details', icon: Car },
                  { step: 3, label: 'Documents', icon: FileText },
                ].map((s) => {
                  const Icon = s.icon
                  return (
                    <div key={s.step} className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        s.step <= currentStep
                          ? 'bg-[#c9a84c] text-[#0a0a0a]'
                          : 'bg-[#1a1a1a] text-[#8a8578] border border-[#2a2a2a]'
                      }`}>
                        {s.step < currentStep ? <CheckCircle2 className="size-4" /> : s.step}
                      </div>
                      <span className={`text-xs hidden sm:inline ${s.step <= currentStep ? 'text-[#c9a84c] font-medium' : 'text-[#8a8578]'}`}>
                        {s.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Step 1: Personal Info */}
            {currentStep === 1 && (
              <Card className="bg-[#111111] border-[#2a2a2a]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <User className="size-5 text-[#c9a84c]" />
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[#8a8578]">Full Name <span className="text-red-400">*</span></Label>
                      <Input
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="As per MyKad"
                        className="bg-[#1a1a1a] border-[#2a2a2a] text-[#f5f0e8] placeholder:text-[#4a4535] focus-visible:border-[#c9a84c]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[#8a8578]">IC Number (MyKad) <span className="text-red-400">*</span></Label>
                      <Input
                        value={icNumber}
                        onChange={(e) => setIcNumber(e.target.value)}
                        placeholder="e.g. 901231-10-5678"
                        className="bg-[#1a1a1a] border-[#2a2a2a] text-[#f5f0e8] placeholder:text-[#4a4535] focus-visible:border-[#c9a84c]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[#8a8578]">Email <span className="text-red-400">*</span></Label>
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="bg-[#1a1a1a] border-[#2a2a2a] text-[#f5f0e8] placeholder:text-[#4a4535] focus-visible:border-[#c9a84c]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[#8a8578]">Phone Number <span className="text-red-400">*</span></Label>
                      <Input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="e.g. +60 12-345 6789"
                        className="bg-[#1a1a1a] border-[#2a2a2a] text-[#f5f0e8] placeholder:text-[#4a4535] focus-visible:border-[#c9a84c]"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#8a8578]">Address <span className="text-red-400">*</span></Label>
                    <Textarea
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Full residential address"
                      rows={3}
                      className="bg-[#1a1a1a] border-[#2a2a2a] text-[#f5f0e8] placeholder:text-[#4a4535] focus-visible:border-[#c9a84c]"
                    />
                  </div>
                  <Separator className="bg-[#2a2a2a]" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[#8a8578]">Employment Status <span className="text-red-400">*</span></Label>
                      <Select value={employmentStatus} onValueChange={setEmploymentStatus}>
                        <SelectTrigger className="bg-[#1a1a1a] border-[#2a2a2a] text-[#f5f0e8]">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#111111] border-[#2a2a2a]">
                          <SelectItem value="employed" className="text-[#f5f0e8] focus:bg-[#1a1a1a] focus:text-[#c9a84c]">Employed</SelectItem>
                          <SelectItem value="selfEmployed" className="text-[#f5f0e8] focus:bg-[#1a1a1a] focus:text-[#c9a84c]">Self-Employed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[#8a8578]">Monthly Income (RM) <span className="text-red-400">*</span></Label>
                      <Input
                        value={monthlyIncome}
                        onChange={(e) => setMonthlyIncome(e.target.value)}
                        placeholder="e.g. 8000"
                        className="bg-[#1a1a1a] border-[#2a2a2a] text-[#f5f0e8] placeholder:text-[#4a4535] focus-visible:border-[#c9a84c]"
                      />
                    </div>
                    <div className="sm:col-span-2 space-y-2">
                      <Label className="text-[#8a8578]">Employer Name</Label>
                      <Input
                        value={employerName}
                        onChange={(e) => setEmployerName(e.target.value)}
                        placeholder="Company name"
                        className="bg-[#1a1a1a] border-[#2a2a2a] text-[#f5f0e8] placeholder:text-[#4a4535] focus-visible:border-[#c9a84c]"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Loan Details */}
            {currentStep === 2 && (
              <Card className="bg-[#111111] border-[#2a2a2a]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Car className="size-5 text-[#c9a84c]" />
                    Loan Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[#8a8578]">Loan Type <span className="text-red-400">*</span></Label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: 'newCar', label: 'New Car' },
                        { value: 'usedCar', label: 'Used Car' },
                        { value: 'continueLoan', label: 'Continue Loan' },
                      ].map((type) => (
                        <Button
                          key={type.value}
                          variant={loanType === type.value ? 'default' : 'outline'}
                          onClick={() => setLoanType(type.value)}
                          className={loanType === type.value
                            ? 'bg-[#c9a84c] text-[#0a0a0a] hover:bg-[#b8963e] font-semibold'
                            : 'border-[#2a2a2a] text-[#8a8578] hover:border-[#c9a84c]/50 hover:text-[#c9a84c]'
                          }
                        >
                          {type.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <Separator className="bg-[#2a2a2a]" />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[#8a8578]">Car Brand <span className="text-red-400">*</span></Label>
                      <Input
                        value={carBrand}
                        onChange={(e) => setCarBrand(e.target.value)}
                        placeholder="e.g. BMW"
                        className="bg-[#1a1a1a] border-[#2a2a2a] text-[#f5f0e8] placeholder:text-[#4a4535] focus-visible:border-[#c9a84c]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[#8a8578]">Car Model <span className="text-red-400">*</span></Label>
                      <Input
                        value={carModel}
                        onChange={(e) => setCarModel(e.target.value)}
                        placeholder="e.g. X5 xDrive40i"
                        className="bg-[#1a1a1a] border-[#2a2a2a] text-[#f5f0e8] placeholder:text-[#4a4535] focus-visible:border-[#c9a84c]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[#8a8578]">Year <span className="text-red-400">*</span></Label>
                      <Input
                        value={carYear}
                        onChange={(e) => setCarYear(e.target.value)}
                        placeholder="e.g. 2023"
                        className="bg-[#1a1a1a] border-[#2a2a2a] text-[#f5f0e8] placeholder:text-[#4a4535] focus-visible:border-[#c9a84c]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[#8a8578]">Car Price (RM) <span className="text-red-400">*</span></Label>
                      <Input
                        value={carPrice}
                        onChange={(e) => setCarPrice(e.target.value)}
                        placeholder="e.g. 298000"
                        className="bg-[#1a1a1a] border-[#2a2a2a] text-[#f5f0e8] placeholder:text-[#4a4535] focus-visible:border-[#c9a84c]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[#8a8578]">Down Payment (RM)</Label>
                      <Input
                        value={downPayment}
                        onChange={(e) => setDownPayment(e.target.value)}
                        placeholder="e.g. 15000"
                        className="bg-[#1a1a1a] border-[#2a2a2a] text-[#f5f0e8] placeholder:text-[#4a4535] focus-visible:border-[#c9a84c]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[#8a8578]">Loan Tenure <span className="text-red-400">*</span></Label>
                      <Select value={loanTenure} onValueChange={setLoanTenure}>
                        <SelectTrigger className="bg-[#1a1a1a] border-[#2a2a2a] text-[#f5f0e8]">
                          <SelectValue placeholder="Select tenure" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#111111] border-[#2a2a2a]">
                          <SelectItem value="5" className="text-[#f5f0e8] focus:bg-[#1a1a1a] focus:text-[#c9a84c]">5 Years</SelectItem>
                          <SelectItem value="7" className="text-[#f5f0e8] focus:bg-[#1a1a1a] focus:text-[#c9a84c]">7 Years</SelectItem>
                          <SelectItem value="9" className="text-[#f5f0e8] focus:bg-[#1a1a1a] focus:text-[#c9a84c]">9 Years</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[#8a8578]">Preferred Bank <span className="text-red-400">*</span></Label>
                    <Select value={preferredBank} onValueChange={setPreferredBank}>
                      <SelectTrigger className="bg-[#1a1a1a] border-[#2a2a2a] text-[#f5f0e8]">
                        <SelectValue placeholder="Select bank" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#111111] border-[#2a2a2a]">
                        {['Maybank', 'CIMB', 'Hong Leong Bank', 'Public Bank', 'RHB', 'AmBank', 'Bank Islam', 'BSN'].map((bank) => (
                          <SelectItem key={bank} value={bank} className="text-[#f5f0e8] focus:bg-[#1a1a1a] focus:text-[#c9a84c]">
                            {bank}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Estimated Monthly Calculation */}
                  {carPrice && downPayment && loanTenure && (
                    <Card className="bg-[#c9a84c]/5 border-[#c9a84c]/20">
                      <CardContent className="p-4">
                        <p className="text-sm font-medium text-[#c9a84c] mb-2">Estimated Monthly Payment</p>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-[#8a8578]">Loan Amount</p>
                            <p className="font-semibold">RM {(Number(carPrice) - Number(downPayment || 0)).toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-[#8a8578]">Est. Monthly (3.5% p.a.)</p>
                            <p className="font-semibold text-[#c9a84c]">
                              RM {Math.round(((Number(carPrice) - Number(downPayment || 0)) * (1 + 0.035 * Number(loanTenure))) / (Number(loanTenure) * 12)).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <p className="text-[10px] text-[#8a8578] mt-2">*Estimation only. Actual rate depends on bank approval and credit score.</p>
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Step 3: Document Upload */}
            {currentStep === 3 && (
              <Card className="bg-[#111111] border-[#2a2a2a]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="size-5 text-[#c9a84c]" />
                    Document Upload
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 space-y-6">
                  {/* IC Upload */}
                  <div>
                    <p className="text-sm font-medium mb-3">MyKad (IC) — Both Sides <span className="text-red-400">*</span></p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { key: 'icFront', label: 'IC Front' },
                        { key: 'icBack', label: 'IC Back' },
                      ].map((doc) => (
                        <div
                          key={doc.key}
                          onClick={() => handleDocUpload(doc.key)}
                          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                            uploadedDocs[doc.key]
                              ? 'border-[#c9a84c] bg-[#c9a84c]/5'
                              : 'border-[#2a2a2a] hover:border-[#c9a84c]/50'
                          }`}
                        >
                          {uploadedDocs[doc.key] ? (
                            <div className="space-y-2">
                              <CheckCircle className="size-8 text-[#c9a84c] mx-auto" />
                              <p className="text-sm font-medium text-[#c9a84c]">{doc.label}</p>
                              <p className="text-xs text-[#8a8578]">Uploaded</p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <Upload className="size-8 text-[#8a8578] mx-auto" />
                              <p className="text-sm text-[#8a8578]">{doc.label}</p>
                              <p className="text-xs text-[#4a4535]">Click to upload</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator className="bg-[#2a2a2a]" />

                  {/* Payslip */}
                  <div>
                    <p className="text-sm font-medium mb-3">Payslip — 3 Months <span className="text-red-400">*</span></p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { key: 'payslip1', label: 'Month 1' },
                        { key: 'payslip2', label: 'Month 2' },
                        { key: 'payslip3', label: 'Month 3' },
                      ].map((doc) => (
                        <div
                          key={doc.key}
                          onClick={() => handleDocUpload(doc.key)}
                          className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                            uploadedDocs[doc.key]
                              ? 'border-[#c9a84c] bg-[#c9a84c]/5'
                              : 'border-[#2a2a2a] hover:border-[#c9a84c]/50'
                          }`}
                        >
                          {uploadedDocs[doc.key] ? (
                            <CheckCircle className="size-6 text-[#c9a84c] mx-auto mb-1" />
                          ) : (
                            <Upload className="size-6 text-[#8a8578] mx-auto mb-1" />
                          )}
                          <p className={`text-xs ${uploadedDocs[doc.key] ? 'text-[#c9a84c] font-medium' : 'text-[#8a8578]'}`}>
                            {doc.label}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator className="bg-[#2a2a2a]" />

                  {/* Bank Statement */}
                  <div>
                    <p className="text-sm font-medium mb-3">Bank Statement — 3 Months <span className="text-red-400">*</span></p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { key: 'bankStatement1', label: 'Month 1' },
                        { key: 'bankStatement2', label: 'Month 2' },
                        { key: 'bankStatement3', label: 'Month 3' },
                      ].map((doc) => (
                        <div
                          key={doc.key}
                          onClick={() => handleDocUpload(doc.key)}
                          className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                            uploadedDocs[doc.key]
                              ? 'border-[#c9a84c] bg-[#c9a84c]/5'
                              : 'border-[#2a2a2a] hover:border-[#c9a84c]/50'
                          }`}
                        >
                          {uploadedDocs[doc.key] ? (
                            <CheckCircle className="size-6 text-[#c9a84c] mx-auto mb-1" />
                          ) : (
                            <Upload className="size-6 text-[#8a8578] mx-auto mb-1" />
                          )}
                          <p className={`text-xs ${uploadedDocs[doc.key] ? 'text-[#c9a84c] font-medium' : 'text-[#8a8578]'}`}>
                            {doc.label}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator className="bg-[#2a2a2a]" />

                  {/* Other Documents */}
                  <div>
                    <p className="text-sm font-medium mb-3">Additional Documents <span className="text-red-400">*</span></p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { key: 'epfStatement', label: 'EPF Statement' },
                        { key: 'utilityBill', label: 'Utility Bill' },
                        { key: 'drivingLicense', label: 'Driving License' },
                      ].map((doc) => (
                        <div
                          key={doc.key}
                          onClick={() => handleDocUpload(doc.key)}
                          className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                            uploadedDocs[doc.key]
                              ? 'border-[#c9a84c] bg-[#c9a84c]/5'
                              : 'border-[#2a2a2a] hover:border-[#c9a84c]/50'
                          }`}
                        >
                          {uploadedDocs[doc.key] ? (
                            <CheckCircle className="size-6 text-[#c9a84c] mx-auto mb-1" />
                          ) : (
                            <Upload className="size-6 text-[#8a8578] mx-auto mb-1" />
                          )}
                          <p className={`text-xs ${uploadedDocs[doc.key] ? 'text-[#c9a84c] font-medium' : 'text-[#8a8578]'}`}>
                            {doc.label}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator className="bg-[#2a2a2a]" />

                  {/* Upload Summary */}
                  <div className="p-4 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a]">
                    <p className="text-sm font-medium mb-2">Upload Progress</p>
                    <div className="flex items-center gap-2 mb-2">
                      <Progress
                        value={(Object.values(uploadedDocs).filter(Boolean).length / Object.keys(uploadedDocs).length) * 100}
                        className="h-2 bg-[#2a2a2a] [&>div]:bg-[#c9a84c]"
                      />
                      <span className="text-xs text-[#8a8578] shrink-0">
                        {Object.values(uploadedDocs).filter(Boolean).length}/{Object.keys(uploadedDocs).length}
                      </span>
                    </div>
                    <p className="text-xs text-[#8a8578]">Please upload all required documents before submitting.</p>
                  </div>

                  {/* Terms */}
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a]">
                    <Checkbox
                      id="terms"
                      checked={termsAccepted}
                      onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
                      className="mt-0.5 data-[state=checked]:bg-[#c9a84c] data-[state=checked]:border-[#c9a84c]"
                    />
                    <label htmlFor="terms" className="text-xs text-[#8a8578] leading-relaxed cursor-pointer">
                      I confirm that all information provided is accurate and I authorize DK Vroom and its partner banks 
                      to verify my details. I understand that loan approval is subject to bank verification and is not guaranteed.
                      I have read and agree to the <span className="text-[#c9a84c] underline">Terms & Conditions</span> and 
                      <span className="text-[#c9a84c] underline"> Privacy Policy</span>.
                    </label>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between mt-6">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1}
                className="border-[#2a2a2a] text-[#8a8578] hover:text-[#f5f0e8] hover:border-[#c9a84c]/50 disabled:opacity-30"
              >
                <ArrowLeft className="size-4 mr-1" />
                Back
              </Button>
              {currentStep < 3 ? (
                <Button
                  onClick={handleNext}
                  className="bg-[#c9a84c] hover:bg-[#b8963e] text-[#0a0a0a] font-semibold"
                >
                  Next
                  <ArrowRight className="size-4 ml-1" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={!termsAccepted}
                  className="bg-[#c9a84c] hover:bg-[#b8963e] text-[#0a0a0a] font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <CreditCard className="size-4 mr-2" />
                  Submit Application
                </Button>
              )}
            </div>
          </TabsContent>

          {/* ===== TRACK APPLICATION TAB ===== */}
          <TabsContent value="track" className="mt-6 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-[#8a8578]">{mockApplications.length} applications</p>
            </div>

            {mockApplications.map((app) => {
              const statusInfo = getStatusInfo(app.status)
              const StatusIcon = statusInfo.icon
              const isExpanded = expandedApp === app.id
              const currentStepIdx = app.timeline.findIndex((t) => !t.completed)

              return (
                <Card key={app.id} className="bg-[#111111] border-[#2a2a2a]">
                  <CardContent className="p-4 sm:p-6">
                    {/* Header */}
                    <div
                      className="flex items-start justify-between cursor-pointer"
                      onClick={() => toggleExpand(app.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#c9a84c]/10 flex items-center justify-center shrink-0">
                          <Car className="size-5 text-[#c9a84c]" />
                        </div>
                        <div>
                          <p className="font-semibold">{app.car}</p>
                          <p className="text-xs text-[#8a8578] mt-0.5">{app.id} · Submitted {app.submittedDate}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-sm font-semibold text-[#c9a84c]">
                              RM {app.amount.toLocaleString()}
                            </span>
                            <span className="text-xs text-[#8a8578]">{app.bank}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge className={`${statusInfo.color} text-xs`}>
                          <StatusIcon className={`size-3 mr-1 ${app.status === 'underReview' ? 'animate-spin' : ''}`} />
                          {statusInfo.label}
                        </Badge>
                        {isExpanded ? (
                          <ChevronUp className="size-4 text-[#8a8578]" />
                        ) : (
                          <ChevronDown className="size-4 text-[#8a8578]" />
                        )}
                      </div>
                    </div>

                    {/* Status Timeline */}
                    <div className="mt-4 pt-4 border-t border-[#2a2a2a]">
                      <p className="text-xs text-[#8a8578] mb-3 font-medium uppercase tracking-wider">Application Status</p>
                      <div className="flex items-center gap-0 w-full">
                        {app.timeline.map((step, idx) => {
                          const isCurrent = idx === currentStepIdx
                          return (
                            <div key={step.step} className="flex-1 flex flex-col items-center">
                              <div className="flex items-center w-full">
                                <div className="flex-1 flex justify-center">
                                  {getTimelineStepIcon(step.completed, isCurrent)}
                                </div>
                                {idx < app.timeline.length - 1 && (
                                  <div className={`flex-1 h-0.5 ${
                                    step.completed ? 'bg-[#c9a84c]' : 'bg-[#2a2a2a]'
                                  }`} />
                                )}
                              </div>
                              <p className={`text-[10px] mt-2 text-center ${
                                step.completed ? 'text-[#c9a84c] font-medium' :
                                isCurrent ? 'text-[#f5f0e8] font-medium' :
                                'text-[#8a8578]'
                              }`}>
                                {step.step}
                              </p>
                              {step.date && (
                                <p className="text-[9px] text-[#8a8578]">{step.date}</p>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-[#2a2a2a] space-y-3">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          <div>
                            <p className="text-[10px] text-[#8a8578] uppercase tracking-wider">Application ID</p>
                            <p className="text-sm font-mono mt-0.5">{app.id}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-[#8a8578] uppercase tracking-wider">Car Details</p>
                            <p className="text-sm mt-0.5">{app.brand} {app.model} ({app.year})</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-[#8a8578] uppercase tracking-wider">Amount Requested</p>
                            <p className="text-sm font-semibold text-[#c9a84c] mt-0.5">RM {app.amount.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-[#8a8578] uppercase tracking-wider">Bank</p>
                            <p className="text-sm mt-0.5">{app.bank}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-[#8a8578] uppercase tracking-wider">Est. Completion</p>
                            <p className="text-sm mt-0.5">{app.estimatedCompletion}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 pt-2">
                          <Button variant="outline" size="sm" className="border-[#2a2a2a] text-[#8a8578] hover:text-[#f5f0e8] text-xs">
                            <FileText className="size-3.5 mr-1" />
                            View Full Details
                          </Button>
                          {app.status !== 'approved' && app.status !== 'rejected' && (
                            <Button size="sm" className="bg-[#c9a84c] hover:bg-[#b8963e] text-[#0a0a0a] text-xs">
                              <CreditCard className="size-3.5 mr-1" />
                              Contact Support
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}

            {/* Disclaimer at bottom */}
            <Card className="bg-[#c9a84c]/5 border-[#c9a84c]/20 mt-6">
              <CardContent className="p-4 flex items-start gap-3">
                <ShieldCheck className="size-5 text-[#c9a84c] shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-[#c9a84c]">Your Data is Secure</p>
                  <p className="text-xs text-[#8a8578] mt-1 leading-relaxed">
                    All documents and personal information are encrypted and shared only with authorized banking partners for verification purposes. 
                    DK Vroom complies with PDPA (Personal Data Protection Act 2010) regulations.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="bg-[#111111] border-[#2a2a2a] max-w-md">
          <DialogHeader>
            <div className="flex flex-col items-center text-center py-4">
              <div className="w-16 h-16 rounded-full bg-[#c9a84c]/10 flex items-center justify-center mb-4">
                <CheckCircle2 className="size-8 text-[#c9a84c]" />
              </div>
              <DialogTitle className="text-xl font-bold mb-2">
                <span className="gold-text">Application Submitted!</span>
              </DialogTitle>
              <p className="text-sm text-[#8a8578] leading-relaxed mt-2">
                Your loan application has been submitted successfully. Our team will review your application and 
                forward it to the bank for verification.
              </p>
              <div className="w-full mt-4 p-3 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a]">
                <p className="text-xs text-[#8a8578]">Application ID</p>
                <p className="text-lg font-mono font-bold text-[#c9a84c]">LA-2026-004</p>
                <p className="text-xs text-[#8a8578] mt-2">Estimated processing time: 5-7 business days</p>
              </div>
              <div className="flex items-center gap-3 mt-6 w-full">
                <Button
                  onClick={() => {
                    setShowSuccessDialog(false)
                    setMainTab('track')
                  }}
                  className="flex-1 bg-[#c9a84c] hover:bg-[#b8963e] text-[#0a0a0a] font-semibold"
                >
                  Track Application
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowSuccessDialog(false)}
                  className="flex-1 border-[#2a2a2a] text-[#8a8578] hover:text-[#f5f0e8]"
                >
                  Close
                </Button>
              </div>
            </div>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  )
}
