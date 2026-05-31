import { NextRequest } from 'next/server'
import { getUserFromRequest, requireRole } from '@/lib/auth/auth-utils'
import { rateLimit, sanitizeInput, sanitizeObject, apiResponse, apiError, paginatedResponse } from '@/lib/security/middleware'
import { db } from '@/lib/db'
import { saveFile, validateFile } from '@/lib/file-upload'

const PHOTO_CONFIG = { maxSizeMB: 5, allowedMimes: ['image/jpeg', 'image/png', 'image/webp'] }

// ============================================================
// GET /api/cars — List / search cars with filters + pagination
// ============================================================
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const rateCheck = rateLimit(request, { windowMs: 60_000, maxRequests: 120, keyPrefix: 'cars-list' })
    if (!rateCheck.allowed) {
      return apiError('Too many requests, please try again later', 429)
    }

    const { searchParams } = new URL(request.url)

    // Pagination
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '12', 10)))
    const skip = (page - 1) * limit

    // Filters
    const type = searchParams.get('type') || undefined
    const brand = searchParams.get('brand') || undefined
    const city = searchParams.get('city') || undefined
    const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined
    const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined
    const featured = searchParams.get('featured') === 'true' ? true : undefined
    const status = searchParams.get('status') || 'approved' // default 'approved'
    const conditionCategory = searchParams.get('conditionCategory') || undefined
    const runningStatus = searchParams.get('runningStatus') || undefined
    const salvageStatus = searchParams.get('salvageStatus') || undefined
    const sort = searchParams.get('sort') || 'createdAt'
    const order = searchParams.get('order') || 'desc'
    const search = searchParams.get('search') || undefined

    // Build where clause
    const where: any = {
      active: true,
      status,
    }

    if (type) where.type = type
    if (brand) where.brand = { contains: brand }
    if (city) where.city = { contains: city }
    if (featured !== undefined) where.featured = featured
    if (conditionCategory) where.conditionCategory = conditionCategory
    if (runningStatus) where.runningStatus = runningStatus
    if (salvageStatus) where.salvageStatus = salvageStatus
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {}
      if (minPrice !== undefined) where.price.gte = minPrice
      if (maxPrice !== undefined) where.price.lte = maxPrice
    }

    // Text search across brand, model, description
    if (search) {
      where.OR = [
        { brand: { contains: search } },
        { model: { contains: search } },
        { description: { contains: search } },
        { city: { contains: search } },
        { state: { contains: search } },
      ]
    }

    // Sorting
    const allowedSortFields = ['createdAt', 'price', 'year', 'views', 'mileage']
    const sortField = allowedSortFields.includes(sort) ? sort : 'createdAt'
    const sortOrder = order === 'asc' ? 'asc' : 'desc'
    const orderBy = { [sortField]: sortOrder }

    // Execute queries
    const [cars, total] = await Promise.all([
      db.car.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          dealer: {
            select: {
              id: true,
              companyName: true,
              verified: true,
              city: true,
              state: true,
              logo: true,
              rating: true,
              subscriptionTier: true,
            },
          },
          _count: {
            select: {
              bookings: true,
              reviews: true,
            },
          },
        },
      }),
      db.car.count({ where }),
    ])

    // Increment view count asynchronously (fire-and-forget)
    // We don't increment on list views to avoid inflating counts

    return paginatedResponse(cars, total, page, limit)
  } catch (error) {
    console.error('[CARS_LIST_ERROR]', error)
    return apiError('Failed to fetch cars', 500)
  }
}

// ============================================================
// POST /api/cars — Create car listing (dealer only)
// ============================================================
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateCheck = rateLimit(request, { windowMs: 60_000, maxRequests: 10, keyPrefix: 'cars-create' })
    if (!rateCheck.allowed) {
      return apiError('Too many requests, please try again later', 429)
    }

    // Auth check
    const user = await getUserFromRequest(request)
    if (!user) return apiError('Unauthorized', 401)
    if (!requireRole(user, ['dealer'])) return apiError('Forbidden: dealer access required', 403)
    if (!user.dealer) return apiError('Dealer profile not found', 404)
    if (!user.dealer.verified) return apiError('Dealer account not yet verified', 403)

    const contentType = request.headers.get('content-type') || ''
    const isMultipart = contentType.includes('multipart/form-data')

    let body: Record<string, any>
    let photoFiles: File[] = []

    if (isMultipart) {
      const formData = await request.formData()
      photoFiles = []
      body = {}
      for (const [key, value] of formData.entries()) {
        if (value instanceof File) {
          if (key.startsWith('photo_')) {
            photoFiles.push(value)
          }
        } else {
          body[key] = value
        }
      }
      // Validate photos
      for (const file of photoFiles) {
        const err = validateFile(file, PHOTO_CONFIG.maxSizeMB, PHOTO_CONFIG.allowedMimes)
        if (err) return apiError(`Photo ${file.name}: ${err}`, 400)
      }
    } else {
      body = await request.json()
    }
    const sanitized = sanitizeObject(body)

    // Required fields validation
    const requiredFields = ['type', 'brand', 'model', 'year', 'price']
    for (const field of requiredFields) {
      if (!sanitized[field]) {
        return apiError(`Missing required field: ${field}`, 400)
      }
    }

    // Validate type
    const validTypes = ['rent', 'sale', 'auction', 'continueLoan']
    if (!validTypes.includes(sanitized.type)) {
      return apiError(`Invalid car type. Must be one of: ${validTypes.join(', ')}`, 400)
    }

    // Validate year
    const currentYear = new Date().getFullYear()
    const carYear = parseInt(sanitized.year, 10)
    if (isNaN(carYear) || carYear < 1900 || carYear > currentYear + 1) {
      return apiError('Invalid year', 400)
    }

    // Validate price
    const price = parseFloat(sanitized.price)
    if (isNaN(price) || price <= 0) {
      return apiError('Price must be a positive number', 400)
    }

    // Build car data
    const carData: any = {
      dealerId: user.dealer.id,
      type: sanitized.type,
      brand: sanitizeInput(sanitized.brand),
      model: sanitizeInput(sanitized.model),
      year: carYear,
      price,
      color: sanitized.color ? sanitizeInput(sanitized.color) : undefined,
      mileage: sanitized.mileage ? parseInt(sanitized.mileage, 10) : undefined,
      fuelType: sanitized.fuelType || undefined,
      transmission: sanitized.transmission || undefined,
      seats: sanitized.seats ? parseInt(sanitized.seats, 10) : undefined,
      condition: sanitized.condition || undefined,
      weeklyPrice: sanitized.weeklyPrice ? parseFloat(sanitized.weeklyPrice) : undefined,
      monthlyPrice: sanitized.monthlyPrice ? parseFloat(sanitized.monthlyPrice) : undefined,
      deposit: sanitized.deposit ? parseFloat(sanitized.deposit) : undefined,
      bookingFee: sanitized.bookingFee ? parseFloat(sanitized.bookingFee) : undefined,
      // Continue Loan specific
      monthlyInstallment: sanitized.monthlyInstallment ? parseFloat(sanitized.monthlyInstallment) : undefined,
      remainingMonths: sanitized.remainingMonths ? parseInt(sanitized.remainingMonths, 10) : undefined,
      remainingBalance: sanitized.remainingBalance ? parseFloat(sanitized.remainingBalance) : undefined,
      takeoverAmount: sanitized.takeoverAmount ? parseFloat(sanitized.takeoverAmount) : undefined,
      bankName: sanitized.bankName ? sanitizeInput(sanitized.bankName) : undefined,
      vehicleCondition: sanitized.vehicleCondition ? sanitizeInput(sanitized.vehicleCondition) : undefined,
      requiredDocs: sanitized.requiredDocs || undefined,
      // Auction specific
      auctionStartBid: sanitized.auctionStartBid ? parseFloat(sanitized.auctionStartBid) : undefined,
      auctionReserve: sanitized.auctionReserve ? parseFloat(sanitized.auctionReserve) : undefined,
      auctionEnd: sanitized.auctionEnd ? new Date(sanitized.auctionEnd) : undefined,
      auctionActive: sanitized.auctionActive || false,
      // Auction vehicle condition fields
      conditionCategory: sanitized.conditionCategory || undefined,
      damageDescription: sanitized.damageDescription ? sanitizeInput(sanitized.damageDescription) : undefined,
      runningStatus: sanitized.runningStatus || undefined,
      salvageStatus: sanitized.salvageStatus || undefined,
      repairEstimate: sanitized.repairEstimate ? parseFloat(sanitized.repairEstimate) : undefined,
      // Rental specific
      rentalTerms: sanitized.rentalTerms || undefined,
      pickupAvailable: sanitized.pickupAvailable !== undefined ? sanitized.pickupAvailable : true,
      deliveryAvailable: sanitized.deliveryAvailable || false,
      deliveryFee: sanitized.deliveryFee ? parseFloat(sanitized.deliveryFee) : undefined,
      availableFrom: sanitized.availableFrom ? new Date(sanitized.availableFrom) : undefined,
      availableTo: sanitized.availableTo ? new Date(sanitized.availableTo) : undefined,
      // Location
      location: sanitized.location ? sanitizeInput(sanitized.location) : undefined,
      city: sanitized.city ? sanitizeInput(sanitized.city) : undefined,
      state: sanitized.state ? sanitizeInput(sanitized.state) : undefined,
      // Media & Description
      description: sanitized.description ? sanitizeInput(sanitized.description) : undefined,
      features: sanitized.features || undefined,
      photos: sanitized.photos || undefined,
      videoUrl: sanitized.videoUrl ? sanitizeInput(sanitized.videoUrl) : undefined,
      featured: false,
      // Status: always pending for admin approval
      status: 'pending',
      active: true,
    }

    // Remove undefined values
    Object.keys(carData).forEach(key => carData[key] === undefined && delete carData[key])

    // Save photos to disk only after DB create succeeds
    if (photoFiles.length > 0) {
      const photoUrls: string[] = []
      for (const file of photoFiles) {
        try {
          const url = await saveFile(file, 'vehicle_photos', user.id)
          photoUrls.push(url)
        } catch {
          // Skip failed photo saves
        }
      }
      if (photoUrls.length > 0) {
        carData.photos = JSON.stringify(photoUrls)
      }
    }

    const car = await db.car.create({
      data: carData,
      include: {
        dealer: {
          select: {
            id: true,
            companyName: true,
            verified: true,
            city: true,
            state: true,
            logo: true,
            rating: true,
            subscriptionTier: true,
          },
        },
      },
    })

    // Update dealer's total listings count
    await db.dealer.update({
      where: { id: user.dealer.id },
      data: { totalListings: { increment: 1 } },
    })

    // Audit log
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'car_created',
        resource: 'car',
        resourceId: car.id,
        details: JSON.stringify({ type: car.type, brand: car.brand, model: car.model, price: car.price }),
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        severity: 'info',
      },
    })

    return apiResponse({ success: true, data: car }, 201)
  } catch (error) {
    console.error('[CAR_CREATE_ERROR]', error)
    return apiError('Failed to create car listing', 500)
  }
}
