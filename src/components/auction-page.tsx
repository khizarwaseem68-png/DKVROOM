'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { auctionsApi } from '@/lib/api'
import CarListing from '@/components/car-listing'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Gavel,
  TrendingUp,
  Users,
  Clock,
  ArrowRight,
  Zap,
  Loader2,
} from 'lucide-react'

export default function AuctionPage() {
  const [auctionStats, setAuctionStats] = useState([
    { icon: Gavel, value: '...', label: 'Active Auctions', color: 'text-[#c9a84c]' },
    { icon: Users, value: '...', label: 'Total Bids', color: 'text-[#e8d48b]' },
    { icon: TrendingUp, value: '...', label: 'Current High Value', color: 'text-[#c9a84c]' },
  ])
  const [statsLoading, setStatsLoading] = useState(true)

  useEffect(() => {
    async function fetchAuctionStats() {
      try {
        const result = await auctionsApi.list({ limit: 100 })
        const auctionCars = result.data || []
        const activeCount = auctionCars.length
        const totalBids = auctionCars.reduce((sum: number, c: any) => sum + (c.bidCount || 0), 0)
        const highValue = auctionCars.reduce((max: number, c: any) => {
          const bid = c.currentBid || c.auctionStartBid || 0
          return bid > max ? bid : max
        }, 0)

        setAuctionStats([
          { icon: Gavel, value: String(activeCount), label: 'Active Auctions', color: 'text-[#c9a84c]' },
          { icon: Users, value: totalBids.toLocaleString(), label: 'Total Bids', color: 'text-[#e8d48b]' },
          { icon: TrendingUp, value: `RM ${(highValue / 1000).toFixed(0)}K`, label: 'Current High Value', color: 'text-[#c9a84c]' },
        ])
      } catch (e) {
        console.error('Failed to fetch auction stats:', e)
        setAuctionStats([
          { icon: Gavel, value: '0', label: 'Active Auctions', color: 'text-[#c9a84c]' },
          { icon: Users, value: '0', label: 'Total Bids', color: 'text-[#e8d48b]' },
          { icon: TrendingUp, value: 'RM 0', label: 'Current High Value', color: 'text-[#c9a84c]' },
        ])
      } finally {
        setStatsLoading(false)
      }
    }
    fetchAuctionStats()
  }, [])

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5f0e8]">
      {/* ===== HERO SECTION ===== */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#c9a84c]/10 via-transparent to-[#c9a84c]/5" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#c9a84c]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-[#c9a84c]/3 rounded-full blur-3xl" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-10">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-px w-8 bg-[#c9a84c]" />
            <Badge className="bg-[#c9a84c]/20 text-[#c9a84c] border-[#c9a84c]/30 gap-1.5">
              <Zap className="size-3" />
              LIVE
            </Badge>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-3">
            Live <span className="gold-text">Auctions</span>
          </h1>
          <p className="text-lg sm:text-xl text-[#8a8578] mb-6 max-w-lg">
            Bid. Win. Drive.
          </p>
          <p className="text-sm text-[#8a8578]/70 max-w-xl mb-8 leading-relaxed">
            Discover exclusive vehicles at auction prices. Place your bids on rare finds, 
            luxury exotics, and great deals. The highest bidder drives home.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 max-w-lg">
            {auctionStats.map((stat) => {
              const Icon = stat.icon
              return (
                <div key={stat.label} className="p-4 rounded-xl bg-[#111111]/80 border border-[#2a2a2a]/50">
                  <Icon className={`size-5 ${stat.color} mb-2`} />
                  <div className="text-lg sm:text-xl font-bold gold-text">
                    {statsLoading ? <Loader2 className="size-5 animate-spin text-[#c9a84c]" /> : stat.value}
                  </div>
                  <div className="text-xs text-[#8a8578]">{stat.label}</div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ===== CAR LISTING WITH AUCTION TYPE ===== */}
      <CarListing type="auction" />
    </div>
  )
}
