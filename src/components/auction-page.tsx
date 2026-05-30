'use client'

import { useState, useEffect } from 'react'
import { auctionsApi } from '@/lib/api'
import { CONDITION_CATEGORIES, formatPrice } from '@/lib/constants'
import CarListing from '@/components/car-listing'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Gavel,
  TrendingUp,
  Users,
  Clock,
  Zap,
  Loader2,
  Car,
  AlertTriangle,
  ShieldAlert,
  Recycle,
  FileWarning,
  Filter,
} from 'lucide-react'

// ============================================================
// Types
// ============================================================

interface AuctionStat {
  icon: typeof Gavel
  value: string
  label: string
  color: string
}

interface AuctionCarItem {
  _count?: { auctionBids?: number }
  currentBid?: number
  auctionStartBid?: number
  [key: string]: unknown
}

// ============================================================
// Map condition categories to icons (used in hero + filter tabs)
// ============================================================

const CATEGORY_ICONS: Record<string, typeof Car> = {
  running: Car,
  used: Clock,
  accident: AlertTriangle,
  wreck: ShieldAlert,
  salvage: FileWarning,
  insurance_writeoff: ShieldAlert,
  rebuild_project: Recycle,
}

// ============================================================
// Main Component
// ============================================================

export default function AuctionPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [auctionStats, setAuctionStats] = useState<AuctionStat[]>([
    { icon: Gavel, value: '...', label: 'Active Auctions', color: 'text-gold' },
    { icon: Users, value: '...', label: 'Total Bids', color: 'text-gold-light' },
    { icon: TrendingUp, value: '...', label: 'Current High Value', color: 'text-gold' },
  ])
  const [statsLoading, setStatsLoading] = useState(true)

  useEffect(() => {
    async function fetchAuctionStats() {
      try {
        const result = await auctionsApi.list({ limit: '100' })
        const auctionCars = (result.data || []) as AuctionCarItem[]

        const activeCount = auctionCars.length
        const totalBids = auctionCars.reduce(
          (sum, c) => sum + (c._count?.auctionBids || 0),
          0,
        )
        const highValue = auctionCars.reduce(
          (max, c) => Math.max(max, c.currentBid || c.auctionStartBid || 0),
          0,
        )

        setAuctionStats([
          { icon: Gavel, value: String(activeCount), label: 'Active Auctions', color: 'text-gold' },
          { icon: Users, value: totalBids.toLocaleString(), label: 'Total Bids', color: 'text-gold-light' },
          { icon: TrendingUp, value: formatPrice(highValue), label: 'Current High Value', color: 'text-gold' },
        ])
      } catch {
        // Silent error handling — show zeroed stats
        setAuctionStats([
          { icon: Gavel, value: '0', label: 'Active Auctions', color: 'text-gold' },
          { icon: Users, value: '0', label: 'Total Bids', color: 'text-gold-light' },
          { icon: TrendingUp, value: 'RM 0', label: 'Current High Value', color: 'text-gold' },
        ])
      } finally {
        setStatsLoading(false)
      }
    }
    fetchAuctionStats()
  }, [])

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ===== HERO SECTION ===== */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gold/10 via-transparent to-gold/5" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-10">
          {/* Badge */}
          <div className="flex items-center gap-2 mb-4">
            <div className="h-px w-8 bg-gold" />
            <Badge className="bg-gold/20 text-gold border-gold/30 gap-1.5">
              <Zap className="size-3" />
              LIVE
            </Badge>
          </div>

          {/* Heading */}
          <h1 className="heading-xl mb-3">
            Live <span className="gold-text">Auctions</span>
          </h1>
          <p className="text-body-lg text-muted-foreground mb-4 max-w-lg">
            Bid. Win. Drive.
          </p>
          <p className="text-body-sm text-muted-foreground/70 max-w-xl mb-4 leading-relaxed">
            Discover exclusive vehicles at auction prices — from pristine running cars to rebuild projects
            and salvage deals. Whether you&apos;re looking for a luxury steal or a restoration project,
            find it here.
          </p>

          {/* Condition categories info */}
          <div className="mb-8 p-4 rounded-xl bg-card/80 border border-border/50">
            <p className="text-overline text-muted-foreground mb-2">We auction all vehicle conditions:</p>
            <div className="flex flex-wrap gap-2">
              {CONDITION_CATEGORIES.map((cat) => {
                const Icon = CATEGORY_ICONS[cat.key] || Car
                return (
                  <span key={cat.key} className="flex items-center gap-1 text-body-sm">
                    <Icon className={`size-3 ${cat.color}`} />
                    <span className="text-foreground/70">{cat.label}</span>
                  </span>
                )
              })}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 max-w-lg">
            {auctionStats.map((stat) => {
              const Icon = stat.icon
              return (
                <div key={stat.label} className="p-4 rounded-xl bg-card/80 border border-border/50">
                  <Icon className={`size-5 ${stat.color} mb-2`} />
                  <div className="text-lg sm:text-xl font-bold gold-text">
                    {statsLoading ? <Loader2 className="size-5 animate-spin text-gold" /> : stat.value}
                  </div>
                  <div className="text-caption text-muted-foreground">{stat.label}</div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ===== VEHICLE CONDITION FILTER ===== */}
      <section className="border-b border-border/50 bg-background sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <Filter className="size-4 text-muted-foreground shrink-0" />
            <span className="text-caption text-muted-foreground shrink-0 mr-1">Condition:</span>

            {/* "All" tab */}
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('all')}
              className={`shrink-0 h-8 gap-1.5 text-caption rounded-full ${
                selectedCategory === 'all'
                  ? 'bg-gold text-black hover:bg-gold-light border-gold'
                  : 'border-border text-muted-foreground hover:text-foreground hover:border-gold/40'
              }`}
            >
              <Gavel className="size-3" />
              All Vehicles
            </Button>

            {/* Category tabs from constants */}
            {CONDITION_CATEGORIES.map((cat) => {
              const Icon = CATEGORY_ICONS[cat.key] || Car
              const isSelected = selectedCategory === cat.key
              return (
                <Button
                  key={cat.key}
                  variant={isSelected ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(cat.key)}
                  className={`shrink-0 h-8 gap-1.5 text-caption rounded-full ${
                    isSelected
                      ? 'bg-gold text-black hover:bg-gold-light border-gold'
                      : `border-border text-muted-foreground hover:text-foreground hover:border-gold/40 ${cat.color}`
                  }`}
                >
                  <Icon className="size-3" />
                  {cat.label}
                </Button>
              )
            })}
          </div>
        </div>
      </section>

      {/* ===== CAR LISTING WITH AUCTION TYPE ===== */}
      <CarListing
        type="auction"
        conditionCategory={selectedCategory !== 'all' ? selectedCategory : undefined}
      />
    </div>
  )
}
