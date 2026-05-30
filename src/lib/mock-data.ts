// Static reference data and types for DK Vroom
// This file contains only types and static reference data (not database records)

export interface CarData {
  id: string
  brand: string
  model: string
  year: number
  color: string
  mileage: number
  fuelType: string
  transmission: string
  seats: number
  condition: string
  price: number
  deposit?: number
  monthlyInstallment?: number
  remainingMonths?: number
  remainingBalance?: number
  bankName?: string
  location: string
  city: string
  description: string
  features: string[]
  photos: string[]
  featured: boolean
  type: 'rent' | 'sale' | 'auction' | 'continueLoan'
  dealerName: string
  dealerId: string
  dealerVerified: boolean
  rating: number
  vehicleCondition?: string
  requiredDocs?: string[]
  auctionEnd?: string
  auctionStartBid?: number
  currentBid?: number
}

export interface DealerData {
  id: string
  companyName: string
  logo: string
  city: string
  verified: boolean
  rating: number
  totalListings: number
  specialization: string[]
}

// Static reference data (these don't come from the database)
export const cities = [
  'All Cities', 'Kuala Lumpur', 'Selangor', 'Penang', 'Johor', 'Melaka', 'Perak', 'Negeri Sembilan', 'Sabah', 'Sarawak'
]

export const brands = [
  'All Brands', 'BMW', 'Mercedes-Benz', 'Porsche', 'Toyota', 'Honda', 'Perodua', 'Proton', 'Mazda', 'Audi', 'Nissan', 'Lamborghini', 'Volvo', 'Volkswagen', 'Hyundai', 'Kia'
]
