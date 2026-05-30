'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { continueLoanApi, carsApi, uploadApi } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
} from 'lucide-react'

function formatPrice(amount: number): string {
  return `RM ${amount.toLocaleString('en-MY')}`
}

function formatMileage(km: number): string {
  return `${km.toLocaleString('en-MY')} km`
}

// Helper to parse JSON strings from API
function parseJsonField(value: any): any[] {
  if (typeof value === 'string') {
    try { return JSON.parse(value) } catch { return [] }
  }
  return Array.isArray(value) ? value : []
}

export default function ContinueLoanEnquiry() {
  const { selectedCarId, goBack, navigate, user } = useAppStore()
  const [car, setCar] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [enquiryId, setEnquiryId] = useState<string | null>(null)

  // Form fields
  const [fullName, setFullName] = useState('')
  const [icNumber, setIcNumber] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [email, setEmail] = useState('')
  const [monthlyIncome, setMonthlyIncome] = useState('')
  const [employer, setEmployer] = useState('')
  const [message, setMessage] = useState('')

  // Fetch car data from API
  useEffect(() => {
    async function fetchCar() {
      if (!selectedCarId) {
        setLoading(false)
        return
      }
      try {
        setLoading(true)
        const result = await carsApi.get(selectedCarId)
        const carData = result.data || result
        // Parse JSON fields
        const photos = parseJsonField(carData.photos)
        const features = parseJsonField(carData.features)
        const requiredDocs = carData.requiredDocs ? parseJsonField(carData.requiredDocs) : ['IC (MyKad)', '3 months payslip', 'Bank statement (3 months)', 'EPF statement', 'Utility bill', 'Driving license']
        setCar({ ...carData, photos, features, requiredDocs })
      } catch (e) {
        console.error('Failed to fetch car:', e)
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

  const handleSubmit = async () => {
    try {
      setSubmitting(true)
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
      const newEnquiryId = result.data?.id || result.id
      setEnquiryId(newEnquiryId)
      setSubmitted(true)
    } catch (e) {
      console.error('Failed to submit enquiry:', e)
    } finally {
      setSubmitting(false)
    }
  }

  const handleFileUpload = async (file: File) => {
    if (!enquiryId) return
    try {
      const uploadResult = await uploadApi.upload(file)
      await continueLoanApi.update(enquiryId, {
        customerIcUrl: uploadResult.url,
      })
    } catch (e) {
      console.error('Failed to upload document:', e)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Loader2 className="size-12 text-muted-foreground animate-spin" />
        <h2 className="text-xl font-semibold">Loading vehicle details...</h2>
      </div>
    )
  }

  if (!car) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Car className="size-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Vehicle not found</h2>
        <Button variant="outline" onClick={goBack} className="gap-2">
          <ArrowLeft className="size-4" />
          Go Back
        </Button>
      </div>
    )
  }

  const photos = car.photos || []
  const requiredDocs = car.requiredDocs || ['IC (MyKad)', '3 months payslip', 'Bank statement (3 months)', 'EPF statement', 'Utility bill', 'Driving license']

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-4">
        <div className="size-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
          <CheckCircle className="size-8 text-emerald-500" />
        </div>
        <h2 className="text-xl font-semibold">Enquiry Submitted!</h2>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          Your interest in the {car.brand} {car.model} has been submitted to the vehicle owner. 
          You will be notified once the owner reviews your enquiry.
        </p>
        <div className="flex gap-3 mt-4">
          <Button onClick={() => navigate('continueLoan')} className="gap-2">
            Browse More Vehicles
          </Button>
          <Button variant="outline" onClick={goBack} className="gap-2">
            <ArrowLeft className="size-4" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto max-w-3xl px-4 py-3 sm:px-6 flex items-center gap-3">
          <Button variant="ghost" onClick={goBack} className="gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" />
            Back
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-foreground">Submit Enquiry</h1>
            <p className="text-xs text-muted-foreground">Sambung Bayar — Continue Loan</p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 space-y-6">
        {/* Vehicle summary */}
        <Card className="border-gold/20 bg-gold/5 overflow-hidden">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="size-16 shrink-0 rounded-lg overflow-hidden bg-muted">
              {photos.length > 0 ? (
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
              <h2 className="font-bold text-foreground gold-shimmer">{car.brand} {car.model}</h2>
              <p className="text-xs text-muted-foreground">{car.year} · {car.color} · {formatMileage(car.mileage || 0)}</p>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-sm font-semibold text-gold">{formatPrice(car.monthlyInstallment || 0)}/mo</span>
                <span className="text-xs text-muted-foreground">{car.remainingMonths} months left</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Marketplace Disclaimer */}
        <div className="rounded-xl border border-amber-600/40 bg-amber-600/5 p-4 flex items-start gap-3">
          <div className="flex size-8 items-center justify-center rounded-full bg-amber-600/15 shrink-0 mt-0.5">
            <AlertTriangle className="size-4 text-amber-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-amber-500">Marketplace Notice</p>
            <p className="text-xs text-amber-500/70 mt-0.5">
              DK Vroom acts as a marketplace platform only. All transactions are between the vehicle owner and the buyer. DK Vroom does not guarantee or assume responsibility for the condition, legality, or completion of any transaction.
            </p>
          </div>
        </div>

        {/* Process flow reminder */}
        <Card className="border-border bg-card overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-foreground flex items-center gap-2 text-base">
              <Handshake className="size-5 text-gold" />
              What Happens Next
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { step: 1, label: 'Enquiry Submitted', desc: 'Your interest is sent to the vehicle owner' },
                { step: 2, label: 'Owner Review', desc: 'Owner reviews your profile and documents' },
                { step: 3, label: 'Agreement', desc: 'Both parties agree on terms and conditions' },
                { step: 4, label: 'Deposit Payment', desc: 'You pay the takeover deposit to secure the vehicle' },
                { step: 5, label: 'Vehicle Handover', desc: 'Physical handover and inspection' },
                { step: 6, label: 'Documents Upload', desc: 'Legal documents submitted for verification' },
                { step: 7, label: 'Admin Verification', desc: 'DK Vroom verifies all documents and ownership transfer' },
              ].map((item) => (
                <div key={item.step} className="flex items-start gap-3">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-gold/10 text-gold text-xs font-bold">
                    {item.step}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Enquiry Form */}
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
                <Label className="text-foreground text-sm">Full Name *</Label>
                <Input 
                  placeholder="Enter your full name" 
                  className="bg-muted/50 border-border" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground text-sm">IC / MyKad Number *</Label>
                <Input 
                  placeholder="e.g. 901234-10-5678" 
                  className="bg-muted/50 border-border"
                  value={icNumber}
                  onChange={(e) => setIcNumber(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground text-sm">Phone Number *</Label>
                <Input 
                  placeholder="e.g. 012-345 6789" 
                  className="bg-muted/50 border-border"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground text-sm">Email Address *</Label>
                <Input 
                  placeholder="you@email.com" 
                  className="bg-muted/50 border-border" 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground text-sm">Monthly Income *</Label>
                <Input 
                  placeholder="e.g. 5000" 
                  className="bg-muted/50 border-border" 
                  type="number"
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground text-sm">Employer *</Label>
                <Input 
                  placeholder="Company name" 
                  className="bg-muted/50 border-border"
                  value={employer}
                  onChange={(e) => setEmployer(e.target.value)}
                />
              </div>
            </div>

            <Separator className="bg-border/50" />

            <div className="space-y-2">
              <Label className="text-foreground text-sm">Message to Owner (Optional)</Label>
              <Input
                placeholder="Tell the owner why you're interested and any questions you may have..."
                className="bg-muted/50 border-border"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-foreground text-sm">Required Documents</Label>
              <div className="space-y-1.5">
                {requiredDocs.map((doc: string, index: number) => (
                  <div key={index} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <FileText className="size-3 text-gold shrink-0" />
                    {doc}
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-gold/70 mt-2">
                Documents will be requested after the owner accepts your enquiry.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex flex-col gap-3">
          <Button
            className="w-full bg-gold text-gold-dark hover:bg-gold-light font-semibold h-12 text-base gap-2"
            disabled={submitting || !fullName || !icNumber || !phoneNumber || !email}
            onClick={handleSubmit}
          >
            {submitting ? <Loader2 className="size-5 animate-spin" /> : <Send className="size-5" />}
            Submit Enquiry
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            By submitting, you agree to DK Vroom&apos;s terms and conditions.
          </p>
        </div>
      </div>
    </div>
  )
}
