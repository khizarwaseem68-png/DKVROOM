import { NextRequest } from 'next/server'
import { getUserFromRequest, requireRole } from '@/lib/auth/auth-utils'
import { rateLimit, sanitizeInput, apiResponse, apiError, paginatedResponse } from '@/lib/security/middleware'
import { db } from '@/lib/db'
import { saveFile, validateFile } from '@/lib/file-upload'

const PHOTO_CONFIG = { maxSizeMB: 5, allowedMimes: ['image/jpeg', 'image/png', 'image/webp'] }

function asString(value: unknown): string {
  return typeof value === 'string' ? value : String(value ?? '')
}

function optionalText(value: unknown): string | undefined {
  const text = asString(value).trim()
  return text ? sanitizeInput(text) : undefined
}

function optionalNumber(value: unknown): number | undefined {
  if (value === null || value === undefined || value === '') return undefined
  const parsed = typeof value === 'number' ? value : parseFloat(asString(value))
  return Number.isFinite(parsed) ? parsed : undefined
}

function optionalInteger(value: unknown): number | undefined {
  if (value === null || value === undefined || value === '') return undefined
  const parsed = typeof value === 'number' ? value : parseInt(asString(value), 10)
  return Number.isInteger(parsed) ? parsed : undefined
}

function optionalBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') return value
  if (value === 'true') return true
  if (value === 'false') return false
  return fallback
}

function optionalDate(value: unknown): Date | undefined {
  if (!value) return undefined
  const date = new Date(asString(value))
  return Number.isNaN(date.getTime()) ? undefined : date
}

function optionalJsonArray(value: unknown): string | undefined {
  if (!value) return undefined
  if (Array.isArray(value)) return JSON.stringify(value.map((item) => optionalText(item)).filter(Boolean))

  const text = asString(value).trim()
  if (!text) return undefined

  try {
    const parsed = JSON.parse(text)
    if (Array.isArray(parsed)) {
      return JSON.stringify(parsed.map((item) => optionalText(item)).filter(Boolean))
    }
  } catch {
    return JSON.stringify([sanitizeInput(text)])
  }

  return undefined
}

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
    if (user.dealer.rejectedAt) return apiError('Dealer account rejected', 403)
    if (!user.dealer.verified) return apiError('Dealer account not yet verified', 403)

    let body: Record<string, unknown>
    let photoFiles: File[] = []

    const contentType = request.headers.get('content-type') ?? ''
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      body = Object.fromEntries(formData.entries())
      // Extract photo files
      for (const [key, value] of formData.entries()) {
        if (key.startsWith('photo_') && value instanceof File) {
          photoFiles.push(value)
        }
      }
    } else {
      body = await request.json()
    }

    // Required fields validation
    const requiredFields = ['type', 'brand', 'model', 'year', 'price']
    for (const field of requiredFields) {
      if (body[field] === undefined || body[field] === null || asString(body[field]).trim() === '') {
        return apiError(`Missing required field: ${field}`, 400)
      }
    }

    // Validate type
    const validTypes = ['rent', 'sale', 'auction', 'continueLoan']
    const carType = asString(body.type).trim()
    if (!validTypes.includes(carType)) {
      return apiError(`Invalid car type. Must be one of: ${validTypes.join(', ')}`, 400)
    }

    // Validate year
    const currentYear = new Date().getFullYear()
    const carYear = optionalInteger(body.year)
    if (carYear === undefined || carYear < 1900 || carYear > currentYear + 1) {
      return apiError('Invalid year', 400)
    }

    // Validate price
    const price = optionalNumber(body.price)
    if (price === undefined || price <= 0) {
      return apiError('Price must be a positive number', 400)
    }

    // Build car data
    const carData: any = {
      dealerId: user.dealer.id,
      userId: user.id,
      type: carType,
      brand: optionalText(body.brand),
      model: optionalText(body.model),
      year: carYear,
      price,
      color: optionalText(body.color),
      mileage: optionalInteger(body.mileage),
      fuelType: optionalText(body.fuelType),
      transmission: optionalText(body.transmission),
      seats: optionalInteger(body.seats),
      condition: optionalText(body.condition),
      weeklyPrice: optionalNumber(body.weeklyPrice),
      monthlyPrice: optionalNumber(body.monthlyPrice),
      deposit: optionalNumber(body.deposit),
      bookingFee: optionalNumber(body.bookingFee),
      // Continue Loan specific
      monthlyInstallment: optionalNumber(body.monthlyInstallment),
      remainingMonths: optionalInteger(body.remainingMonths),
      remainingBalance: optionalNumber(body.remainingBalance),
      takeoverAmount: optionalNumber(body.takeoverAmount),
      bankName: optionalText(body.bankName),
      vehicleCondition: optionalText(body.vehicleCondition),
      requiredDocs: optionalJsonArray(body.requiredDocs),
      // Auction specific
      auctionStartBid: optionalNumber(body.auctionStartBid),
      auctionReserve: optionalNumber(body.auctionReserve),
      currentBid: carType === 'auction' ? optionalNumber(body.auctionStartBid) : undefined,
      auctionEnd: optionalDate(body.auctionEnd),
      auctionActive: optionalBoolean(body.auctionActive, carType === 'auction'),
      // Auction vehicle condition fields
      conditionCategory: optionalText(body.conditionCategory),
      damageDescription: optionalText(body.damageDescription),
      runningStatus: optionalText(body.runningStatus),
      salvageStatus: optionalText(body.salvageStatus),
      repairEstimate: optionalNumber(body.repairEstimate),
      // Rental specific
      rentalTerms: optionalText(body.rentalTerms),
      pickupAvailable: optionalBoolean(body.pickupAvailable, true),
      deliveryAvailable: optionalBoolean(body.deliveryAvailable),
      deliveryFee: optionalNumber(body.deliveryFee),
      availableFrom: optionalDate(body.availableFrom),
      availableTo: optionalDate(body.availableTo),
      // Location
      location: optionalText(body.location),
      city: optionalText(body.city),
      state: optionalText(body.state),
      // Media & Description
      description: optionalText(body.description),
      features: optionalJsonArray(body.features),
      photos: optionalJsonArray(body.photos),
      videoUrl: optionalText(body.videoUrl),
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
