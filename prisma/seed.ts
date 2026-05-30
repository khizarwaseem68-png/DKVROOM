import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

const carPhotos = [
  'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&q=80',
  'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80',
  'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=80',
  'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800&q=80',
  'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&q=80',
  'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=800&q=80',
  'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&q=80',
  'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800&q=80',
  'https://images.unsplash.com/photo-1542362567-b07e54358753?w=800&q=80',
  'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&q=80',
  'https://images.unsplash.com/photo-1606611013016-969c19ba27bb?w=800&q=80',
  'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=800&q=80',
]

async function main() {
  console.log('🌱 Seeding database...')

  // Clean all tables in correct order (reverse dependency)
  await prisma.auditLog.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.auctionBid.deleteMany()
  await prisma.review.deleteMany()
  await prisma.payment.deleteMany()
  await prisma.continueLoanEnquiry.deleteMany()
  await prisma.insuranceEnquiry.deleteMany()
  await prisma.workshopAppointment.deleteMany()
  await prisma.loanApplication.deleteMany()
  await prisma.booking.deleteMany()
  await prisma.car.deleteMany()
  await prisma.dealer.deleteMany()
  await prisma.user.deleteMany()
  await prisma.platformSetting.deleteMany()
  console.log('✅ Cleaned existing data')

  // ============================
  // 1. CREATE ADMIN USER
  // ============================
  const adminPassword = await hash('Admin@123', 12)
  const admin = await prisma.user.create({
    data: {
      email: 'admin@dkvroom.com',
      password: adminPassword,
      name: 'DK Vroom Admin',
      phone: '+60 12-345 0001',
      whatsapp: '+60 12-345 0001',
      role: 'admin',
      verified: true,
      active: true,
    }
  })
  console.log('✅ Admin created: admin@dkvroom.com / Admin@123')

  // ============================
  // 2. CREATE DEALER USERS + DEALER PROFILES
  // ============================
  const dealerData = [
    { companyName: 'Prestige Auto KL', dealerType: 'rental', city: 'Kuala Lumpur', state: 'Wilayah Persekutuan', phone: '+60 12-345 1001', whatsapp: '+60 12-345 1001', email: 'prestige@dkvroom.com', contactPerson: 'Raj Kumar', rating: 4.9, totalListings: 45, bankName: 'Maybank', bankAcc: '5123-4567-8901', bankHolder: 'Prestige Auto KL Sdn Bhd' },
    { companyName: 'Merc Gallery MY', dealerType: 'used_car', city: 'Kuala Lumpur', state: 'Wilayah Persekutuan', phone: '+60 12-345 1002', whatsapp: '+60 12-345 1002', email: 'mercgallery@dkvroom.com', contactPerson: 'Sarah Tan', rating: 4.8, totalListings: 38, bankName: 'CIMB', bankAcc: '6234-5678-9012', bankHolder: 'Merc Gallery MY Sdn Bhd' },
    { companyName: 'Stuttgart Motors', dealerType: 'rental', city: 'Selangor', state: 'Selangor', phone: '+60 12-345 1003', whatsapp: '+60 12-345 1003', email: 'stuttgart@dkvroom.com', contactPerson: 'Hans Mueller', rating: 5.0, totalListings: 22, bankName: 'Hong Leong Bank', bankAcc: '7345-6789-0123', bankHolder: 'Stuttgart Motors Sdn Bhd' },
    { companyName: 'Southern Auto Hub', dealerType: 'used_car', city: 'Johor', state: 'Johor', phone: '+60 12-345 1004', whatsapp: '+60 12-345 1004', email: 'southern@dkvroom.com', contactPerson: 'Ali Hassan', rating: 4.5, totalListings: 120, bankName: 'Public Bank', bankAcc: '8456-7890-1234', bankHolder: 'Southern Auto Hub Sdn Bhd' },
    { companyName: 'Honda Power Zone', dealerType: 'used_car', city: 'Selangor', state: 'Selangor', phone: '+60 12-345 1005', whatsapp: '+60 12-345 1005', email: 'hondapower@dkvroom.com', contactPerson: 'Lim Wei Jie', rating: 4.7, totalListings: 65, bankName: 'RHB', bankAcc: '9567-8901-2345', bankHolder: 'Honda Power Zone Sdn Bhd' },
    { companyName: 'MyviMart Shah Alam', dealerType: 'used_car', city: 'Selangor', state: 'Selangor', phone: '+60 12-345 1006', whatsapp: '+60 12-345 1006', email: 'myvimart@dkvroom.com', contactPerson: 'Nurul Aisyah', rating: 4.3, totalListings: 90, bankName: 'AmBank', bankAcc: '1678-9012-3456', bankHolder: 'MyviMart Shah Alam Sdn Bhd' },
    { companyName: 'Bavarian Motors KL', dealerType: 'used_car', city: 'Kuala Lumpur', state: 'Wilayah Persekutuan', phone: '+60 12-345 1007', whatsapp: '+60 12-345 1007', email: 'bavarian@dkvroom.com', contactPerson: 'David Kumar', rating: 4.8, totalListings: 35, bankName: 'Maybank', bankAcc: '2789-0123-4567', bankHolder: 'Bavarian Motors KL Sdn Bhd' },
    { companyName: 'Supercars Asia', dealerType: 'auction', city: 'Kuala Lumpur', state: 'Wilayah Persekutuan', phone: '+60 12-345 1008', whatsapp: '+60 12-345 1008', email: 'supercars@dkvroom.com', contactPerson: 'James Wong', rating: 4.9, totalListings: 15, bankName: 'CIMB', bankAcc: '3890-1234-5678', bankHolder: 'Supercars Asia Sdn Bhd' },
    { companyName: 'JDM Legends MY', dealerType: 'auction', city: 'Kuala Lumpur', state: 'Wilayah Persekutuan', phone: '+60 12-345 1009', whatsapp: '+60 12-345 1009', email: 'jdmlegends@dkvroom.com', contactPerson: 'Kenji Tanaka', rating: 4.7, totalListings: 18, bankName: 'Hong Leong Bank', bankAcc: '4901-2345-6789', bankHolder: 'JDM Legends MY Sdn Bhd' },
    { companyName: 'Proton Elite Penang', dealerType: 'used_car', city: 'Penang', state: 'Penang', phone: '+60 12-345 1010', whatsapp: '+60 12-345 1010', email: 'protonelite@dkvroom.com', contactPerson: 'Amirul Azmi', rating: 4.4, totalListings: 55, bankName: 'Bank Islam', bankAcc: '5012-3456-7890', bankHolder: 'Proton Elite Penang Sdn Bhd' },
    { companyName: 'Zoom-Zoom Auto', dealerType: 'used_car', city: 'Selangor', state: 'Selangor', phone: '+60 12-345 1011', whatsapp: '+60 12-345 1011', email: 'zoomzoom@dkvroom.com', contactPerson: 'Farah Ismail', rating: 4.6, totalListings: 40, bankName: 'Bank Rakyat', bankAcc: '6123-4567-8901', bankHolder: 'Zoom-Zoom Auto Sdn Bhd' },
    { companyName: 'Four Rings Garage', dealerType: 'rental', city: 'Selangor', state: 'Selangor', phone: '+60 12-345 1012', whatsapp: '+60 12-345 1012', email: 'fourrings@dkvroom.com', contactPerson: 'Ahmad Faiz', rating: 4.8, totalListings: 25, bankName: 'Public Bank', bankAcc: '7234-5678-9012', bankHolder: 'Four Rings Garage Sdn Bhd' },
    { companyName: 'AutoFix Workshop', dealerType: 'workshop', city: 'Kuala Lumpur', state: 'Wilayah Persekutuan', phone: '+60 12-345 1013', whatsapp: '+60 12-345 1013', email: 'autofix@dkvroom.com', contactPerson: 'Muthu Selvan', rating: 4.6, totalListings: 0, bankName: 'Maybank', bankAcc: '8345-6789-0123', bankHolder: 'AutoFix Workshop Sdn Bhd' },
    { companyName: 'KK Workshop & Parts', dealerType: 'workshop', city: 'Selangor', state: 'Selangor', phone: '+60 12-345 1014', whatsapp: '+60 12-345 1014', email: 'kkworkshop@dkvroom.com', contactPerson: 'Kumar Nair', rating: 4.4, totalListings: 0, bankName: 'CIMB', bankAcc: '9456-7890-1234', bankHolder: 'KK Workshop & Parts Sdn Bhd' },
    { companyName: 'Shield Insurance MY', dealerType: 'insurance', city: 'Kuala Lumpur', state: 'Wilayah Persekutuan', phone: '+60 12-345 1015', whatsapp: '+60 12-345 1015', email: 'shieldins@dkvroom.com', contactPerson: 'Linda Ooi', rating: 4.7, totalListings: 0, bankName: 'RHB', bankAcc: '1567-8901-2345', bankHolder: 'Shield Insurance MY Sdn Bhd' },
    { companyName: 'CovCare Insurance', dealerType: 'insurance', city: 'Selangor', state: 'Selangor', phone: '+60 12-345 1016', whatsapp: '+60 12-345 1016', email: 'covcare@dkvroom.com', contactPerson: 'Susan Liew', rating: 4.5, totalListings: 0, bankName: 'AmBank', bankAcc: '2678-9012-3456', bankHolder: 'CovCare Insurance Sdn Bhd' },
  ]

  const dealers: any[] = []
  for (const d of dealerData) {
    const password = await hash('Dealer@123', 12)
    const user = await prisma.user.create({
      data: {
        email: d.email,
        password,
        name: d.contactPerson,
        phone: d.phone,
        whatsapp: d.whatsapp,
        role: 'dealer',
        verified: true,
        active: true,
      }
    })
    const dealer = await prisma.dealer.create({
      data: {
        userId: user.id,
        companyName: d.companyName,
        dealerType: d.dealerType,
        contactPerson: d.contactPerson,
        city: d.city,
        state: d.state,
        phone: d.phone,
        whatsapp: d.whatsapp,
        address: `${d.companyName}, Jalan Utama, ${d.city}, ${d.state}`,
        registrationNo: `SSM-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        verified: true,
        verifiedAt: new Date(),
        verifiedBy: admin.id,
        rating: d.rating,
        totalListings: d.totalListings,
        bankName: d.bankName,
        bankAccountNumber: d.bankAcc,
        bankAccountHolder: d.bankHolder,
        subscriptionTier: d.rating >= 4.8 ? 'premium' : 'basic',
        operatingHours: JSON.stringify({ mon: '9:00-18:00', tue: '9:00-18:00', wed: '9:00-18:00', thu: '9:00-18:00', fri: '9:00-18:00', sat: '9:00-14:00', sun: 'Closed' }),
      }
    })
    dealers.push(dealer)
  }
  console.log(`✅ Created ${dealers.length} dealers (login: [email] / Dealer@123)`)

  // ============================
  // 3. CREATE CUSTOMER USERS
  // ============================
  const customerData = [
    { name: 'Ahmad Razak', email: 'ahmad@dkvroom.com', phone: '+60 19-876 0001', whatsapp: '+60 19-876 0001', ic: '901234-56-7890', license: 'B2-90123456' },
    { name: 'Sarah Tan', email: 'sarah@dkvroom.com', phone: '+60 17-654 0002', whatsapp: '+60 17-654 0002', ic: '920456-78-9012', license: 'D-92045678' },
    { name: 'Lim Wei Jie', email: 'limwj@dkvroom.com', phone: '+60 16-543 0003', whatsapp: '+60 16-543 0003', ic: '950678-01-2345', license: 'B2-95067890' },
    { name: 'Nurul Aisyah', email: 'nurul@dkvroom.com', phone: '+60 14-321 0004', whatsapp: '+60 14-321 0004', ic: '960789-12-3456', license: 'D-96078901' },
    { name: 'David Kumar', email: 'david@dkvroom.com', phone: '+60 18-765 0005', whatsapp: '+60 18-765 0005', ic: '880901-23-4567', license: 'B2-88090123' },
    { name: 'Wei Ming', email: 'weiming@dkvroom.com', phone: '+60 12-987 0006', whatsapp: '+60 12-987 0006', ic: '930234-45-6789', license: 'D-93023456' },
    { name: 'Siti Aminah', email: 'siti@dkvroom.com', phone: '+60 13-876 0007', whatsapp: '+60 13-876 0007', ic: '970567-89-0123', license: 'B2-97056789' },
    { name: 'Rajesh Nair', email: 'rajesh@dkvroom.com', phone: '+60 15-765 0008', whatsapp: '+60 15-765 0008', ic: '890890-01-2345', license: 'D-89089012' },
  ]

  const customers: any[] = []
  for (const c of customerData) {
    const password = await hash('Customer@123', 12)
    const user = await prisma.user.create({
      data: {
        email: c.email,
        password,
        name: c.name,
        phone: c.phone,
        whatsapp: c.whatsapp,
        icNumber: c.ic,
        drivingLicense: c.license,
        address: `${Math.floor(Math.random() * 100) + 1}, Jalan ${c.name.split(' ')[0]}, 50000 Kuala Lumpur`,
        role: 'customer',
        verified: true,
        active: true,
      }
    })
    customers.push(user)
  }
  console.log(`✅ Created ${customers.length} customers (login: [email] / Customer@123)`)

  // ============================
  // 4. CREATE CAR LISTINGS
  // ============================
  const carData = [
    // RENTAL CARS
    { dealerIdx: 0, type: 'rent', brand: 'BMW', model: 'M4 Competition', year: 2023, color: 'Alpine White', mileage: 12000, fuelType: 'petrol', transmission: 'auto', seats: 4, condition: 'certified', price: 680, weeklyPrice: 4200, monthlyPrice: 15000, deposit: 5000, location: 'KLCC, Kuala Lumpur', city: 'Kuala Lumpur', state: 'Wilayah Persekutuan', features: ['M Sport Package', 'Harman Kardon Sound', 'Head-Up Display', 'Adaptive LED', 'M Carbon Bucket Seats', 'Launch Control'], photos: [0, 1], description: 'Experience the thrill of the BMW M4 Competition. Twin-turbo inline-6 with 503hp, M Sport exhaust, and adaptive M suspension. Perfect for those who demand performance and luxury.', featured: true, pickupAvailable: true, deliveryAvailable: true, deliveryFee: 150, rentalTerms: JSON.stringify({ minAge: 23, minLicense: 2, depositRequired: true, insuranceIncluded: true, mileageLimit: '300km/day', excessCharge: 'RM 0.80/km' }) },
    { dealerIdx: 2, type: 'rent', brand: 'Porsche', model: '911 Turbo S', year: 2023, color: 'GT Silver Metallic', mileage: 8000, fuelType: 'petrol', transmission: 'auto', seats: 2, condition: 'certified', price: 1200, weeklyPrice: 7500, monthlyPrice: 28000, deposit: 10000, location: 'Petaling Jaya', city: 'Selangor', state: 'Selangor', features: ['Sport Chrono Package', 'PASM', 'Ceramic Brakes', 'Sport Exhaust', 'Porsche Communication Management', 'LED Matrix Lights'], photos: [4, 5], description: 'The ultimate expression of Porsche performance. 640hp twin-turbo flat-six, 0-100 in 2.7 seconds. Available for daily or weekly rental.', featured: true, pickupAvailable: true, deliveryAvailable: true, deliveryFee: 300, rentalTerms: JSON.stringify({ minAge: 25, minLicense: 3, depositRequired: true, insuranceIncluded: true, mileageLimit: '200km/day', excessCharge: 'RM 1.20/km' }) },
    { dealerIdx: 4, type: 'rent', brand: 'Honda', model: 'Civic Type R', year: 2023, color: 'Championship White', mileage: 15000, fuelType: 'petrol', transmission: 'manual', seats: 5, condition: 'certified', price: 380, weeklyPrice: 2400, monthlyPrice: 8500, deposit: 1000, location: 'Cyberjaya', city: 'Selangor', state: 'Selangor', features: ['Brembo Brakes', 'Adaptive Damper System', 'Rev Match Control', 'Honda Sensing', 'Bose Premium Audio', 'Limited Slip Diff'], photos: [8, 9], description: 'The hottest hatchback returns! 315hp VTEC turbo with 6-speed manual. Track-ready with daily drivability. Available for weekend specials.', featured: true, pickupAvailable: true, deliveryAvailable: false, deliveryFee: 0, rentalTerms: JSON.stringify({ minAge: 21, minLicense: 1, depositRequired: true, insuranceIncluded: true, mileageLimit: '350km/day', excessCharge: 'RM 0.50/km' }) },
    { dealerIdx: 11, type: 'rent', brand: 'Audi', model: 'RS6 Avant', year: 2022, color: 'Nardo Grey', mileage: 22000, fuelType: 'petrol', transmission: 'auto', seats: 5, condition: 'certified', price: 1500, weeklyPrice: 9500, monthlyPrice: 35000, deposit: 8000, location: 'Kota Kemuning', city: 'Selangor', state: 'Selangor', features: ['Quattro AWD', 'Carbon Ceramic Brakes', 'Dynamic Package Plus', 'Matrix LED', 'Bang & Olufsen 3D', 'Air Suspension'], photos: [3, 0], description: 'The ultimate super-wagon. 591hp twin-turbo V8, Quattro AWD, and carbon ceramic brakes. Daily usability meets supercar performance.', featured: true, pickupAvailable: true, deliveryAvailable: true, deliveryFee: 250, rentalTerms: JSON.stringify({ minAge: 25, minLicense: 3, depositRequired: true, insuranceIncluded: true, mileageLimit: '250km/day', excessCharge: 'RM 1.00/km' }) },
    { dealerIdx: 0, type: 'rent', brand: 'Mercedes-Benz', model: 'C300 AMG Line', year: 2023, color: 'Obsidian Black', mileage: 18000, fuelType: 'petrol', transmission: 'auto', seats: 5, condition: 'used', price: 450, weeklyPrice: 2800, monthlyPrice: 10000, deposit: 3000, location: 'Bangsar, Kuala Lumpur', city: 'Kuala Lumpur', state: 'Wilayah Persekutuan', features: ['AMG Line Package', 'MBUX System', 'Burmester Sound', '360 Camera', 'Digital Cockpit', 'Ambient Lighting'], photos: [2, 7], description: 'Elegant Mercedes C300 in stunning Obsidian Black with AMG Line package. Perfect for business trips and special occasions.', featured: false, pickupAvailable: true, deliveryAvailable: true, deliveryFee: 100, rentalTerms: JSON.stringify({ minAge: 21, minLicense: 1, depositRequired: true, insuranceIncluded: true, mileageLimit: '400km/day', excessCharge: 'RM 0.40/km' }) },

    // SALE CARS
    { dealerIdx: 1, type: 'sale', brand: 'Mercedes-Benz', model: 'S-Class S580', year: 2024, color: 'Obsidian Black', mileage: 5000, fuelType: 'hybrid', transmission: 'auto', seats: 5, condition: 'new', price: 898000, bookingFee: 500, location: 'Bangsar, Kuala Lumpur', city: 'Kuala Lumpur', state: 'Wilayah Persekutuan', features: ['MBUX Hyperscreen', 'Burmester 4D Sound', 'Executive Rear Seats', 'Air Balance', '360 Camera', 'Digital Light'], photos: [2, 3], description: 'The pinnacle of luxury sedans. The S580 features a 4.0L V8 biturbo with EQ Boost, MBUX Hyperscreen, and executive rear seating.', featured: true },
    { dealerIdx: 3, type: 'sale', brand: 'Toyota', model: 'Camry 2.5V', year: 2022, color: 'Phantom Grey', mileage: 35000, fuelType: 'petrol', transmission: 'auto', seats: 5, condition: 'used', price: 138000, bookingFee: 200, location: 'Johor Bahru', city: 'Johor', state: 'Johor', features: ['Toyota Safety Sense', 'Leather Seats', 'Sunroof', 'JBL Sound System', 'Dual Zone Climate', 'Smart Entry'], photos: [6, 7], description: 'Well-maintained Toyota Camry 2.5V with full service history. Reliable, comfortable, and fuel-efficient. One owner, accident-free.', featured: false },
    { dealerIdx: 9, type: 'sale', brand: 'Proton', model: 'X70 Executive', year: 2022, color: 'Snow White', mileage: 42000, fuelType: 'petrol', transmission: 'auto', seats: 5, condition: 'used', price: 88000, bookingFee: 100, location: 'Penang', city: 'Penang', state: 'Penang', features: ['Proton Safety Suite', 'Panoramic Sunroof', 'Leather Seats', 'GKUI Infotainment', '360 Camera', 'Auto Park Assist'], photos: [10, 11], description: 'Popular Proton X70 in excellent condition. Full service history, one owner, accident-free. Great value for a premium C-segment SUV.', featured: false },
    { dealerIdx: 1, type: 'sale', brand: 'BMW', model: '320i M Sport', year: 2023, color: 'Portimao Blue', mileage: 12000, fuelType: 'petrol', transmission: 'auto', seats: 5, condition: 'certified', price: 248000, bookingFee: 300, location: 'Damansara Heights', city: 'Kuala Lumpur', state: 'Wilayah Persekutuan', features: ['M Sport Package', 'BMW Live Cockpit', 'Harman Kardon', 'Parking Assistant Plus', 'Digital Key', 'Ambient Lighting'], photos: [1, 0], description: 'Stunning BMW 320i M Sport in Portimao Blue. Low mileage, full BMW service history. The perfect balance of sport and luxury.', featured: true },
    { dealerIdx: 3, type: 'sale', brand: 'Honda', model: 'HR-V RS', year: 2023, color: 'Crystal Black Pearl', mileage: 25000, fuelType: 'petrol', transmission: 'auto', seats: 5, condition: 'used', price: 125000, bookingFee: 150, location: 'Iskandar Puteri', city: 'Johor', state: 'Johor', features: ['Honda Sensing', 'Panoramic Sunroof', 'Leather Seats', 'Wireless Charger', 'RS Body Kit', 'LED Headlights'], photos: [8, 6], description: 'Sporty Honda HR-V RS in Crystal Black Pearl. RS body kit, Honda Sensing, and panoramic sunroof. Low mileage, excellent condition.', featured: false },

    // CONTINUE LOAN CARS
    { dealerIdx: 5, type: 'continueLoan', brand: 'Perodua', model: 'Myvi 1.5 AV', year: 2023, color: 'Granite Grey', mileage: 20000, fuelType: 'petrol', transmission: 'auto', seats: 5, condition: 'used', price: 52000, monthlyInstallment: 698, remainingMonths: 60, remainingBalance: 41880, takeoverAmount: 3000, bankName: 'Maybank', deposit: 3000, location: 'Shah Alam', city: 'Selangor', state: 'Selangor', features: ['ASA 3.0 Safety', 'LED Headlamps', 'Smart Infotainment', 'Push Start Button', 'LED DRL', '9" Touchscreen'], photos: [10, 11], description: 'Continue loan available for this well-maintained Perodua Myvi 1.5 AV. Low mileage, full service record, accident-free. Takeover with easy bank approval.', featured: false, vehicleCondition: 'Excellent - No scratches, no dents, full service history at Perodua SC', requiredDocs: JSON.stringify(['IC (MyKad)', '3 months payslip', 'Bank statement (3 months)', 'EPF statement', 'Utility bill', 'Driving license']) },
    { dealerIdx: 6, type: 'continueLoan', brand: 'BMW', model: 'X5 xDrive40i', year: 2022, color: 'Carbon Black', mileage: 28000, fuelType: 'petrol', transmission: 'auto', seats: 7, condition: 'used', price: 298000, monthlyInstallment: 3200, remainingMonths: 48, remainingBalance: 153600, takeoverAmount: 15000, bankName: 'CIMB', deposit: 15000, location: 'Damansara Heights', city: 'Kuala Lumpur', state: 'Wilayah Persekutuan', features: ['M Sport Package', 'Panoramic Roof', 'BMW Live Cockpit', 'Driving Assistant Professional', 'Comfort Access', 'Harman Kardon'], photos: [1, 3], description: 'Premium BMW X5 available for continue loan. M Sport package, panoramic roof, and full BMW ConnectedDrive. Well-maintained by single owner.', featured: true, vehicleCondition: 'Very Good - Minor wear on driver seat, otherwise pristine', requiredDocs: JSON.stringify(['IC (MyKad)', '3 months payslip', 'Bank statement (3 months)', 'EPF statement', 'Utility bill', 'Driving license', 'Employment letter']) },
    { dealerIdx: 10, type: 'continueLoan', brand: 'Mazda', model: 'CX-5 Turbo', year: 2023, color: 'Soul Red Crystal', mileage: 18000, fuelType: 'petrol', transmission: 'auto', seats: 5, condition: 'used', price: 165000, monthlyInstallment: 1850, remainingMonths: 54, remainingBalance: 99900, takeoverAmount: 8000, bankName: 'Hong Leong Bank', deposit: 8000, location: 'Subang Jaya', city: 'Selangor', state: 'Selangor', features: ['i-Activ AWD', 'Bose Sound', 'Head-Up Display', 'Leather Seats', 'Power Liftgate', 'Apple CarPlay / Android Auto'], photos: [7, 8], description: 'Stunning Mazda CX-5 Turbo in Soul Red Crystal. Continue loan available with easy approval process. Well-maintained with full service record.', featured: false, vehicleCondition: 'Excellent - Like new, no modifications, original paint', requiredDocs: JSON.stringify(['IC (MyKad)', '3 months payslip', 'Bank statement (3 months)', 'EPF statement', 'Utility bill', 'Driving license']) },
    { dealerIdx: 5, type: 'continueLoan', brand: 'Toyota', model: 'Vios 1.5G', year: 2021, color: 'Silver Metallic', mileage: 48000, fuelType: 'petrol', transmission: 'auto', seats: 5, condition: 'used', price: 75000, monthlyInstallment: 880, remainingMonths: 42, remainingBalance: 36960, takeoverAmount: 2000, bankName: 'Public Bank', deposit: 2000, location: 'Shah Alam', city: 'Selangor', state: 'Selangor', features: ['Toyota Safety Sense', 'LED Headlamps', 'Smart Entry', 'Push Start', '9" Touchscreen', 'Reverse Camera'], photos: [6, 9], description: 'Reliable Toyota Vios 1.5G available for continue loan. Low monthly commitment, perfect for first-time buyers.', featured: false, vehicleCondition: 'Good - Regular maintenance, minor scratch on rear bumper', requiredDocs: JSON.stringify(['IC (MyKad)', '3 months payslip', 'Bank statement (3 months)', 'EPF statement', 'Utility bill', 'Driving license']) },

    // AUCTION CARS
    { dealerIdx: 7, type: 'auction', brand: 'Lamborghini', model: 'Huracan EVO', year: 2021, color: 'Verde Mantis', mileage: 6000, fuelType: 'petrol', transmission: 'auto', seats: 2, condition: 'certified', price: 880000, auctionStartBid: 750000, auctionReserve: 820000, currentBid: 810000, location: 'Mont Kiara', city: 'Kuala Lumpur', state: 'Wilayah Persekutuan', features: ['LDVI System', 'Carbon Ceramic Brakes', 'Lifting System', 'ALA 2.0 Aero', 'Bang & Olufsen', 'Full LED Lighting'], photos: [5, 4], description: 'Rare opportunity to own a Lamborghini Huracan EVO in striking Verde Mantis. 631hp V10 with LDVI system. Full dealer service history, ceramic brakes, and lifting system.', featured: true, auctionEnd: new Date('2026-06-15T18:00:00Z'), auctionActive: true },
    { dealerIdx: 8, type: 'auction', brand: 'Nissan', model: 'GT-R NISMO', year: 2020, color: 'Vibrant Red', mileage: 12000, fuelType: 'petrol', transmission: 'auto', seats: 2, condition: 'certified', price: 1200000, auctionStartBid: 980000, auctionReserve: 1050000, currentBid: 1050000, location: 'Bukit Jalil', city: 'Kuala Lumpur', state: 'Wilayah Persekutuan', features: ['NISMO Suspension', 'Carbon Fibre Aero', 'Rays Forged Wheels', 'NISMO Exhaust', 'Brembo Brakes', 'Track Package'], photos: [9, 6], description: 'Legendary Godzilla. GT-R NISMO with 600hp hand-assembled VR38DETT. NISMO-tuned suspension, carbon fibre aero, and race-bred engineering.', featured: true, auctionEnd: new Date('2026-06-20T20:00:00Z'), auctionActive: true },
  ]

  const cars: any[] = []
  for (const c of carData) {
    const dealer = dealers[c.dealerIdx]
    const dealerUser = await prisma.user.findUnique({ where: { id: dealer.userId } })
    if (!dealerUser) continue

    const car = await prisma.car.create({
      data: {
        dealerId: dealer.id,
        userId: dealerUser.id,
        type: c.type,
        brand: c.brand,
        model: c.model,
        year: c.year,
        color: c.color,
        mileage: c.mileage,
        fuelType: c.fuelType,
        transmission: c.transmission,
        seats: c.seats,
        condition: c.condition,
        price: c.price,
        weeklyPrice: c.weeklyPrice || null,
        monthlyPrice: c.monthlyPrice || null,
        deposit: c.deposit || null,
        bookingFee: c.bookingFee || null,
        monthlyInstallment: c.monthlyInstallment || null,
        remainingMonths: c.remainingMonths || null,
        remainingBalance: c.remainingBalance || null,
        takeoverAmount: c.takeoverAmount || null,
        bankName: c.bankName || null,
        vehicleCondition: c.vehicleCondition || null,
        requiredDocs: c.requiredDocs || null,
        auctionStartBid: c.auctionStartBid || null,
        auctionReserve: c.auctionReserve || null,
        currentBid: c.currentBid || null,
        auctionEnd: c.auctionEnd || null,
        auctionActive: c.auctionActive || false,
        rentalTerms: c.rentalTerms || null,
        pickupAvailable: c.pickupAvailable ?? true,
        deliveryAvailable: c.deliveryAvailable ?? false,
        deliveryFee: c.deliveryFee || null,
        location: c.location,
        city: c.city,
        state: c.state,
        description: c.description,
        features: JSON.stringify(c.features),
        photos: JSON.stringify(c.photos.map((i: number) => carPhotos[i])),
        featured: c.featured,
        status: 'approved',
        approvedAt: new Date(),
        approvedBy: admin.id,
        views: Math.floor(Math.random() * 500) + 50,
        enquiries: Math.floor(Math.random() * 30) + 2,
        active: true,
      }
    })
    cars.push(car)
  }
  console.log(`✅ Created ${cars.length} car listings`)

  // ============================
  // 5. CREATE BOOKINGS + PAYMENTS
  // ============================
  const bookingData = [
    { customerIdx: 0, carIdx: 0, type: 'rent', startDate: new Date('2026-06-01'), endDate: new Date('2026-06-05'), amount: 3400, status: 'confirmed', contactUnlocked: true },
    { customerIdx: 1, carIdx: 1, type: 'purchase', startDate: null, endDate: null, amount: 500, status: 'payment_pending', contactUnlocked: false },
    { customerIdx: 2, carIdx: 2, type: 'rent', startDate: new Date('2026-06-08'), endDate: new Date('2026-06-10'), amount: 3600, status: 'confirmed', contactUnlocked: true },
    { customerIdx: 3, carIdx: 8, type: 'continueLoan', startDate: null, endDate: null, amount: 3000, status: 'pending', contactUnlocked: false },
    { customerIdx: 4, carIdx: 3, type: 'rent', startDate: new Date('2026-06-15'), endDate: new Date('2026-06-20'), amount: 7500, status: 'confirmed', contactUnlocked: true },
    { customerIdx: 5, carIdx: 13, type: 'rent', startDate: new Date('2026-06-12'), endDate: new Date('2026-06-14'), amount: 3000, status: 'pending', contactUnlocked: false },
  ]

  for (const b of bookingData) {
    const customer = customers[b.customerIdx]
    const car = cars[b.carIdx]
    const dealer = dealers[carData[b.carIdx].dealerIdx]

    const booking = await prisma.booking.create({
      data: {
        carId: car.id,
        userId: customer.id,
        dealerId: dealer.id,
        type: b.type,
        startDate: b.startDate,
        endDate: b.endDate,
        status: b.status,
        totalAmount: b.amount,
        platformFee: b.amount * 0.05,
        contactUnlocked: b.contactUnlocked,
        unlockedAt: b.contactUnlocked ? new Date() : null,
      }
    })

    // Create payment for each booking
    await prisma.payment.create({
      data: {
        userId: customer.id,
        dealerId: dealer.id,
        bookingId: booking.id,
        amount: b.amount,
        platformFee: b.amount * 0.05,
        dealerPayout: b.amount * 0.95,
        method: 'qr_manual',
        paymentType: b.type === 'rent' ? 'booking' : b.type === 'purchase' ? 'enquiry_fee' : 'deposit',
        qrReference: 'QR' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase(),
        qrGeneratedAt: new Date(),
        status: b.contactUnlocked ? 'verified' : (b.status === 'payment_pending' ? 'pending' : 'uploaded'),
        receiptUploadedAt: b.status !== 'payment_pending' ? new Date() : null,
        verifiedAt: b.contactUnlocked ? new Date() : null,
        verifiedBy: b.contactUnlocked ? admin.id : null,
        contactUnlocked: b.contactUnlocked,
        unlockedAt: b.contactUnlocked ? new Date() : null,
      }
    })
  }
  console.log(`✅ Created ${bookingData.length} bookings with payments`)

  // ============================
  // 6. CREATE LOAN APPLICATIONS
  // ============================
  const loanData = [
    { customerIdx: 0, carIdx: 8, type: 'continueLoan', amount: 41880, tenure: 60, monthlyIncome: 5000, employmentType: 'employed', employerName: 'Petronas', bankName: 'Maybank', status: 'pending' },
    { customerIdx: 1, carIdx: 9, type: 'continueLoan', amount: 153600, tenure: 48, monthlyIncome: 12000, employmentType: 'employed', employerName: 'Maybank', bankName: 'CIMB', status: 'reviewing' },
    { customerIdx: 2, carIdx: 10, type: 'continueLoan', amount: 99900, tenure: 54, monthlyIncome: 8000, employmentType: 'self-employed', employerName: 'Self', bankName: 'Hong Leong Bank', status: 'approved', approvedAmount: 99900, approvedTenure: 54, interestRate: 3.5, monthlyRepayment: 1850 },
    { customerIdx: 3, carIdx: 11, type: 'loan', amount: 62000, tenure: 60, monthlyIncome: 4000, employmentType: 'government', employerName: 'Kementerian Pendidikan', bankName: 'Maybank', status: 'rejected', rejectionReason: 'Insufficient income for requested amount' },
    { customerIdx: 4, carIdx: 4, type: 'loan', amount: 85000, tenure: 84, monthlyIncome: 6500, employmentType: 'employed', employerName: 'Telekom Malaysia', bankName: 'Public Bank', status: 'pending' },
  ]

  for (const l of loanData) {
    const customer = customers[l.customerIdx]
    const car = cars[l.carIdx]
    const dealer = dealers[carData[l.carIdx].dealerIdx]

    await prisma.loanApplication.create({
      data: {
        userId: customer.id,
        carId: car.id,
        dealerId: dealer.id,
        type: l.type,
        amount: l.amount,
        tenure: l.tenure,
        monthlyIncome: l.monthlyIncome,
        employmentType: l.employmentType,
        employerName: l.employerName,
        bankName: l.bankName,
        status: l.status,
        approvedAmount: l.approvedAmount || null,
        approvedTenure: l.approvedTenure || null,
        interestRate: l.interestRate || null,
        monthlyRepayment: l.monthlyRepayment || null,
        rejectionReason: l.rejectionReason || null,
        reviewedAt: l.status !== 'pending' ? new Date() : null,
        reviewedBy: l.status !== 'pending' ? admin.id : null,
      }
    })
  }
  console.log(`✅ Created ${loanData.length} loan applications`)

  // ============================
  // 7. CREATE AUCTION BIDS
  // ============================
  // Bids on the Lamborghini
  const auction1Car = cars[15] // Lamborghini
  const auction2Car = cars[16] // GT-R NISMO

  if (auction1Car) {
    const bids1 = [
      { userIdx: 4, amount: 760000, isWinning: false },
      { userIdx: 5, amount: 790000, isWinning: false },
      { userIdx: 6, amount: 810000, isWinning: true },
    ]
    for (const bid of bids1) {
      await prisma.auctionBid.create({
        data: {
          carId: auction1Car.id,
          userId: customers[bid.userIdx].id,
          amount: bid.amount,
          status: bid.isWinning ? 'winning' : 'outbid',
          isWinning: bid.isWinning,
        }
      })
    }
  }

  if (auction2Car) {
    const bids2 = [
      { userIdx: 7, amount: 990000, isWinning: false },
      { userIdx: 0, amount: 1020000, isWinning: false },
      { userIdx: 1, amount: 1050000, isWinning: true },
    ]
    for (const bid of bids2) {
      await prisma.auctionBid.create({
        data: {
          carId: auction2Car.id,
          userId: customers[bid.userIdx].id,
          amount: bid.amount,
          status: bid.isWinning ? 'winning' : 'outbid',
          isWinning: bid.isWinning,
        }
      })
    }
  }
  console.log('✅ Created auction bids')

  // ============================
  // 8. CREATE REVIEWS
  // ============================
  const reviewData = [
    { customerIdx: 0, carIdx: 0, rating: 5, comment: 'Incredible driving experience! The M4 Competition is a beast on the road. Dealer was very professional.' },
    { customerIdx: 2, carIdx: 2, rating: 5, comment: 'Porsche 911 Turbo S is simply amazing. 0-100 in 2.7 seconds is no joke. Highly recommended!' },
    { customerIdx: 4, carIdx: 3, rating: 4, comment: 'Audi RS6 is the perfect daily supercar. Great for family and track days. Minor issue with pickup time.' },
    { customerIdx: 0, carIdx: 4, rating: 4, comment: 'Nice C300, very comfortable ride. Perfect for business trips around KL.' },
    { customerIdx: 1, carIdx: 1, rating: 5, comment: 'The S-Class is truly the pinnacle of luxury. MBUX Hyperscreen is mind-blowing!' },
  ]

  for (const r of reviewData) {
    await prisma.review.create({
      data: {
        carId: cars[r.carIdx].id,
        userId: customers[r.customerIdx].id,
        rating: r.rating,
        comment: r.comment,
      }
    })
  }
  console.log(`✅ Created ${reviewData.length} reviews`)

  // ============================
  // 9. CREATE WORKSHOP APPOINTMENTS
  // ============================
  const workshopDealers = dealers.filter(d => d.dealerType === 'workshop')
  if (workshopDealers.length > 0) {
    const appointmentData = [
      { customerIdx: 0, dealerIdx: 12, serviceType: 'general_service', vehicleBrand: 'Honda', vehicleModel: 'Civic', vehicleYear: 2022, issueDescription: 'Regular 50,000km service required', preferredDate: new Date('2026-06-10') },
      { customerIdx: 3, dealerIdx: 13, serviceType: 'engine_repair', vehicleBrand: 'Perodua', vehicleModel: 'Myvi', vehicleYear: 2021, issueDescription: 'Engine making unusual noise when accelerating', preferredDate: new Date('2026-06-12') },
      { customerIdx: 5, dealerIdx: 12, serviceType: 'ac_service', vehicleBrand: 'Toyota', vehicleModel: 'Camry', vehicleYear: 2023, issueDescription: 'Air conditioning not cooling properly', preferredDate: new Date('2026-06-08'), status: 'confirmed' },
    ]

    for (const a of appointmentData) {
      const dealer = workshopDealers.find(d => d.id === dealers[a.dealerIdx]?.id) || workshopDealers[0]
      await prisma.workshopAppointment.create({
        data: {
          customerId: customers[a.customerIdx].id,
          dealerId: dealer.id,
          serviceType: a.serviceType,
          vehicleBrand: a.vehicleBrand,
          vehicleModel: a.vehicleModel,
          vehicleYear: a.vehicleYear,
          issueDescription: a.issueDescription,
          preferredDate: a.preferredDate,
          status: a.status || 'pending',
          estimatedCost: a.serviceType === 'general_service' ? 350 : a.serviceType === 'engine_repair' ? 1500 : 280,
        }
      })
    }
    console.log('✅ Created workshop appointments')
  }

  // ============================
  // 10. CREATE INSURANCE ENQUIRIES
  // ============================
  const insuranceDealers = dealers.filter(d => d.dealerType === 'insurance')
  if (insuranceDealers.length > 0) {
    const insuranceData = [
      { customerIdx: 0, dealerIdx: 14, coverageType: 'comprehensive', vehicleBrand: 'BMW', vehicleModel: 'M4', vehicleYear: 2023, age: 30, drivingExperience: 8, ncdPercentage: 55, status: 'quoted', quotedPremium: 8900 },
      { customerIdx: 2, dealerIdx: 15, coverageType: 'comprehensive', vehicleBrand: 'Toyota', vehicleModel: 'Camry', vehicleYear: 2022, age: 28, drivingExperience: 5, ncdPercentage: 40, status: 'pending' },
    ]

    for (const i of insuranceData) {
      const dealer = insuranceDealers.find(d => d.id === dealers[i.dealerIdx]?.id) || insuranceDealers[0]
      await prisma.insuranceEnquiry.create({
        data: {
          customerId: customers[i.customerIdx].id,
          dealerId: dealer.id,
          vehicleBrand: i.vehicleBrand,
          vehicleModel: i.vehicleModel,
          vehicleYear: i.vehicleYear,
          coverageType: i.coverageType,
          age: i.age,
          drivingExperience: i.drivingExperience,
          ncdPercentage: i.ncdPercentage,
          status: i.status,
          quotedPremium: i.quotedPremium || null,
          quotedAt: i.status === 'quoted' ? new Date() : null,
          quoteExpiry: i.status === 'quoted' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null,
        }
      })
    }
    console.log('✅ Created insurance enquiries')
  }

  // ============================
  // 11. CREATE NOTIFICATIONS
  // ============================
  for (let i = 0; i < customers.length; i++) {
    await prisma.notification.createMany({
      data: [
        {
          userId: customers[i].id,
          title: 'Welcome to DK Vroom!',
          message: 'Your account has been created successfully. Start exploring premium vehicles now!',
          type: 'success',
        },
        {
          userId: customers[i].id,
          title: 'New Listings Available',
          message: 'Check out the latest premium vehicles added to our marketplace.',
          type: 'info',
        },
      ]
    })
  }

  // Dealer notifications
  for (const dealer of dealers) {
    const dealerUser = await prisma.user.findUnique({ where: { id: dealer.userId } })
    if (dealerUser) {
      await prisma.notification.create({
        data: {
          userId: dealerUser.id,
          title: 'Dealer Account Verified',
          message: 'Your dealer account has been verified. You can now list vehicles on DK Vroom.',
          type: 'success',
        }
      })
    }
  }
  console.log('✅ Created notifications')

  // ============================
  // 12. CREATE AUDIT LOGS
  // ============================
  const auditActions = [
    { action: 'register', resource: 'user', severity: 'info' },
    { action: 'login', resource: 'user', severity: 'info' },
    { action: 'car_approved', resource: 'car', severity: 'info' },
    { action: 'dealer_verified', resource: 'dealer', severity: 'info' },
    { action: 'payment_verified', resource: 'payment', severity: 'info' },
  ]

  for (const audit of auditActions) {
    for (let i = 0; i < 3; i++) {
      await prisma.auditLog.create({
        data: {
          userId: admin.id,
          action: audit.action,
          resource: audit.resource,
          severity: audit.severity,
          ipAddress: '127.0.0.1',
          userAgent: 'DK Vroom Seed Script',
        }
      })
    }
  }
  console.log('✅ Created audit logs')

  // ============================
  // 13. PLATFORM SETTINGS
  // ============================
  const settings = [
    { key: 'platform_fee_percent', value: '5', description: 'Platform commission percentage on bookings' },
    { key: 'max_login_attempts', value: '5', description: 'Maximum login attempts before account lockout' },
    { key: 'lockout_duration_minutes', value: '15', description: 'Account lockout duration in minutes' },
    { key: 'min_password_length', value: '8', description: 'Minimum password length' },
    { key: 'auction_min_bid_increment_percent', value: '2', description: 'Minimum bid increment percentage for auctions' },
    { key: 'payment_verification_timeout_hours', value: '24', description: 'Hours before unverified payment is flagged' },
    { key: 'listing_approval_required', value: 'true', description: 'Whether new car listings require admin approval' },
    { key: 'dealer_verification_required', value: 'true', description: 'Whether dealer accounts require admin verification' },
    { key: 'max_photos_per_listing', value: '10', description: 'Maximum photos per car listing' },
    { key: 'max_file_size_mb', value: '5', description: 'Maximum file upload size in MB' },
    { key: 'qr_payment_account', value: 'DK VROOM SDN BHD', description: 'QR Payment recipient name' },
    { key: 'support_whatsapp', value: '+60 12-345 0001', description: 'DK Vroom support WhatsApp number' },
    { key: 'support_email', value: 'support@dkvroom.com', description: 'DK Vroom support email' },
  ]

  for (const s of settings) {
    await prisma.platformSetting.create({ data: s })
  }
  console.log(`✅ Created ${settings.length} platform settings`)

  // ============================
  // 14. CREATE UNVERIFIED DEALER (for testing admin flow)
  // ============================
  const unverifiedPassword = await hash('Dealer@123', 12)
  const unverifiedUser = await prisma.user.create({
    data: {
      email: 'newdealer@dkvroom.com',
      password: unverifiedPassword,
      name: 'New Dealer Applicant',
      phone: '+60 19-999 0001',
      whatsapp: '+60 19-999 0001',
      role: 'dealer',
      verified: false,
      active: true,
    }
  })
  await prisma.dealer.create({
    data: {
      userId: unverifiedUser.id,
      companyName: 'New Auto Dealer (Pending)',
      dealerType: 'used_car',
      contactPerson: 'New Dealer Applicant',
      registrationNo: 'SSM-PENDING-12345',
      city: 'Kuala Lumpur',
      state: 'Wilayah Persekutuan',
      phone: '+60 19-999 0001',
      whatsapp: '+60 19-999 0001',
      verified: false,
      bankName: 'Maybank',
      bankAccountNumber: '9999-8888-7777',
      bankAccountHolder: 'New Auto Dealer',
    }
  })

  // Create a pending car listing for admin to approve
  const pendingCarDealer = dealers[0]
  const pendingCarDealerUser = await prisma.user.findUnique({ where: { id: pendingCarDealer.userId } })
  if (pendingCarDealerUser) {
    await prisma.car.create({
      data: {
        dealerId: pendingCarDealer.id,
        userId: pendingCarDealerUser.id,
        type: 'sale',
        brand: 'Volvo',
        model: 'XC90 Recharge',
        year: 2024,
        color: 'Denim Blue',
        mileage: 3000,
        fuelType: 'hybrid',
        transmission: 'auto',
        seats: 7,
        condition: 'new',
        price: 398000,
        bookingFee: 500,
        location: 'KLCC, Kuala Lumpur',
        city: 'Kuala Lumpur',
        state: 'Wilayah Persekutuan',
        description: 'Brand new Volvo XC90 Recharge T8. PHEV with 455hp, Pilot Assist, and Bowers & Wilkins audio. Pending admin approval.',
        features: JSON.stringify(['Pilot Assist', 'Bowers & Wilkins Audio', 'Air Suspension', '360 Camera', 'Head-Up Display', 'Crystal Gear Shifter']),
        photos: JSON.stringify([carPhotos[2], carPhotos[7]]),
        featured: false,
        status: 'pending',
        active: true,
      }
    })
  }
  console.log('✅ Created unverified dealer and pending car listing for testing')

  console.log('\n🎉 Seed completed successfully!')
  console.log('\n📋 Test Accounts:')
  console.log('  Admin:    admin@dkvroom.com / Admin@123')
  console.log('  Dealer:   prestige@dkvroom.com / Dealer@123')
  console.log('  Customer: ahmad@dkvroom.com / Customer@123')
  console.log('  Unverified Dealer: newdealer@dkvroom.com / Dealer@123')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
