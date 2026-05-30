'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  LayoutDashboard,
  Car,
  PlusCircle,
  CalendarCheck,
  MessageSquare,
  BarChart3,
  Wallet,
  Settings,
  Bell,
  Search,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  DollarSign,
  Star,
  Edit,
  Trash2,
  StarOff,
  Upload,
  X,
  CheckCircle,
  Clock,
  AlertCircle,
  Eye,
  MoreHorizontal,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Menu,
  Phone,
  ImagePlus,
  MapPin,
  Truck,
  Info,
  AlertTriangle,
  Gavel,
  Handshake,
} from 'lucide-react'

// Mock data
const mockBookings = [
  { id: 'BK001', customer: 'Ahmad Razak', car: 'BMW M4 Competition', dates: 'Mar 1-5, 2026', status: 'confirmed', amount: 3400 },
  { id: 'BK002', customer: 'Sarah Tan', car: 'Mercedes S580', dates: 'Mar 3-7, 2026', status: 'pending', amount: 5200 },
  { id: 'BK003', customer: 'Lim Wei Jie', car: 'Porsche 911 Turbo S', dates: 'Mar 8-10, 2026', status: 'confirmed', amount: 3600 },
  { id: 'BK004', customer: 'Nurul Aisyah', car: 'Honda Civic Type R', dates: 'Mar 10-12, 2026', status: 'completed', amount: 760 },
  { id: 'BK005', customer: 'David Kumar', car: 'Audi RS6 Avant', dates: 'Mar 12-14, 2026', status: 'pending', amount: 3000 },
]

const mockListings = [
  { id: '1', brand: 'BMW', model: 'M4 Competition', type: 'rent', price: 680, status: 'active', photo: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=200&q=60', featured: true },
  { id: '3', brand: 'Porsche', model: '911 Turbo S', type: 'rent', price: 1200, status: 'active', photo: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=200&q=60', featured: true },
  { id: '5', brand: 'Honda', model: 'Civic Type R', type: 'rent', price: 380, status: 'active', photo: 'https://images.unsplash.com/photo-1542362567-b07e54358753?w=200&q=60', featured: false },
  { id: '11', brand: 'Audi', model: 'RS6 Avant', type: 'rent', price: 1500, status: 'active', photo: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=200&q=60', featured: true },
  { id: '2', brand: 'Mercedes-Benz', model: 'S-Class S580', type: 'sale', price: 898000, status: 'active', photo: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=200&q=60', featured: false },
  { id: '4', brand: 'Toyota', model: 'Camry 2.5V', type: 'sale', price: 138000, status: 'pending', photo: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=200&q=60', featured: false },
  { id: '6', brand: 'Perodua', model: 'Myvi 1.5 AV', type: 'continueLoan', price: 52000, status: 'active', photo: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=200&q=60', featured: false },
  { id: '7', brand: 'BMW', model: 'X5 xDrive40i', type: 'continueLoan', price: 298000, status: 'sold', photo: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=200&q=60', featured: false },
  { id: '8', brand: 'Lamborghini', model: 'Huracán EVO', type: 'auction', price: 880000, status: 'active', photo: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=200&q=60', featured: true },
]

const monthlyRevenue = [
  { month: 'Sep', value: 45 },
  { month: 'Oct', value: 62 },
  { month: 'Nov', value: 55 },
  { month: 'Dec', value: 78 },
  { month: 'Jan', value: 85 },
  { month: 'Feb', value: 92 },
  { month: 'Mar', value: 68 },
]

const sidebarItems = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'listings', label: 'My Listings', icon: Car },
  { id: 'addCar', label: 'Add Car', icon: PlusCircle },
  { id: 'bookings', label: 'Bookings', icon: CalendarCheck },
  { id: 'enquiries', label: 'Enquiries', icon: MessageSquare },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'payments', label: 'Payments', icon: Wallet },
  { id: 'settings', label: 'Settings', icon: Settings },
]

function getStatusBadge(status: string) {
  switch (status) {
    case 'active':
    case 'confirmed':
      return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">Active</Badge>
    case 'pending':
      return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">Pending</Badge>
    case 'sold':
    case 'completed':
      return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30 text-xs">Sold</Badge>
    case 'rejected':
      return <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">Rejected</Badge>
    default:
      return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30 text-xs">{status}</Badge>
  }
}

function getTypeLabel(type: string) {
  switch (type) {
    case 'rent': return 'For Rent'
    case 'sale': return 'For Sale'
    case 'continueLoan': return 'Continue Loan'
    case 'auction': return 'Auction'
    default: return type
  }
}

export default function DealerDashboard() {
  const { userName, goBack } = useAppStore()
  const [activeTab, setActiveTab] = useState('overview')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [listingFilter, setListingFilter] = useState('all')
  const [bookingFilter, setBookingFilter] = useState('all')

  // Add car form state — common fields
  const [carType, setCarType] = useState('rent')
  const [carBrand, setCarBrand] = useState('')
  const [carModel, setCarModel] = useState('')
  const [carYear, setCarYear] = useState('')
  const [carLocation, setCarLocation] = useState('')
  const [carDescription, setCarDescription] = useState('')
  const [carPhotos, setCarPhotos] = useState<string[]>([])

  // Rental specific
  const [carDailyPrice, setCarDailyPrice] = useState('')
  const [carWeeklyPrice, setCarWeeklyPrice] = useState('')
  const [carMonthlyPrice, setCarMonthlyPrice] = useState('')
  const [carRentDeposit, setCarRentDeposit] = useState('')
  const [carAvailability, setCarAvailability] = useState(true)
  const [carRentalTerms, setCarRentalTerms] = useState('')
  const [carSelfPickup, setCarSelfPickup] = useState(true)
  const [carDeliveryAvailable, setCarDeliveryAvailable] = useState(false)
  const [carPickupLocation, setCarPickupLocation] = useState('')
  const [carDeliveryFee, setCarDeliveryFee] = useState('')

  // Sale specific
  const [carSalePrice, setCarSalePrice] = useState('')
  const [carBookingFee, setCarBookingFee] = useState('')
  const [carSaleCondition, setCarSaleCondition] = useState('')
  const [carMileage, setCarMileage] = useState('')
  const [carFeatures, setCarFeatures] = useState('')

  // Continue Loan specific
  const [carMonthlyInstallment, setCarMonthlyInstallment] = useState('')
  const [carRemainingMonths, setCarRemainingMonths] = useState('')
  const [carTakeoverAmount, setCarTakeoverAmount] = useState('')
  const [carVehicleCondition, setCarVehicleCondition] = useState('')
  const [carBankName, setCarBankName] = useState('')

  // Auction specific
  const [carStartingBid, setCarStartingBid] = useState('')
  const [carAuctionEndDate, setCarAuctionEndDate] = useState('')
  const [carReservePrice, setCarReservePrice] = useState('')
  const [carAuctionCondition, setCarAuctionCondition] = useState('')

  const filteredListings = listingFilter === 'all'
    ? mockListings
    : mockListings.filter((l) => l.type === listingFilter)

  const filteredBookings = bookingFilter === 'all'
    ? mockBookings
    : mockBookings.filter((b) => b.status === bookingFilter)

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    setMobileSidebarOpen(false)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5f0e8] flex">
      {/* Sidebar - Desktop */}
      <aside
        className={`hidden lg:flex flex-col border-r border-[#2a2a2a] bg-[#0f0f0f] transition-all duration-300 ${
          sidebarCollapsed ? 'w-16' : 'w-60'
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#2a2a2a]">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#c9a84c]/10 flex items-center justify-center">
                <Car className="size-4 text-[#c9a84c]" />
              </div>
              <span className="text-sm font-bold gold-text">DK Vroom</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="text-[#8a8578] hover:text-[#c9a84c] hover:bg-[#c9a84c]/10 h-7 w-7"
          >
            {sidebarCollapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
          </Button>
        </div>

        {/* Sidebar Nav */}
        <nav className="flex-1 py-4 px-2 space-y-1">
          {sidebarItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-[#c9a84c]/10 text-[#c9a84c] shadow-[inset_0_0_20px_rgba(201,168,76,0.05)]'
                    : 'text-[#8a8578] hover:bg-[#1a1a1a] hover:text-[#f5f0e8]'
                } ${sidebarCollapsed ? 'justify-center' : ''}`}
              >
                <Icon className="size-4 shrink-0" />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </button>
            )
          })}
        </nav>

        {/* Sidebar Footer */}
        {!sidebarCollapsed && (
          <div className="p-4 border-t border-[#2a2a2a]">
            <Button
              variant="ghost"
              onClick={goBack}
              className="w-full text-[#8a8578] hover:text-[#c9a84c] hover:bg-[#c9a84c]/10 text-sm"
            >
              <ChevronLeft className="size-4 mr-1" />
              Back to Site
            </Button>
          </div>
        )}
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-[#0f0f0f] border-r border-[#2a2a2a] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-[#2a2a2a]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#c9a84c]/10 flex items-center justify-center">
                  <Car className="size-4 text-[#c9a84c]" />
                </div>
                <span className="text-sm font-bold gold-text">DK Vroom</span>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setMobileSidebarOpen(false)} className="text-[#8a8578]">
                <X className="size-4" />
              </Button>
            </div>
            <nav className="flex-1 py-4 px-2 space-y-1">
              {sidebarItems.map((item) => {
                const Icon = item.icon
                const isActive = activeTab === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabChange(item.id)}
                    className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-[#c9a84c]/10 text-[#c9a84c]'
                        : 'text-[#8a8578] hover:bg-[#1a1a1a] hover:text-[#f5f0e8]'
                    }`}
                  >
                    <Icon className="size-4" />
                    <span>{item.label}</span>
                  </button>
                )
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-40 border-b border-[#2a2a2a] bg-[#0a0a0a]/95 backdrop-blur-xl">
          <div className="flex items-center justify-between px-4 sm:px-6 h-14">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileSidebarOpen(true)}
                className="lg:hidden text-[#8a8578] hover:text-[#c9a84c]"
              >
                <Menu className="size-5" />
              </Button>
              <h1 className="text-lg font-semibold">
                {sidebarItems.find((i) => i.id === activeTab)?.label || 'Dashboard'}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="relative text-[#8a8578] hover:text-[#c9a84c]">
                <Bell className="size-4" />
                <span className="absolute top-1 right-1 size-2 bg-[#c9a84c] rounded-full" />
              </Button>
              <Separator orientation="vertical" className="h-6 bg-[#2a2a2a]" />
              <div className="flex items-center gap-2">
                <Avatar className="size-8 border border-[#c9a84c]/30">
                  <AvatarFallback className="bg-[#c9a84c]/10 text-[#c9a84c] text-xs font-bold">
                    {userName?.charAt(0) || 'D'}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium hidden sm:inline">{userName || 'Dealer'}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
          {/* ===== OVERVIEW TAB ===== */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total Listings', value: '24', icon: Car, change: '+3', up: true },
                  { label: 'Active Bookings', value: '8', icon: CalendarCheck, change: '+2', up: true },
                  { label: 'Revenue This Month', value: 'RM 45,200', icon: DollarSign, change: '+12%', up: true },
                  { label: 'Rating', value: '4.8', icon: Star, change: '+0.1', up: true },
                ].map((stat) => {
                  const Icon = stat.icon
                  return (
                    <Card key={stat.label} className="bg-[#111111] border-[#2a2a2a]">
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex items-start justify-between mb-3">
                          <div className="w-10 h-10 rounded-lg bg-[#c9a84c]/10 flex items-center justify-center">
                            <Icon className="size-5 text-[#c9a84c]" />
                          </div>
                          <span className={`flex items-center text-xs font-medium ${stat.up ? 'text-emerald-400' : 'text-red-400'}`}>
                            {stat.up ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                            {stat.change}
                          </span>
                        </div>
                        <div className="text-2xl font-bold text-[#f5f0e8]">{stat.value}</div>
                        <div className="text-xs text-[#8a8578] mt-1">{stat.label}</div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Revenue Chart */}
                <Card className="lg:col-span-2 bg-[#111111] border-[#2a2a2a]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold">Revenue Overview</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 pt-0">
                    <div className="flex items-end gap-2 sm:gap-3 h-48">
                      {monthlyRevenue.map((item) => (
                        <div key={item.month} className="flex-1 flex flex-col items-center gap-2">
                          <div className="w-full relative" style={{ height: '160px' }}>
                            <div
                              className="absolute bottom-0 w-full rounded-t-md bg-gradient-to-t from-[#c9a84c] to-[#e8d48b] transition-all duration-500 hover:from-[#e8d48b] hover:to-[#c9a84c]"
                              style={{ height: `${item.value}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-[#8a8578]">{item.month}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Bookings */}
                <Card className="bg-[#111111] border-[#2a2a2a]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold">Recent Bookings</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 pt-2 space-y-3 max-h-72 overflow-y-auto">
                    {mockBookings.slice(0, 5).map((booking) => (
                      <div key={booking.id} className="flex items-center justify-between py-2 border-b border-[#2a2a2a]/50 last:border-0">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{booking.customer}</p>
                          <p className="text-xs text-[#8a8578] truncate">{booking.car}</p>
                        </div>
                        <div className="text-right shrink-0 ml-2">
                          <p className="text-sm font-semibold text-[#c9a84c]">RM {booking.amount.toLocaleString()}</p>
                          {getStatusBadge(booking.status)}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: 'Add New Car', icon: PlusCircle, tab: 'addCar' },
                  { label: 'View Enquiries', icon: MessageSquare, tab: 'enquiries' },
                  { label: 'Update Profile', icon: Settings, tab: 'settings' },
                ].map((action) => {
                  const Icon = action.icon
                  return (
                    <Card
                      key={action.label}
                      className="bg-[#111111] border-[#2a2a2a] cursor-pointer hover:border-[#c9a84c]/50 transition-all"
                      onClick={() => handleTabChange(action.tab)}
                    >
                      <CardContent className="p-4 sm:p-6 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-[#c9a84c]/10 flex items-center justify-center">
                          <Icon className="size-6 text-[#c9a84c]" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{action.label}</p>
                          <p className="text-xs text-[#8a8578]">Quick access</p>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}

          {/* ===== MY LISTINGS TAB ===== */}
          {activeTab === 'listings' && (
            <div className="space-y-4">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <Filter className="size-4 text-[#8a8578]" />
                  {['all', 'rent', 'sale', 'continueLoan', 'auction'].map((type) => (
                    <Button
                      key={type}
                      variant={listingFilter === type ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setListingFilter(type)}
                      className={listingFilter === type
                        ? 'bg-[#c9a84c] text-[#0a0a0a] hover:bg-[#b8963e] text-xs'
                        : 'text-[#8a8578] hover:text-[#f5f0e8] text-xs'
                      }
                    >
                      {type === 'all' ? 'All' : getTypeLabel(type)}
                    </Button>
                  ))}
                </div>
                <Button
                  onClick={() => handleTabChange('addCar')}
                  className="bg-[#c9a84c] hover:bg-[#b8963e] text-[#0a0a0a] font-semibold"
                >
                  <PlusCircle className="size-4 mr-1" />
                  Add New Car
                </Button>
              </div>

              {/* Listings Table */}
              <Card className="bg-[#111111] border-[#2a2a2a]">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[#2a2a2a]">
                          <th className="text-left py-3 px-4 text-[#8a8578] font-medium">Photo</th>
                          <th className="text-left py-3 px-4 text-[#8a8578] font-medium">Brand / Model</th>
                          <th className="text-left py-3 px-4 text-[#8a8578] font-medium">Type</th>
                          <th className="text-left py-3 px-4 text-[#8a8578] font-medium">Price</th>
                          <th className="text-left py-3 px-4 text-[#8a8578] font-medium">Status</th>
                          <th className="text-left py-3 px-4 text-[#8a8578] font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredListings.map((car) => (
                          <tr key={car.id} className="border-b border-[#2a2a2a]/50 hover:bg-[#1a1a1a]/50">
                            <td className="py-3 px-4">
                              <img src={car.photo} alt={car.brand} className="w-16 h-12 object-cover rounded-md" />
                            </td>
                            <td className="py-3 px-4">
                              <p className="font-medium">{car.brand} {car.model}</p>
                              {car.featured && (
                                <Badge className="bg-[#c9a84c]/20 text-[#c9a84c] border-[#c9a84c]/30 text-[10px] mt-1">
                                  <Star className="size-2.5 mr-0.5" />Featured
                                </Badge>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <Badge variant="outline" className="border-[#2a2a2a] text-[#8a8578] text-xs">
                                {getTypeLabel(car.type)}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 font-medium text-[#c9a84c]">
                              RM {car.price.toLocaleString()}{car.type === 'rent' ? '/day' : ''}
                            </td>
                            <td className="py-3 px-4">{getStatusBadge(car.status)}</td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-[#8a8578] hover:text-[#c9a84c]">
                                  <Edit className="size-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-[#8a8578] hover:text-red-400">
                                  <Trash2 className="size-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className={`h-7 w-7 ${car.featured ? 'text-[#c9a84c]' : 'text-[#8a8578]'} hover:text-[#c9a84c]`}
                                >
                                  {car.featured ? <Star className="size-3.5" /> : <StarOff className="size-3.5" />}
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ===== ADD CAR TAB ===== */}
          {activeTab === 'addCar' && (
            <div className="max-w-3xl mx-auto space-y-6">
              {/* Header Card */}
              <Card className="bg-[#111111] border-[#2a2a2a]">
                <CardHeader>
                  <CardTitle className="text-xl font-bold">
                    <span className="gold-text">Add New Car</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 space-y-6">
                  {/* Listing Type */}
                  <div className="space-y-2">
                    <Label className="text-[#8a8578] text-sm font-medium">Listing Type</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { type: 'rent', icon: Car, label: 'For Rent' },
                        { type: 'sale', icon: DollarSign, label: 'For Sale' },
                        { type: 'continueLoan', icon: Handshake, label: 'Continue Loan' },
                        { type: 'auction', icon: Gavel, label: 'Auction' },
                      ].map(({ type, icon: TypeIcon, label }) => (
                        <Button
                          key={type}
                          variant={carType === type ? 'default' : 'outline'}
                          onClick={() => setCarType(type)}
                          className={carType === type
                            ? 'bg-[#c9a84c] text-[#0a0a0a] hover:bg-[#b8963e] h-auto py-3 flex flex-col gap-1'
                            : 'border-[#2a2a2a] text-[#8a8578] hover:border-[#c9a84c]/50 hover:text-[#c9a84c] h-auto py-3 flex flex-col gap-1'
                          }
                        >
                          <TypeIcon className="size-4" />
                          <span className="text-xs">{label}</span>
                        </Button>
                      ))}
                    </div>
                  </div>

                  <Separator className="bg-[#2a2a2a]" />

                  {/* ===== CAR PHOTOS — ALL TYPES ===== */}
                  <div className="space-y-3">
                    <Label className="text-[#8a8578] text-sm font-medium flex items-center gap-2">
                      <ImagePlus className="size-4 text-[#c9a84c]" />
                      Car Photos
                    </Label>
                    <div
                      className="border-2 border-dashed border-[#2a2a2a] rounded-xl p-6 sm:p-8 text-center hover:border-[#c9a84c]/50 transition-colors cursor-pointer group"
                      onClick={() => {
                        if (carPhotos.length < 10) {
                          const mockNames = ['exterior_front.jpg', 'exterior_rear.jpg', 'interior_dash.jpg', 'interior_seats.jpg', 'side_profile.jpg', 'engine_bay.jpg', 'wheel_closeup.jpg', 'trunk_space.jpg', 'dashboard_screen.jpg', 'rear_lights.jpg']
                          const nextName = mockNames[carPhotos.length % mockNames.length]
                          setCarPhotos([...carPhotos, `photo_${carPhotos.length + 1}_${nextName}`])
                        }
                      }}
                    >
                      <Upload className="size-8 text-[#8a8578] mx-auto mb-2 group-hover:text-[#c9a84c] transition-colors" />
                      <p className="text-sm text-[#8a8578]">Drag & drop photos here or click to upload</p>
                      <p className="text-xs text-[#4a4535] mt-1">PNG, JPG up to 5MB each. Max 10 photos.</p>
                      {carPhotos.length > 0 && (
                        <Badge className="mt-2 bg-[#c9a84c]/20 text-[#c9a84c] border-[#c9a84c]/30 text-xs">
                          {carPhotos.length}/10 photos added
                        </Badge>
                      )}
                    </div>
                    {carPhotos.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        {carPhotos.map((photo, idx) => (
                          <div key={idx} className="relative group/photo bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg overflow-hidden">
                            <div className="aspect-video flex items-center justify-center">
                              <Car className="size-6 text-[#4a4535]" />
                            </div>
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/photo:opacity-100 transition-opacity flex items-center justify-center">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-red-400 hover:text-red-300 hover:bg-red-400/10"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setCarPhotos(carPhotos.filter((_, i) => i !== idx))
                                }}
                              >
                                <X className="size-4" />
                              </Button>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1.5">
                              <p className="text-[10px] text-[#8a8578] truncate">{photo}</p>
                            </div>
                            {idx === 0 && (
                              <Badge className="absolute top-1 left-1 bg-[#c9a84c] text-[#0a0a0a] text-[9px] px-1.5 py-0">Cover</Badge>
                            )}
                          </div>
                        ))}
                        {carPhotos.length < 10 && (
                          <div
                            className="aspect-video border-2 border-dashed border-[#2a2a2a] rounded-lg flex items-center justify-center cursor-pointer hover:border-[#c9a84c]/50 transition-colors"
                            onClick={() => {
                              const mockNames = ['exterior_front.jpg', 'exterior_rear.jpg', 'interior_dash.jpg', 'interior_seats.jpg', 'side_profile.jpg', 'engine_bay.jpg', 'wheel_closeup.jpg', 'trunk_space.jpg', 'dashboard_screen.jpg', 'rear_lights.jpg']
                              const nextName = mockNames[carPhotos.length % mockNames.length]
                              setCarPhotos([...carPhotos, `photo_${carPhotos.length + 1}_${nextName}`])
                            }}
                          >
                            <PlusCircle className="size-5 text-[#4a4535]" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <Separator className="bg-[#2a2a2a]" />

                  {/* ===== BASIC INFO — ALL TYPES ===== */}
                  <div className="space-y-4">
                    <p className="text-sm font-medium text-[#c9a84c] flex items-center gap-2">
                      <Car className="size-4" />
                      Vehicle Details
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[#8a8578] text-xs">Brand</Label>
                        <Input
                          value={carBrand}
                          onChange={(e) => setCarBrand(e.target.value)}
                          placeholder="e.g. BMW"
                          className="bg-[#1a1a1a] border-[#2a2a2a] text-[#f5f0e8] placeholder:text-[#4a4535] focus-visible:border-[#c9a84c] h-10"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[#8a8578] text-xs">Model</Label>
                        <Input
                          value={carModel}
                          onChange={(e) => setCarModel(e.target.value)}
                          placeholder="e.g. M4 Competition"
                          className="bg-[#1a1a1a] border-[#2a2a2a] text-[#f5f0e8] placeholder:text-[#4a4535] focus-visible:border-[#c9a84c] h-10"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[#8a8578] text-xs">Year</Label>
                        <Input
                          value={carYear}
                          onChange={(e) => setCarYear(e.target.value)}
                          placeholder="e.g. 2024"
                          className="bg-[#1a1a1a] border-[#2a2a2a] text-[#f5f0e8] placeholder:text-[#4a4535] focus-visible:border-[#c9a84c] h-10"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator className="bg-[#2a2a2a]" />

                  {/* ===== LOCATION — ALL TYPES ===== */}
                  <div className="space-y-4">
                    <p className="text-sm font-medium text-[#c9a84c] flex items-center gap-2">
                      <MapPin className="size-4" />
                      Location
                    </p>
                    <div className="space-y-2">
                      <Label className="text-[#8a8578] text-xs">Location</Label>
                      <Input
                        value={carLocation}
                        onChange={(e) => setCarLocation(e.target.value)}
                        placeholder="e.g. KLCC, Kuala Lumpur"
                        className="bg-[#1a1a1a] border-[#2a2a2a] text-[#f5f0e8] placeholder:text-[#4a4535] focus-visible:border-[#c9a84c] h-10"
                      />
                    </div>
                  </div>

                  <Separator className="bg-[#2a2a2a]" />

                  {/* ===== RENTAL SPECIFIC FIELDS ===== */}
                  {carType === 'rent' && (
                    <div className="p-4 rounded-lg bg-[#c9a84c]/5 border border-[#c9a84c]/20 space-y-4">
                      <p className="text-sm font-medium text-[#c9a84c] flex items-center gap-2">
                        <Car className="size-4" />
                        Rental Pricing & Details
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label className="text-[#8a8578] text-xs">Daily Price (RM)</Label>
                          <Input
                            type="number"
                            value={carDailyPrice}
                            onChange={(e) => setCarDailyPrice(e.target.value)}
                            placeholder="e.g. 680"
                            className="bg-[#1a1a1a] border-[#2a2a2a] text-[#f5f0e8] placeholder:text-[#4a4535] focus-visible:border-[#c9a84c] h-10"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[#8a8578] text-xs">Weekly Price (RM)</Label>
                          <Input
                            type="number"
                            value={carWeeklyPrice}
                            onChange={(e) => setCarWeeklyPrice(e.target.value)}
                            placeholder="e.g. 4200"
                            className="bg-[#1a1a1a] border-[#2a2a2a] text-[#f5f0e8] placeholder:text-[#4a4535] focus-visible:border-[#c9a84c] h-10"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[#8a8578] text-xs">Monthly Price (RM)</Label>
                          <Input
                            type="number"
                            value={carMonthlyPrice}
                            onChange={(e) => setCarMonthlyPrice(e.target.value)}
                            placeholder="e.g. 15000"
                            className="bg-[#1a1a1a] border-[#2a2a2a] text-[#f5f0e8] placeholder:text-[#4a4535] focus-visible:border-[#c9a84c] h-10"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-[#8a8578] text-xs">Deposit (RM)</Label>
                          <Input
                            type="number"
                            value={carRentDeposit}
                            onChange={(e) => setCarRentDeposit(e.target.value)}
                            placeholder="e.g. 5000"
                            className="bg-[#1a1a1a] border-[#2a2a2a] text-[#f5f0e8] placeholder:text-[#4a4535] focus-visible:border-[#c9a84c] h-10"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[#8a8578] text-xs">Availability</Label>
                          <div className="flex items-center gap-3 h-10">
                            <Switch
                              checked={carAvailability}
                              onCheckedChange={setCarAvailability}
                              className="data-[state=checked]:bg-[#c9a84c]"
                            />
                            <span className={`text-sm font-medium ${carAvailability ? 'text-emerald-400' : 'text-red-400'}`}>
                              {carAvailability ? 'Available' : 'Unavailable'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <Separator className="bg-[#2a2a2a]/50" />

                      {/* Rental Terms */}
                      <div className="space-y-2">
                        <Label className="text-[#8a8578] text-xs">Rental Terms & Conditions</Label>
                        <Textarea
                          value={carRentalTerms}
                          onChange={(e) => setCarRentalTerms(e.target.value)}
                          placeholder="Enter rental terms and conditions, e.g. minimum rental period, fuel policy, late return charges..."
                          rows={4}
                          className="bg-[#1a1a1a] border-[#2a2a2a] text-[#f5f0e8] placeholder:text-[#4a4535] focus-visible:border-[#c9a84c]"
                        />
                      </div>

                      <Separator className="bg-[#2a2a2a]/50" />

                      {/* Pickup / Delivery Options */}
                      <div className="space-y-3">
                        <p className="text-xs font-medium text-[#8a8578] flex items-center gap-2">
                          <Truck className="size-3.5" />
                          Pickup / Delivery Options
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a]">
                            <Checkbox
                              checked={carSelfPickup}
                              onCheckedChange={(checked) => setCarSelfPickup(checked === true)}
                              className="data-[state=checked]:bg-[#c9a84c] data-[state=checked]:border-[#c9a84c]"
                            />
                            <Label className="text-sm text-[#f5f0e8] cursor-pointer">Self Pickup</Label>
                          </div>
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a]">
                            <Checkbox
                              checked={carDeliveryAvailable}
                              onCheckedChange={(checked) => setCarDeliveryAvailable(checked === true)}
                              className="data-[state=checked]:bg-[#c9a84c] data-[state=checked]:border-[#c9a84c]"
                            />
                            <Label className="text-sm text-[#f5f0e8] cursor-pointer">Delivery Available</Label>
                          </div>
                        </div>
                        {carSelfPickup && (
                          <div className="space-y-2">
                            <Label className="text-[#8a8578] text-xs">Pickup Location</Label>
                            <Input
                              value={carPickupLocation}
                              onChange={(e) => setCarPickupLocation(e.target.value)}
                              placeholder="e.g. DK Vroom Hub, Jalan Ampang, KL"
                              className="bg-[#1a1a1a] border-[#2a2a2a] text-[#f5f0e8] placeholder:text-[#4a4535] focus-visible:border-[#c9a84c] h-10"
                            />
                          </div>
                        )}
                        {carDeliveryAvailable && (
                          <div className="space-y-2">
                            <Label className="text-[#8a8578] text-xs">Delivery Fee (RM)</Label>
                            <Input
                              type="number"
                              value={carDeliveryFee}
                              onChange={(e) => setCarDeliveryFee(e.target.value)}
                              placeholder="e.g. 50"
                              className="bg-[#1a1a1a] border-[#2a2a2a] text-[#f5f0e8] placeholder:text-[#4a4535] focus-visible:border-[#c9a84c] h-10"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ===== SALE SPECIFIC FIELDS ===== */}
                  {carType === 'sale' && (
                    <div className="p-4 rounded-lg bg-[#c9a84c]/5 border border-[#c9a84c]/20 space-y-4">
                      <p className="text-sm font-medium text-[#c9a84c] flex items-center gap-2">
                        <DollarSign className="size-4" />
                        Sale Pricing & Details
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-[#8a8578] text-xs">Sale Price (RM)</Label>
                          <Input
                            type="number"
                            value={carSalePrice}
                            onChange={(e) => setCarSalePrice(e.target.value)}
                            placeholder="e.g. 298000"
                            className="bg-[#1a1a1a] border-[#2a2a2a] text-[#f5f0e8] placeholder:text-[#4a4535] focus-visible:border-[#c9a84c] h-10"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[#8a8578] text-xs">Deposit / Booking Fee (RM)</Label>
                          <Input
                            type="number"
                            value={carBookingFee}
                            onChange={(e) => setCarBookingFee(e.target.value)}
                            placeholder="e.g. 5000"
                            className="bg-[#1a1a1a] border-[#2a2a2a] text-[#f5f0e8] placeholder:text-[#4a4535] focus-visible:border-[#c9a84c] h-10"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-[#8a8578] text-xs">Condition</Label>
                          <Select value={carSaleCondition} onValueChange={setCarSaleCondition}>
                            <SelectTrigger className="bg-[#1a1a1a] border-[#2a2a2a] text-[#f5f0e8] h-10">
                              <SelectValue placeholder="Select Condition" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#111111] border-[#2a2a2a]">
                              {['New', 'Certified Pre-Owned', 'Used'].map((c) => (
                                <SelectItem key={c} value={c.toLowerCase().replace(/\s+/g, '_')} className="text-[#f5f0e8] focus:bg-[#1a1a1a] focus:text-[#c9a84c]">
                                  {c}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[#8a8578] text-xs">Mileage (km)</Label>
                          <Input
                            type="number"
                            value={carMileage}
                            onChange={(e) => setCarMileage(e.target.value)}
                            placeholder="e.g. 12000"
                            className="bg-[#1a1a1a] border-[#2a2a2a] text-[#f5f0e8] placeholder:text-[#4a4535] focus-visible:border-[#c9a84c] h-10"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[#8a8578] text-xs">Features (comma-separated)</Label>
                        <Input
                          value={carFeatures}
                          onChange={(e) => setCarFeatures(e.target.value)}
                          placeholder="e.g. M Sport Package, Harman Kardon, Head-Up Display, Sunroof"
                          className="bg-[#1a1a1a] border-[#2a2a2a] text-[#f5f0e8] placeholder:text-[#4a4535] focus-visible:border-[#c9a84c] h-10"
                        />
                      </div>
                    </div>
                  )}

                  {/* ===== CONTINUE LOAN SPECIFIC FIELDS ===== */}
                  {carType === 'continueLoan' && (
                    <div className="space-y-4">
                      {/* Marketplace Notice */}
                      <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="size-5 text-amber-400 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-amber-300 mb-1">Continue Loan / Sambung Bayar</p>
                            <p className="text-xs text-amber-200/80 leading-relaxed">
                              You are listing a vehicle with an existing loan for takeover. The customer will submit an enquiry. After agreement, both parties complete the transaction with document upload and admin verification. DK Vroom acts as marketplace platform only.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 rounded-lg bg-[#c9a84c]/5 border border-[#c9a84c]/20 space-y-4">
                        <p className="text-sm font-medium text-[#c9a84c] flex items-center gap-2">
                          <Handshake className="size-4" />
                          Loan Transfer Details
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-[#8a8578] text-xs">Monthly Installment (RM)</Label>
                            <Input
                              type="number"
                              value={carMonthlyInstallment}
                              onChange={(e) => setCarMonthlyInstallment(e.target.value)}
                              placeholder="e.g. 698"
                              className="bg-[#1a1a1a] border-[#2a2a2a] text-[#f5f0e8] placeholder:text-[#4a4535] focus-visible:border-[#c9a84c] h-10"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[#8a8578] text-xs">Remaining Loan Period (months)</Label>
                            <Input
                              type="number"
                              value={carRemainingMonths}
                              onChange={(e) => setCarRemainingMonths(e.target.value)}
                              placeholder="e.g. 60"
                              className="bg-[#1a1a1a] border-[#2a2a2a] text-[#f5f0e8] placeholder:text-[#4a4535] focus-visible:border-[#c9a84c] h-10"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[#8a8578] text-xs">Deposit / Takeover Amount (RM)</Label>
                            <Input
                              type="number"
                              value={carTakeoverAmount}
                              onChange={(e) => setCarTakeoverAmount(e.target.value)}
                              placeholder="e.g. 5000"
                              className="bg-[#1a1a1a] border-[#2a2a2a] text-[#f5f0e8] placeholder:text-[#4a4535] focus-visible:border-[#c9a84c] h-10"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[#8a8578] text-xs">Bank Name</Label>
                            <Select value={carBankName} onValueChange={setCarBankName}>
                              <SelectTrigger className="bg-[#1a1a1a] border-[#2a2a2a] text-[#f5f0e8] h-10">
                                <SelectValue placeholder="Select Bank" />
                              </SelectTrigger>
                              <SelectContent className="bg-[#111111] border-[#2a2a2a]">
                                {['Maybank', 'CIMB', 'Hong Leong Bank', 'Public Bank', 'RHB', 'AmBank', 'Bank Islam', 'Bank Rakyat', 'BSN', 'UOB'].map((bank) => (
                                  <SelectItem key={bank} value={bank} className="text-[#f5f0e8] focus:bg-[#1a1a1a] focus:text-[#c9a84c]">
                                    {bank}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[#8a8578] text-xs">Vehicle Condition</Label>
                          <Textarea
                            value={carVehicleCondition}
                            onChange={(e) => setCarVehicleCondition(e.target.value)}
                            placeholder="Provide detailed description of the vehicle condition, e.g. Excellent — No scratches, full service history, accident-free..."
                            rows={4}
                            className="bg-[#1a1a1a] border-[#2a2a2a] text-[#f5f0e8] placeholder:text-[#4a4535] focus-visible:border-[#c9a84c]"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ===== AUCTION SPECIFIC FIELDS ===== */}
                  {carType === 'auction' && (
                    <div className="p-4 rounded-lg bg-[#c9a84c]/5 border border-[#c9a84c]/20 space-y-4">
                      <p className="text-sm font-medium text-[#c9a84c] flex items-center gap-2">
                        <Gavel className="size-4" />
                        Auction Details
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-[#8a8578] text-xs">Starting Bid Price (RM)</Label>
                          <Input
                            type="number"
                            value={carStartingBid}
                            onChange={(e) => setCarStartingBid(e.target.value)}
                            placeholder="e.g. 880000"
                            className="bg-[#1a1a1a] border-[#2a2a2a] text-[#f5f0e8] placeholder:text-[#4a4535] focus-visible:border-[#c9a84c] h-10"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[#8a8578] text-xs">Auction End Date/Time</Label>
                          <Input
                            type="datetime-local"
                            value={carAuctionEndDate}
                            onChange={(e) => setCarAuctionEndDate(e.target.value)}
                            className="bg-[#1a1a1a] border-[#2a2a2a] text-[#f5f0e8] placeholder:text-[#4a4535] focus-visible:border-[#c9a84c] h-10 [color-scheme:dark]"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[#8a8578] text-xs">Reserve Price (RM) <span className="text-[#4a4535]">— optional</span></Label>
                          <Input
                            type="number"
                            value={carReservePrice}
                            onChange={(e) => setCarReservePrice(e.target.value)}
                            placeholder="e.g. 950000"
                            className="bg-[#1a1a1a] border-[#2a2a2a] text-[#f5f0e8] placeholder:text-[#4a4535] focus-visible:border-[#c9a84c] h-10"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[#8a8578] text-xs">Condition</Label>
                          <Select value={carAuctionCondition} onValueChange={setCarAuctionCondition}>
                            <SelectTrigger className="bg-[#1a1a1a] border-[#2a2a2a] text-[#f5f0e8] h-10">
                              <SelectValue placeholder="Select Condition" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#111111] border-[#2a2a2a]">
                              {['New', 'Certified Pre-Owned', 'Used'].map((c) => (
                                <SelectItem key={c} value={c.toLowerCase().replace(/\s+/g, '_')} className="text-[#f5f0e8] focus:bg-[#1a1a1a] focus:text-[#c9a84c]">
                                  {c}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  )}

                  <Separator className="bg-[#2a2a2a]" />

                  {/* ===== DESCRIPTION — ALL TYPES ===== */}
                  <div className="space-y-2">
                    <Label className="text-[#8a8578] text-sm font-medium">Description</Label>
                    <Textarea
                      value={carDescription}
                      onChange={(e) => setCarDescription(e.target.value)}
                      placeholder={carType === 'continueLoan'
                        ? 'Describe the vehicle, reason for loan transfer, and any additional terms...'
                        : carType === 'rent'
                        ? 'Describe the vehicle, rental inclusions, and any special notes...'
                        : carType === 'auction'
                        ? 'Describe the vehicle, its history, and auction terms...'
                        : 'Describe the vehicle, its features, and any special notes...'
                      }
                      rows={4}
                      className="bg-[#1a1a1a] border-[#2a2a2a] text-[#f5f0e8] placeholder:text-[#4a4535] focus-visible:border-[#c9a84c]"
                    />
                  </div>

                  {/* Submit */}
                  <Button className="w-full bg-[#c9a84c] hover:bg-[#b8963e] text-[#0a0a0a] font-semibold h-12 text-base">
                    <PlusCircle className="size-5 mr-2" />
                    Add {getTypeLabel(carType)} Listing
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ===== BOOKINGS TAB ===== */}
          {activeTab === 'bookings' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <Filter className="size-4 text-[#8a8578]" />
                {['all', 'pending', 'confirmed', 'completed'].map((status) => (
                  <Button
                    key={status}
                    variant={bookingFilter === status ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setBookingFilter(status)}
                    className={bookingFilter === status
                      ? 'bg-[#c9a84c] text-[#0a0a0a] hover:bg-[#b8963e] text-xs'
                      : 'text-[#8a8578] hover:text-[#f5f0e8] text-xs'
                    }
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Button>
                ))}
              </div>

              <Card className="bg-[#111111] border-[#2a2a2a]">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[#2a2a2a]">
                          <th className="text-left py-3 px-4 text-[#8a8578] font-medium">Customer</th>
                          <th className="text-left py-3 px-4 text-[#8a8578] font-medium">Car</th>
                          <th className="text-left py-3 px-4 text-[#8a8578] font-medium">Dates</th>
                          <th className="text-left py-3 px-4 text-[#8a8578] font-medium">Status</th>
                          <th className="text-left py-3 px-4 text-[#8a8578] font-medium">Amount</th>
                          <th className="text-left py-3 px-4 text-[#8a8578] font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredBookings.map((booking) => (
                          <tr key={booking.id} className="border-b border-[#2a2a2a]/50 hover:bg-[#1a1a1a]/50">
                            <td className="py-3 px-4 font-medium">{booking.customer}</td>
                            <td className="py-3 px-4 text-[#8a8578]">{booking.car}</td>
                            <td className="py-3 px-4 text-[#8a8578]">{booking.dates}</td>
                            <td className="py-3 px-4">{getStatusBadge(booking.status)}</td>
                            <td className="py-3 px-4 font-medium text-[#c9a84c]">RM {booking.amount.toLocaleString()}</td>
                            <td className="py-3 px-4">
                              {booking.status === 'pending' ? (
                                <div className="flex items-center gap-1">
                                  <Button variant="ghost" size="sm" className="h-7 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 text-xs">
                                    <CheckCircle className="size-3.5 mr-1" />
                                    Approve
                                  </Button>
                                  <Button variant="ghost" size="sm" className="h-7 text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs">
                                    <X className="size-3.5 mr-1" />
                                    Reject
                                  </Button>
                                </div>
                              ) : (
                                <Button variant="ghost" size="sm" className="h-7 text-[#8a8578] hover:text-[#c9a84c] text-xs">
                                  <Eye className="size-3.5 mr-1" />
                                  View
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ===== ENQUIRIES TAB ===== */}
          {activeTab === 'enquiries' && (
            <div className="space-y-4">
              {[
                { name: 'Ahmad Razak', car: 'BMW M4 Competition', message: 'Is this available for a week rental?', date: '2 hours ago', phone: '+60 12-345 6789' },
                { name: 'Sarah Tan', car: 'Mercedes S580', message: 'Can I schedule a test drive?', date: '5 hours ago', phone: '+60 11-234 5678' },
                { name: 'Lim Wei Jie', car: 'Porsche 911 Turbo S', message: 'What is the deposit amount?', date: '1 day ago', phone: '+60 13-456 7890' },
                { name: 'Nurul Aisyah', car: 'Honda Civic Type R', message: 'Do you offer weekend packages?', date: '2 days ago', phone: '+60 14-567 8901' },
              ].map((enquiry, idx) => (
                <Card key={idx} className="bg-[#111111] border-[#2a2a2a]">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold">{enquiry.name}</p>
                        <p className="text-sm text-[#c9a84c]">{enquiry.car}</p>
                      </div>
                      <span className="text-xs text-[#8a8578]">{enquiry.date}</span>
                    </div>
                    <p className="text-sm text-[#8a8578] mb-3">{enquiry.message}</p>
                    <div className="flex items-center gap-2">
                      <Button size="sm" className="bg-[#c9a84c] hover:bg-[#b8963e] text-[#0a0a0a] text-xs">
                        <MessageSquare className="size-3.5 mr-1" />
                        Reply
                      </Button>
                      <Button variant="outline" size="sm" className="border-[#2a2a2a] text-[#8a8578] hover:text-[#f5f0e8] text-xs">
                        <Phone className="size-3.5 mr-1" />
                        {enquiry.phone}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* ===== ANALYTICS TAB ===== */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              {/* Stats Row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total Views', value: '3,248', change: '+18%', up: true },
                  { label: 'Conversion Rate', value: '4.2%', change: '+0.5%', up: true },
                  { label: 'Avg. Response Time', value: '2.3h', change: '-15min', up: true },
                  { label: 'Repeat Customers', value: '28%', change: '+3%', up: true },
                ].map((stat) => (
                  <Card key={stat.label} className="bg-[#111111] border-[#2a2a2a]">
                    <CardContent className="p-4 sm:p-6">
                      <div className="text-xs text-[#8a8578] mb-1">{stat.label}</div>
                      <div className="text-2xl font-bold text-[#f5f0e8]">{stat.value}</div>
                      <span className={`flex items-center text-xs font-medium ${stat.up ? 'text-emerald-400' : 'text-red-400'}`}>
                        <ArrowUpRight className="size-3" />
                        {stat.change}
                      </span>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Most Viewed Cars */}
                <Card className="bg-[#111111] border-[#2a2a2a]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold">Most Viewed Cars</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 pt-2 space-y-3">
                    {[
                      { name: 'BMW M4 Competition', views: 845 },
                      { name: 'Porsche 911 Turbo S', views: 723 },
                      { name: 'Lamborghini Huracán EVO', views: 691 },
                      { name: 'Audi RS6 Avant', views: 534 },
                      { name: 'Mercedes S580', views: 445 },
                    ].map((item, idx) => (
                      <div key={item.name} className="flex items-center justify-between py-2 border-b border-[#2a2a2a]/50 last:border-0">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-[#c9a84c] w-6">#{idx + 1}</span>
                          <span className="text-sm">{item.name}</span>
                        </div>
                        <span className="text-sm text-[#8a8578]">{item.views} views</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Revenue Breakdown */}
                <Card className="bg-[#111111] border-[#2a2a2a]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold">Revenue Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 pt-2 space-y-4">
                    {[
                      { label: 'Rental Income', value: 24500, color: 'bg-[#c9a84c]', percent: 54 },
                      { label: 'Car Sales', value: 15200, color: 'bg-emerald-500', percent: 34 },
                      { label: 'Continue Loan', value: 5500, color: 'bg-purple-500', percent: 12 },
                    ].map((item) => (
                      <div key={item.label}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm">{item.label}</span>
                          <span className="text-sm font-semibold text-[#c9a84c]">RM {item.value.toLocaleString()}</span>
                        </div>
                        <div className="w-full h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
                          <div className={`h-full ${item.color} rounded-full transition-all duration-500`} style={{ width: `${item.percent}%` }} />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* ===== PAYMENTS TAB ===== */}
          {activeTab === 'payments' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total Earned', value: 'RM 245,000' },
                  { label: 'Pending Payout', value: 'RM 12,400' },
                  { label: 'This Month', value: 'RM 45,200' },
                  { label: 'Commission Rate', value: '8%' },
                ].map((stat) => (
                  <Card key={stat.label} className="bg-[#111111] border-[#2a2a2a]">
                    <CardContent className="p-4">
                      <div className="text-xs text-[#8a8578]">{stat.label}</div>
                      <div className="text-xl font-bold text-[#c9a84c] mt-1">{stat.value}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <Card className="bg-[#111111] border-[#2a2a2a]">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[#2a2a2a]">
                          <th className="text-left py-3 px-4 text-[#8a8578] font-medium">Transaction ID</th>
                          <th className="text-left py-3 px-4 text-[#8a8578] font-medium">Customer</th>
                          <th className="text-left py-3 px-4 text-[#8a8578] font-medium">Amount</th>
                          <th className="text-left py-3 px-4 text-[#8a8578] font-medium">Method</th>
                          <th className="text-left py-3 px-4 text-[#8a8578] font-medium">Status</th>
                          <th className="text-left py-3 px-4 text-[#8a8578] font-medium">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { id: 'TXN001', customer: 'Ahmad Razak', amount: 3400, method: 'FPX', status: 'completed', date: 'Mar 1, 2026' },
                          { id: 'TXN002', customer: 'Sarah Tan', amount: 5200, method: 'TNG', status: 'pending', date: 'Mar 3, 2026' },
                          { id: 'TXN003', customer: 'Lim Wei Jie', amount: 3600, method: 'Billplz', status: 'completed', date: 'Mar 8, 2026' },
                          { id: 'TXN004', customer: 'Nurul Aisyah', amount: 760, method: 'Stripe', status: 'completed', date: 'Mar 10, 2026' },
                        ].map((txn) => (
                          <tr key={txn.id} className="border-b border-[#2a2a2a]/50 hover:bg-[#1a1a1a]/50">
                            <td className="py-3 px-4 font-mono text-xs">{txn.id}</td>
                            <td className="py-3 px-4">{txn.customer}</td>
                            <td className="py-3 px-4 font-medium text-[#c9a84c]">RM {txn.amount.toLocaleString()}</td>
                            <td className="py-3 px-4">
                              <Badge variant="outline" className="border-[#2a2a2a] text-[#8a8578] text-xs">{txn.method}</Badge>
                            </td>
                            <td className="py-3 px-4">
                              {txn.status === 'completed' ? (
                                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">Completed</Badge>
                              ) : (
                                <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">Pending</Badge>
                              )}
                            </td>
                            <td className="py-3 px-4 text-[#8a8578]">{txn.date}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ===== SETTINGS TAB ===== */}
          {activeTab === 'settings' && (
            <div className="max-w-2xl mx-auto space-y-6">
              <Card className="bg-[#111111] border-[#2a2a2a]">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Dealer Profile</CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 space-y-4">
                  <div className="flex items-center gap-4 mb-4">
                    <Avatar className="size-16 border-2 border-[#c9a84c]/30">
                      <AvatarFallback className="bg-[#c9a84c]/10 text-[#c9a84c] text-xl font-bold">
                        {userName?.charAt(0) || 'D'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-lg">{userName || 'Dealer Name'}</p>
                      <Badge className="bg-[#c9a84c]/20 text-[#c9a84c] border-[#c9a84c]/30 text-xs">
                        <CheckCircle className="size-3 mr-1" />Verified Dealer
                      </Badge>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[#8a8578]">Company Name</Label>
                      <Input defaultValue="Prestige Auto KL" className="bg-[#1a1a1a] border-[#2a2a2a] text-[#f5f0e8] focus-visible:border-[#c9a84c]" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[#8a8578]">Email</Label>
                      <Input defaultValue="info@prestigeauto.my" className="bg-[#1a1a1a] border-[#2a2a2a] text-[#f5f0e8] focus-visible:border-[#c9a84c]" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[#8a8578]">Phone</Label>
                      <Input defaultValue="+60 3-8888 9999" className="bg-[#1a1a1a] border-[#2a2a2a] text-[#f5f0e8] focus-visible:border-[#c9a84c]" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[#8a8578]">City</Label>
                      <Input defaultValue="Kuala Lumpur" className="bg-[#1a1a1a] border-[#2a2a2a] text-[#f5f0e8] focus-visible:border-[#c9a84c]" />
                    </div>
                  </div>
                  <Button className="bg-[#c9a84c] hover:bg-[#b8963e] text-[#0a0a0a] font-semibold">
                    Save Changes
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
