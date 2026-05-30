'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useAppStore } from '@/lib/store'
import { loansApi, uploadApi } from '@/lib/api'
import {
  formatPrice,
  formatDate,
  EMPLOYMENT_TYPES,
  BANKS,
  LOAN_TENURES,
  LOAN_TYPES,
  LOAN_DOCUMENTS,
  ALLOWED_FILE_TYPES,
  MAX_FILE_SIZE_MB,
} from '@/lib/constants'
import { LoadingState, EmptyState, StatusBadge } from '@/components/shared'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
  Car,
  Banknote,
  User,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Loader2,
  CheckCircle2,
  CircleDot,
  Circle,
  AlertTriangle,
} from 'lucide-react'

// ===== TYPES =====

interface TimelineStep {
  step: string
  completed: boolean
  date: string
}

interface LoanApplicationData {
  id: string
  status: string
  amount: number
  bankName: string
  carBrand: string
  carModel: string
  createdAt: string
  reviewedAt?: string
  car?: { brand: string; model: string }
  [key: string]: unknown
}

interface MappedApplication {
  id: string
  status: string
  car: string
  amount: number
  bank: string
  submittedDate: string
  estimatedCompletion: string
  timeline: TimelineStep[]
}

interface StepValidation {
  step1: boolean
  step2: boolean
  step3: boolean
}

// ===== HELPERS =====

function getTimelineStepIcon(completed: boolean, isCurrent: boolean) {
  if (completed) return <CheckCircle2 className="size-5 text-gold" />
  if (isCurrent) return <CircleDot className="size-5 text-gold animate-pulse" />
  return <Circle className="size-5 text-muted-foreground/30" />
}

const STEPS = [
  { step: 1, label: 'Personal Info', icon: User },
  { step: 2, label: 'Loan Details', icon: Car },
  { step: 3, label: 'Documents', icon: FileText },
] as const

// ===== COMPONENT =====

export default function LoanApplication() {
  const { goBack, user } = useAppStore()
  const [mainTab, setMainTab] = useState('apply')
  const [currentStep, setCurrentStep] = useState(1)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [expandedApp, setExpandedApp] = useState<string | null>(null)
  const [applications, setApplications] = useState<MappedApplication[]>([])
  const [loadingApps, setLoadingApps] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

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
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const progressValue = (currentStep / 3) * 100

  // ===== VALIDATION =====

  const stepValidation: StepValidation = {
    step1: !!(fullName && icNumber && email && phone && address && employmentStatus && monthlyIncome),
    step2: !!(loanType && carBrand && carModel && carYear && carPrice && loanTenure && preferredBank),
    step3: termsAccepted && Object.values(uploadedDocs).filter(Boolean).length >= 2,
  }

  const canProceed = (step: number): boolean => {
    if (step === 1) return stepValidation.step1
    if (step === 2) return stepValidation.step2
    return stepValidation.step3
  }

  // ===== NAVIGATION =====

  const handleNext = () => {
    if (currentStep < 3 && canProceed(currentStep)) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
  }

  // ===== DOCUMENT UPLOAD =====

  const handleDocUpload = async (key: string) => {
    const input = fileInputRefs.current[key]
    if (!input) return
    input.click()
  }

  const handleFileChange = async (key: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setError(`File size must be under ${MAX_FILE_SIZE_MB}MB`)
      return
    }

    try {
      await uploadApi.upload(file)
      setUploadedDocs((prev) => ({ ...prev, [key]: true }))
      setError('')
    } catch {
      setError('Failed to upload document. Please try again.')
    }
  }

  // ===== SUBMIT =====

  const handleSubmit = async () => {
    if (!user) return
    setSubmitting(true)
    setError('')
    try {
      const result = await loansApi.create({
        type: loanType === 'continueLoan' ? 'continueLoan' : 'loan',
        amount: Number(carPrice) - Number(downPayment || 0),
        tenure: Number(loanTenure) * 12,
        monthlyIncome: Number(monthlyIncome),
        employmentType: employmentStatus === 'selfEmployed' ? 'self-employed' : 'employed',
        employerName,
        bankName: preferredBank,
        carBrand,
        carModel,
        carYear: Number(carYear),
      })
      if (result.success) {
        setShowSuccessDialog(true)
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to submit application'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  // ===== FETCH APPLICATIONS =====

  const fetchApplications = useCallback(async () => {
    if (!user) return
    setLoadingApps(true)
    try {
      const result = await loansApi.list()
      if (result.data) {
        const mapped = (Array.isArray(result.data) ? result.data : [result.data]).map(
          (app: LoanApplicationData) => ({
            id: app.id,
            status: app.status,
            car: app.car
              ? `${app.car.brand} ${app.car.model}`
              : `${app.carBrand || 'Unknown'} ${app.carModel || ''}`,
            amount: app.amount,
            bank: app.bankName || '',
            submittedDate: formatDate(app.createdAt),
            estimatedCompletion: app.status === 'approved' ? 'Completed' : 'Pending',
            timeline: [
              {
                step: 'Submitted',
                completed: true,
                date: formatDate(app.createdAt),
              },
              {
                step: 'Under Review',
                completed: ['reviewing', 'approved', 'rejected'].includes(app.status),
                date: app.reviewedAt ? formatDate(app.reviewedAt) : '',
              },
              {
                step: 'Bank Verification',
                completed: ['approved', 'rejected'].includes(app.status),
                date: '',
              },
              {
                step: app.status === 'approved' ? 'Approved' : 'Pending',
                completed: app.status === 'approved',
                date: app.status === 'approved' && app.reviewedAt ? formatDate(app.reviewedAt) : '',
              },
            ],
          })
        )
        setApplications(mapped)
      }
    } catch {
      // Silently fail — user can retry
    } finally {
      setLoadingApps(false)
    }
  }, [user])

  useEffect(() => {
    if (mainTab === 'track' && user) {
      fetchApplications()
    }
  }, [mainTab, user, fetchApplications])

  const toggleExpand = (id: string) => {
    setExpandedApp(expandedApp === id ? null : id)
  }

  // ===== ESTIMATED MONTHLY PAYMENT =====

  const loanAmount = Number(carPrice) - Number(downPayment || 0)
  const estimatedMonthly =
    carPrice && loanTenure
      ? Math.round((loanAmount * (1 + 0.035 * Number(loanTenure))) / (Number(loanTenure) * 12))
      : 0

  // ===== RENDER: DOCUMENT UPLOAD TILE =====

  const renderDocTile = (key: string, label: string, large = false) => (
    <div
      key={key}
      role="button"
      tabIndex={0}
      onClick={() => handleDocUpload(key)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleDocUpload(key) }}
      className={`border-2 border-dashed rounded-xl text-center cursor-pointer transition-all ${
        large ? 'p-6' : 'p-5'
      } ${
        uploadedDocs[key]
          ? 'border-gold bg-gold/5'
          : 'border-border hover:border-gold/50'
      }`}
    >
      <input
        ref={(el) => { fileInputRefs.current[key] = el }}
        type="file"
        accept={ALLOWED_FILE_TYPES}
        className="hidden"
        onChange={(e) => handleFileChange(key, e)}
      />
      {uploadedDocs[key] ? (
        <div className={large ? 'space-y-2' : ''}>
          <CheckCircle className={`text-gold mx-auto ${large ? 'size-8' : 'size-6 mb-1'}`} />
          <p className={`text-gold font-medium ${large ? 'text-body-sm' : 'text-caption'}`}>
            {label}
          </p>
          {large && <p className="text-caption text-muted-foreground">Uploaded</p>}
        </div>
      ) : (
        <div className={large ? 'space-y-2' : ''}>
          <Upload className={`text-muted-foreground mx-auto ${large ? 'size-8' : 'size-6 mb-1'}`} />
          <p className={`text-muted-foreground ${large ? 'text-body-sm' : 'text-caption'}`}>
            {label}
          </p>
          {large && <p className="text-caption text-muted-foreground/50">Click to upload</p>}
        </div>
      )}
    </div>
  )

  // ===== RENDER =====

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={goBack} className="text-muted-foreground hover:text-gold">
                <ArrowLeft className="size-5" />
              </Button>
              <h1 className="heading-sm">
                <span className="gold-text">Loan Center</span>
              </h1>
            </div>
            <Banknote className="size-5 text-gold" />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Disclaimer */}
        <Card className="bg-gold/5 border-gold/20 mb-6">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="size-5 text-gold shrink-0 mt-0.5" />
            <div>
              <p className="text-body-sm font-medium text-gold">Important Disclaimer</p>
              <p className="text-caption text-muted-foreground mt-1 leading-relaxed">
                Approval is subject to bank/finance partner verification. DK Vroom facilitates the application process but does not guarantee loan approval.
                All loan terms, interest rates, and conditions are determined solely by the respective financial institutions.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Main Tabs */}
        <Tabs value={mainTab} onValueChange={setMainTab}>
          <TabsList className="bg-card border border-border p-1 h-auto w-full sm:w-auto">
            <TabsTrigger
              value="apply"
              className="data-[state=active]:bg-gold data-[state=active]:text-gold-dark text-muted-foreground data-[state=active]:font-semibold px-6 py-2 text-body-sm"
            >
              <FileText className="size-4 mr-1.5" />
              Apply for Loan
            </TabsTrigger>
            <TabsTrigger
              value="track"
              className="data-[state=active]:bg-gold data-[state=active]:text-gold-dark text-muted-foreground data-[state=active]:font-semibold px-6 py-2 text-body-sm"
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
                <span className="text-body-sm font-medium">
                  Step {currentStep} of 3
                </span>
                <span className="text-body-sm text-muted-foreground">{Math.round(progressValue)}% complete</span>
              </div>
              <Progress value={progressValue} className="h-2 bg-secondary [&>div]:bg-gradient-to-r [&>div]:from-gold [&>div]:to-gold-light" />
              <div className="flex items-center justify-between mt-3">
                {STEPS.map((s) => {
                  return (
                    <div key={s.step} className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        s.step <= currentStep
                          ? 'bg-gold text-gold-dark'
                          : 'bg-secondary text-muted-foreground border border-border'
                      }`}>
                        {s.step < currentStep ? <CheckCircle2 className="size-4" /> : s.step}
                      </div>
                      <span className={`text-caption hidden sm:inline ${s.step <= currentStep ? 'text-gold font-medium' : 'text-muted-foreground'}`}>
                        {s.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Step 1: Personal Info */}
            {currentStep === 1 && (
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 heading-sm">
                    <User className="size-5 text-gold" />
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Full Name <span className="text-destructive">*</span></Label>
                      <Input
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="As per MyKad"
                        className="bg-secondary border-border text-foreground placeholder:text-muted-foreground/50 focus-visible:border-gold"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">IC Number (MyKad) <span className="text-destructive">*</span></Label>
                      <Input
                        value={icNumber}
                        onChange={(e) => setIcNumber(e.target.value)}
                        placeholder="e.g. 901231-10-5678"
                        className="bg-secondary border-border text-foreground placeholder:text-muted-foreground/50 focus-visible:border-gold"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Email <span className="text-destructive">*</span></Label>
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="bg-secondary border-border text-foreground placeholder:text-muted-foreground/50 focus-visible:border-gold"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Phone Number <span className="text-destructive">*</span></Label>
                      <Input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="e.g. +60 12-345 6789"
                        className="bg-secondary border-border text-foreground placeholder:text-muted-foreground/50 focus-visible:border-gold"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Address <span className="text-destructive">*</span></Label>
                    <Textarea
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Full residential address"
                      rows={3}
                      className="bg-secondary border-border text-foreground placeholder:text-muted-foreground/50 focus-visible:border-gold"
                    />
                  </div>
                  <Separator className="bg-border" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Employment Status <span className="text-destructive">*</span></Label>
                      <Select value={employmentStatus} onValueChange={setEmploymentStatus}>
                        <SelectTrigger className="bg-secondary border-border text-foreground">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border">
                          {EMPLOYMENT_TYPES.map((type) => (
                            <SelectItem key={type.key} value={type.key} className="text-foreground focus:bg-secondary focus:text-gold">
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Monthly Income (RM) <span className="text-destructive">*</span></Label>
                      <Input
                        value={monthlyIncome}
                        onChange={(e) => setMonthlyIncome(e.target.value)}
                        placeholder="e.g. 8000"
                        className="bg-secondary border-border text-foreground placeholder:text-muted-foreground/50 focus-visible:border-gold"
                      />
                    </div>
                    <div className="sm:col-span-2 space-y-2">
                      <Label className="text-muted-foreground">Employer Name</Label>
                      <Input
                        value={employerName}
                        onChange={(e) => setEmployerName(e.target.value)}
                        placeholder="Company name"
                        className="bg-secondary border-border text-foreground placeholder:text-muted-foreground/50 focus-visible:border-gold"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Loan Details */}
            {currentStep === 2 && (
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 heading-sm">
                    <Car className="size-5 text-gold" />
                    Loan Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Loan Type <span className="text-destructive">*</span></Label>
                    <div className="grid grid-cols-3 gap-2">
                      {LOAN_TYPES.map((type) => (
                        <Button
                          key={type.value}
                          variant={loanType === type.value ? 'default' : 'outline'}
                          onClick={() => setLoanType(type.value)}
                          className={loanType === type.value
                            ? 'bg-gold text-gold-dark hover:bg-gold-light font-semibold'
                            : 'border-border text-muted-foreground hover:border-gold/50 hover:text-gold'
                          }
                        >
                          {type.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <Separator className="bg-border" />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Car Brand <span className="text-destructive">*</span></Label>
                      <Input
                        value={carBrand}
                        onChange={(e) => setCarBrand(e.target.value)}
                        placeholder="e.g. BMW"
                        className="bg-secondary border-border text-foreground placeholder:text-muted-foreground/50 focus-visible:border-gold"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Car Model <span className="text-destructive">*</span></Label>
                      <Input
                        value={carModel}
                        onChange={(e) => setCarModel(e.target.value)}
                        placeholder="e.g. X5 xDrive40i"
                        className="bg-secondary border-border text-foreground placeholder:text-muted-foreground/50 focus-visible:border-gold"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Year <span className="text-destructive">*</span></Label>
                      <Input
                        value={carYear}
                        onChange={(e) => setCarYear(e.target.value)}
                        placeholder="e.g. 2023"
                        className="bg-secondary border-border text-foreground placeholder:text-muted-foreground/50 focus-visible:border-gold"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Car Price (RM) <span className="text-destructive">*</span></Label>
                      <Input
                        value={carPrice}
                        onChange={(e) => setCarPrice(e.target.value)}
                        placeholder="e.g. 298000"
                        className="bg-secondary border-border text-foreground placeholder:text-muted-foreground/50 focus-visible:border-gold"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Down Payment (RM)</Label>
                      <Input
                        value={downPayment}
                        onChange={(e) => setDownPayment(e.target.value)}
                        placeholder="e.g. 15000"
                        className="bg-secondary border-border text-foreground placeholder:text-muted-foreground/50 focus-visible:border-gold"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Loan Tenure <span className="text-destructive">*</span></Label>
                      <Select value={loanTenure} onValueChange={setLoanTenure}>
                        <SelectTrigger className="bg-secondary border-border text-foreground">
                          <SelectValue placeholder="Select tenure" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border">
                          {LOAN_TENURES.map((t) => (
                            <SelectItem key={t.value} value={t.value} className="text-foreground focus:bg-secondary focus:text-gold">
                              {t.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Preferred Bank <span className="text-destructive">*</span></Label>
                    <Select value={preferredBank} onValueChange={setPreferredBank}>
                      <SelectTrigger className="bg-secondary border-border text-foreground">
                        <SelectValue placeholder="Select bank" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {BANKS.map((bank) => (
                          <SelectItem key={bank} value={bank} className="text-foreground focus:bg-secondary focus:text-gold">
                            {bank}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Estimated Monthly Calculation */}
                  {carPrice && loanTenure && Number(carPrice) > 0 && (
                    <Card className="bg-gold/5 border-gold/20">
                      <CardContent className="p-4">
                        <p className="text-body-sm font-medium text-gold mb-2">Estimated Monthly Payment</p>
                        <div className="grid grid-cols-2 gap-4 text-body-sm">
                          <div>
                            <p className="text-muted-foreground">Loan Amount</p>
                            <p className="font-semibold">{formatPrice(loanAmount)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Est. Monthly (3.5% p.a.)</p>
                            <p className="font-semibold text-gold">
                              {formatPrice(estimatedMonthly)}
                            </p>
                          </div>
                        </div>
                        <p className="text-caption text-muted-foreground mt-2">
                          *Estimation only. Actual rate depends on bank approval and credit score.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Step 3: Document Upload */}
            {currentStep === 3 && (
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 heading-sm">
                    <FileText className="size-5 text-gold" />
                    Document Upload
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 space-y-6">
                  {/* IC Upload */}
                  <div>
                    <p className="text-body-sm font-medium mb-3">
                      MyKad (IC) — Both Sides <span className="text-destructive">*</span>
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {LOAN_DOCUMENTS.ic.map((doc) => renderDocTile(doc.key, doc.label, true))}
                    </div>
                  </div>

                  <Separator className="bg-border" />

                  {/* Payslip */}
                  <div>
                    <p className="text-body-sm font-medium mb-3">
                      Payslip — 3 Months <span className="text-destructive">*</span>
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {LOAN_DOCUMENTS.payslip.map((doc) => renderDocTile(doc.key, doc.label))}
                    </div>
                  </div>

                  <Separator className="bg-border" />

                  {/* Bank Statement */}
                  <div>
                    <p className="text-body-sm font-medium mb-3">
                      Bank Statement — 3 Months <span className="text-destructive">*</span>
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {LOAN_DOCUMENTS.bankStatement.map((doc) => renderDocTile(doc.key, doc.label))}
                    </div>
                  </div>

                  <Separator className="bg-border" />

                  {/* Other Documents */}
                  <div>
                    <p className="text-body-sm font-medium mb-3">
                      Additional Documents <span className="text-destructive">*</span>
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {LOAN_DOCUMENTS.additional.map((doc) => renderDocTile(doc.key, doc.label))}
                    </div>
                  </div>

                  <Separator className="bg-border" />

                  {/* Upload Summary */}
                  <div className="p-4 rounded-lg bg-secondary border border-border">
                    <p className="text-body-sm font-medium mb-2">Upload Progress</p>
                    <div className="flex items-center gap-2 mb-2">
                      <Progress
                        value={(Object.values(uploadedDocs).filter(Boolean).length / Object.keys(uploadedDocs).length) * 100}
                        className="h-2 bg-border [&>div]:bg-gold"
                      />
                      <span className="text-caption text-muted-foreground shrink-0">
                        {Object.values(uploadedDocs).filter(Boolean).length}/{Object.keys(uploadedDocs).length}
                      </span>
                    </div>
                    <p className="text-caption text-muted-foreground">
                      Please upload all required documents before submitting.
                    </p>
                  </div>

                  {/* Terms */}
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-secondary border border-border">
                    <Checkbox
                      id="terms"
                      checked={termsAccepted}
                      onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                      className="mt-0.5 data-[state=checked]:bg-gold data-[state=checked]:border-gold"
                    />
                    <label htmlFor="terms" className="text-caption text-muted-foreground leading-relaxed cursor-pointer">
                      I confirm that all information provided is accurate and I authorize DK Vroom and its partner banks
                      to verify my details. I understand that loan approval is subject to bank verification and is not guaranteed.
                      I have read and agree to the{' '}
                      <span className="text-gold underline">Terms &amp; Conditions</span> and{' '}
                      <span className="text-gold underline">Privacy Policy</span>.
                    </label>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Navigation Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-6">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1}
                className="border-border text-muted-foreground hover:text-foreground hover:border-gold/50 disabled:opacity-30"
              >
                <ArrowLeft className="size-4 mr-1" />
                Back
              </Button>
              {currentStep < 3 ? (
                <Button
                  onClick={handleNext}
                  disabled={!canProceed(currentStep)}
                  className="bg-gold hover:bg-gold-light text-gold-dark font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                  <ArrowRight className="size-4 ml-1" />
                </Button>
              ) : (
                <div className="flex flex-col items-end gap-2">
                  {error && (
                    <p className="text-body-sm text-destructive text-right">{error}</p>
                  )}
                  <Button
                    onClick={handleSubmit}
                    disabled={!stepValidation.step3 || submitting}
                    className="bg-gold hover:bg-gold-light text-gold-dark font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <Loader2 className="size-4 mr-2 animate-spin" />
                    ) : (
                      <CreditCard className="size-4 mr-2" />
                    )}
                    {submitting ? 'Submitting...' : 'Submit Application'}
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          {/* ===== TRACK APPLICATION TAB ===== */}
          <TabsContent value="track" className="mt-6 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-body-sm text-muted-foreground">
                {applications.length} application{applications.length !== 1 ? 's' : ''}
              </p>
            </div>

            {loadingApps ? (
              <LoadingState message="Loading your applications..." />
            ) : applications.length === 0 ? (
              <EmptyState
                icon={<FileText className="size-12" />}
                title="No loan applications yet"
                description="Start your car financing journey by applying for a loan."
                action={
                  <Button onClick={() => setMainTab('apply')} className="bg-gold hover:bg-gold-light text-gold-dark">
                    Apply Now
                  </Button>
                }
              />
            ) : (
              applications.map((app) => {
                const isExpanded = expandedApp === app.id
                const currentStepIdx = app.timeline.findIndex((t) => !t.completed)

                return (
                  <Card key={app.id} className="bg-card border-border">
                    <CardContent className="p-4 sm:p-6">
                      {/* Header */}
                      <div
                        className="flex items-start justify-between cursor-pointer"
                        onClick={() => toggleExpand(app.id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleExpand(app.id) }}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center shrink-0">
                            <Car className="size-5 text-gold" />
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{app.car}</p>
                            <p className="text-caption text-muted-foreground mt-0.5">
                              {app.id} · Submitted {app.submittedDate}
                            </p>
                            <div className="flex items-center gap-3 mt-2">
                              <span className="text-body-sm font-semibold text-gold">
                                {formatPrice(app.amount)}
                              </span>
                              {app.bank && (
                                <span className="text-caption text-muted-foreground">{app.bank}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <StatusBadge status={app.status} />
                          {isExpanded ? (
                            <ChevronUp className="size-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="size-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>

                      {/* Status Timeline */}
                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-border">
                          <p className="text-overline text-muted-foreground mb-3">Application Status</p>
                          <div className="flex items-center gap-0 w-full">
                            {app.timeline.map((step, idx) => (
                              <React.Fragment key={step.step}>
                                <div className="flex flex-col items-center text-center flex-1 min-w-0">
                                  {getTimelineStepIcon(step.completed, idx === currentStepIdx)}
                                  <p className={`text-caption mt-1.5 ${
                                    step.completed ? 'text-foreground font-medium' : 'text-muted-foreground'
                                  }`}>
                                    {step.step}
                                  </p>
                                  {step.date && (
                                    <p className="text-caption text-muted-foreground/60">{step.date}</p>
                                  )}
                                </div>
                                {idx < app.timeline.length - 1 && (
                                  <div className={`h-0.5 w-full mx-1 -mt-6 ${
                                    step.completed && app.timeline[idx + 1].completed
                                      ? 'bg-gold'
                                      : 'bg-border'
                                  }`} />
                                )}
                              </React.Fragment>
                            ))}
                          </div>
                          <div className="mt-4 flex items-center justify-between">
                            <p className="text-caption text-muted-foreground">
                              Estimated: {app.estimatedCompletion}
                            </p>
                            <StatusBadge status={app.status} />
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 heading-md text-foreground">
              <CheckCircle className="size-6 text-gold" />
              Application Submitted
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-4">
            <div className="size-16 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="size-8 text-gold" />
            </div>
            <p className="text-body text-foreground mb-2">
              Your loan application has been submitted successfully!
            </p>
            <p className="text-body-sm text-muted-foreground mb-6">
              You can track the status of your application in the &ldquo;Track Application&rdquo; tab. 
              Our team will review your application and get back to you shortly.
            </p>
            <Button
              onClick={() => {
                setShowSuccessDialog(false)
                setMainTab('track')
              }}
              className="bg-gold hover:bg-gold-light text-gold-dark font-semibold"
            >
              Track Application
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
