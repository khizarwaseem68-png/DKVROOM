'use client'

import { useState, useRef } from 'react'
import { useAppStore } from '@/lib/store'
import { paymentsApi, uploadApi } from '@/lib/api'
import { formatPrice, PAYMENT_METHODS } from '@/lib/constants'
import { StatusBadge } from '@/components/shared'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { QRCodeSVG } from 'qrcode.react'
import {
  ArrowLeft,
  QrCode,
  Upload,
  Clock,
  CheckCircle,
  AlertCircle,
  Shield,
  Phone,
  MessageCircle,
  MapPin,
  Lock,
  FileText,
  Copy,
  CheckCircle2,
  ImagePlus,
  X,
  Loader2,
} from 'lucide-react'

// ===== TYPES =====

interface PaymentStep {
  label: string
  icon: React.ComponentType<{ className?: string }>
}

// ===== CONSTANTS =====

const PAYMENT_STEPS: PaymentStep[] = [
  { label: 'Booking Submitted', icon: FileText },
  { label: 'Payment QR Generated', icon: QrCode },
  { label: 'Receipt Uploaded', icon: Upload },
  { label: 'Admin Verification', icon: Shield },
  { label: 'Confirmed', icon: CheckCircle },
]

// ===== HELPERS =====

function getBookingLabel(bookingType: string | null): string {
  switch (bookingType) {
    case 'rent': return 'Rental Booking'
    case 'sale': return 'Vehicle Enquiry'
    case 'continueLoan': return 'Continue Loan Enquiry'
    case 'auction': return 'Auction Bid Deposit'
    case 'insurance': return 'Insurance Payment'
    case 'workshop': return 'Workshop Appointment'
    default: return 'Booking'
  }
}

function getStatusStep(paymentStatus: string, receiptUploaded: boolean): number {
  if (paymentStatus === 'verified') return 4
  if (paymentStatus === 'uploaded' || receiptUploaded) return 3
  if (paymentStatus === 'pending') return 2
  return 1
}

// ===== SUB-COMPONENTS =====

function VerifiedView({ navigate }: { navigate: (view: 'home') => void }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <Button variant="ghost" onClick={() => navigate('home')} className="gap-2 text-muted-foreground hover:text-gold mb-6">
          <ArrowLeft className="size-4" />
          Back to Home
        </Button>

        {/* Verified Banner */}
        <Card className="bg-emerald-500/10 border-emerald-500/30 mb-6">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="size-8 text-emerald-400" />
            </div>
            <h2 className="heading-sm text-emerald-400 mb-2">Payment Verified!</h2>
            <p className="text-body-sm text-muted-foreground">Your booking has been confirmed. Dealer contact details are now unlocked.</p>
            <Badge className="mt-3 bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
              Booking Confirmed
            </Badge>
          </CardContent>
        </Card>

        {/* Unlocked Contact Details */}
        <Card className="bg-card border-border mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gold">
              <Lock className="size-5" />
              Contact Details Unlocked
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-background">
              <Phone className="size-5 text-emerald-400" />
              <div>
                <p className="text-caption text-muted-foreground">Dealer Phone</p>
                <p className="font-medium text-foreground">+60 12-345 6789</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-background">
              <MessageCircle className="size-5 text-emerald-400" />
              <div>
                <p className="text-caption text-muted-foreground">WhatsApp</p>
                <p className="font-medium text-foreground">+60 12-345 6789</p>
              </div>
            </div>
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2 h-11">
              <MessageCircle className="size-5" />
              Chat on WhatsApp
            </Button>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-background">
              <MapPin className="size-5 text-gold" />
              <div>
                <p className="text-caption text-muted-foreground">Exact Location</p>
                <p className="font-medium text-foreground">Lot 23, Jalan Ampang, KLCC, 50450 Kuala Lumpur</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button
          onClick={() => navigate('home')}
          className="w-full bg-gold hover:bg-gold-dark text-primary-foreground font-semibold h-11"
        >
          Continue to Dashboard
        </Button>
      </div>
    </div>
  )
}

function ProgressSteps({ steps, currentStep }: { steps: PaymentStep[]; currentStep: number }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep
          const isCurrent = index === currentStep - 1
          return (
            <div key={step.label} className="flex flex-col items-center flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mb-1 transition-all ${
                isCompleted
                  ? 'bg-gold text-primary-foreground'
                  : isCurrent
                  ? 'bg-gold/20 text-gold border border-gold/50'
                  : 'bg-secondary text-muted-foreground border border-border'
              }`}>
                {isCompleted ? <CheckCircle2 className="size-4" /> : index + 1}
              </div>
              <span className={`text-[9px] sm:text-[10px] text-center leading-tight ${
                isCompleted ? 'text-gold' : isCurrent ? 'text-foreground' : 'text-muted-foreground'
              }`}>
                {step.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ===== MAIN COMPONENT =====

export default function PaymentPage() {
  const { booking, goBack, uploadReceipt, verifyPayment, navigate, user } = useAppStore()
  const [uploaded, setUploaded] = useState(booking.receiptUploaded)
  const [copied, setCopied] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [receiptFileName, setReceiptFileName] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isAdmin = user?.role === 'admin'

  const qrValue = `https://dkvroom.com/pay?ref=${booking.bookingId || 'DEMO'}&amount=${booking.amount}`
  const currentStep = getStatusStep(booking.paymentStatus, uploaded)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setReceiptFile(file)
    setReceiptFileName(file.name)
    setUploadError(null)
  }

  const handleUpload = async () => {
    if (!receiptFile || !booking.paymentId) return

    setUploading(true)
    setUploadError(null)
    try {
      // Upload file first, then attach to payment
      await uploadApi.upload(receiptFile)
      await paymentsApi.uploadReceipt(booking.paymentId, receiptFile)
      setUploaded(true)
      uploadReceipt()
    } catch {
      setUploadError('Failed to upload receipt. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleCopyRef = () => {
    navigator.clipboard?.writeText(booking.bookingId || '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleAdminVerify = async () => {
    if (!booking.paymentId) return

    setVerifying(true)
    try {
      await paymentsApi.verify(booking.paymentId)
      verifyPayment()
    } catch {
      // Silently fail — admin can retry
    } finally {
      setVerifying(false)
    }
  }

  // ===== VERIFIED STATE =====
  if (booking.contactUnlocked) {
    return <VerifiedView navigate={navigate} />
  }

  // ===== PAYMENT FLOW =====
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        {/* Back button */}
        <Button variant="ghost" onClick={goBack} className="gap-2 text-muted-foreground hover:text-gold mb-6">
          <ArrowLeft className="size-4" />
          Back
        </Button>

        {/* Title */}
        <div className="mb-8">
          <h1 className="heading-md gold-text mb-2">Complete Your Payment</h1>
          <p className="text-body-sm text-muted-foreground">Follow the steps below to complete your booking</p>
        </div>

        {/* Progress Steps */}
        <ProgressSteps steps={PAYMENT_STEPS} currentStep={currentStep} />

        {/* Booking Summary */}
        <Card className="bg-card border-border mb-6">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-body-sm text-muted-foreground">{getBookingLabel(booking.bookingType)}</span>
              <StatusBadge status={booking.paymentStatus === 'none' ? 'pending' : booking.paymentStatus} />
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-caption text-muted-foreground">Booking ID</span>
              <div className="flex items-center gap-2">
                <span className="text-body-sm font-mono font-medium text-foreground">{booking.bookingId || 'BK-DEMO'}</span>
                <button onClick={handleCopyRef} className="text-muted-foreground hover:text-gold">
                  {copied ? <CheckCircle2 className="size-3.5 text-gold" /> : <Copy className="size-3.5" />}
                </button>
              </div>
            </div>
            <Separator className="bg-border my-3" />
            <div className="flex items-center justify-between">
              <span className="text-body-sm text-muted-foreground">Amount to Pay</span>
              <span className="text-2xl font-bold gold-text">{formatPrice(booking.amount)}</span>
            </div>
          </CardContent>
        </Card>

        {/* QR Code Section */}
        <Card className="bg-card border-gold/30 mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg text-gold">
              <QrCode className="size-5" />
              Payment QR Code
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            {/* QR Code */}
            <div className="p-4 rounded-xl bg-white mb-4">
              <QRCodeSVG
                value={qrValue}
                size={200}
                level="H"
                bgColor="#ffffff"
                fgColor="#0a0a0a"
              />
            </div>
            <p className="text-body-sm text-muted-foreground mb-4 text-center">Scan with your banking app or eWallet</p>

            {/* Payment Instructions */}
            <div className="w-full space-y-3">
              {[
                'Open your banking app, DuitNow, TNG, or eWallet',
                `Scan the QR code and ensure the exact amount is ${formatPrice(booking.amount)}`,
                `Include Booking ID ${booking.bookingId || 'BK-DEMO'} as payment reference`,
                'Upload your payment receipt below',
              ].map((instruction, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-background border border-border">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-gold/10 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-gold">{idx + 1}</span>
                    </div>
                    <p className="text-body-sm text-foreground">{instruction}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Supported Methods */}
            <div className="w-full mt-4">
              <p className="text-caption text-muted-foreground mb-2">Supported Payment Methods:</p>
              <div className="flex flex-wrap gap-2">
                {PAYMENT_METHODS.map((method) => (
                  <Badge key={method.key} variant="outline" className="border-border text-muted-foreground text-xs">
                    {method.label}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Warning Notice */}
        <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="size-5 text-yellow-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-body-sm font-medium text-yellow-400">Important</p>
              <p className="text-caption text-muted-foreground mt-1">
                Do NOT close this page until you have uploaded your payment receipt. Your booking will remain pending until the receipt is verified by admin.
              </p>
            </div>
          </div>
        </div>

        {/* Receipt Upload Section */}
        <Card className="bg-card border-border mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg text-foreground">
              <Upload className="size-5 text-gold" />
              Upload Payment Receipt
            </CardTitle>
          </CardHeader>
          <CardContent>
            {uploaded ? (
              <div className="space-y-4">
                {/* Uploaded State */}
                <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-center">
                  <CheckCircle className="size-8 text-emerald-400 mx-auto mb-2" />
                  <p className="text-body-sm font-medium text-emerald-400">Receipt Uploaded Successfully</p>
                  <p className="text-caption text-muted-foreground mt-1">
                    Uploaded at {new Date().toLocaleString('en-MY', { timeZone: 'Asia/Kuala_Lumpur' })}
                  </p>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-background">
                  <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center">
                    <FileText className="size-6 text-gold" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-body-sm font-medium text-foreground truncate">{receiptFileName || 'payment_receipt.jpg'}</p>
                    <p className="text-caption text-muted-foreground">{receiptFile ? `${(receiptFile.size / 1024).toFixed(1)} KB` : 'Receipt uploaded'}</p>
                  </div>
                  <CheckCircle2 className="size-5 text-emerald-400 shrink-0" />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  className="hidden"
                  onChange={handleFileSelect}
                />

                {receiptFile ? (
                  /* File selected, ready to upload */
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-background">
                      <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center">
                        <ImagePlus className="size-6 text-gold" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-body-sm font-medium text-foreground truncate">{receiptFileName}</p>
                        <p className="text-caption text-muted-foreground">{(receiptFile.size / 1024).toFixed(1)} KB</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-red-400"
                        onClick={() => {
                          setReceiptFile(null)
                          setReceiptFileName(null)
                        }}
                      >
                        <X className="size-4" />
                      </Button>
                    </div>

                    {uploadError && (
                      <p className="text-body-sm text-red-400">{uploadError}</p>
                    )}

                    <Button
                      className="w-full bg-gold hover:bg-gold-dark text-primary-foreground font-semibold h-11 gap-2"
                      onClick={handleUpload}
                      disabled={uploading}
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="size-4" />
                          Upload Receipt
                        </>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full text-muted-foreground hover:text-foreground text-body-sm"
                      onClick={() => {
                        setReceiptFile(null)
                        setReceiptFileName(null)
                        fileInputRef.current?.click()
                      }}
                    >
                      Choose a different file
                    </Button>
                  </div>
                ) : (
                  /* Upload Area */
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full p-8 rounded-xl border-2 border-dashed border-border hover:border-gold/50 bg-background transition-all group"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 rounded-xl bg-gold/10 flex items-center justify-center group-hover:bg-gold/20 transition-colors">
                        <ImagePlus className="size-7 text-gold" />
                      </div>
                      <div>
                        <p className="text-body-sm font-medium text-foreground">Click to upload or drag and drop</p>
                        <p className="text-caption text-muted-foreground mt-1">JPG, PNG, PDF (max 5MB)</p>
                      </div>
                    </div>
                  </button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Status Section */}
        <Card className="bg-card border-border mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg text-foreground">
              <Clock className="size-5 text-gold" />
              Payment Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {PAYMENT_STEPS.map((step, index) => {
                const StepIcon = step.icon
                const isCompleted = index < currentStep
                const isCurrent = index === currentStep - 1
                return (
                  <div key={step.label} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      isCompleted
                        ? 'bg-gold text-primary-foreground'
                        : isCurrent
                        ? 'bg-gold/20 border border-gold/50'
                        : 'bg-secondary border border-border'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle2 className="size-4" />
                      ) : (
                        <StepIcon className={`size-4 ${isCurrent ? 'text-gold' : 'text-muted-foreground'}`} />
                      )}
                    </div>
                    <span className={`text-body-sm ${isCompleted ? 'text-foreground' : isCurrent ? 'text-gold font-medium' : 'text-muted-foreground'}`}>
                      {step.label}
                    </span>
                    {isCompleted && <CheckCircle className="size-4 text-gold ml-auto" />}
                    {isCurrent && <span className="text-caption text-gold ml-auto">In Progress</span>}
                  </div>
                )
              })}
            </div>
            <Separator className="bg-border my-4" />
            <p className="text-caption text-muted-foreground">
              Your payment will be verified by our admin team within 1-24 hours. You will receive a notification once confirmed.
            </p>
          </CardContent>
        </Card>

        {/* Admin: Verify Payment Button */}
        {isAdmin && (
          <div className="p-3 rounded-lg bg-secondary border border-gold/30 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-caption font-medium text-gold">Admin Mode</p>
                <p className="text-[10px] text-muted-foreground/60">Verify this payment as admin</p>
              </div>
              <Button
                size="sm"
                onClick={handleAdminVerify}
                disabled={!uploaded || verifying}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs disabled:opacity-50 gap-1"
              >
                {verifying ? (
                  <>
                    <Loader2 className="size-3 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Shield className="size-3" />
                    Verify Payment
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
