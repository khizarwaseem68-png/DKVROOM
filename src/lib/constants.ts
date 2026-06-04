// ============================================================
// DK Vroom — Design System Constants
// Central source of truth for formatting, enumerations, and configuration
// ============================================================

// ===== FORMATTING =====

export function formatPrice(amount: number, type?: string): string {
  const formatted = amount.toLocaleString('en-MY')
  if (type === 'rent') return `RM ${formatted}/day`
  if (type === 'continueLoan') return `RM ${formatted}/mo`
  return `RM ${formatted}`
}

export function formatMileage(km: number): string {
  if (km >= 1000) return `${(km / 1000).toFixed(0)}K km`
  return `${km} km`
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-MY', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-MY', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// ===== FEE LABELS BY MODULE =====

export function getFeeLabel(type: string): string {
  switch (type) {
    case 'rent': return 'Booking Fee'
    case 'sale': case 'purchase': return 'Verified Contact Access Fee'
    case 'continueLoan': return 'Application Fee'
    case 'auction': return 'Bid Deposit'
    case 'workshop': return 'Appointment Fee'
    case 'insurance': return 'Processing Fee'
    default: return 'Access Fee'
  }
}

// ===== VEHICLE TYPES =====

export type VehicleType = 'rent' | 'sale' | 'auction' | 'continueLoan'

export const VEHICLE_TYPE_CONFIG: Record<VehicleType, { label: string; color: string }> = {
  rent: { label: 'For Rent', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  sale: { label: 'For Sale', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  auction: { label: 'Auction', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  continueLoan: { label: 'Continue Loan', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
}

// ===== CITIES =====

export const CITIES = [
  'All Cities', 'Kuala Lumpur', 'Selangor', 'Petaling Jaya', 'Subang Jaya', 'Shah Alam',
  'Johor Bahru', 'Penang', 'Ipoh', 'Melaka', 'Kota Kinabalu', 'Kuching',
  'Seremban', 'Kuantan', 'Kuala Terengganu', 'Alor Setar', 'Perlis',
  'Sabah', 'Sarawak', 'Pahang', 'Terengganu', 'Kelantan', 'Kedah',
  'Miri', 'Sandakan', 'Labuan', 'Putrajaya', 'Cyberjaya',
] as const

// ===== CAR BRANDS =====

export const BRANDS = [
  'All Brands', 'Perodua', 'Proton', 'Honda', 'Toyota', 'Nissan', 'Mazda',
  'BMW', 'Mercedes-Benz', 'Audi', 'Volkswagen', 'Volvo', 'Lexus',
  'Hyundai', 'Kia', 'Mitsubishi', 'Subaru', 'Suzuki', 'Ford',
  'Peugeot', 'Renault', 'Porsche', 'Lamborghini',
] as const

export const FUEL_TYPES = ['Petrol', 'Diesel', 'Electric', 'Hybrid'] as const
export const TRANSMISSION_TYPES = ['Automatic', 'Manual'] as const

// ===== CONDITION CATEGORIES (Auction) =====

export const CONDITION_CATEGORIES = [
  { key: 'running', label: 'Running', color: 'text-emerald-400', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/30', description: 'Good running condition vehicles' },
  { key: 'used', label: 'Used', color: 'text-blue-400', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/30', description: 'Used vehicles with wear' },
  { key: 'accident', label: 'Accident', color: 'text-orange-400', bgColor: 'bg-orange-500/10', borderColor: 'border-orange-500/30', description: 'Accident damaged vehicles' },
  { key: 'wreck', label: 'Wreck', color: 'text-red-400', bgColor: 'bg-red-500/10', borderColor: 'border-red-500/30', description: 'Severely damaged / wreck vehicles' },
  { key: 'salvage', label: 'Salvage', color: 'text-purple-400', bgColor: 'bg-purple-500/10', borderColor: 'border-purple-500/30', description: 'Salvage title vehicles' },
  { key: 'insurance_writeoff', label: 'Insurance Write-off', color: 'text-pink-400', bgColor: 'bg-pink-500/10', borderColor: 'border-pink-500/30', description: 'Insurance write-off vehicles' },
  { key: 'rebuild_project', label: 'Rebuild Project', color: 'text-cyan-400', bgColor: 'bg-cyan-500/10', borderColor: 'border-cyan-500/30', description: 'Ideal for rebuild / project cars' },
] as const

export type ConditionCategory = typeof CONDITION_CATEGORIES[number]['key']

// ===== RUNNING STATUS =====

export const RUNNING_STATUS: Record<string, { label: string; color: string }> = {
  running: { label: 'Running', color: 'text-emerald-400' },
  non_running: { label: 'Non-Running', color: 'text-red-400' },
  starts_but_issues: { label: 'Starts but Issues', color: 'text-amber-400' },
}

// ===== SALVAGE STATUS =====

export const SALVAGE_STATUS: Record<string, { label: string; color: string }> = {
  clean: { label: 'Clean Title', color: 'text-emerald-400' },
  salvage: { label: 'Salvage', color: 'text-orange-400' },
  rebuilt: { label: 'Rebuilt', color: 'text-blue-400' },
}

// ===== DEALER TYPES =====

export const DEALER_TYPES = [
  { key: 'used_car', label: 'Used Car Dealer' },
  { key: 'rental', label: 'Rental Company' },
  { key: 'workshop', label: 'Workshop' },
  { key: 'insurance', label: 'Insurance Agent' },
  { key: 'auction', label: 'Auction House' },
  { key: 'loan', label: 'Loan Provider' },
] as const

// ===== EMPLOYMENT TYPES =====

export const EMPLOYMENT_TYPES = [
  { key: 'employed', label: 'Employed (Salaried)' },
  { key: 'self-employed', label: 'Self-Employed' },
  { key: 'government', label: 'Government Servant' },
] as const

// ===== SERVICE TYPES (Workshop) =====

export const SERVICE_TYPES = [
  { key: 'general_service', label: 'General Service' },
  { key: 'engine_repair', label: 'Engine Repair' },
  { key: 'bodywork', label: 'Bodywork & Paint' },
  { key: 'electrical', label: 'Electrical' },
  { key: 'tire_battery', label: 'Tire & Battery' },
  { key: 'ac_service', label: 'A/C Service' },
  { key: 'others', label: 'Others' },
] as const

// ===== INSURANCE COVERAGE TYPES =====

export const INSURANCE_COVERAGE_TYPES = [
  { key: 'comprehensive', label: 'Comprehensive' },
  { key: 'third_party', label: 'Third Party' },
  { key: 'third_party_fire_theft', label: 'Third Party, Fire & Theft' },
] as const

// ===== PAYMENT METHODS =====

export const PAYMENT_METHODS = [
  { key: 'qr_manual', label: 'QR Payment (Manual)', description: 'Scan QR and upload receipt' },
  { key: 'fpx', label: 'FPX Online Banking', description: 'Direct bank transfer' },
  { key: 'tng', label: 'Touch n Go', description: 'Touch n Go eWallet' },
  { key: 'bank_transfer', label: 'Bank Transfer', description: 'Direct bank-in' },
] as const

// ===== BANKS =====

export const BANKS = [
  'Maybank', 'CIMB', 'Hong Leong Bank', 'Public Bank', 'RHB',
  'AmBank', 'Bank Islam', 'BSN', 'Bank Rakyat', 'UOB', 'OCBC',
] as const

// ===== LOAN TENURES =====

export const LOAN_TENURES = [
  { value: '5', label: '5 Years' },
  { value: '7', label: '7 Years' },
  { value: '9', label: '9 Years' },
] as const

// ===== LOAN TYPES =====

export const LOAN_TYPES = [
  { value: 'newCar', label: 'New Car' },
  { value: 'usedCar', label: 'Used Car' },
  { value: 'continueLoan', label: 'Continue Loan' },
] as const

// ===== STATUS COLORS =====

export const STATUS_COLORS: Record<string, string> = {
  // Booking statuses
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  payment_pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  payment_uploaded: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  confirmed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  completed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  cancelled: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  disputed: 'bg-purple-500/20 text-purple-400 border-purple-500/30',

  // Payment statuses
  uploaded: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  verified: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  failed: 'bg-red-500/20 text-red-400 border-red-500/30',
  rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
  refunded: 'bg-purple-500/20 text-purple-400 border-purple-500/30',

  // Car statuses
  approved: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  sold: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  booked: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  inactive: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  available: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',

  // Loan statuses
  reviewing: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  disbursed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',

  // Continue Loan statuses
  agreement_sent: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  agreement_signed: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  deposit_paid: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  handover_complete: 'bg-teal-500/20 text-teal-400 border-teal-500/30',

  // Insurance statuses
  quoted: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  accepted: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  expired: 'bg-gray-500/20 text-gray-400 border-gray-500/30',

  // Workshop statuses
  in_progress: 'bg-blue-500/20 text-blue-400 border-blue-500/30',

  // General
  none: 'bg-gray-500/20 text-gray-400 border-gray-500/30',

  // Review statuses
  published: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  hidden: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  flagged: 'bg-red-500/20 text-red-400 border-red-500/30',
}

export function getStatusColor(status: string): string {
  return STATUS_COLORS[status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'
}

export function getStatusLabel(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

// ===== CONTINUE LOAN FLOW STEPS =====

export const CONTINUE_LOAN_STEPS = [
  { step: 1, key: 'pending', label: 'Enquiry Submitted', desc: 'Your interest is sent to the vehicle owner' },
  { step: 2, key: 'agreement_sent', label: 'Agreement Sent', desc: 'Owner sends agreement for your review' },
  { step: 3, key: 'agreement_signed', label: 'Agreement Signed', desc: 'Both parties sign the agreement' },
  { step: 4, key: 'deposit_paid', label: 'Deposit Paid', desc: 'You pay the takeover deposit' },
  { step: 5, key: 'handover_complete', label: 'Vehicle Handover', desc: 'Physical handover and inspection' },
  { step: 6, key: 'completed', label: 'Completed', desc: 'All documents verified and ownership transferred' },
] as const

// ===== DOCUMENT TYPES =====

export const LOAN_DOCUMENTS = {
  ic: [
    { key: 'icFront', label: 'IC Front' },
    { key: 'icBack', label: 'IC Back' },
  ],
  payslip: [
    { key: 'payslip1', label: 'Month 1' },
    { key: 'payslip2', label: 'Month 2' },
    { key: 'payslip3', label: 'Month 3' },
  ],
  bankStatement: [
    { key: 'bankStatement1', label: 'Month 1' },
    { key: 'bankStatement2', label: 'Month 2' },
    { key: 'bankStatement3', label: 'Month 3' },
  ],
  additional: [
    { key: 'epfStatement', label: 'EPF Statement' },
    { key: 'utilityBill', label: 'Utility Bill' },
    { key: 'drivingLicense', label: 'Driving License' },
  ],
} as const

export const CONTINUE_LOAN_DOCUMENTS = [
  { key: 'customerIc', label: 'IC (MyKad)', accept: '.pdf,.jpg,.jpeg,.png', required: true },
  { key: 'drivingLicense', label: 'Driving License', accept: '.pdf,.jpg,.jpeg,.png', required: true },
  { key: 'policeReport', label: 'Police Report (if applicable)', accept: '.pdf,.jpg,.jpeg,.png', required: false },
  { key: 'payslip', label: '3 Months Payslip', accept: '.pdf,.jpg,.jpeg,.png', required: true },
  { key: 'bankStatement', label: '3 Months Bank Statement', accept: '.pdf,.jpg,.jpeg,.png', required: true },
] as const

export const ALLOWED_FILE_TYPES = '.pdf,.jpg,.jpeg,.png'
export const MAX_FILE_SIZE_MB = 5
