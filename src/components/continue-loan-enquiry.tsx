'use client'

import { useAppStore } from '@/lib/store'
import { sampleCars } from '@/lib/mock-data'
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
} from 'lucide-react'

export default function ContinueLoanEnquiry() {
  const { selectedCarId, goBack, navigate } = useAppStore()

  const car = sampleCars.find((c) => c.id === selectedCarId)

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
              <img
                src={car.photos[0]}
                alt={`${car.brand} ${car.model}`}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-foreground gold-shimmer">{car.brand} {car.model}</h2>
              <p className="text-xs text-muted-foreground">{car.year} · {car.color} · {formatMileage(car.mileage)}</p>
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
                <Input placeholder="Enter your full name" className="bg-muted/50 border-border" />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground text-sm">IC / MyKad Number *</Label>
                <Input placeholder="e.g. 901234-10-5678" className="bg-muted/50 border-border" />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground text-sm">Phone Number *</Label>
                <Input placeholder="e.g. 012-345 6789" className="bg-muted/50 border-border" />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground text-sm">Email Address *</Label>
                <Input placeholder="you@email.com" className="bg-muted/50 border-border" type="email" />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground text-sm">Monthly Income *</Label>
                <Input placeholder="e.g. 5000" className="bg-muted/50 border-border" type="number" />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground text-sm">Employer *</Label>
                <Input placeholder="Company name" className="bg-muted/50 border-border" />
              </div>
            </div>

            <Separator className="bg-border/50" />

            <div className="space-y-2">
              <Label className="text-foreground text-sm">Message to Owner (Optional)</Label>
              <Input
                placeholder="Tell the owner why you're interested and any questions you may have..."
                className="bg-muted/50 border-border"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-foreground text-sm">Required Documents</Label>
              <div className="space-y-1.5">
                {car.requiredDocs?.map((doc, index) => (
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
            onClick={() => {
              // For demo, navigate back to car detail
              navigate('carDetail')
            }}
          >
            <Send className="size-5" />
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

function formatPrice(amount: number): string {
  return `RM ${amount.toLocaleString('en-MY')}`
}

function formatMileage(km: number): string {
  return `${km.toLocaleString('en-MY')} km`
}
