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
} from 'lucide-react'

export default function AuthPage() {
  const { navigate, login } = useAppStore()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [showPassword, setShowPassword] = useState(false)

  // Login form
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginRole, setLoginRole] = useState<'customer' | 'dealer' | 'admin'>('customer')

  // Register form
  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPhone, setRegPhone] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regRole, setRegRole] = useState<'customer' | 'dealer'>('customer')
  const [regCompany, setRegCompany] = useState('')
  const [regAgree, setRegAgree] = useState(false)

  const handleLogin = () => {
    if (!loginEmail) return
    login(loginRole, loginRole === 'admin' ? 'Admin User' : loginRole === 'dealer' ? 'Premium Dealer' : 'Ahmad Razak')
    if (loginRole === 'admin') navigate('adminDashboard')
    else if (loginRole === 'dealer') navigate('dealerDashboard')
    else navigate('home')
  }

  const handleRegister = () => {
    if (!regName || !regEmail) return
    login(regRole, regName)
    if (regRole === 'dealer') navigate('dealerDashboard')
    else navigate('home')
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4 py-12">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#c9a84c]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#c9a84c]/3 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <button onClick={() => navigate('home')} className="inline-flex items-center gap-2 mb-4">
            <div className="flex size-10 items-center justify-center rounded-lg border border-[#c9a84c]/30 bg-gradient-to-br from-[#c9a84c]/20 to-transparent">
              <Car className="size-5 text-[#c9a84c]" />
            </div>
            <span className="gold-text text-2xl font-bold tracking-wider">DK Vroom</span>
          </button>
          <p className="text-[#8a8578] text-sm">
            {mode === 'login' ? 'Welcome back to Malaysia\'s Premium Automotive Marketplace' : 'Join Malaysia\'s Premium Automotive Marketplace'}
          </p>
        </div>

        <Card className="bg-[#111111] border-[#2a2a2a] rounded-xl overflow-hidden">
          <CardHeader className="pb-4">
            {/* Tab Switcher */}
            <div className="flex rounded-lg bg-[#0a0a0a] p-1">
              <button
                onClick={() => setMode('login')}
                className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-all ${
                  mode === 'login'
                    ? 'bg-[#c9a84c] text-[#0a0a0a]'
                    : 'text-[#8a8578] hover:text-[#f5f0e8]'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setMode('register')}
                className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-all ${
                  mode === 'register'
                    ? 'bg-[#c9a84c] text-[#0a0a0a]'
                    : 'text-[#8a8578] hover:text-[#f5f0e8]'
                }`}
              >
                Create Account
              </button>
            </div>
          </CardHeader>

          <CardContent className="px-6 pb-6">
            {mode === 'login' ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[#f5f0e8] text-sm">Sign in as</Label>
                  <Select value={loginRole} onValueChange={(v: any) => setLoginRole(v)}>
                    <SelectTrigger className="h-11 bg-[#0a0a0a] border-[#2a2a2a] text-[#f5f0e8]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#111111] border-[#2a2a2a]">
                      <SelectItem value="customer" className="text-[#f5f0e8] focus:bg-[#1a1a1a]">
                        <div className="flex items-center gap-2">
                          <User className="size-4 text-[#c9a84c]" />
                          Customer
                        </div>
                      </SelectItem>
                      <SelectItem value="dealer" className="text-[#f5f0e8] focus:bg-[#1a1a1a]">
                        <div className="flex items-center gap-2">
                          <Building2 className="size-4 text-[#c9a84c]" />
                          Dealer
                        </div>
                      </SelectItem>
                      <SelectItem value="admin" className="text-[#f5f0e8] focus:bg-[#1a1a1a]">
                        <div className="flex items-center gap-2">
                          <Shield className="size-4 text-[#c9a84c]" />
                          Admin
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[#f5f0e8] text-sm">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#8a8578]" />
                    <Input
                      type="email"
                      placeholder="your@email.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="h-11 pl-10 bg-[#0a0a0a] border-[#2a2a2a] text-[#f5f0e8] placeholder:text-[#8a8578] focus-visible:border-[#c9a84c]"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-[#f5f0e8] text-sm">Password</Label>
                    <button className="text-xs text-[#c9a84c] hover:underline">Forgot password?</button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#8a8578]" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="h-11 pl-10 pr-10 bg-[#0a0a0a] border-[#2a2a2a] text-[#f5f0e8] placeholder:text-[#8a8578] focus-visible:border-[#c9a84c]"
                    />
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8a8578] hover:text-[#c9a84c]"
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox id="remember" className="border-[#2a2a2a]" />
                  <label htmlFor="remember" className="text-sm text-[#8a8578] cursor-pointer">
                    Remember me
                  </label>
                </div>

                <Button
                  onClick={handleLogin}
                  className="w-full h-11 bg-[#c9a84c] hover:bg-[#b8963e] text-[#0a0a0a] font-semibold rounded-lg"
                >
                  Sign In
                  <ArrowRight className="size-4 ml-1" />
                </Button>

                {/* Demo login hints */}
                <div className="mt-4 p-3 rounded-lg bg-[#0a0a0a] border border-[#2a2a2a]">
                  <p className="text-xs text-[#8a8578] mb-2">Quick demo access:</p>
                  <div className="flex gap-2 flex-wrap">
                    <Badge
                      className="cursor-pointer bg-[#c9a84c]/10 text-[#c9a84c] border-[#c9a84c]/30 hover:bg-[#c9a84c]/20"
                      onClick={() => { setLoginRole('customer'); setLoginEmail('customer@demo.com') }}
                    >
                      Customer
                    </Badge>
                    <Badge
                      className="cursor-pointer bg-[#3b82f6]/10 text-[#3b82f6] border-[#3b82f6]/30 hover:bg-[#3b82f6]/20"
                      onClick={() => { setLoginRole('dealer'); setLoginEmail('dealer@demo.com') }}
                    >
                      Dealer
                    </Badge>
                    <Badge
                      className="cursor-pointer bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/30 hover:bg-[#ef4444]/20"
                      onClick={() => { setLoginRole('admin'); setLoginEmail('admin@demo.com') }}
                    >
                      Admin
                    </Badge>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[#f5f0e8] text-sm">I am a</Label>
                  <Select value={regRole} onValueChange={(v: any) => setRegRole(v)}>
                    <SelectTrigger className="h-11 bg-[#0a0a0a] border-[#2a2a2a] text-[#f5f0e8]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#111111] border-[#2a2a2a]">
                      <SelectItem value="customer" className="text-[#f5f0e8] focus:bg-[#1a1a1a]">
                        <div className="flex items-center gap-2">
                          <User className="size-4 text-[#c9a84c]" />
                          Customer — Looking for cars
                        </div>
                      </SelectItem>
                      <SelectItem value="dealer" className="text-[#f5f0e8] focus:bg-[#1a1a1a]">
                        <div className="flex items-center gap-2">
                          <Building2 className="size-4 text-[#c9a84c]" />
                          Dealer — Selling cars & services
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[#f5f0e8] text-sm">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#8a8578]" />
                    <Input
                      placeholder="Ahmad Razak"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      className="h-11 pl-10 bg-[#0a0a0a] border-[#2a2a2a] text-[#f5f0e8] placeholder:text-[#8a8578] focus-visible:border-[#c9a84c]"
                    />
                  </div>
                </div>

                {regRole === 'dealer' && (
                  <div className="space-y-2">
                    <Label className="text-[#f5f0e8] text-sm">Company Name</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#8a8578]" />
                      <Input
                        placeholder="Your Auto Sdn Bhd"
                        value={regCompany}
                        onChange={(e) => setRegCompany(e.target.value)}
                        className="h-11 pl-10 bg-[#0a0a0a] border-[#2a2a2a] text-[#f5f0e8] placeholder:text-[#8a8578] focus-visible:border-[#c9a84c]"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-[#f5f0e8] text-sm">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#8a8578]" />
                    <Input
                      type="email"
                      placeholder="your@email.com"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="h-11 pl-10 bg-[#0a0a0a] border-[#2a2a2a] text-[#f5f0e8] placeholder:text-[#8a8578] focus-visible:border-[#c9a84c]"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[#f5f0e8] text-sm">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#8a8578]" />
                    <Input
                      type="tel"
                      placeholder="+60 12-345 6789"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      className="h-11 pl-10 bg-[#0a0a0a] border-[#2a2a2a] text-[#f5f0e8] placeholder:text-[#8a8578] focus-visible:border-[#c9a84c]"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[#f5f0e8] text-sm">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#8a8578]" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Create a strong password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="h-11 pl-10 pr-10 bg-[#0a0a0a] border-[#2a2a2a] text-[#f5f0e8] placeholder:text-[#8a8578] focus-visible:border-[#c9a84c]"
                    />
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8a8578] hover:text-[#c9a84c]"
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Checkbox
                    id="agree"
                    checked={regAgree}
                    onCheckedChange={(v) => setRegAgree(!!v)}
                    className="border-[#2a2a2a] mt-1"
                  />
                  <label htmlFor="agree" className="text-xs text-[#8a8578] leading-relaxed cursor-pointer">
                    I agree to the{' '}
                    <span className="text-[#c9a84c] hover:underline">Terms of Service</span>{' '}
                    and{' '}
                    <span className="text-[#c9a84c] hover:underline">Privacy Policy</span>
                  </label>
                </div>

                <Button
                  onClick={handleRegister}
                  disabled={!regAgree}
                  className="w-full h-11 bg-[#c9a84c] hover:bg-[#b8963e] text-[#0a0a0a] font-semibold rounded-lg disabled:opacity-50"
                >
                  Create Account
                  <ArrowRight className="size-4 ml-1" />
                </Button>

                {regRole === 'dealer' && (
                  <div className="p-3 rounded-lg bg-[#c9a84c]/5 border border-[#c9a84c]/20">
                    <div className="flex items-start gap-2">
                      <Star className="size-4 text-[#c9a84c] mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-[#c9a84c]">Dealer Benefits</p>
                        <p className="text-xs text-[#8a8578] mt-1">
                          Premium listing placement, real-time analytics, dedicated account manager, and zero commission on your first 10 sales.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <Separator className="bg-[#2a2a2a] my-5" />

            {/* Trust indicators */}
            <div className="flex items-center justify-center gap-4 text-[#8a8578]">
              <div className="flex items-center gap-1 text-xs">
                <Shield className="size-3.5 text-[#c9a84c]" />
                Secure
              </div>
              <div className="flex items-center gap-1 text-xs">
                <CheckCircle className="size-3.5 text-[#c9a84c]" />
                Verified
              </div>
              <div className="flex items-center gap-1 text-xs">
                <Lock className="size-3.5 text-[#c9a84c]" />
                Encrypted
              </div>
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
