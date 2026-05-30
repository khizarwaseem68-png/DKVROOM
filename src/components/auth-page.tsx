'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Car,
  Mail,
  Lock,
  User,
  Phone,
  Building2,
  ArrowRight,
  Eye,
  EyeOff,
  Shield,
  CheckCircle,
  Star,
  MapPin,
  CreditCard,
  FileText,
  Upload,
  MessageCircle,
  AlertCircle,
} from 'lucide-react'

function UploadBox({ label, uploaded, onUpload }: { label: string; uploaded: boolean; onUpload: () => void }) {
  return (
    <button
      onClick={onUpload}
      className={`w-full p-4 rounded-lg border-2 border-dashed transition-all text-left ${
        uploaded
          ? 'border-emerald-500/40 bg-emerald-500/5'
          : 'border-[#2a2a2a] bg-[#0a0a0a] hover:border-[#c9a84c]/50'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
          uploaded ? 'bg-emerald-500/10' : 'bg-[#1a1a1a]'
        }`}>
          {uploaded ? (
            <CheckCircle className="size-5 text-emerald-400" />
          ) : (
            <Upload className="size-5 text-[#8a8578]" />
          )}
        </div>
        <div>
          <p className={`text-sm font-medium ${uploaded ? 'text-emerald-400' : 'text-[#f5f0e8]'}`}>
            {uploaded ? 'Uploaded' : label}
          </p>
          <p className="text-xs text-[#8a8578]">JPG, PNG, PDF (max 5MB)</p>
        </div>
      </div>
    </button>
  )
}

export default function AuthPage() {
  const { navigate, login } = useAppStore()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [showPassword, setShowPassword] = useState(false)
  const [regRole, setRegRole] = useState<'customer' | 'dealer'>('customer')
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginRole, setLoginRole] = useState<'customer' | 'dealer' | 'admin'>('customer')
  const [custName, setCustName] = useState('')
  const [custPhone, setCustPhone] = useState('')
  const [custWhatsapp, setCustWhatsapp] = useState('')
  const [custEmail, setCustEmail] = useState('')
  const [custPassword, setCustPassword] = useState('')
  const [custAddress, setCustAddress] = useState('')
  const [custIC, setCustIC] = useState('')
  const [custLicense, setCustLicense] = useState('')
  const [custICUploaded, setCustICUploaded] = useState(false)
  const [custLicenseUploaded, setCustLicenseUploaded] = useState(false)
  const [custAgree, setCustAgree] = useState(false)
  const [dealBizName, setDealBizName] = useState('')
  const [dealType, setDealType] = useState('')
  const [dealContact, setDealContact] = useState('')
  const [dealPhone, setDealPhone] = useState('')
  const [dealWhatsapp, setDealWhatsapp] = useState('')
  const [dealEmail, setDealEmail] = useState('')
  const [dealPassword, setDealPassword] = useState('')
  const [dealAddress, setDealAddress] = useState('')
  const [dealRegNo, setDealRegNo] = useState('')
  const [dealDocUploaded, setDealDocUploaded] = useState(false)
  const [dealBankName, setDealBankName] = useState('')
  const [dealBankAcc, setDealBankAcc] = useState('')
  const [dealBankHolder, setDealBankHolder] = useState('')
  const [dealAgree, setDealAgree] = useState(false)

  const handleLogin = () => {
    if (!loginEmail) return
    login(loginRole, loginRole === 'admin' ? 'Admin User' : loginRole === 'dealer' ? 'Premium Dealer' : 'Ahmad Razak')
    if (loginRole === 'admin') navigate('adminDashboard')
    else if (loginRole === 'dealer') navigate('dealerDashboard')
    else navigate('home')
  }

  const handleRegister = () => {
    if (regRole === 'customer' && (!custName || !custEmail)) return
    if (regRole === 'dealer' && (!dealBizName || !dealEmail)) return
    login(regRole, regRole === 'dealer' ? dealBizName : custName)
    if (regRole === 'dealer') navigate('dealerDashboard')
    else navigate('home')
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4 py-12">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#c9a84c]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#c9a84c]/3 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-lg">
        <div className="text-center mb-8">
          <button onClick={() => navigate('home')} className="inline-flex items-center gap-2 mb-4">
            <div className="flex size-10 items-center justify-center rounded-lg border border-[#c9a84c]/30 bg-gradient-to-br from-[#c9a84c]/20 to-transparent">
              <Car className="size-5 text-[#c9a84c]" />
            </div>
            <span className="gold-text text-2xl font-bold tracking-wider">DK Vroom</span>
          </button>
          <p className="text-[#8a8578] text-sm">
            {mode === 'login' ? "Welcome back to Malaysia's Premium Automotive Marketplace" : "Join Malaysia's Premium Automotive Marketplace"}
          </p>
        </div>

        <Card className="bg-[#111111] border-[#2a2a2a] rounded-xl">
          <CardHeader className="pb-4">
            <div className="flex rounded-lg bg-[#0a0a0a] p-1">
              <button
                onClick={() => setMode('login')}
                className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-all ${
                  mode === 'login' ? 'bg-[#c9a84c] text-[#0a0a0a]' : 'text-[#8a8578] hover:text-[#f5f0e8]'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setMode('register')}
                className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-all ${
                  mode === 'register' ? 'bg-[#c9a84c] text-[#0a0a0a]' : 'text-[#8a8578] hover:text-[#f5f0e8]'
                }`}
              >
                Create Account
              </button>
            </div>
          </CardHeader>

          <CardContent className="px-6 pb-6">
            {mode === 'login' ? (
              /* ===== LOGIN FORM ===== */
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[#f5f0e8] text-sm">Sign in as</Label>
                  <Select value={loginRole} onValueChange={(v: any) => setLoginRole(v)}>
                    <SelectTrigger className="h-11 bg-[#0a0a0a] border-[#2a2a2a] text-[#f5f0e8]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#111111] border-[#2a2a2a]">
                      <SelectItem value="customer" className="text-[#f5f0e8] focus:bg-[#1a1a1a]">
                        <div className="flex items-center gap-2"><User className="size-4 text-[#c9a84c]" />Customer</div>
                      </SelectItem>
                      <SelectItem value="dealer" className="text-[#f5f0e8] focus:bg-[#1a1a1a]">
                        <div className="flex items-center gap-2"><Building2 className="size-4 text-[#c9a84c]" />Dealer</div>
                      </SelectItem>
                      <SelectItem value="admin" className="text-[#f5f0e8] focus:bg-[#1a1a1a]">
                        <div className="flex items-center gap-2"><Shield className="size-4 text-[#c9a84c]" />Admin</div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[#f5f0e8] text-sm">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#8a8578]" />
                    <Input type="email" placeholder="your@email.com" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className="h-11 pl-10 bg-[#0a0a0a] border-[#2a2a2a] text-[#f5f0e8] placeholder:text-[#8a8578] focus-visible:border-[#c9a84c]" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-[#f5f0e8] text-sm">Password</Label>
                    <button className="text-xs text-[#c9a84c] hover:underline">Forgot password?</button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#8a8578]" />
                    <Input type={showPassword ? 'text' : 'password'} placeholder="Enter your password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="h-11 pl-10 pr-10 bg-[#0a0a0a] border-[#2a2a2a] text-[#f5f0e8] placeholder:text-[#8a8578] focus-visible:border-[#c9a84c]" />
                    <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8a8578] hover:text-[#c9a84c]">
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>
                <Button onClick={handleLogin} className="w-full h-11 bg-[#c9a84c] hover:bg-[#b8963e] text-[#0a0a0a] font-semibold rounded-lg">
                  Sign In <ArrowRight className="size-4 ml-1" />
                </Button>
                <div className="p-3 rounded-lg bg-[#0a0a0a] border border-[#2a2a2a]">
                  <p className="text-xs text-[#8a8578] mb-2">Quick demo access:</p>
                  <div className="flex gap-2 flex-wrap">
                    <Badge className="cursor-pointer bg-[#c9a84c]/10 text-[#c9a84c] border-[#c9a84c]/30 hover:bg-[#c9a84c]/20" onClick={() => { setLoginRole('customer'); setLoginEmail('customer@demo.com') }}>Customer</Badge>
                    <Badge className="cursor-pointer bg-[#3b82f6]/10 text-[#3b82f6] border-[#3b82f6]/30 hover:bg-[#3b82f6]/20" onClick={() => { setLoginRole('dealer'); setLoginEmail('dealer@demo.com') }}>Dealer</Badge>
                    <Badge className="cursor-pointer bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/30 hover:bg-[#ef4444]/20" onClick={() => { setLoginRole('admin'); setLoginEmail('admin@demo.com') }}>Admin</Badge>
                  </div>
                </div>
              </div>
            ) : (
              /* ===== REGISTER FORM ===== */
              <div className="space-y-4">
                {/* Role Selection */}
                <div className="space-y-2">
                  <Label className="text-[#f5f0e8] text-sm">I am a</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setRegRole('customer')}
                      className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                        regRole === 'customer' ? 'border-[#c9a84c] bg-[#c9a84c]/10 text-[#c9a84c]' : 'border-[#2a2a2a] bg-[#0a0a0a] text-[#8a8578] hover:border-[#c9a84c]/50'
                      }`}
                    >
                      <User className="size-5 mx-auto mb-1" />
                      Customer
                    </button>
                    <button
                      onClick={() => setRegRole('dealer')}
                      className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                        regRole === 'dealer' ? 'border-[#c9a84c] bg-[#c9a84c]/10 text-[#c9a84c]' : 'border-[#2a2a2a] bg-[#0a0a0a] text-[#8a8578] hover:border-[#c9a84c]/50'
                      }`}
                    >
                      <Building2 className="size-5 mx-auto mb-1" />
                      Dealer
                    </button>
                  </div>
                </div>

                <Separator className="bg-[#2a2a2a]" />

                {/* ===== CUSTOMER REGISTRATION ===== */}
                {regRole === 'customer' && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-[#c9a84c] flex items-center gap-2">
                      <User className="size-4" /> Customer Registration
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-[#8a8578] text-xs">Full Name *</Label>
                        <div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#8a8578]" /><Input placeholder="Ahmad Razak" value={custName} onChange={(e) => setCustName(e.target.value)} className="h-10 pl-10 bg-[#0a0a0a] border-[#2a2a2a] text-[#f5f0e8] text-sm placeholder:text-[#4a4535] focus-visible:border-[#c9a84c]" /></div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[#8a8578] text-xs">Phone Number *</Label>
                        <div className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#8a8578]" /><Input placeholder="+60 12-345 6789" value={custPhone} onChange={(e) => setCustPhone(e.target.value)} className="h-10 pl-10 bg-[#0a0a0a] border-[#2a2a2a] text-[#f5f0e8] text-sm placeholder:text-[#4a4535] focus-visible:border-[#c9a84c]" /></div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[#8a8578] text-xs">WhatsApp Number</Label>
                        <div className="relative"><MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#8a8578]" /><Input placeholder="+60 12-345 6789" value={custWhatsapp} onChange={(e) => setCustWhatsapp(e.target.value)} className="h-10 pl-10 bg-[#0a0a0a] border-[#2a2a2a] text-[#f5f0e8] text-sm placeholder:text-[#4a4535] focus-visible:border-[#c9a84c]" /></div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[#8a8578] text-xs">Email *</Label>
                        <div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#8a8578]" /><Input type="email" placeholder="your@email.com" value={custEmail} onChange={(e) => setCustEmail(e.target.value)} className="h-10 pl-10 bg-[#0a0a0a] border-[#2a2a2a] text-[#f5f0e8] text-sm placeholder:text-[#4a4535] focus-visible:border-[#c9a84c]" /></div>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[#8a8578] text-xs">Password *</Label>
                      <div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#8a8578]" /><Input type={showPassword ? 'text' : 'password'} placeholder="Create a strong password" value={custPassword} onChange={(e) => setCustPassword(e.target.value)} className="h-10 pl-10 pr-10 bg-[#0a0a0a] border-[#2a2a2a] text-[#f5f0e8] text-sm placeholder:text-[#4a4535] focus-visible:border-[#c9a84c]" /><button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8a8578] hover:text-[#c9a84c]">{showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button></div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[#8a8578] text-xs">Address</Label>
                      <div className="relative"><MapPin className="absolute left-3 top-3 size-4 text-[#8a8578]" /><Textarea placeholder="Your full address" value={custAddress} onChange={(e) => setCustAddress(e.target.value)} className="pl-10 bg-[#0a0a0a] border-[#2a2a2a] text-[#f5f0e8] text-sm placeholder:text-[#4a4535] focus-visible:border-[#c9a84c] min-h-[60px]" /></div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-[#8a8578] text-xs">IC / Passport Number *</Label>
                        <div className="relative"><FileText className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#8a8578]" /><Input placeholder="e.g. 901234-56-7890" value={custIC} onChange={(e) => setCustIC(e.target.value)} className="h-10 pl-10 bg-[#0a0a0a] border-[#2a2a2a] text-[#f5f0e8] text-sm placeholder:text-[#4a4535] focus-visible:border-[#c9a84c]" /></div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[#8a8578] text-xs">Driving License Number *</Label>
                        <div className="relative"><CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#8a8578]" /><Input placeholder="License number" value={custLicense} onChange={(e) => setCustLicense(e.target.value)} className="h-10 pl-10 bg-[#0a0a0a] border-[#2a2a2a] text-[#f5f0e8] text-sm placeholder:text-[#4a4535] focus-visible:border-[#c9a84c]" /></div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <UploadBox label="Upload IC / Passport" uploaded={custICUploaded} onUpload={() => setCustICUploaded(true)} />
                      <UploadBox label="Upload Driving License" uploaded={custLicenseUploaded} onUpload={() => setCustLicenseUploaded(true)} />
                    </div>
                    <div className="flex items-start gap-2">
                      <Checkbox id="cust-agree" checked={custAgree} onCheckedChange={(v) => setCustAgree(!!v)} className="border-[#2a2a2a] mt-1" />
                      <label htmlFor="cust-agree" className="text-xs text-[#8a8578] leading-relaxed cursor-pointer">
                        I agree to the <span className="text-[#c9a84c]">Terms of Service</span> and <span className="text-[#c9a84c]">Privacy Policy</span>
                      </label>
                    </div>
                    <Button onClick={handleRegister} disabled={!custAgree} className="w-full h-11 bg-[#c9a84c] hover:bg-[#b8963e] text-[#0a0a0a] font-semibold rounded-lg disabled:opacity-50">
                      Create Account <ArrowRight className="size-4 ml-1" />
                    </Button>
                  </div>
                )}

                {/* ===== DEALER REGISTRATION ===== */}
                {regRole === 'dealer' && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-[#c9a84c] flex items-center gap-2">
                      <Building2 className="size-4" /> Dealer Registration
                    </h3>

                    {/* Verification notice */}
                    <div className="p-3 rounded-lg bg-[#c9a84c]/5 border border-[#c9a84c]/20">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="size-4 text-[#c9a84c] mt-0.5 shrink-0" />
                        <p className="text-xs text-[#8a8578]">Your dealer account will be reviewed and verified by our admin team within 24-48 hours.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-[#8a8578] text-xs">Business Name *</Label>
                        <div className="relative"><Building2 className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#8a8578]" /><Input placeholder="Your Auto Sdn Bhd" value={dealBizName} onChange={(e) => setDealBizName(e.target.value)} className="h-10 pl-10 bg-[#0a0a0a] border-[#2a2a2a] text-[#f5f0e8] text-sm placeholder:text-[#4a4535] focus-visible:border-[#c9a84c]" /></div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[#8a8578] text-xs">Dealer Type *</Label>
                        <Select value={dealType} onValueChange={setDealType}>
                          <SelectTrigger className="h-10 bg-[#0a0a0a] border-[#2a2a2a] text-[#f5f0e8] text-sm">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#111111] border-[#2a2a2a]">
                            <SelectItem value="used_car" className="text-[#f5f0e8] focus:bg-[#1a1a1a]">Used Car Dealer</SelectItem>
                            <SelectItem value="rental" className="text-[#f5f0e8] focus:bg-[#1a1a1a]">Rental Company</SelectItem>
                            <SelectItem value="workshop" className="text-[#f5f0e8] focus:bg-[#1a1a1a]">Workshop</SelectItem>
                            <SelectItem value="insurance" className="text-[#f5f0e8] focus:bg-[#1a1a1a]">Insurance Agent</SelectItem>
                            <SelectItem value="auction" className="text-[#f5f0e8] focus:bg-[#1a1a1a]">Auction Seller</SelectItem>
                            <SelectItem value="loan" className="text-[#f5f0e8] focus:bg-[#1a1a1a]">Loan Partner</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[#8a8578] text-xs">Contact Person *</Label>
                        <div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#8a8578]" /><Input placeholder="Contact person name" value={dealContact} onChange={(e) => setDealContact(e.target.value)} className="h-10 pl-10 bg-[#0a0a0a] border-[#2a2a2a] text-[#f5f0e8] text-sm placeholder:text-[#4a4535] focus-visible:border-[#c9a84c]" /></div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[#8a8578] text-xs">Phone Number *</Label>
                        <div className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#8a8578]" /><Input placeholder="+60 12-345 6789" value={dealPhone} onChange={(e) => setDealPhone(e.target.value)} className="h-10 pl-10 bg-[#0a0a0a] border-[#2a2a2a] text-[#f5f0e8] text-sm placeholder:text-[#4a4535] focus-visible:border-[#c9a84c]" /></div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[#8a8578] text-xs">WhatsApp Number</Label>
                        <div className="relative"><MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#8a8578]" /><Input placeholder="+60 12-345 6789" value={dealWhatsapp} onChange={(e) => setDealWhatsapp(e.target.value)} className="h-10 pl-10 bg-[#0a0a0a] border-[#2a2a2a] text-[#f5f0e8] text-sm placeholder:text-[#4a4535] focus-visible:border-[#c9a84c]" /></div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[#8a8578] text-xs">Email *</Label>
                        <div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#8a8578]" /><Input type="email" placeholder="dealer@company.com" value={dealEmail} onChange={(e) => setDealEmail(e.target.value)} className="h-10 pl-10 bg-[#0a0a0a] border-[#2a2a2a] text-[#f5f0e8] text-sm placeholder:text-[#4a4535] focus-visible:border-[#c9a84c]" /></div>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[#8a8578] text-xs">Password *</Label>
                      <div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#8a8578]" /><Input type={showPassword ? 'text' : 'password'} placeholder="Create a strong password" value={dealPassword} onChange={(e) => setDealPassword(e.target.value)} className="h-10 pl-10 pr-10 bg-[#0a0a0a] border-[#2a2a2a] text-[#f5f0e8] text-sm placeholder:text-[#4a4535] focus-visible:border-[#c9a84c]" /><button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8a8578] hover:text-[#c9a84c]">{showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button></div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[#8a8578] text-xs">Business Address</Label>
                      <div className="relative"><MapPin className="absolute left-3 top-3 size-4 text-[#8a8578]" /><Textarea placeholder="Full business address" value={dealAddress} onChange={(e) => setDealAddress(e.target.value)} className="pl-10 bg-[#0a0a0a] border-[#2a2a2a] text-[#f5f0e8] text-sm placeholder:text-[#4a4535] focus-visible:border-[#c9a84c] min-h-[60px]" /></div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-[#8a8578] text-xs">IC / SSM / Business Registration *</Label>
                        <div className="relative"><FileText className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#8a8578]" /><Input placeholder="Registration number" value={dealRegNo} onChange={(e) => setDealRegNo(e.target.value)} className="h-10 pl-10 bg-[#0a0a0a] border-[#2a2a2a] text-[#f5f0e8] text-sm placeholder:text-[#4a4535] focus-visible:border-[#c9a84c]" /></div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[#8a8578] text-xs">Upload IC / SSM Document</Label>
                        <UploadBox label="Upload Document" uploaded={dealDocUploaded} onUpload={() => setDealDocUploaded(true)} />
                      </div>
                    </div>

                    <Separator className="bg-[#2a2a2a]" />
                    <h4 className="text-xs font-semibold text-[#c9a84c] flex items-center gap-2">
                      <CreditCard className="size-3.5" /> Bank Details
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-[#8a8578] text-xs">Bank Name *</Label>
                        <Select value={dealBankName} onValueChange={setDealBankName}>
                          <SelectTrigger className="h-10 bg-[#0a0a0a] border-[#2a2a2a] text-[#f5f0e8] text-sm">
                            <SelectValue placeholder="Select bank" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#111111] border-[#2a2a2a]">
                            {['Maybank', 'CIMB', 'Hong Leong Bank', 'Public Bank', 'RHB', 'AmBank', 'Bank Islam', 'Bank Rakyat'].map((b) => (
                              <SelectItem key={b} value={b} className="text-[#f5f0e8] focus:bg-[#1a1a1a]">{b}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[#8a8578] text-xs">Account Number *</Label>
                        <Input placeholder="Bank account number" value={dealBankAcc} onChange={(e) => setDealBankAcc(e.target.value)} className="h-10 bg-[#0a0a0a] border-[#2a2a2a] text-[#f5f0e8] text-sm placeholder:text-[#4a4535] focus-visible:border-[#c9a84c]" />
                      </div>
                      <div className="sm:col-span-2 space-y-1.5">
                        <Label className="text-[#8a8578] text-xs">Account Holder Name *</Label>
                        <Input placeholder="Name as per bank account" value={dealBankHolder} onChange={(e) => setDealBankHolder(e.target.value)} className="h-10 bg-[#0a0a0a] border-[#2a2a2a] text-[#f5f0e8] text-sm placeholder:text-[#4a4535] focus-visible:border-[#c9a84c]" />
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Checkbox id="deal-agree" checked={dealAgree} onCheckedChange={(v) => setDealAgree(!!v)} className="border-[#2a2a2a] mt-1" />
                      <label htmlFor="deal-agree" className="text-xs text-[#8a8578] leading-relaxed cursor-pointer">
                        I agree to the <span className="text-[#c9a84c]">Terms of Service</span>, <span className="text-[#c9a84c]">Privacy Policy</span>, and <span className="text-[#c9a84c]">Dealer Agreement</span>
                      </label>
                    </div>
                    <Button onClick={handleRegister} disabled={!dealAgree} className="w-full h-11 bg-[#c9a84c] hover:bg-[#b8963e] text-[#0a0a0a] font-semibold rounded-lg disabled:opacity-50">
                      Register as Dealer <ArrowRight className="size-4 ml-1" />
                    </Button>
                  </div>
                )}
              </div>
            )}

            <Separator className="bg-[#2a2a2a] my-5" />
            <div className="flex items-center justify-center gap-4 text-[#8a8578]">
              <div className="flex items-center gap-1 text-xs"><Shield className="size-3.5 text-[#c9a84c]" />Secure</div>
              <div className="flex items-center gap-1 text-xs"><CheckCircle className="size-3.5 text-[#c9a84c]" />Verified</div>
              <div className="flex items-center gap-1 text-xs"><Lock className="size-3.5 text-[#c9a84c]" />Encrypted</div>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-[#8a8578] mt-6">
          By continuing, you agree to DK Vroom&apos;s Terms & Conditions
        </p>
      </div>
    </div>
  )
}
