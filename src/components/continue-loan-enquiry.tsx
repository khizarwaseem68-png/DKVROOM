'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAppStore } from '@/lib/store'
import { continueLoanApi, carsApi, uploadApi, type CarData } from '@/lib/api'
import {
  formatPrice,
  CONTINUE_LOAN_STEPS,
  CONTINUE_LOAN_DOCUMENTS,
  ALLOWED_FILE_TYPES,
  MAX_FILE_SIZE_MB,
} from '@/lib/constants'
import { LoadingState, EmptyState, StatusBadge } from '@/components/shared'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  ArrowLeft,
  FileText,
  Car,
  Handshake,
  AlertTriangle,
  Send,
  User,
  Loader2,
  CheckCircle,
  CheckCircle2,
  CircleDot,
  Circle,
  Upload,
  ShieldCheck,
  KeyRound,
} from 'lucide-react'

// ===== TYPES =====

interface ParsedCarData {
  id: string
  brand: string
  model: string
  year: number
  color: string | null
  mileage: number | null
  monthlyInstallment: number | null
  remainingMonths: number | null
  remainingBalance: number | null
  takeoverAmount: number | null
  bankName: string | null
  photos: string[]
  features: string[]
  requiredDocs: string[]
  [key: string]: unknown
}

interface UploadedFiles {
  [key: string]: { uploaded: boolean; url?: string }
}

type EnquiryPhase = 'form' | 'documents' | 'agreement' | 'submitted'

// ===== HELPERS =====

function parseJsonField(value: unknown): string[] {
  if (typeof value === 'string') {
    try { return JSON.parse(value) } catch { return [] }
  }
  return Array.isArray(value) ? value : []
}

function formatMileage(km: number): string {
  return `${km.toLocaleString('en-MY')} km`
}

function getStepIcon(completed: boolean, isCurrent: boolean) {
  if (completed) return <CheckCircle2 className="size-5 text-gold" />
  if (isCurrent) return <CircleDot className="size-5 text-gold animate-pulse" />
  return <Circle className="size-5 text-muted-foreground/30" />
}

const DEFAULT_REQUIRED_DOCS = [
  'IC (MyKad)',
  '3 months payslip',
  'Bank statement (3 months)',
  'EPF statement',
  'Utility bill',
  'Driving license',
]

// ===== COMPONENT =====

export default function ContinueLoanEnquiry() {
  const { selectedCarId, goBack, navigate, user } = useAppStore()
  const [car, setCar] = useState<ParsedCarData | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [enquiryId, setEnquiryId] = useState<string | null>(null)
  const [phase, setPhase] = useState<EnquiryPhase>('form')
  const [error, setError] = useState('')

  // Form fields
  const [fullName, setFullName] = useState('')
  const [icNumber, setIcNumber] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [email, setEmail] = useState('')
  const [monthlyIncome, setMonthlyIncome] = useState('')
  const [employer, setEmployer] = useState('')
  const [message, setMessage] = useState('')

  // Document uploads
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFiles>({})
  const [termsAccepted, setTermsAccepted] = useState(false)
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  // Enquiry status tracking
  const [enquiryStatus, setEnquiryStatus] = useState<string>('enquiry')

  // ===== VALIDATION =====

  const isFormValid = !!(fullName && icNumber && phoneNumber && email)
  const allDocsUploaded = CONTINUE_LOAN_DOCUMENTS
    .filter((d) => d.required)
    .every((d) => uploadedFiles[d.key]?.uploaded)

  // ===== FETCH CAR DATA =====

  useEffect(() => {
    async function fetchCar() {
      if (!selectedCarId) {
        setLoading(false)
        return
      }
      try {
        setLoading(true)
        const result = await carsApi.get(selectedCarId)
        const carData = (result.data || result) as CarData
        const photos = parseJsonField(carData.photos)
        const features = parseJsonField(carData.features)
        const requiredDocs = carData.requiredDocs
          ? parseJsonField(carData.requiredDocs)
          : DEFAULT_REQUIRED_DOCS

        setCar({
          ...carData,
          photos,
          features,
          requiredDocs,
        } as ParsedCarData)
      } catch {
        setCar(null)
      } finally {
        setLoading(false)
      }
    }
    fetchCar()
  }, [selectedCarId])

  // Pre-fill form from user data
  useEffect(() => {
    if (user) {
      setFullName(user.name || '')
      setPhoneNumber(user.phone || '')
      setEmail(user.email || '')
    }
  }, [user])

  // ===== ENQUIRY STATUS POLLING =====

  const pollEnquiryStatus = useCallback(async () => {
    if (!enquiryId) return
    try {
      const result = await continueLoanApi.get(enquiryId)
      const data = result.data as { status?: string } | undefined
      if (data?.status) {
        setEnquiryStatus(data.status)
        // Auto-advance phase based on status
        if (data.status === 'ownerReview' || data.status === 'documents') {
          setPhase('documents')
        } else if (data.status === 'agreement' || data.status === 'depositPaid') {
          setPhase('agreement')
        } else if (data.status === 'completed' || data.status === 'handover') {
          setPhase('submitted')
        }
      }
    } catch {
      // Silently fail — can retry
    }
  }, [enquiryId])

  useEffect(() => {
    if (!enquiryId || phase === 'submitted') return
    const interval = setInterval(pollEnquiryStatus, 15000)
    return () => clearInterval(interval)
  }, [enquiryId, phase, pollEnquiryStatus])

  // ===== SUBMIT ENQUIRY =====

  const handleSubmit = async () => {
    if (!isFormValid) return
    setSubmitting(true)
    setError('')
    try {
      const result = await continueLoanApi.create({
        carId: selectedCarId,
        userId: user?.id,
        fullName,
        icNumber,
        phoneNumber,
        email,
        monthlyIncome: parseFloat(monthlyIncome) || 0,
        employer,
        message,
      })
      const newEnquiryId = (result.data as { id?: string } | undefined)?.id || (result as { id?: string }).id
      if (newEnquiryId) {
        setEnquiryId(newEnquiryId)
        setPhase('documents')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to submit enquiry'
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  // ===== DOCUMENT UPLOAD =====

  const handleDocUpload = (key: string) => {
    const input = fileInputRefs.current[key]
    if (!input) return
    input.click()
  }

  const handleFileChange = async (key: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !enquiryId) return

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setError(`File size must be under ${MAX_FILE_SIZE_MB}MB`)
      return
    }

    try {
      setError('')
      const uploadResult = await uploadApi.upload(file)
      // Map key to API field name
      const fieldMap: Record<string, string> = {
        customerIc: 'customerIcUrl',
        drivingLicense: 'drivingLicenseUrl',
        policeReport: 'policeReportUrl',
        payslip: 'payslipUrl',
        bankStatement: 'bankStatementUrl',
      }
      await continueLoanApi.update(enquiryId, {
        [fieldMap[key] || `${key}Url`]: uploadResult.url,
      })
      setUploadedFiles((prev) => ({
        ...prev,
        [key]: { uploaded: true, url: uploadResult.url },
      }))
    } catch {
      setError('Failed to upload document. Please try again.')
    }
  }

  // ===== ADVANCE TO AGREEMENT =====

  const handleProceedToAgreement = () => {
    if (allDocsUploaded) {
      setPhase('agreement')
    }
  }

  // ===== CONFIRM AGREEMENT =====

  const handleConfirmAgreement = async () => {
    if (!enquiryId || !termsAccepted) return
    setSubmitting(true)
    setError('')
    try {
      await continueLoanApi.update(enquiryId, {
        status: 'agreement',
        agreementAccepted: true,
      })
      setEnquiryStatus('agreement')
      setPhase('submitted')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to confirm agreement'
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  // ===== LOADING STATE =====

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <LoadingState message="Loading vehicle details..." />
      </div>
    )
  }

  // ===== NO CAR STATE =====

  if (!car) {
    return (
      <div className="min-h-screen bg-background">
        <EmptyState
          icon={<Car className="size-12" />}
          title="Vehicle not found"
          description="The vehicle you are looking for could not be found. Please go back and try again."
          action={
            <Button variant="outline" onClick={goBack} className="gap-2">
              <ArrowLeft className="size-4" />
              Go Back
            </Button>
          }
        />
      </div>
    )
  }

  const photos = car.photos || []
  const currentStepIndex = CONTINUE_LOAN_STEPS.findIndex(
    (s) => s.key === enquiryStatus
  )

  // ===== RENDER: DOCUMENT UPLOAD TILE =====

  const renderDocUploadTile = (
    key: string,
    label: string,
    required: boolean
  ) => {
    const isUploaded = uploadedFiles[key]?.uploaded
    return (
      <div key={key} className="space-y-2">
        <Label className="text-foreground text-body-sm">
          {label} {required && <span className="text-destructive">*</span>}
        </Label>
        <div
          role="button"
          tabIndex={0}
          onClick={() => handleDocUpload(key)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleDocUpload(key) }}
          className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
            isUploaded
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
          {isUploaded ? (
            <div className="flex items-center justify-center gap-2">
              <CheckCircle className="size-5 text-gold" />
              <span className="text-body-sm text-gold font-medium">Uploaded</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <Upload className="size-5 text-muted-foreground" />
              <span className="text-body-sm text-muted-foreground">Click to upload</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ===== RENDER =====

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto max-w-3xl px-4 py-3 sm:px-6 flex items-center gap-3">
          <Button variant="ghost" onClick={goBack} className="gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" />
            Back
          </Button>
          <div className="flex-1">
            <h1 className="heading-sm text-foreground">Submit Enquiry</h1>
            <p className="text-caption text-muted-foreground">Sambung Bayar — Continue Loan</p>
          </div>
          <StatusBadge status={enquiryStatus} />
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 space-y-6">
        {/* Vehicle summary */}
        <Card className="border-gold/20 bg-gold/5 overflow-hidden">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="size-16 shrink-0 rounded-lg overflow-hidden bg-muted">
              {photos.length > 0 ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photos[0]}
                  alt={`${car.brand} ${car.model}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Car className="size-6 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-foreground gold-shimmer">
                {car.brand} {car.model}
              </h2>
              <p className="text-caption text-muted-foreground">
                {car.year} · {car.color || 'N/A'} · {formatMileage(car.mileage || 0)}
              </p>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-body-sm font-semibold text-gold">
                  {formatPrice(car.monthlyInstallment || 0)}/mo
                </span>
                {car.remainingMonths && (
                  <span className="text-caption text-muted-foreground">
                    {car.remainingMonths} months left
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Marketplace Disclaimer */}
        <div className="rounded-xl border border-warning/40 bg-warning/5 p-4 flex items-start gap-3">
          <div className="flex size-8 items-center justify-center rounded-full bg-warning/15 shrink-0 mt-0.5">
            <AlertTriangle className="size-4 text-warning" />
          </div>
          <div>
            <p className="text-body-sm font-semibold text-warning">Marketplace Notice</p>
            <p className="text-caption text-muted-foreground mt-0.5">
              DK Vroom acts as a marketplace platform only. All transactions are between the vehicle owner and the buyer.
              DK Vroom does not guarantee or assume responsibility for the condition, legality, or completion of any transaction.
            </p>
          </div>
        </div>

        {/* Process Flow */}
        <Card className="border-border bg-card overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-foreground flex items-center gap-2 text-base">
              <Handshake className="size-5 text-gold" />
              What Happens Next
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {CONTINUE_LOAN_STEPS.map((item, idx) => {
                const isCompleted = idx < currentStepIndex || phase === 'submitted'
                const isCurrent = idx === currentStepIndex && phase !== 'submitted'
                return (
                  <div key={item.step} className="flex items-start gap-3">
                    <div className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      isCompleted
                        ? 'bg-gold/20 text-gold'
                        : isCurrent
                          ? 'bg-gold/10 text-gold ring-1 ring-gold/40'
                          : 'bg-secondary text-muted-foreground'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle2 className="size-4" />
                      ) : (
                        item.step
                      )}
                    </div>
                    <div>
                      <p className={`text-body-sm font-medium ${
                        isCompleted ? 'text-foreground' : isCurrent ? 'text-gold' : 'text-muted-foreground'
                      }`}>
                        {item.label}
                      </p>
                      <p className="text-caption text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* ===== PHASE: FORM ===== */}
        {phase === 'form' && (
          <Card className="border-border bg-card overflow-hidden">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2 text-base">
                <User className="size-5 text-gold" />
                Your Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-foreground text-body-sm">Full Name *</Label>
                  <Input
                    placeholder="Enter your full name"
                    className="bg-secondary/50 border-border"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground text-body-sm">IC / MyKad Number *</Label>
                  <Input
                    placeholder="e.g. 901234-10-5678"
                    className="bg-secondary/50 border-border"
                    value={icNumber}
                    onChange={(e) => setIcNumber(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground text-body-sm">Phone Number *</Label>
                  <Input
                    placeholder="e.g. 012-345 6789"
                    className="bg-secondary/50 border-border"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground text-body-sm">Email Address *</Label>
                  <Input
                    placeholder="you@email.com"
                    className="bg-secondary/50 border-border"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground text-body-sm">Monthly Income *</Label>
                  <Input
                    placeholder="e.g. 5000"
                    className="bg-secondary/50 border-border"
                    type="number"
                    value={monthlyIncome}
                    onChange={(e) => setMonthlyIncome(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground text-body-sm">Employer *</Label>
                  <Input
                    placeholder="Company name"
                    className="bg-secondary/50 border-border"
                    value={employer}
                    onChange={(e) => setEmployer(e.target.value)}
                  />
                </div>
              </div>

              <Separator className="bg-border/50" />

              <div className="space-y-2">
                <Label className="text-foreground text-body-sm">Message to Owner (Optional)</Label>
                <Input
                  placeholder="Tell the owner why you're interested and any questions you may have..."
                  className="bg-secondary/50 border-border"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-foreground text-body-sm">Required Documents</Label>
                <div className="space-y-1.5">
                  {(car.requiredDocs || DEFAULT_REQUIRED_DOCS).map((doc: string, index: number) => (
                    <div key={index} className="flex items-center gap-2 text-caption text-muted-foreground">
                      <FileText className="size-3 text-gold shrink-0" />
                      {doc}
                    </div>
                  ))}
                </div>
                <p className="text-caption text-gold/70 mt-2">
                  Documents will be requested after the owner accepts your enquiry.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ===== PHASE: DOCUMENTS ===== */}
        {phase === 'documents' && (
          <Card className="border-border bg-card overflow-hidden">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2 text-base">
                <FileText className="size-5 text-gold" />
                Upload Documents
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-body-sm text-muted-foreground">
                Please upload the following documents to proceed with your enquiry. 
                Only PDF, JPG, and PNG files are accepted (max {MAX_FILE_SIZE_MB}MB each).
              </p>

              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <p className="text-body-sm text-destructive">{error}</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {CONTINUE_LOAN_DOCUMENTS.map((doc) =>
                  renderDocUploadTile(doc.key, doc.label, doc.required)
                )}
              </div>

              {/* Upload Progress */}
              <div className="p-4 rounded-lg bg-secondary border border-border">
                <p className="text-body-sm font-medium text-foreground mb-2">Upload Progress</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 rounded-full bg-border overflow-hidden">
                    <div
                      className="h-full bg-gold rounded-full transition-all duration-300"
                      style={{
                        width: `${(Object.values(uploadedFiles).filter((f) => f.uploaded).length / CONTINUE_LOAN_DOCUMENTS.length) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-caption text-muted-foreground shrink-0">
                    {Object.values(uploadedFiles).filter((f) => f.uploaded).length}/{CONTINUE_LOAN_DOCUMENTS.length}
                  </span>
                </div>
              </div>

              <Button
                onClick={handleProceedToAgreement}
                disabled={!allDocsUploaded}
                className="w-full bg-gold text-gold-dark hover:bg-gold-light font-semibold h-12 text-base gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ShieldCheck className="size-5" />
                Proceed to Agreement
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ===== PHASE: AGREEMENT ===== */}
        {phase === 'agreement' && (
          <Card className="border-border bg-card overflow-hidden">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2 text-base">
                <ShieldCheck className="size-5 text-gold" />
                Agreement
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-secondary border border-border space-y-3">
                <h3 className="text-body-sm font-semibold text-foreground">
                  Sambung Bayar Agreement Terms
                </h3>
                <ul className="space-y-2 text-caption text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="size-4 text-gold shrink-0 mt-0.5" />
                    I understand this is a vehicle takeover from the current owner, not a new bank loan.
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="size-4 text-gold shrink-0 mt-0.5" />
                    I will take over the remaining monthly installments of{' '}
                    <span className="text-gold font-medium">
                      {formatPrice(car.monthlyInstallment || 0)}/mo
                    </span>{' '}
                    for the remaining{' '}
                    <span className="text-gold font-medium">{car.remainingMonths} months</span>.
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="size-4 text-gold shrink-0 mt-0.5" />
                    I will pay the takeover deposit as agreed between both parties.
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="size-4 text-gold shrink-0 mt-0.5" />
                    I understand DK Vroom facilitates the process but is not party to the transaction.
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="size-4 text-gold shrink-0 mt-0.5" />
                    I agree to the ownership transfer process upon completion of the handover.
                  </li>
                </ul>
              </div>

              {/* Vehicle Details Confirmation */}
              <div className="p-4 rounded-lg bg-gold/5 border border-gold/20">
                <h3 className="text-body-sm font-semibold text-gold mb-2">Vehicle Details</h3>
                <div className="grid grid-cols-2 gap-3 text-caption">
                  <div>
                    <p className="text-muted-foreground">Vehicle</p>
                    <p className="text-foreground font-medium">{car.brand} {car.model} ({car.year})</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Monthly Installment</p>
                    <p className="text-gold font-medium">{formatPrice(car.monthlyInstallment || 0)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Remaining Months</p>
                    <p className="text-foreground font-medium">{car.remainingMonths || 'N/A'}</p>
                  </div>
                  {car.remainingBalance && (
                    <div>
                      <p className="text-muted-foreground">Remaining Balance</p>
                      <p className="text-foreground font-medium">{formatPrice(car.remainingBalance)}</p>
                    </div>
                  )}
                  {car.takeoverAmount && (
                    <div>
                      <p className="text-muted-foreground">Takeover Amount</p>
                      <p className="text-gold font-medium">{formatPrice(car.takeoverAmount)}</p>
                    </div>
                  )}
                  {car.bankName && (
                    <div>
                      <p className="text-muted-foreground">Current Bank</p>
                      <p className="text-foreground font-medium">{car.bankName}</p>
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <p className="text-body-sm text-destructive">{error}</p>
                </div>
              )}

              {/* Terms checkbox */}
              <div className="flex items-start gap-3 p-4 rounded-lg bg-secondary border border-border">
                <Checkbox
                  id="cl-terms"
                  checked={termsAccepted}
                  onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                  className="mt-0.5 data-[state=checked]:bg-gold data-[state=checked]:border-gold"
                />
                <label htmlFor="cl-terms" className="text-caption text-muted-foreground leading-relaxed cursor-pointer">
                  I have read, understood, and agree to the Sambung Bayar terms and conditions. 
                  I acknowledge that this is a vehicle takeover arrangement and I am responsible for 
                  the remaining loan obligations. I agree to DK Vroom&apos;s{' '}
                  <span className="text-gold underline">Terms of Service</span> and{' '}
                  <span className="text-gold underline">Privacy Policy</span>.
                </label>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  onClick={() => setPhase('documents')}
                  className="border-border text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="size-4 mr-1" />
                  Back to Documents
                </Button>
                <Button
                  onClick={handleConfirmAgreement}
                  disabled={!termsAccepted || submitting}
                  className="flex-1 bg-gold text-gold-dark hover:bg-gold-light font-semibold h-12 gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <Loader2 className="size-5 animate-spin" />
                  ) : (
                    <KeyRound className="size-5" />
                  )}
                  {submitting ? 'Confirming...' : 'Confirm & Accept Agreement'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ===== PHASE: SUBMITTED ===== */}
        {phase === 'submitted' && (
          <Card className="border-border bg-card overflow-hidden">
            <CardContent className="p-8 text-center space-y-4">
              <div className="size-16 rounded-full bg-gold/10 flex items-center justify-center mx-auto">
                <CheckCircle className="size-8 text-gold" />
              </div>
              <h2 className="heading-md text-foreground">
                {enquiryStatus === 'completed' ? 'Transfer Complete!' : 'Enquiry Submitted!'}
              </h2>
              <p className="text-body-sm text-muted-foreground max-w-md mx-auto">
                {enquiryStatus === 'completed'
                  ? 'The vehicle ownership transfer has been completed. Congratulations on your new vehicle!'
                  : `Your interest in the ${car.brand} ${car.model} has been submitted to the vehicle owner. 
                     You will be notified once the owner reviews your enquiry.`}
              </p>

              {/* Status Progression */}
              <div className="pt-4 border-t border-border">
                <p className="text-overline text-muted-foreground mb-4">Progress</p>
                <div className="flex items-start justify-between gap-1 max-w-md mx-auto">
                  {CONTINUE_LOAN_STEPS.map((step, idx) => {
                    const isCompleted = idx <= currentStepIndex || enquiryStatus === 'completed'
                    const isCurrent = idx === currentStepIndex && enquiryStatus !== 'completed'
                    return (
                      <div key={step.step} className="flex flex-col items-center text-center flex-1 min-w-0">
                        {getStepIcon(isCompleted, isCurrent)}
                        <p className={`text-caption mt-1 ${
                          isCompleted ? 'text-foreground font-medium' : 'text-muted-foreground'
                        }`}>
                          {step.label}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4 justify-center">
                <Button onClick={() => navigate('continueLoan')} className="gap-2 bg-gold hover:bg-gold-light text-gold-dark">
                  <Car className="size-4" />
                  Browse More Vehicles
                </Button>
                <Button variant="outline" onClick={goBack} className="gap-2 border-border">
                  <ArrowLeft className="size-4" />
                  Go Back
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submit Button (form phase only) */}
        {phase === 'form' && (
          <div className="flex flex-col gap-3">
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-body-sm text-destructive">{error}</p>
              </div>
            )}
            <Button
              className="w-full bg-gold text-gold-dark hover:bg-gold-light font-semibold h-12 text-base gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              disabled={submitting || !isFormValid}
              onClick={handleSubmit}
            >
              {submitting ? <Loader2 className="size-5 animate-spin" /> : <Send className="size-5" />}
              Submit Enquiry
            </Button>
            <p className="text-center text-caption text-muted-foreground">
              By submitting, you agree to DK Vroom&apos;s terms and conditions.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
