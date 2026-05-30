'use client'

import { useState, useRef, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAppStore, type UserState } from '@/lib/store'
import { authApi, uploadApi } from '@/lib/api'
import { CITIES, DEALER_TYPES } from '@/lib/constants'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
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
  MapPin,
  CreditCard,
  FileText,
  Upload,
  MessageCircle,
  AlertCircle,
} from 'lucide-react'

// ============================================================
// Zod Schemas
// ============================================================

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginFormData = z.infer<typeof loginSchema>

const malaysianPhoneRegex = /^(\+?6?0?1)[0-9]-?\s?[0-9]{3,4}\s?[0-9]{4}$/

const customerSchema = z.object({
  name: z.string().min(1, 'Full name is required'),
  email: z.string().min(1, 'Email is required').email('Please enter a valid email'),
  phone: z.string().min(1, 'Phone number is required').regex(malaysianPhoneRegex, 'Please enter a valid Malaysian phone number'),
  whatsapp: z.string().optional(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least 1 uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least 1 number'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  address: z.string().optional(),
  icNumber: z.string().optional(),
  licenseNumber: z.string().optional(),
  agree: z.literal(true, { message: 'You must agree to the terms' }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

type CustomerFormData = z.infer<typeof customerSchema>

const dealerSchema = z.object({
  contactName: z.string().min(1, 'Contact person name is required'),
  email: z.string().min(1, 'Email is required').email('Please enter a valid email'),
  phone: z.string().min(1, 'Phone number is required').regex(malaysianPhoneRegex, 'Please enter a valid Malaysian phone number'),
  whatsapp: z.string().optional(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least 1 uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least 1 number'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  companyName: z.string().min(1, 'Business name is required'),
  dealerType: z.string().min(1, 'Dealer type is required'),
  address: z.string().optional(),
  regNo: z.string().optional(),
  city: z.string().optional(),
  bankName: z.string().optional(),
  bankAccount: z.string().optional(),
  bankHolder: z.string().optional(),
  agree: z.literal(true, { message: 'You must agree to the terms' }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

type DealerFormData = z.infer<typeof dealerSchema>

// ============================================================
// Sub-components
// ============================================================

function UploadBox({
  label,
  uploaded,
  onUpload,
  fileInputRef,
}: {
  label: string
  uploaded: boolean
  onUpload: (file: File) => void
  fileInputRef: React.RefObject<HTMLInputElement | null>
}) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.size <= 5 * 1024 * 1024) {
      onUpload(file)
    }
  }

  return (
    <button
      type="button"
      onClick={() => fileInputRef.current?.click()}
      className={`w-full p-4 rounded-lg border-2 border-dashed transition-all text-left ${
        uploaded
          ? 'border-success/40 bg-success/5'
          : 'border-border bg-background hover:border-gold/50'
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,application/pdf"
        className="hidden"
        onChange={handleFileChange}
      />
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
          uploaded ? 'bg-success/10' : 'bg-muted'
        }`}>
          {uploaded ? (
            <CheckCircle className="size-5 text-success" />
          ) : (
            <Upload className="size-5 text-muted-foreground" />
          )}
        </div>
        <div>
          <p className={`text-body-sm font-medium ${uploaded ? 'text-success' : 'text-foreground'}`}>
            {uploaded ? 'Uploaded' : label}
          </p>
          <p className="text-caption text-muted-foreground">JPG, PNG, PDF (max 5MB)</p>
        </div>
      </div>
    </button>
  )
}

function FormField({
  label,
  required,
  error,
  children,
}: {
  label: string
  required?: boolean
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-muted-foreground text-caption">
        {label}{required && ' *'}
      </Label>
      {children}
      {error && (
        <p className="text-caption text-error flex items-center gap-1 mt-1">
          <AlertCircle className="size-3 shrink-0" />
          {error}
        </p>
      )}
    </div>
  )
}

// ============================================================
// Main Component
// ============================================================

export default function AuthPage() {
  const { navigate, login } = useAppStore()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [regRole, setRegRole] = useState<'customer' | 'dealer'>('customer')
  const [loginRole, setLoginRole] = useState<'customer' | 'dealer' | 'admin'>('customer')

  // File upload states
  const [custICUploaded, setCustICUploaded] = useState(false)
  const [custLicenseUploaded, setCustLicenseUploaded] = useState(false)
  const [dealDocUploaded, setDealDocUploaded] = useState(false)

  // File refs
  const custICRef = useRef<HTMLInputElement>(null)
  const custLicenseRef = useRef<HTMLInputElement>(null)
  const dealDocRef = useRef<HTMLInputElement>(null)

  // ===== LOGIN FORM =====
  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  // ===== CUSTOMER REGISTRATION FORM =====
  const customerForm = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: '', email: '', phone: '', whatsapp: '',
      password: '', confirmPassword: '', address: '',
      icNumber: '', licenseNumber: '', agree: false as unknown as true,
    },
  })

  // ===== DEALER REGISTRATION FORM =====
  const dealerForm = useForm<DealerFormData>({
    resolver: zodResolver(dealerSchema),
    defaultValues: {
      contactName: '', email: '', phone: '', whatsapp: '',
      password: '', confirmPassword: '', companyName: '',
      dealerType: '', address: '', regNo: '', city: '',
      bankName: '', bankAccount: '', bankHolder: '',
      agree: false as unknown as true,
    },
  })

  // Reset forms on mode/role change
  const switchMode = useCallback((newMode: 'login' | 'register') => {
    setMode(newMode)
    setError(null)
    setSuccess(null)
    if (newMode === 'login') {
      loginForm.reset()
    }
  }, [loginForm])

  const switchRole = useCallback((role: 'customer' | 'dealer') => {
    setRegRole(role)
    setError(null)
    setSuccess(null)
    customerForm.reset()
    dealerForm.reset()
    setCustICUploaded(false)
    setCustLicenseUploaded(false)
    setDealDocUploaded(false)
  }, [customerForm, dealerForm])

  // ===== FILE UPLOAD HANDLER =====
  const handleFileUpload = async (
    file: File,
    onUploaded: () => void,
  ) => {
    try {
      await uploadApi.upload(file)
      onUploaded()
    } catch {
      setError('File upload failed. Please try again.')
    }
  }

  // ===== MAP USER STATE =====
  function mapUserState(u: {
    id: string
    email: string
    name: string
    phone: string | null
    whatsapp: string | null
    role: 'customer' | 'dealer' | 'admin'
    verified: boolean
    avatar: string | null
    dealer?: { id: string; companyName: string; verified: boolean; rating: number; [key: string]: unknown } | null
  }): UserState {
    return {
      id: u.id,
      email: u.email,
      name: u.name,
      phone: u.phone,
      whatsapp: u.whatsapp,
      role: u.role,
      verified: u.verified,
      avatar: u.avatar,
      dealerId: u.dealer?.id || null,
      dealer: u.dealer || null,
    }
  }

  // ===== LOGIN HANDLER =====
  const handleLogin = async (data: LoginFormData) => {
    setLoading(true)
    setError(null)
    try {
      const result = await authApi.login(data.email, data.password)
      const userState = mapUserState(result.user)
      login(userState, result.token)
      if (result.user.role === 'admin') navigate('adminDashboard')
      else if (result.user.role === 'dealer') navigate('dealerDashboard')
      else navigate('home')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed. Please try again.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  // ===== CUSTOMER REGISTER HANDLER =====
  const handleCustomerRegister = async (data: CustomerFormData) => {
    setLoading(true)
    setError(null)
    try {
      const userData = {
        name: data.name,
        email: data.email,
        password: data.password,
        phone: data.phone,
        whatsapp: data.whatsapp || undefined,
        role: 'customer' as const,
        address: data.address || undefined,
        icNumber: data.icNumber || undefined,
        licenseNumber: data.licenseNumber || undefined,
      }
      const result = await authApi.register(userData)
      const userState = mapUserState(result.user)
      login(userState, result.token)
      navigate('home')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed. Please try again.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  // ===== DEALER REGISTER HANDLER =====
  const handleDealerRegister = async (data: DealerFormData) => {
    setLoading(true)
    setError(null)
    try {
      const userData = {
        name: data.contactName,
        email: data.email,
        password: data.password,
        phone: data.phone,
        whatsapp: data.whatsapp || undefined,
        role: 'dealer' as const,
        businessName: data.companyName,
        dealerType: data.dealerType,
        address: data.address || undefined,
        regNo: data.regNo || undefined,
        city: data.city || undefined,
        bankName: data.bankName || undefined,
        bankAccount: data.bankAccount || undefined,
        bankHolder: data.bankHolder || undefined,
      }
      const result = await authApi.register(userData)
      const userState = mapUserState(result.user)
      login(userState, result.token)
      navigate('dealerDashboard')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed. Please try again.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  // ===== DEMO CREDS =====
  const demoCredentials = [
    { role: 'customer' as const, label: 'Customer', email: 'ahmad@dkvroom.com', password: 'Customer@123', color: 'bg-gold/10 text-gold border-gold/30 hover:bg-gold/20' },
    { role: 'dealer' as const, label: 'Dealer', email: 'prestige@dkvroom.com', password: 'Dealer@123', color: 'bg-info/10 text-info border-info/30 hover:bg-info/20' },
    { role: 'admin' as const, label: 'Admin', email: 'admin@dkvroom.com', password: 'Admin@123', color: 'bg-error/10 text-error border-error/30 hover:bg-error/20' },
  ]

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      {/* Background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gold/3 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <button onClick={() => navigate('home')} className="inline-flex items-center gap-2 mb-4" type="button">
            <div className="flex size-10 items-center justify-center rounded-lg border border-gold/30 bg-gradient-to-br from-gold/20 to-transparent">
              <Car className="size-5 text-gold" />
            </div>
            <span className="gold-text text-2xl font-bold tracking-wider">DK Vroom</span>
          </button>
          <p className="text-body-sm text-muted-foreground">
            {mode === 'login' ? "Welcome back to Malaysia's Premium Automotive Marketplace" : "Join Malaysia's Premium Automotive Marketplace"}
          </p>
        </div>

        <Card className="bg-card border-border rounded-xl">
          <CardHeader className="pb-4">
            {/* Tab switcher */}
            <div className="flex rounded-lg bg-background p-1" role="tablist">
              <button
                role="tab"
                aria-selected={mode === 'login'}
                onClick={() => switchMode('login')}
                className={`flex-1 py-2.5 text-body-sm font-medium rounded-md transition-all ${
                  mode === 'login' ? 'bg-gold text-gold-dark' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Sign In
              </button>
              <button
                role="tab"
                aria-selected={mode === 'register'}
                onClick={() => switchMode('register')}
                className={`flex-1 py-2.5 text-body-sm font-medium rounded-md transition-all ${
                  mode === 'register' ? 'bg-gold text-gold-dark' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Create Account
              </button>
            </div>
          </CardHeader>

          <CardContent className="px-6 pb-6">
            {mode === 'login' ? (
              /* ===== LOGIN FORM ===== */
              <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4" noValidate>
                {/* Role selector */}
                <FormField label="Sign in as">
                  <Select value={loginRole} onValueChange={(v: 'customer' | 'dealer' | 'admin') => setLoginRole(v)}>
                    <SelectTrigger className="h-11 bg-background border-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="customer" className="text-foreground focus:bg-muted">
                        <div className="flex items-center gap-2"><User className="size-4 text-gold" />Customer</div>
                      </SelectItem>
                      <SelectItem value="dealer" className="text-foreground focus:bg-muted">
                        <div className="flex items-center gap-2"><Building2 className="size-4 text-gold" />Dealer</div>
                      </SelectItem>
                      <SelectItem value="admin" className="text-foreground focus:bg-muted">
                        <div className="flex items-center gap-2"><Shield className="size-4 text-gold" />Admin</div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>

                {/* Email */}
                <FormField label="Email" required error={loginForm.formState.errors.email?.message}>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="your@email.com"
                      {...loginForm.register('email')}
                      className="h-11 pl-10 bg-background border-border text-foreground placeholder:text-muted-foreground focus-visible:border-gold"
                    />
                  </div>
                </FormField>

                {/* Password */}
                <FormField label="Password" required error={loginForm.formState.errors.password?.message}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="sr-only">Password</span>
                    <button type="button" className="text-caption text-gold hover:underline ml-auto">Forgot password?</button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      {...loginForm.register('password')}
                      className="h-11 pl-10 pr-10 bg-background border-border text-foreground placeholder:text-muted-foreground focus-visible:border-gold"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-gold"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </FormField>

                {/* Error message */}
                {error && (
                  <div className="p-3 rounded-lg bg-error/10 border border-error/30 text-error text-body-sm flex items-center gap-2" role="alert">
                    <AlertCircle className="size-4 shrink-0" />
                    {error}
                  </div>
                )}

                {/* Success message */}
                {success && (
                  <div className="p-3 rounded-lg bg-success/10 border border-success/30 text-success text-body-sm flex items-center gap-2" role="status">
                    <CheckCircle className="size-4 shrink-0" />
                    {success}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-gold hover:bg-gold-light text-gold-dark font-semibold rounded-lg disabled:opacity-50"
                >
                  {loading ? 'Signing In...' : <>Sign In <ArrowRight className="size-4 ml-1" /></>}
                </Button>

                {/* Demo access */}
                <div className="p-3 rounded-lg bg-background border border-border">
                  <p className="text-caption text-muted-foreground mb-2">Quick demo access:</p>
                  <div className="flex gap-2 flex-wrap">
                    {demoCredentials.map((demo) => (
                      <Badge
                        key={demo.role}
                        className={`cursor-pointer ${demo.color}`}
                        onClick={() => {
                          setLoginRole(demo.role)
                          loginForm.setValue('email', demo.email)
                          loginForm.setValue('password', demo.password)
                        }}
                      >
                        {demo.label}
                      </Badge>
                    ))}
                  </div>
                </div>
              </form>
            ) : (
              /* ===== REGISTER FORM ===== */
              <div className="space-y-4">
                {/* Role Selection */}
                <div className="space-y-2">
                  <Label className="text-foreground text-body-sm">I am a</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => switchRole('customer')}
                      className={`p-3 rounded-lg border text-body-sm font-medium transition-all ${
                        regRole === 'customer'
                          ? 'border-gold bg-gold/10 text-gold'
                          : 'border-border bg-background text-muted-foreground hover:border-gold/50'
                      }`}
                    >
                      <User className="size-5 mx-auto mb-1" />
                      Customer
                    </button>
                    <button
                      type="button"
                      onClick={() => switchRole('dealer')}
                      className={`p-3 rounded-lg border text-body-sm font-medium transition-all ${
                        regRole === 'dealer'
                          ? 'border-gold bg-gold/10 text-gold'
                          : 'border-border bg-background text-muted-foreground hover:border-gold/50'
                      }`}
                    >
                      <Building2 className="size-5 mx-auto mb-1" />
                      Dealer
                    </button>
                  </div>
                </div>

                <Separator className="bg-border" />

                {/* ===== CUSTOMER REGISTRATION ===== */}
                {regRole === 'customer' && (
                  <form onSubmit={customerForm.handleSubmit(handleCustomerRegister)} className="space-y-4" noValidate>
                    <h3 className="text-body-sm font-semibold text-gold flex items-center gap-2">
                      <User className="size-4" /> Customer Registration
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <FormField label="Full Name" required error={customerForm.formState.errors.name?.message}>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                          <Input
                            placeholder="Ahmad Razak"
                            {...customerForm.register('name')}
                            className="h-10 pl-10 bg-background border-border text-foreground text-body-sm placeholder:text-muted-foreground/60 focus-visible:border-gold"
                          />
                        </div>
                      </FormField>

                      <FormField label="Phone Number" required error={customerForm.formState.errors.phone?.message}>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                          <Input
                            placeholder="+60 12-345 6789"
                            {...customerForm.register('phone')}
                            className="h-10 pl-10 bg-background border-border text-foreground text-body-sm placeholder:text-muted-foreground/60 focus-visible:border-gold"
                          />
                        </div>
                      </FormField>

                      <FormField label="WhatsApp Number" error={customerForm.formState.errors.whatsapp?.message}>
                        <div className="relative">
                          <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                          <Input
                            placeholder="+60 12-345 6789"
                            {...customerForm.register('whatsapp')}
                            className="h-10 pl-10 bg-background border-border text-foreground text-body-sm placeholder:text-muted-foreground/60 focus-visible:border-gold"
                          />
                        </div>
                      </FormField>

                      <FormField label="Email" required error={customerForm.formState.errors.email?.message}>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                          <Input
                            type="email"
                            placeholder="your@email.com"
                            {...customerForm.register('email')}
                            className="h-10 pl-10 bg-background border-border text-foreground text-body-sm placeholder:text-muted-foreground/60 focus-visible:border-gold"
                          />
                        </div>
                      </FormField>
                    </div>

                    {/* Password fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <FormField label="Password" required error={customerForm.formState.errors.password?.message}>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Min 8 chars, 1 uppercase, 1 number"
                            {...customerForm.register('password')}
                            className="h-10 pl-10 pr-10 bg-background border-border text-foreground text-body-sm placeholder:text-muted-foreground/60 focus-visible:border-gold"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-gold"
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                          >
                            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                          </button>
                        </div>
                      </FormField>

                      <FormField label="Confirm Password" required error={customerForm.formState.errors.confirmPassword?.message}>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Re-enter your password"
                            {...customerForm.register('confirmPassword')}
                            className="h-10 pl-10 bg-background border-border text-foreground text-body-sm placeholder:text-muted-foreground/60 focus-visible:border-gold"
                          />
                        </div>
                      </FormField>
                    </div>

                    <FormField label="Address" error={customerForm.formState.errors.address?.message}>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 size-4 text-muted-foreground" />
                        <Textarea
                          placeholder="Your full address"
                          {...customerForm.register('address')}
                          className="pl-10 bg-background border-border text-foreground text-body-sm placeholder:text-muted-foreground/60 focus-visible:border-gold min-h-[60px]"
                        />
                      </div>
                    </FormField>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <FormField label="IC / Passport Number" error={customerForm.formState.errors.icNumber?.message}>
                        <div className="relative">
                          <FileText className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                          <Input
                            placeholder="e.g. 901234-56-7890"
                            {...customerForm.register('icNumber')}
                            className="h-10 pl-10 bg-background border-border text-foreground text-body-sm placeholder:text-muted-foreground/60 focus-visible:border-gold"
                          />
                        </div>
                      </FormField>

                      <FormField label="Driving License Number" error={customerForm.formState.errors.licenseNumber?.message}>
                        <div className="relative">
                          <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                          <Input
                            placeholder="License number"
                            {...customerForm.register('licenseNumber')}
                            className="h-10 pl-10 bg-background border-border text-foreground text-body-sm placeholder:text-muted-foreground/60 focus-visible:border-gold"
                          />
                        </div>
                      </FormField>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <UploadBox
                        label="Upload IC / Passport"
                        uploaded={custICUploaded}
                        onUpload={(file) => handleFileUpload(file, () => setCustICUploaded(true))}
                        fileInputRef={custICRef}
                      />
                      <UploadBox
                        label="Upload Driving License"
                        uploaded={custLicenseUploaded}
                        onUpload={(file) => handleFileUpload(file, () => setCustLicenseUploaded(true))}
                        fileInputRef={custLicenseRef}
                      />
                    </div>

                    {/* Agree to terms */}
                    <div className="flex items-start gap-2">
                      <Checkbox
                        id="cust-agree"
                        checked={customerForm.watch('agree') as boolean}
                        onCheckedChange={(v) => customerForm.setValue('agree', !!v as true)}
                        className="border-border mt-1"
                      />
                      <label htmlFor="cust-agree" className="text-caption text-muted-foreground leading-relaxed cursor-pointer">
                        I agree to the <span className="text-gold">Terms of Service</span> and <span className="text-gold">Privacy Policy</span>
                      </label>
                    </div>
                    {customerForm.formState.errors.agree && (
                      <p className="text-caption text-error -mt-2">{customerForm.formState.errors.agree.message}</p>
                    )}

                    {/* Global error */}
                    {error && (
                      <div className="p-3 rounded-lg bg-error/10 border border-error/30 text-error text-body-sm flex items-center gap-2" role="alert">
                        <AlertCircle className="size-4 shrink-0" />
                        {error}
                      </div>
                    )}

                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full h-11 bg-gold hover:bg-gold-light text-gold-dark font-semibold rounded-lg disabled:opacity-50"
                    >
                      {loading ? 'Creating Account...' : <>Create Account <ArrowRight className="size-4 ml-1" /></>}
                    </Button>
                  </form>
                )}

                {/* ===== DEALER REGISTRATION ===== */}
                {regRole === 'dealer' && (
                  <form onSubmit={dealerForm.handleSubmit(handleDealerRegister)} className="space-y-4" noValidate>
                    <h3 className="text-body-sm font-semibold text-gold flex items-center gap-2">
                      <Building2 className="size-4" /> Dealer Registration
                    </h3>

                    {/* Verification notice */}
                    <div className="p-3 rounded-lg bg-gold/5 border border-gold/20">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="size-4 text-gold mt-0.5 shrink-0" />
                        <p className="text-caption text-muted-foreground">Your dealer account will be reviewed and verified by our admin team within 24-48 hours.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <FormField label="Business Name" required error={dealerForm.formState.errors.companyName?.message}>
                        <div className="relative">
                          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                          <Input
                            placeholder="Your Auto Sdn Bhd"
                            {...dealerForm.register('companyName')}
                            className="h-10 pl-10 bg-background border-border text-foreground text-body-sm placeholder:text-muted-foreground/60 focus-visible:border-gold"
                          />
                        </div>
                      </FormField>

                      <FormField label="Dealer Type" required error={dealerForm.formState.errors.dealerType?.message}>
                        <Select value={dealerForm.watch('dealerType') || ''} onValueChange={(v) => dealerForm.setValue('dealerType', v)}>
                          <SelectTrigger className="h-10 bg-background border-border text-foreground text-body-sm">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent className="bg-card border-border">
                            {DEALER_TYPES.map((dt) => (
                              <SelectItem key={dt.key} value={dt.key} className="text-foreground focus:bg-muted">
                                {dt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormField>

                      <FormField label="Contact Person" required error={dealerForm.formState.errors.contactName?.message}>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                          <Input
                            placeholder="Contact person name"
                            {...dealerForm.register('contactName')}
                            className="h-10 pl-10 bg-background border-border text-foreground text-body-sm placeholder:text-muted-foreground/60 focus-visible:border-gold"
                          />
                        </div>
                      </FormField>

                      <FormField label="Phone Number" required error={dealerForm.formState.errors.phone?.message}>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                          <Input
                            placeholder="+60 12-345 6789"
                            {...dealerForm.register('phone')}
                            className="h-10 pl-10 bg-background border-border text-foreground text-body-sm placeholder:text-muted-foreground/60 focus-visible:border-gold"
                          />
                        </div>
                      </FormField>

                      <FormField label="WhatsApp Number" error={dealerForm.formState.errors.whatsapp?.message}>
                        <div className="relative">
                          <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                          <Input
                            placeholder="+60 12-345 6789"
                            {...dealerForm.register('whatsapp')}
                            className="h-10 pl-10 bg-background border-border text-foreground text-body-sm placeholder:text-muted-foreground/60 focus-visible:border-gold"
                          />
                        </div>
                      </FormField>

                      <FormField label="Email" required error={dealerForm.formState.errors.email?.message}>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                          <Input
                            type="email"
                            placeholder="dealer@company.com"
                            {...dealerForm.register('email')}
                            className="h-10 pl-10 bg-background border-border text-foreground text-body-sm placeholder:text-muted-foreground/60 focus-visible:border-gold"
                          />
                        </div>
                      </FormField>
                    </div>

                    {/* Password fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <FormField label="Password" required error={dealerForm.formState.errors.password?.message}>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Min 8 chars, 1 uppercase, 1 number"
                            {...dealerForm.register('password')}
                            className="h-10 pl-10 pr-10 bg-background border-border text-foreground text-body-sm placeholder:text-muted-foreground/60 focus-visible:border-gold"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-gold"
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                          >
                            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                          </button>
                        </div>
                      </FormField>

                      <FormField label="Confirm Password" required error={dealerForm.formState.errors.confirmPassword?.message}>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Re-enter your password"
                            {...dealerForm.register('confirmPassword')}
                            className="h-10 pl-10 bg-background border-border text-foreground text-body-sm placeholder:text-muted-foreground/60 focus-visible:border-gold"
                          />
                        </div>
                      </FormField>
                    </div>

                    <FormField label="Business Address" error={dealerForm.formState.errors.address?.message}>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 size-4 text-muted-foreground" />
                        <Textarea
                          placeholder="Full business address"
                          {...dealerForm.register('address')}
                          className="pl-10 bg-background border-border text-foreground text-body-sm placeholder:text-muted-foreground/60 focus-visible:border-gold min-h-[60px]"
                        />
                      </div>
                    </FormField>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <FormField label="IC / SSM Registration No." error={dealerForm.formState.errors.regNo?.message}>
                        <div className="relative">
                          <FileText className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                          <Input
                            placeholder="Registration number"
                            {...dealerForm.register('regNo')}
                            className="h-10 pl-10 bg-background border-border text-foreground text-body-sm placeholder:text-muted-foreground/60 focus-visible:border-gold"
                          />
                        </div>
                      </FormField>

                      <FormField label="City" error={dealerForm.formState.errors.city?.message}>
                        <Select value={dealerForm.watch('city') || ''} onValueChange={(v) => dealerForm.setValue('city', v)}>
                          <SelectTrigger className="h-10 bg-background border-border text-foreground text-body-sm">
                            <SelectValue placeholder="Select city" />
                          </SelectTrigger>
                          <SelectContent className="bg-card border-border">
                            {CITIES.filter((c) => c !== 'All Cities').map((city) => (
                              <SelectItem key={city} value={city} className="text-foreground focus:bg-muted">
                                {city}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormField>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <UploadBox
                        label="Upload IC / SSM Document"
                        uploaded={dealDocUploaded}
                        onUpload={(file) => handleFileUpload(file, () => setDealDocUploaded(true))}
                        fileInputRef={dealDocRef}
                      />
                    </div>

                    <Separator className="bg-border" />
                    <h4 className="text-caption font-semibold text-gold flex items-center gap-2">
                      <CreditCard className="size-3.5" /> Bank Details
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <FormField label="Bank Name" error={dealerForm.formState.errors.bankName?.message}>
                        <Select value={dealerForm.watch('bankName') || ''} onValueChange={(v) => dealerForm.setValue('bankName', v)}>
                          <SelectTrigger className="h-10 bg-background border-border text-foreground text-body-sm">
                            <SelectValue placeholder="Select bank" />
                          </SelectTrigger>
                          <SelectContent className="bg-card border-border">
                            {['Maybank', 'CIMB', 'Hong Leong Bank', 'Public Bank', 'RHB', 'AmBank', 'Bank Islam', 'Bank Rakyat'].map((b) => (
                              <SelectItem key={b} value={b} className="text-foreground focus:bg-muted">{b}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormField>

                      <FormField label="Account Number" error={dealerForm.formState.errors.bankAccount?.message}>
                        <Input
                          placeholder="Bank account number"
                          {...dealerForm.register('bankAccount')}
                          className="h-10 bg-background border-border text-foreground text-body-sm placeholder:text-muted-foreground/60 focus-visible:border-gold"
                        />
                      </FormField>

                      <div className="sm:col-span-2">
                        <FormField label="Account Holder Name" error={dealerForm.formState.errors.bankHolder?.message}>
                          <Input
                            placeholder="Name as per bank account"
                            {...dealerForm.register('bankHolder')}
                            className="h-10 bg-background border-border text-foreground text-body-sm placeholder:text-muted-foreground/60 focus-visible:border-gold"
                          />
                        </FormField>
                      </div>
                    </div>

                    {/* Agree to terms */}
                    <div className="flex items-start gap-2">
                      <Checkbox
                        id="deal-agree"
                        checked={dealerForm.watch('agree') as boolean}
                        onCheckedChange={(v) => dealerForm.setValue('agree', !!v as true)}
                        className="border-border mt-1"
                      />
                      <label htmlFor="deal-agree" className="text-caption text-muted-foreground leading-relaxed cursor-pointer">
                        I agree to the <span className="text-gold">Terms of Service</span>, <span className="text-gold">Privacy Policy</span>, and <span className="text-gold">Dealer Agreement</span>
                      </label>
                    </div>
                    {dealerForm.formState.errors.agree && (
                      <p className="text-caption text-error -mt-2">{dealerForm.formState.errors.agree.message}</p>
                    )}

                    {/* Global error */}
                    {error && (
                      <div className="p-3 rounded-lg bg-error/10 border border-error/30 text-error text-body-sm flex items-center gap-2" role="alert">
                        <AlertCircle className="size-4 shrink-0" />
                        {error}
                      </div>
                    )}

                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full h-11 bg-gold hover:bg-gold-light text-gold-dark font-semibold rounded-lg disabled:opacity-50"
                    >
                      {loading ? 'Registering...' : <>Register as Dealer <ArrowRight className="size-4 ml-1" /></>}
                    </Button>
                  </form>
                )}
              </div>
            )}

            <Separator className="bg-border my-5" />
            <div className="flex items-center justify-center gap-4 text-muted-foreground">
              <div className="flex items-center gap-1 text-caption"><Shield className="size-3.5 text-gold" />Secure</div>
              <div className="flex items-center gap-1 text-caption"><CheckCircle className="size-3.5 text-gold" />Verified</div>
              <div className="flex items-center gap-1 text-caption"><Lock className="size-3.5 text-gold" />Encrypted</div>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-caption text-muted-foreground mt-6">
          By continuing, you agree to DK Vroom&apos;s Terms &amp; Conditions
        </p>
      </div>
    </div>
  )
}
