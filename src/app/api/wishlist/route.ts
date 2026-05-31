import { NextRequest } from 'next/server'
import { getUserFromRequest } from '@/lib/auth/auth-utils'
import { rateLimit, apiResponse, apiError } from '@/lib/security/middleware'
import { db } from '@/lib/db'

// GET /api/wishlist - List user's wishlist
export async function GET(request: NextRequest) {
  const rateCheck = rateLimit(request)
  if (!rateCheck.allowed) return apiError('Too many requests', 429)

  const user = await getUserFromRequest(request)
  if (!user) return apiError('Unauthorized', 401)

  const wishlist = await db.wishlist.findMany({
    where: { userId: user.id },
    include: {
      car: {
        select: {
          id: true,
          brand: true,
          model: true,
          year: true,
          price: true,
          mileage: true,
          fuelType: true,
          city: true,
          type: true,
          photos: true,
          status: true,
          dealer: {
            select: {
              id: true,
              companyName: true,
              verified: true,
              rating: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return apiResponse({ success: true, data: wishlist })
}

// POST /api/wishlist - Add item to wishlist
export async function POST(request: NextRequest) {
  const rateCheck = rateLimit(request)
  if (!rateCheck.allowed) return apiError('Too many requests', 429)

  const user = await getUserFromRequest(request)
  if (!user) return apiError('Unauthorized', 401)

  const body = await request.json()
  const { carId } = body

  if (!carId) {
    return apiError('Car ID is required', 400)
  }

  // Check if car exists
  const car = await db.car.findUnique({ where: { id: carId } })
  if (!car) {
    return apiError('Car not found', 404)
  }

  // Check if already in wishlist
  const existing = await db.wishlist.findUnique({
    where: { userId_carId: { userId: user.id, carId } },
  })

  if (existing) {
    return apiResponse({ success: true, data: existing, message: 'Already in wishlist' })
  }

  const wishlistItem = await db.wishlist.create({
    data: {
      userId: user.id,
      carId,
    },
  })

  return apiResponse({ success: true, data: wishlistItem, message: 'Added to wishlist' })
}

// DELETE /api/wishlist - Remove item from wishlist
export async function DELETE(request: NextRequest) {
  const rateCheck = rateLimit(request)
  if (!rateCheck.allowed) return apiError('Too many requests', 429)

  const user = await getUserFromRequest(request)
  if (!user) return apiError('Unauthorized', 401)

  const { searchParams } = new URL(request.url)
  const carId = searchParams.get('carId')

  if (!carId) {
    return apiError('Car ID is required', 400)
  }

  await db.wishlist.deleteMany({
    where: {
      userId: user.id,
      carId,
    },
  })

  return apiResponse({ success: true, message: 'Removed from wishlist' })
}
