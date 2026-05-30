'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { auctionsApi, carsApi } from '@/lib/api'
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
  Car,
  AlertTriangle,
  Wrench,
  ShieldAlert,
  Recycle,
  FileWarning,
  Hammer,
  Filter,
  X,
} from 'lucide-react'

// Vehicle condition categories for auctions
const conditionCategories = [
  { key: 'all', label: 'All Vehicles', icon: Gavel, color: 'text-[#c9a84c]', bgColor: 'bg-[#c9a84c]/10', borderColor: 'border-[#c9a84c]/30' },
  { key: 'running', label: 'Running', icon: Car, color: 'text-emerald-400', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/30', description: 'Good running condition vehicles' },
  { key: 'used', label: 'Used', icon: Clock, color: 'text-blue-400', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/30', description: 'Used vehicles with wear' },
  { key: 'accident', label: 'Accident', icon: AlertTriangle, color: 'text-orange-400', bgColor: 'bg-orange-500/10', borderColor: 'border-orange-500/30', description: 'Accident damaged vehicles' },
  { key: 'wreck', label: 'Wreck', icon: ShieldAlert, color: 'text-red-400', bgColor: 'bg-red-500/10', borderColor: 'border-red-500/30', description: 'Severely damaged / wreck vehicles' },
  { key: 'salvage', label: 'Salvage', icon: FileWarning, color: 'text-purple-400', bgColor: 'bg-purple-500/10', borderColor: 'border-purple-500/30', description: 'Salvage title vehicles' },
  { key: 'insurance_writeoff', label: 'Insurance Write-off', icon: ShieldAlert, color: 'text-pink-400', bgColor: 'bg-pink-500/10', borderColor: 'border-pink-500/30', description: 'Insurance write-off vehicles' },
  { key: 'rebuild_project', label: 'Rebuild Project', icon: Recycle, color: 'text-cyan-400', bgColor: 'bg-cyan-500/10', borderColor: 'border-cyan-500/30', description: 'Ideal for rebuild / project cars' },
] as const

export default function AuctionPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
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
        const totalBids = auctionCars.reduce((sum: number, c: any) => sum + (c._count?.auctionBids || 0), 0)
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
          <p className="text-lg sm:text-xl text-[#8a8578] mb-4 max-w-lg">
            Bid. Win. Drive.
          </p>
          <p className="text-sm text-[#8a8578]/70 max-w-xl mb-4 leading-relaxed">
            Discover exclusive vehicles at auction prices — from pristine running cars to rebuild projects
            and salvage deals. Whether you&apos;re looking for a luxury steal or a restoration project,
            find it here.
          </p>

          {/* Condition categories info */}
          <div className="mb-8 p-4 rounded-xl bg-[#111111]/80 border border-[#2a2a2a]/50">
            <p className="text-xs text-[#8a8578] mb-2 font-medium">We auction all vehicle conditions:</p>
            <div className="flex flex-wrap gap-2">
              {conditionCategories.filter(c => c.key !== 'all').map((cat) => {
                const Icon = cat.icon
                return (
                  <span key={cat.key} className="flex items-center gap-1 text-xs">
                    <Icon className={`size-3 ${cat.color}`} />
                    <span className="text-[#f5f0e8]/70">{cat.label}</span>
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

      {/* ===== VEHICLE CONDITION FILTER ===== */}
      <section className="border-b border-[#2a2a2a]/50 bg-[#0a0a0a] sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <Filter className="size-4 text-[#8a8578] shrink-0" />
            <span className="text-xs text-[#8a8578] shrink-0 mr-1">Condition:</span>
            {conditionCategories.map((cat) => {
              const Icon = cat.icon
              const isSelected = selectedCategory === cat.key
              return (
                <Button
                  key={cat.key}
                  variant={isSelected ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(cat.key)}
                  className={`shrink-0 h-8 gap-1.5 text-xs rounded-full ${
                    isSelected
                      ? 'bg-[#c9a84c] text-[#0a0a0a] hover:bg-[#b8963e] border-[#c9a84c]'
                      : `border-[#2a2a2a] text-[#8a8578] hover:text-[#f5f0e8] hover:border-[#c9a84c]/40 ${cat.color}`
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
      <CarListing type="auction" conditionCategory={selectedCategory !== 'all' ? selectedCategory : undefined} />
    </div>
  )
}
