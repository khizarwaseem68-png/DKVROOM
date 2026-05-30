import { NextRequest } from 'next/server'
import { getUserFromRequest, requireRole } from '@/lib/auth/auth-utils'
import { rateLimit, apiResponse, apiError, paginatedResponse } from '@/lib/security/middleware'
import { db } from '@/lib/db'

// GET /api/auctions - List auction cars
export async function GET(request: NextRequest) {
  const rateCheck = rateLimit(request)
  if (!rateCheck.allowed) return apiError('Too many requests', 429)

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
  const brand = searchParams.get('brand')
  const city = searchParams.get('city')
  const minBid = searchParams.get('minBid')
  const maxBid = searchParams.get('maxBid')
  const conditionCategory = searchParams.get('conditionCategory')
  const runningStatus = searchParams.get('runningStatus')
  const salvageStatus = searchParams.get('salvageStatus')

  const where: any = {
    type: 'auction',
    auctionActive: true,
    status: 'approved',
    active: true,
  }

  if (brand) where.brand = { contains: brand, mode: 'insensitive' }
  if (city) where.city = { contains: city, mode: 'insensitive' }
  if (conditionCategory) where.conditionCategory = conditionCategory
  if (runningStatus) where.runningStatus = runningStatus
  if (salvageStatus) where.salvageStatus = salvageStatus
  if (minBid || maxBid) {
    where.currentBid = {}
    if (minBid) where.currentBid.gte = parseFloat(minBid)
    if (maxBid) where.currentBid.lte = parseFloat(maxBid)
  }

  // Only show auctions that haven't ended
  where.OR = [
    { auctionEnd: null },
    { auctionEnd: { gt: new Date() } }
  ]

  const [cars, total] = await Promise.all([
    db.car.findMany({
      where,
      include: {
        dealer: {
          select: { id: true, companyName: true, verified: true, rating: true, logo: true }
        },
        auctionBids: {
          where: { isWinning: true },
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { id: true, name: true } }
          }
        },
        _count: { select: { auctionBids: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.car.count({ where })
  ])

  return paginatedResponse(cars, total, page, limit)
}

// POST /api/auctions - Place a bid (customer only)
export async function POST(request: NextRequest) {
  const rateCheck = rateLimit(request)
  if (!rateCheck.allowed) return apiError('Too many requests', 429)

  const user = await getUserFromRequest(request)
  if (!user) return apiError('Unauthorized', 401)

  if (!requireRole(user, ['customer'])) {
    return apiError('Only customers can place bids', 403)
  }

  const body = await request.json()
  const { carId, amount } = body

  if (!carId) return apiError('Car ID is required', 400)
  if (!amount) return apiError('Bid amount is required', 400)

  const bidAmount = parseFloat(String(amount))
  if (isNaN(bidAmount) || bidAmount <= 0) {
    return apiError('Invalid bid amount', 400)
  }

  // Verify car is an active auction
  const car = await db.car.findUnique({
    where: { id: carId },
    include: {
      auctionBids: {
        where: { isWinning: true },
        orderBy: { createdAt: 'desc' },
        take: 1,
      }
    }
  })

  if (!car) return apiError('Car not found', 404)
  if (car.type !== 'auction') return apiError('Car is not an auction listing', 400)
  if (!car.auctionActive) return apiError('Auction is not active', 400)
  if (car.status !== 'approved') return apiError('Auction is not available for bidding', 400)

  // Check auction end time
  if (car.auctionEnd && new Date() > new Date(car.auctionEnd)) {
    return apiError('Auction has ended', 400)
  }

  // Validate bid amount > current highest bid
  const currentBid = car.currentBid || car.auctionStartBid || 0
  if (bidAmount <= currentBid) {
    return apiError(`Bid must be greater than current bid of RM${currentBid}`, 400)
  }

  // Validate against reserve price (warning only, don't block)
  // Validate minimum increment
  const minIncrement = Math.max(currentBid * 0.01, 100) // 1% or RM100 minimum increment
  if (bidAmount < currentBid + minIncrement) {
    return apiError(`Minimum bid increment is RM${minIncrement.toFixed(2)}`, 400)
  }

  // Use transaction to handle bid placement atomically
  const result = await db.$transaction(async (tx) => {
    // Mark previous winning bids as outbid
    const previousWinningBids = await tx.auctionBid.findMany({
      where: { carId, isWinning: true }
    })

    for (const prevBid of previousWinningBids) {
      await tx.auctionBid.update({
        where: { id: prevBid.id },
        data: { isWinning: false, status: 'outbid' }
      })

      // Notify previous bidder they've been outbid
      await tx.notification.create({
        data: {
          userId: prevBid.userId,
          title: 'You have been outbid!',
          message: `Your bid on ${car.brand} ${car.model} ${car.year} has been outbid. Current bid: RM${bidAmount}`,
          type: 'warning',
          link: `/auctions/${carId}`,
        }
      })
    }

    // Create new bid
    const bid = await tx.auctionBid.create({
      data: {
        carId,
        userId: user.id,
        amount: bidAmount,
        status: 'active',
        isWinning: true,
      }
    })

    // Update car's current bid
    await tx.car.update({
      where: { id: carId },
      data: { currentBid: bidAmount }
    })

    return bid
  })

  // Notify dealer of new bid
  const dealer = await db.dealer.findUnique({ where: { id: car.dealerId } })
  if (dealer) {
    await db.notification.create({
      data: {
        userId: dealer.userId,
        title: 'New Auction Bid',
        message: `A new bid of RM${bidAmount} has been placed on ${car.brand} ${car.model} ${car.year}`,
        type: 'info',
        link: `/auctions/${carId}`,
      }
    })
  }

  // Audit log
  await db.auditLog.create({
    data: {
      userId: user.id,
      action: 'auction_bid_placed',
      resource: 'auctionBid',
      resourceId: result.id,
      details: JSON.stringify({ carId, amount: bidAmount, previousBid: currentBid }),
      severity: 'info',
    }
  })

  return apiResponse({ success: true, data: result }, 201)
}
