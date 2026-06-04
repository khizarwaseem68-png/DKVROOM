'use client'

import { useState, useRef, useCallback, Fragment } from 'react'
import { useRouter } from 'next/navigation'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
  ArrowLeft,
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
  X,
  KeyRound,
} from 'lucide-react'

// ============================================================
// Zod Schemas
// ============================================================

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginFormData = z.infer<typeof loginSchema>

const phoneRegex = /^[+()\-\s0-9]{7,20}$/
const passwordMessage = 'Password must be at least 8 characters'

const customerSchema = z.object({
  name: z.string().min(1, 'Full name is required'),
  email: z.string().min(1, 'Email is required').email('Please enter a valid email'),
  phone: z.string().min(1, 'Phone number is required').regex(phoneRegex, 'Please enter a valid phone number'),
  whatsapp: z.string().optional(),
  password: z.string().min(8, passwordMessage),
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
  phone: z.string().min(1, 'Phone number is required').regex(phoneRegex, 'Please enter a valid phone number'),
  whatsapp: z.string().optional(),
  password: z.string().min(8, passwordMessage),
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

type RegistrationPayload = Record<string, unknown> & {
  email: string
  role: 'customer' | 'dealer'
}

// ============================================================
// Step definitions
// ============================================================

const CUSTOMER_STEPS = [
  { label: 'Personal Info', icon: User },
  { label: 'Security', icon: Lock },
  { label: 'Address & Docs', icon: FileText },
  { label: 'Review', icon: CheckCircle },
]

const DEALER_STEPS = [
  { label: 'Business', icon: Building2 },
  { label: 'Contact & Account', icon: User },
  { label: 'Banking & Docs', icon: CreditCard },
  { label: 'Review', icon: CheckCircle },
]

// ============================================================
// Sub-components
// ============================================================

function Stepper({
  steps,
  currentStep,
}: {
  steps: typeof CUSTOMER_STEPS
  currentStep: number
}) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8" role="navigation" aria-label="Registration steps">
      {steps.map((step, i) => (
        <Fragment key={i}>
          {i > 0 && (
            <div className={`h-0.5 w-8 sm:w-12 transition-colors duration-300 ${
              i <= currentStep ? 'bg-gold' : 'bg-border'
            }`} />
          )}
          <div className="flex flex-col items-center gap-1.5">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
              i < currentStep
                ? 'bg-gold text-primary-foreground'
                : i === currentStep
                  ? 'bg-gold/20 text-gold border-2 border-gold'
                  : 'bg-secondary text-muted-foreground border border-border'
            }`}>
              {i < currentStep ? <CheckCircle className="size-4" /> : i + 1}
            </div>
            <span className={`text-[10px] sm:text-xs text-center max-w-[60px] transition-colors duration-300 ${
              i === currentStep ? 'text-gold font-medium' : 'text-muted-foreground'
            }`}>{step.label}</span>
          </div>
        </Fragment>
      ))}
    </div>
  )
}

function FileUploadBox({
  label,
  fileInfo,
  onUpload,
  onRemove,
  fileInputRef,
  uploading,
}: {
  label: string
  fileInfo: File | null
  onUpload: (file: File) => void
  onRemove: () => void
  fileInputRef: React.RefObject<HTMLInputElement | null>
  uploading?: boolean
}) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.size <= 5 * 1024 * 1024) {
      onUpload(file)
    }
    // Reset the input value so the same file can be re-selected
    e.target.value = ''
  }

  return (
    <div className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
      fileInfo
        ? 'border-success/40 bg-success/5'
        : 'border-dashed border-border bg-background hover:border-gold/50 cursor-pointer'
    }`}
      role={!fileInfo ? 'button' : undefined}
      tabIndex={!fileInfo ? 0 : undefined}
      onClick={() => {
        if (!fileInfo && !uploading) fileInputRef.current?.click()
      }}
      onKeyDown={(e) => {
        if (!fileInfo && !uploading && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          fileInputRef.current?.click()
        }
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,application/pdf"
        className="hidden"
        onChange={handleFileChange}
      />
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
          fileInfo ? 'bg-success/10' : 'bg-muted'
        }`}>
          {uploading ? (
            <div className="size-5 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
          ) : fileInfo ? (
            <CheckCircle className="size-5 text-success" />
          ) : (
            <Upload className="size-5 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          {fileInfo ? (
            <>
              <p className="text-body-sm font-medium text-success truncate" title={fileInfo.name}>
                {fileInfo.name}
              </p>
              <p className="text-caption text-muted-foreground">
                {(fileInfo.size / 1024).toFixed(1)} KB
              </p>
            </>
          ) : (
            <>
              <p className="text-body-sm font-medium text-foreground">{label}</p>
              <p className="text-caption text-muted-foreground">JPG, PNG, PDF (max 5MB)</p>
            </>
          )}
        </div>
        {fileInfo && !uploading && (
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-2 py-1 text-caption text-gold hover:text-gold-light hover:bg-gold/10 rounded transition-colors cursor-pointer"
            >
              Change
            </button>
            <button
              type="button"
              onClick={onRemove}
              className="p-1 text-muted-foreground hover:text-error hover:bg-error/10 rounded transition-colors cursor-pointer"
              aria-label="Remove file"
            >
              <X className="size-4" />
            </button>
          </div>
        )}
      </div>
    </div>
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

function ReviewRow({ label, value }: { label: string; value: string | undefined | null }) {
  return (
    <div className="flex justify-between items-start py-1.5 border-b border-border/50 last:border-0">
      <span className="text-caption text-muted-foreground shrink-0">{label}</span>
      <span className="text-body-sm text-foreground text-right ml-4 break-all">{value || '—'}</span>
    </div>
  )
}

// ============================================================
// Main Component
// ============================================================

export default function AuthPage({ initialMode }: { initialMode?: 'login' | 'register' }) {
  const { login } = useAppStore()
  const router = useRouter()
  const [mode, setMode] = useState<'login' | 'register'>(initialMode || 'login')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [regRole, setRegRole] = useState<'customer' | 'dealer'>('customer')
  const [loginRole, setLoginRole] = useState<'customer' | 'dealer' | 'admin'>('customer')
  const [otpOpen, setOtpOpen] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [otpEmail, setOtpEmail] = useState('')
  const [otpPurpose, setOtpPurpose] = useState<'registration' | 'forgot_password'>('registration')
  const [otpLoading, setOtpLoading] = useState(false)
  const [otpError, setOtpError] = useState<string | null>(null)
  const [pendingRegistration, setPendingRegistration] = useState<RegistrationPayload | null>(null)
  const [resetEmail, setResetEmail] = useState('')
  const [resetPassword, setResetPassword] = useState('')
  const [resetConfirmPassword, setResetConfirmPassword] = useState('')
  const [resetVerificationToken, setResetVerificationToken] = useState<string | null>(null)

  // Stepper state
  const [custStep, setCustStep] = useState(0)
  const [dealerStep, setDealerStep] = useState(0)

  // File upload states — capture file + URL
  const [custICFile, setCustICFile] = useState<File | null>(null)
  const [custLicenseFile, setCustLicenseFile] = useState<File | null>(null)
  const [dealerDocFile, setDealerDocFile] = useState<File | null>(null)
  const [custICUploading, setCustICUploading] = useState(false)
  const [custLicenseUploading, setCustLicenseUploading] = useState(false)
  const [dealerDocUploading, setDealerDocUploading] = useState(false)

  // File refs
  const custICRef = useRef<HTMLInputElement>(null)
  const custLicenseRef = useRef<HTMLInputElement>(null)
  const dealerDocRef = useRef<HTMLInputElement>(null)

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
    setCustStep(0)
    setDealerStep(0)
    setCustICFile(null)
    setCustLicenseFile(null)
    setDealerDocFile(null)
  }, [customerForm, dealerForm])

  // ===== FILE HANDLER =====
  const handleFileSelect = (
    file: File,
    onSelected: (file: File) => void,
    setUploading: (v: boolean) => void,
  ) => {
    setUploading(true)
    onSelected(file)
    setUploading(false)
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
    dealer?: { id: string; companyName: string; verified: boolean; rejectedAt?: string | null; rating: number; [key: string]: unknown } | null
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

  function getDealerDestination(user: { role: string; dealer?: { verified?: boolean; rejectedAt?: string | null } | null }) {
    if (user.role !== 'dealer') return '/'
    return user.dealer?.verified && !user.dealer?.rejectedAt ? '/dealer-dashboard' : '/dealer-status'
  }

  const [pendingFileMap, setPendingFileMap] = useState<Record<string, File | null> | null>(null)

  const startOtpFlow = async (
    email: string,
    purpose: 'registration' | 'forgot_password',
    pendingData?: RegistrationPayload,
    fileMap?: Record<string, File | null>
  ) => {
    setOtpLoading(true)
    setOtpError(null)
    setError(null)
    try {
      await authApi.sendOtp(email, purpose)
      setOtpEmail(email)
      setOtpPurpose(purpose)
      setOtpCode('')
      setPendingRegistration(pendingData || null)
      setPendingFileMap(fileMap || null)
      setResetVerificationToken(null)
      setOtpOpen(true)
      setSuccess('OTP sent to your email.')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send OTP. Please try again.'
      if (purpose === 'registration') setError(message)
      else setOtpError(message)
    } finally {
      setOtpLoading(false)
    }
  }

  const completeRegistration = async (payload: RegistrationPayload, emailVerificationToken: string) => {
    const result = await authApi.register({ ...payload, emailVerificationToken }, pendingFileMap || undefined)
    const userState = mapUserState(result.user)
    login(userState, result.token)
    setPendingFileMap(null)
    if (result.user.role === 'dealer') router.push(getDealerDestination(result.user))
    else router.push('/')
  }

  const handleVerifyOtp = async () => {
    setOtpLoading(true)
    setOtpError(null)
    try {
      const result = await authApi.verifyOtp(otpEmail, otpCode, otpPurpose)
      const verificationToken = result.verificationToken || result.data?.verificationToken
      if (!verificationToken) throw new Error('OTP verified, but verification token was missing.')

      if (otpPurpose === 'registration') {
        if (!pendingRegistration) throw new Error('Registration data expired. Please submit the form again.')
        await completeRegistration(pendingRegistration, verificationToken)
        setOtpOpen(false)
      } else {
        setResetVerificationToken(verificationToken)
        setSuccess('Email verified. Enter your new password.')
      }

      setOtpCode('')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'OTP verification failed. Please try again.'
      setOtpError(message)
    } finally {
      setOtpLoading(false)
    }
  }

  const handleForgotPasswordClick = async () => {
    const email = loginForm.getValues('email') || resetEmail
    if (!email) {
      setOtpError('Enter your email first, then click forgot password.')
      setOtpEmail('')
      setOtpPurpose('forgot_password')
      setOtpOpen(true)
      return
    }
    setResetEmail(email)
    await startOtpFlow(email, 'forgot_password')
  }

  const handleResetPassword = async () => {
    setOtpLoading(true)
    setOtpError(null)
    try {
      if (!resetVerificationToken) throw new Error('Please verify your email OTP first.')
      if (resetPassword !== resetConfirmPassword) throw new Error('Passwords do not match.')
      if (resetPassword.length < 8) throw new Error(passwordMessage)
      await authApi.resetPassword(resetEmail || otpEmail, resetPassword, resetVerificationToken)
      setResetPassword('')
      setResetConfirmPassword('')
      setResetVerificationToken(null)
      setSuccess('Password reset successfully. You can sign in now.')
      setOtpOpen(false)
    } catch (err: unknown) {
      setOtpError(err instanceof Error ? err.message : 'Failed to reset password.')
    } finally {
      setOtpLoading(false)
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
      if (result.user.role === 'admin') router.push('/admin-dashboard')
      else if (result.user.role === 'dealer') router.push(getDealerDestination(result.user))
      else router.push('/')
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
        drivingLicense: data.licenseNumber || undefined,
      }
      const fileMap = {
        icDocument: custICFile,
        licenseDocument: custLicenseFile,
      }
      await startOtpFlow(data.email, 'registration', userData, fileMap)
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
        companyName: data.companyName,
        dealerType: data.dealerType,
        address: data.address || undefined,
        registrationNo: data.regNo || undefined,
        city: data.city || undefined,
        bankName: data.bankName || undefined,
        bankAccountNumber: data.bankAccount || undefined,
        bankAccountHolder: data.bankHolder || undefined,
      }
      const fileMap = {
        registrationDoc: dealerDocFile,
      }
      await startOtpFlow(data.email, 'registration', userData, fileMap)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed. Please try again.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  // ===== STEP NAVIGATION — CUSTOMER =====
  const goCustNext = async () => {
    setError(null)
    if (custStep === 0) {
      const valid = await customerForm.trigger(['name', 'phone', 'whatsapp', 'email'])
      if (valid) setCustStep(1)
    } else if (custStep === 1) {
      const valid = await customerForm.trigger(['password', 'confirmPassword'])
      if (valid) setCustStep(2)
    } else if (custStep === 2) {
      const valid = await customerForm.trigger(['address', 'icNumber', 'licenseNumber'])
      if (valid) setCustStep(3)
    }
  }

  const goCustBack = () => {
    setError(null)
    if (custStep > 0) setCustStep(custStep - 1)
  }

  // ===== STEP NAVIGATION — DEALER =====
  const goDealerNext = async () => {
    setError(null)
    if (dealerStep === 0) {
      const valid = await dealerForm.trigger(['companyName', 'dealerType', 'address', 'regNo', 'city'])
      if (valid) setDealerStep(1)
    } else if (dealerStep === 1) {
      const valid = await dealerForm.trigger(['contactName', 'phone', 'whatsapp', 'email', 'password', 'confirmPassword'])
      if (valid) setDealerStep(2)
    } else if (dealerStep === 2) {
      const valid = await dealerForm.trigger(['bankName', 'bankAccount', 'bankHolder'])
      if (valid) setDealerStep(3)
    }
  }

  const goDealerBack = () => {
    setError(null)
    if (dealerStep > 0) setDealerStep(dealerStep - 1)
  }

  // ===== DEMO CREDS =====
  const demoCredentials = [
    { role: 'customer' as const, label: 'Customer', email: 'ahmad@dkvroom.com', password: '12345678', color: 'bg-gold/10 text-gold border-gold/30 hover:bg-gold/20' },
    { role: 'dealer' as const, label: 'Dealer', email: 'prestige@dkvroom.com', password: '12345678', color: 'bg-info/10 text-info border-info/30 hover:bg-info/20' },
    { role: 'admin' as const, label: 'Admin', email: 'admin@dkvroom.com', password: '12345678', color: 'bg-error/10 text-error border-error/30 hover:bg-error/20' },
  ]

  // Helper to get dealer type label
  const getDealerTypeLabel = (key: string) => {
    return DEALER_TYPES.find((dt) => dt.key === key)?.label || key
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      {/* Background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gold/3 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-2xl">
        {/* Logo */}
        <div className="text-center mb-8">
          <button onClick={() => router.push('/')} className="inline-flex items-center gap-2 mb-4 cursor-pointer" type="button">
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
                className={`flex-1 py-2.5 text-body-sm font-medium rounded-md transition-all cursor-pointer ${
                  mode === 'login' ? 'bg-gold text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Sign In
              </button>
              <button
                role="tab"
                aria-selected={mode === 'register'}
                onClick={() => switchMode('register')}
                className={`flex-1 py-2.5 text-body-sm font-medium rounded-md transition-all cursor-pointer ${
                  mode === 'register' ? 'bg-gold text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
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
                    <button type="button" onClick={handleForgotPasswordClick} className="text-caption text-gold hover:underline ml-auto">Forgot password?</button>
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
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-gold cursor-pointer"
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
                  className="w-full h-11 bg-gold hover:bg-gold-light text-primary-foreground font-semibold rounded-lg disabled:opacity-50"
                >
                  {loading ? 'Signing In...' : <>Sign In <ArrowRight className="size-4 ml-1" /></>}
                </Button>
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
                      className={`p-3 rounded-lg border text-body-sm font-medium transition-all cursor-pointer ${
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
                      className={`p-3 rounded-lg border text-body-sm font-medium transition-all cursor-pointer ${
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

                {/* ===== CUSTOMER REGISTRATION — STEPPER ===== */}
                {regRole === 'customer' && (
                  <div>
                    <h3 className="text-body-sm font-semibold text-gold flex items-center gap-2 mb-4">
                      <User className="size-4" /> Customer Registration
                    </h3>

                    <Stepper steps={CUSTOMER_STEPS} currentStep={custStep} />

                    {/* Step 1: Personal Information */}
                    {custStep === 0 && (
                      <div className="space-y-4 animate-in fade-in duration-200">
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
                      </div>
                    )}

                    {/* Step 2: Security */}
                    {custStep === 1 && (
                      <div className="space-y-4 animate-in fade-in duration-200">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <FormField label="Password" required error={customerForm.formState.errors.password?.message}>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                              <Input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Min 8 characters"
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
                        <div className="p-3 rounded-lg bg-muted/50 border border-border">
                          <p className="text-caption text-muted-foreground">{passwordMessage}.</p>
                        </div>
                      </div>
                    )}

                    {/* Step 3: Address & Documents */}
                    {custStep === 2 && (
                      <div className="space-y-4 animate-in fade-in duration-200">
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
                          <FileUploadBox
                            label="Upload IC / Passport"
                            fileInfo={custICFile}
                            onUpload={(file) => handleFileSelect(file, setCustICFile, setCustICUploading)}
                            onRemove={() => setCustICFile(null)}
                            fileInputRef={custICRef}
                            uploading={custICUploading}
                          />
                          <FileUploadBox
                            label="Upload Driving License"
                            fileInfo={custLicenseFile}
                            onUpload={(file) => handleFileSelect(file, setCustLicenseFile, setCustLicenseUploading)}
                            onRemove={() => setCustLicenseFile(null)}
                            fileInputRef={custLicenseRef}
                            uploading={custLicenseUploading}
                          />
                        </div>
                      </div>
                    )}

                    {/* Step 4: Review & Submit */}
                    {custStep === 3 && (
                      <div className="space-y-4 animate-in fade-in duration-200">
                        <div className="p-4 rounded-lg bg-background border border-border">
                          <h4 className="text-body-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                            <User className="size-4 text-gold" /> Personal Information
                          </h4>
                          <ReviewRow label="Full Name" value={customerForm.getValues('name')} />
                          <ReviewRow label="Phone" value={customerForm.getValues('phone')} />
                          <ReviewRow label="WhatsApp" value={customerForm.getValues('whatsapp')} />
                          <ReviewRow label="Email" value={customerForm.getValues('email')} />
                        </div>

                        <div className="p-4 rounded-lg bg-background border border-border">
                          <h4 className="text-body-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                            <Lock className="size-4 text-gold" /> Security
                          </h4>
                          <ReviewRow label="Password" value="••••••••" />
                        </div>

                        <div className="p-4 rounded-lg bg-background border border-border">
                          <h4 className="text-body-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                            <FileText className="size-4 text-gold" /> Address & Documents
                          </h4>
                          <ReviewRow label="Address" value={customerForm.getValues('address')} />
                          <ReviewRow label="IC Number" value={customerForm.getValues('icNumber')} />
                          <ReviewRow label="License Number" value={customerForm.getValues('licenseNumber')} />
                          <ReviewRow label="IC Document" value={custICFile?.name || 'Not uploaded'} />
                          <ReviewRow label="License Document" value={custLicenseFile?.name || 'Not uploaded'} />
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
                          <p className="text-caption text-error">{customerForm.formState.errors.agree.message}</p>
                        )}

                        {/* Global error */}
                        {error && (
                          <div className="p-3 rounded-lg bg-error/10 border border-error/30 text-error text-body-sm flex items-center gap-2" role="alert">
                            <AlertCircle className="size-4 shrink-0" />
                            {error}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Navigation buttons */}
                    <div className="flex gap-3 mt-6">
                      {custStep > 0 && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={goCustBack}
                          className="flex-1 h-11 border-border text-foreground hover:bg-muted"
                        >
                          <ArrowLeft className="size-4 mr-1" /> Back
                        </Button>
                      )}
                      {custStep < 3 ? (
                        <Button
                          type="button"
                          onClick={goCustNext}
                          className="flex-1 h-11 bg-gold hover:bg-gold-light text-primary-foreground font-semibold rounded-lg"
                        >
                          Next <ArrowRight className="size-4 ml-1" />
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          disabled={loading}
                          onClick={customerForm.handleSubmit(handleCustomerRegister)}
                          className="flex-1 h-11 bg-gold hover:bg-gold-light text-primary-foreground font-semibold rounded-lg disabled:opacity-50"
                        >
                          {loading ? 'Creating Account...' : <>Create Account <ArrowRight className="size-4 ml-1" /></>}
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {/* ===== DEALER REGISTRATION — STEPPER ===== */}
                {regRole === 'dealer' && (
                  <div>
                    <h3 className="text-body-sm font-semibold text-gold flex items-center gap-2 mb-4">
                      <Building2 className="size-4" /> Dealer Registration
                    </h3>

                    <Stepper steps={DEALER_STEPS} currentStep={dealerStep} />

                    {/* Step 1: Business Details */}
                    {dealerStep === 0 && (
                      <div className="space-y-4 animate-in fade-in duration-200">
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
                      </div>
                    )}

                    {/* Step 2: Contact & Account */}
                    {dealerStep === 1 && (
                      <div className="space-y-4 animate-in fade-in duration-200">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <FormField label="Password" required error={dealerForm.formState.errors.password?.message}>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                              <Input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Min 8 characters"
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

                        <div className="p-3 rounded-lg bg-muted/50 border border-border">
                          <p className="text-caption text-muted-foreground">{passwordMessage}.</p>
                        </div>
                      </div>
                    )}

                    {/* Step 3: Banking & Documents */}
                    {dealerStep === 2 && (
                      <div className="space-y-4 animate-in fade-in duration-200">
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
                        </div>

                        <FormField label="Account Holder Name" error={dealerForm.formState.errors.bankHolder?.message}>
                          <Input
                            placeholder="Name as per bank account"
                            {...dealerForm.register('bankHolder')}
                            className="h-10 bg-background border-border text-foreground text-body-sm placeholder:text-muted-foreground/60 focus-visible:border-gold"
                          />
                        </FormField>

                        <FileUploadBox
                          label="Upload SSM / Registration Document"
                          fileInfo={dealerDocFile}
                          onUpload={(file) => handleFileSelect(file, setDealerDocFile, setDealerDocUploading)}
                          onRemove={() => setDealerDocFile(null)}
                          fileInputRef={dealerDocRef}
                          uploading={dealerDocUploading}
                        />
                      </div>
                    )}

                    {/* Step 4: Review & Submit */}
                    {dealerStep === 3 && (
                      <div className="space-y-4 animate-in fade-in duration-200">
                        {/* Verification notice */}
                        <div className="p-3 rounded-lg bg-gold/5 border border-gold/20">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="size-4 text-gold mt-0.5 shrink-0" />
                            <p className="text-caption text-muted-foreground">Your dealer account will be reviewed and verified by our admin team within 24-48 hours.</p>
                          </div>
                        </div>

                        <div className="p-4 rounded-lg bg-background border border-border">
                          <h4 className="text-body-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                            <Building2 className="size-4 text-gold" /> Business Details
                          </h4>
                          <ReviewRow label="Business Name" value={dealerForm.getValues('companyName')} />
                          <ReviewRow label="Dealer Type" value={getDealerTypeLabel(dealerForm.getValues('dealerType'))} />
                          <ReviewRow label="Registration No." value={dealerForm.getValues('regNo')} />
                          <ReviewRow label="City" value={dealerForm.getValues('city')} />
                          <ReviewRow label="Address" value={dealerForm.getValues('address')} />
                        </div>

                        <div className="p-4 rounded-lg bg-background border border-border">
                          <h4 className="text-body-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                            <User className="size-4 text-gold" /> Contact & Account
                          </h4>
                          <ReviewRow label="Contact Person" value={dealerForm.getValues('contactName')} />
                          <ReviewRow label="Phone" value={dealerForm.getValues('phone')} />
                          <ReviewRow label="WhatsApp" value={dealerForm.getValues('whatsapp')} />
                          <ReviewRow label="Email" value={dealerForm.getValues('email')} />
                          <ReviewRow label="Password" value="••••••••" />
                        </div>

                        <div className="p-4 rounded-lg bg-background border border-border">
                          <h4 className="text-body-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                            <CreditCard className="size-4 text-gold" /> Banking & Documents
                          </h4>
                          <ReviewRow label="Bank Name" value={dealerForm.getValues('bankName')} />
                          <ReviewRow label="Account Number" value={dealerForm.getValues('bankAccount')} />
                          <ReviewRow label="Account Holder" value={dealerForm.getValues('bankHolder')} />
                          <ReviewRow label="SSM / Reg. Doc" value={dealerDocFile?.name || 'Not uploaded'} />
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
                          <p className="text-caption text-error">{dealerForm.formState.errors.agree.message}</p>
                        )}

                        {/* Global error */}
                        {error && (
                          <div className="p-3 rounded-lg bg-error/10 border border-error/30 text-error text-body-sm flex items-center gap-2" role="alert">
                            <AlertCircle className="size-4 shrink-0" />
                            {error}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Navigation buttons */}
                    <div className="flex gap-3 mt-6">
                      {dealerStep > 0 && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={goDealerBack}
                          className="flex-1 h-11 border-border text-foreground hover:bg-muted"
                        >
                          <ArrowLeft className="size-4 mr-1" /> Back
                        </Button>
                      )}
                      {dealerStep < 3 ? (
                        <Button
                          type="button"
                          onClick={goDealerNext}
                          className="flex-1 h-11 bg-gold hover:bg-gold-light text-primary-foreground font-semibold rounded-lg"
                        >
                          Next <ArrowRight className="size-4 ml-1" />
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          disabled={loading}
                          onClick={dealerForm.handleSubmit(handleDealerRegister)}
                          className="flex-1 h-11 bg-gold hover:bg-gold-light text-primary-foreground font-semibold rounded-lg disabled:opacity-50"
                        >
                          {loading ? 'Registering...' : <>Register as Dealer <ArrowRight className="size-4 ml-1" /></>}
                        </Button>
                      )}
                    </div>
                  </div>
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

      <Dialog open={otpOpen} onOpenChange={(open) => {
        setOtpOpen(open)
        if (!open) {
          setOtpError(null)
          setOtpCode('')
        }
      }}>
        <DialogContent className="bg-card border-border text-foreground">
          <DialogHeader>
            <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-gold/10">
              <KeyRound className="size-6 text-gold" />
            </div>
            <DialogTitle className="text-center">
              {otpPurpose === 'registration' ? 'Verify your email' : resetVerificationToken ? 'Set a new password' : 'Reset your password'}
            </DialogTitle>
            <DialogDescription className="text-center">
              {resetVerificationToken
                ? 'Your email is verified. Choose a secure new password.'
                : `Enter the 6-digit OTP sent to ${otpEmail || 'your email'}.`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {otpPurpose === 'forgot_password' && !otpEmail && (
              <FormField label="Email" required>
                <Input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="bg-background border-border text-foreground"
                />
              </FormField>
            )}

            {!resetVerificationToken ? (
              <>
                <Input
                  inputMode="numeric"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="h-14 bg-background border-border text-center text-2xl tracking-[0.5em] text-foreground placeholder:tracking-normal"
                />
                <div className="flex gap-2">
                  {otpPurpose === 'forgot_password' && !otpEmail ? (
                    <Button
                      type="button"
                      disabled={otpLoading || !resetEmail}
                      onClick={() => startOtpFlow(resetEmail, 'forgot_password')}
                      className="flex-1 bg-gold hover:bg-gold-light text-primary-foreground"
                    >
                      {otpLoading ? 'Sending...' : 'Send OTP'}
                    </Button>
                  ) : (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={otpLoading}
                        onClick={() => startOtpFlow(otpEmail, otpPurpose, pendingRegistration || undefined)}
                        className="flex-1 border-border text-foreground hover:bg-muted"
                      >
                        Resend
                      </Button>
                      <Button
                        type="button"
                        disabled={otpLoading || otpCode.length !== 6}
                        onClick={handleVerifyOtp}
                        className="flex-1 bg-gold hover:bg-gold-light text-primary-foreground"
                      >
                        {otpLoading ? 'Verifying...' : 'Verify OTP'}
                      </Button>
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                <FormField label="New Password" required>
                  <Input
                    type="password"
                    value={resetPassword}
                    onChange={(e) => setResetPassword(e.target.value)}
                    placeholder="New password"
                    className="bg-background border-border text-foreground"
                  />
                </FormField>
                <FormField label="Confirm Password" required>
                  <Input
                    type="password"
                    value={resetConfirmPassword}
                    onChange={(e) => setResetConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="bg-background border-border text-foreground"
                  />
                </FormField>
                <p className="text-caption text-muted-foreground">{passwordMessage}.</p>
                <Button
                  type="button"
                  disabled={otpLoading}
                  onClick={handleResetPassword}
                  className="w-full bg-gold hover:bg-gold-light text-primary-foreground"
                >
                  {otpLoading ? 'Resetting...' : 'Reset Password'}
                </Button>
              </>
            )}

            {otpError && (
              <div className="rounded-lg border border-error/30 bg-error/10 p-3 text-body-sm text-error">
                {otpError}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
