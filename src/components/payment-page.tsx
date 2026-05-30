'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
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
} from 'lucide-react'

export default function PaymentPage() {
  const { booking, goBack, uploadReceipt, verifyPayment, navigate } = useAppStore()
  const [receiptFile, setReceiptFile] = useState<string | null>(null)
  const [uploaded, setUploaded] = useState(booking.receiptUploaded)
  const [copied, setCopied] = useState(false)

  const qrValue = `https://dkvroom.com/pay?ref=${booking.bookingId || 'DEMO'}&amount=${booking.amount}`

  const handleUpload = () => {
    setReceiptFile('receipt_uploaded_' + Date.now() + '.jpg')
    setUploaded(true)
    uploadReceipt()
  }

  const handleCopyRef = () => {
    navigator.clipboard?.writeText(booking.bookingId || '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getStatusStep = () => {
    if (booking.paymentStatus === 'verified') return 4
    if (booking.paymentStatus === 'uploaded' || uploaded) return 3
    if (booking.paymentStatus === 'pending') return 2
    return 1
  }

  const currentStep = getStatusStep()

  const steps = [
    { label: 'Booking Submitted', icon: FileText },
    { label: 'Payment QR Generated', icon: QrCode },
    { label: 'Receipt Uploaded', icon: Upload },
    { label: 'Admin Verification', icon: Shield },
    { label: 'Confirmed', icon: CheckCircle },
  ]

  const getBookingLabel = () => {
    switch (booking.bookingType) {
      case 'rent': return 'Rental Booking'
      case 'sale': return 'Vehicle Enquiry'
      case 'continueLoan': return 'Continue Loan Enquiry'
      case 'auction': return 'Auction Bid Deposit'
      case 'insurance': return 'Insurance Payment'
      case 'workshop': return 'Workshop Appointment'
      default: return 'Booking'
    }
  }

  // If payment is verified, show confirmed state with unlocked contacts
  if (booking.contactUnlocked) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-[#f5f0e8]">
        <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
          {/* Back button */}
          <Button variant="ghost" onClick={() => navigate('home')} className="gap-2 text-[#8a8578] hover:text-[#c9a84c] mb-6">
            <ArrowLeft className="size-4" />
            Back to Home
          </Button>

          {/* Verified Banner */}
          <Card className="bg-emerald-500/10 border-emerald-500/30 mb-6">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="size-8 text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold text-emerald-400 mb-2">Payment Verified!</h2>
              <p className="text-[#8a8578]">Your booking has been confirmed. Dealer contact details are now unlocked.</p>
              <Badge className="mt-3 bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                Booking Confirmed
              </Badge>
            </CardContent>
          </Card>

          {/* Unlocked Contact Details */}
          <Card className="bg-[#111111] border-[#2a2a2a] mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#c9a84c]">
                <Lock className="size-5" />
                Contact Details Unlocked
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-[#0a0a0a]">
                <Phone className="size-5 text-green-400" />
                <div>
                  <p className="text-xs text-[#8a8578]">Dealer Phone</p>
                  <p className="font-medium text-[#f5f0e8]">+60 12-345 6789</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-[#0a0a0a]">
                <MessageCircle className="size-5 text-green-400" />
                <div>
                  <p className="text-xs text-[#8a8578]">WhatsApp</p>
                  <p className="font-medium text-[#f5f0e8]">+60 12-345 6789</p>
                </div>
              </div>
              <Button className="w-full bg-green-600 hover:bg-green-700 text-white gap-2 h-11">
                <MessageCircle className="size-5" />
                Chat on WhatsApp
              </Button>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-[#0a0a0a]">
                <MapPin className="size-5 text-[#c9a84c]" />
                <div>
                  <p className="text-xs text-[#8a8578]">Exact Location</p>
                  <p className="font-medium text-[#f5f0e8]">Lot 23, Jalan Ampang, KLCC, 50450 Kuala Lumpur</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={() => navigate('home')}
            className="w-full bg-[#c9a84c] hover:bg-[#b8963e] text-[#0a0a0a] font-semibold h-11"
          >
            Continue to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5f0e8]">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        {/* Back button */}
        <Button variant="ghost" onClick={goBack} className="gap-2 text-[#8a8578] hover:text-[#c9a84c] mb-6">
          <ArrowLeft className="size-4" />
          Back
        </Button>

        {/* Title */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold gold-text mb-2">Complete Your Payment</h1>
          <p className="text-[#8a8578]">Follow the steps below to complete your booking</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            {steps.map((step, index) => {
              const StepIcon = step.icon
              const isCompleted = index < currentStep
              const isCurrent = index === currentStep - 1
              return (
                <div key={step.label} className="flex flex-col items-center flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mb-1 transition-all ${
                    isCompleted
                      ? 'bg-[#c9a84c] text-[#0a0a0a]'
                      : isCurrent
                      ? 'bg-[#c9a84c]/20 text-[#c9a84c] border border-[#c9a84c]/50'
                      : 'bg-[#1a1a1a] text-[#8a8578] border border-[#2a2a2a]'
                  }`}>
                    {isCompleted ? <CheckCircle2 className="size-4" /> : index + 1}
                  </div>
                  <span className={`text-[9px] sm:text-[10px] text-center leading-tight ${
                    isCompleted ? 'text-[#c9a84c]' : isCurrent ? 'text-[#f5f0e8]' : 'text-[#8a8578]'
                  }`}>
                    {step.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Booking Summary */}
        <Card className="bg-[#111111] border-[#2a2a2a] mb-6">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-[#8a8578]">{getBookingLabel()}</span>
              <Badge className={
                booking.paymentStatus === 'verified'
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : booking.paymentStatus === 'uploaded'
                  ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                  : booking.paymentStatus === 'rejected'
                  ? 'bg-red-500/20 text-red-400 border-red-500/30'
                  : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
              }>
                {booking.paymentStatus === 'verified' ? 'Verified' :
                 booking.paymentStatus === 'uploaded' ? 'Under Review' :
                 booking.paymentStatus === 'rejected' ? 'Rejected' : 'Pending Payment'}
              </Badge>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[#8a8578]">Booking ID</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono font-medium text-[#f5f0e8]">{booking.bookingId || 'BK-DEMO'}</span>
                <button onClick={handleCopyRef} className="text-[#8a8578] hover:text-[#c9a84c]">
                  {copied ? <CheckCircle2 className="size-3.5 text-[#c9a84c]" /> : <Copy className="size-3.5" />}
                </button>
              </div>
            </div>
            <Separator className="bg-[#2a2a2a] my-3" />
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#8a8578]">Amount to Pay</span>
              <span className="text-2xl font-bold gold-text">RM {booking.amount.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        {/* QR Code Section */}
        <Card className="bg-[#111111] border-[#c9a84c]/30 mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg text-[#c9a84c]">
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
            <p className="text-sm text-[#8a8578] mb-4 text-center">Scan with your banking app or eWallet</p>

            {/* Payment Instructions */}
            <div className="w-full space-y-3">
              <div className="p-3 rounded-lg bg-[#0a0a0a] border border-[#2a2a2a]">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#c9a84c]/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-[#c9a84c]">1</span>
                  </div>
                  <p className="text-sm text-[#f5f0e8]">Open your banking app, DuitNow, TNG, or eWallet</p>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-[#0a0a0a] border border-[#2a2a2a]">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#c9a84c]/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-[#c9a84c]">2</span>
                  </div>
                  <p className="text-sm text-[#f5f0e8]">Scan the QR code and ensure the exact amount is <strong>RM {booking.amount.toLocaleString()}</strong></p>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-[#0a0a0a] border border-[#2a2a2a]">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#c9a84c]/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-[#c9a84c]">3</span>
                  </div>
                  <p className="text-sm text-[#f5f0e8]">Include Booking ID <strong className="text-[#c9a84c]">{booking.bookingId || 'BK-DEMO'}</strong> as payment reference</p>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-[#0a0a0a] border border-[#2a2a2a]">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#c9a84c]/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-[#c9a84c]">4</span>
                  </div>
                  <p className="text-sm text-[#f5f0e8]">Upload your payment receipt below</p>
                </div>
              </div>
            </div>

            {/* Supported Methods */}
            <div className="w-full mt-4">
              <p className="text-xs text-[#8a8578] mb-2">Supported Payment Methods:</p>
              <div className="flex flex-wrap gap-2">
                {['FPX', 'DuitNow', 'TNG eWallet', 'Boost', 'GrabPay', 'Maybank2U', 'CIMB Clicks'].map((method) => (
                  <Badge key={method} variant="outline" className="border-[#2a2a2a] text-[#8a8578] text-xs">
                    {method}
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
              <p className="text-sm font-medium text-yellow-400">Important</p>
              <p className="text-xs text-[#8a8578] mt-1">
                Do NOT close this page until you have uploaded your payment receipt. Your booking will remain pending until the receipt is verified by admin.
              </p>
            </div>
          </div>
        </div>

        {/* Receipt Upload Section */}
        <Card className="bg-[#111111] border-[#2a2a2a] mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg text-[#f5f0e8]">
              <Upload className="size-5 text-[#c9a84c]" />
              Upload Payment Receipt
            </CardTitle>
          </CardHeader>
          <CardContent>
            {uploaded ? (
              <div className="space-y-4">
                {/* Uploaded State */}
                <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-center">
                  <CheckCircle className="size-8 text-emerald-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-emerald-400">Receipt Uploaded Successfully</p>
                  <p className="text-xs text-[#8a8578] mt-1">
                    Uploaded at {new Date().toLocaleString('en-MY', { timeZone: 'Asia/Kuala_Lumpur' })}
                  </p>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-[#0a0a0a]">
                  <div className="w-12 h-12 rounded-lg bg-[#1a1a1a] flex items-center justify-center">
                    <FileText className="size-6 text-[#c9a84c]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#f5f0e8] truncate">{receiptFile || 'payment_receipt.jpg'}</p>
                    <p className="text-xs text-[#8a8578]">1.2 MB</p>
                  </div>
                  <CheckCircle2 className="size-5 text-emerald-400 shrink-0" />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Upload Area */}
                <button
                  onClick={handleUpload}
                  className="w-full p-8 rounded-xl border-2 border-dashed border-[#2a2a2a] hover:border-[#c9a84c]/50 bg-[#0a0a0a] transition-all group"
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-xl bg-[#c9a84c]/10 flex items-center justify-center group-hover:bg-[#c9a84c]/20 transition-colors">
                      <ImagePlus className="size-7 text-[#c9a84c]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#f5f0e8]">Click to upload or drag and drop</p>
                      <p className="text-xs text-[#8a8578] mt-1">JPG, PNG, PDF (max 5MB)</p>
                    </div>
                  </div>
                </button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Status Section */}
        <Card className="bg-[#111111] border-[#2a2a2a] mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg text-[#f5f0e8]">
              <Clock className="size-5 text-[#c9a84c]" />
              Payment Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {steps.map((step, index) => {
                const StepIcon = step.icon
                const isCompleted = index < currentStep
                const isCurrent = index === currentStep - 1
                return (
                  <div key={step.label} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      isCompleted
                        ? 'bg-[#c9a84c] text-[#0a0a0a]'
                        : isCurrent
                        ? 'bg-[#c9a84c]/20 border border-[#c9a84c]/50'
                        : 'bg-[#1a1a1a] border border-[#2a2a2a]'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle2 className="size-4" />
                      ) : (
                        <StepIcon className={`size-4 ${isCurrent ? 'text-[#c9a84c]' : 'text-[#8a8578]'}`} />
                      )}
                    </div>
                    <span className={`text-sm ${isCompleted ? 'text-[#f5f0e8]' : isCurrent ? 'text-[#c9a84c] font-medium' : 'text-[#8a8578]'}`}>
                      {step.label}
                    </span>
                    {isCompleted && <CheckCircle className="size-4 text-[#c9a84c] ml-auto" />}
                    {isCurrent && <span className="text-xs text-[#c9a84c] ml-auto">In Progress</span>}
                  </div>
                )
              })}
            </div>
            <Separator className="bg-[#2a2a2a] my-4" />
            <p className="text-xs text-[#8a8578]">
              Your payment will be verified by our admin team within 1-24 hours. You will receive a notification once confirmed.
            </p>
          </CardContent>
        </Card>

        {/* Demo: Verify Payment Button (for testing only) */}
        <div className="p-3 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-[#8a8578]">Demo Mode</p>
              <p className="text-[10px] text-[#8a8578]/60">Simulate admin verifying payment</p>
            </div>
            <Button
              size="sm"
              onClick={verifyPayment}
              disabled={!uploaded}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs disabled:opacity-50"
            >
              <Shield className="size-3 mr-1" />
              Verify Payment
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
