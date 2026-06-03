'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAppStore } from '@/lib/store'
import { useScrollPosition } from '@/hooks/use-api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Car,
  Search,
  Menu,
  LogIn,
  UserPlus,
  LogOut,
  User,
  ShieldCheck,
  LayoutDashboard,
  X,
  Crown,
} from 'lucide-react'

interface NavItem {
  label: string
  path: string
  icon?: React.ReactNode
  badge?: string
}

const navItems: NavItem[] = [
  { label: 'Rent', path: '/rent' },
  { label: 'Buy', path: '/buy' },
  { label: 'Repair', path: '/repair' },
  { label: 'Insurance', path: '/insurance' },
  { label: 'Auction', path: '/auction', badge: 'HOT' },
  { label: 'Loan', path: '/loan' },
  { label: 'Continue Loan', path: '/continue-loan' },
]

export function Header() {
  const {
    searchQuery,
    isLoggedIn,
    user,
    setSearch,
    logout,
  } = useAppStore()

  const router = useRouter()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchFocused, setSearchFocused] = useState(false)
  const { isScrolled } = useScrollPosition()

  const isActive = (path: string) => pathname === path

  const handleNavClick = (path: string) => {
    router.push(path)
    setMobileOpen(false)
  }

  const userRole = user?.role
  const userName = user?.name

  const getRoleBadgeColor = () => {
    switch (userRole) {
      case 'admin':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'dealer':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      default:
        return 'bg-primary/20 text-primary border-primary/30'
    }
  }

  const getUserInitials = () => {
    if (!userName) return 'U'
    return userName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getDashboardPath = () => {
    if (userRole === 'admin') return '/admin-dashboard'
    if (userRole === 'dealer') {
      const dealer = user?.dealer
      return dealer?.verified && !dealer?.rejectedAt ? '/dealer-dashboard' : '/dealer-status'
    }
    if (userRole === 'customer') return '/customer-dashboard'
    return '/'
  }

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-500 ${
        isScrolled
          ? 'border-b border-gold/20 bg-background/95 shadow-[0_4px_30px_rgba(201,168,76,0.08)]'
          : 'border-b border-transparent bg-background/80'
      } backdrop-blur-xl`}
    >
      {/* Top gold accent line */}
      <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-gold/60 to-transparent" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4 lg:h-18">
          {/* Logo */}
          <button
            onClick={() => handleNavClick('/')}
            className="group flex shrink-0 items-center gap-2 transition-all duration-300 hover:scale-105 cursor-pointer"
          >
            <div className="relative flex size-9 items-center justify-center rounded-lg border border-gold/30 bg-gradient-to-br from-gold/20 to-transparent shadow-[0_0_15px_rgba(201,168,76,0.15)] transition-all duration-300 group-hover:border-gold/60 group-hover:shadow-[0_0_25px_rgba(201,168,76,0.25)]">
              <Car className="size-5 text-gold transition-transform duration-300 group-hover:translate-x-0.5" />
              <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-gold/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </div>
            <div className="flex flex-col">
              <span className="gold-text text-xl font-bold tracking-wider leading-tight">
                DK Vroom
              </span>
              <span className="text-[9px] font-medium uppercase tracking-[0.25em] text-gold/50">
                Premium Motors
              </span>
            </div>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-0.5 lg:flex">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => handleNavClick(item.path)}
                className={`group relative rounded-lg px-2.5 py-2 text-sm font-medium transition-all duration-300 cursor-pointer ${
                  isActive(item.path)
                    ? 'text-gold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <span className="relative z-10 flex items-center gap-1.5 whitespace-nowrap">
                  {item.label}
                  {item.badge && (
                    <Badge
                      variant="outline"
                      className="h-4 border-gold/40 bg-gold/10 px-1 text-[9px] font-bold text-gold"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </span>
                {/* Active indicator */}
                {isActive(item.path) && (
                  <span className="absolute bottom-0 left-1/2 h-[2px] w-3/4 -translate-x-1/2 rounded-full bg-gradient-to-r from-transparent via-gold to-transparent" />
                )}
                {/* Hover background */}
                <span
                  className={`absolute inset-0 rounded-lg transition-all duration-300 ${
                    isActive(item.path)
                      ? 'bg-gold/10'
                      : 'bg-transparent group-hover:bg-white/5'
                  }`}
                />
              </button>
            ))}
          </nav>

          {/* Search Bar + Actions */}
          <div className="flex items-center gap-3">
            {/* Search - Desktop */}
            <div
              className={`relative hidden transition-all duration-300 md:block ${
                searchFocused ? 'w-64' : 'w-48'
              }`}
            >
              <Search
                className={`absolute left-3 top-1/2 size-4 -translate-y-1/2 transition-colors duration-300 ${
                  searchFocused ? 'text-gold' : 'text-muted-foreground'
                }`}
              />
              <Input
                placeholder="Search vehicles..."
                value={searchQuery}
                onChange={(e) => setSearch(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className={`h-9 border-border/50 bg-secondary/50 pl-9 pr-3 text-sm transition-all duration-300 placeholder:text-muted-foreground/60 ${
                  searchFocused
                    ? 'border-gold/40 bg-secondary shadow-[0_0_15px_rgba(201,168,76,0.1)]'
                    : 'hover:border-border'
                }`}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-gold cursor-pointer"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            {/* Search - Mobile icon */}
            <Button
              variant="ghost"
              size="icon"
              className="relative text-muted-foreground transition-colors hover:text-gold md:hidden"
              onClick={() => setSearch(searchQuery ? '' : ' ')}
            >
              <Search className="size-5" />
            </Button>

            <Separator orientation="vertical" className="hidden h-6 lg:block" />

            {/* User Actions */}
            {(isLoggedIn) ? (
              <div className="flex items-center gap-2">
                {/* Dashboard link */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleNavClick(getDashboardPath())}
                  className="hidden text-muted-foreground transition-colors hover:text-gold lg:flex"
                >
                  <LayoutDashboard className="mr-1.5 size-4" />
                  Dashboard
                </Button>

                {/* User Avatar */}
                <button
                  onClick={() => handleNavClick(getDashboardPath())}
                  className="group flex items-center gap-2 rounded-full p-1 pr-3 transition-all duration-300 hover:bg-white/5 cursor-pointer"
                >
                  <Avatar className="size-8 border border-gold/30 transition-all duration-300 group-hover:border-gold/60 group-hover:shadow-[0_0_12px_rgba(201,168,76,0.2)]">
                    <AvatarFallback className="bg-gradient-to-br from-gold/20 to-gold/5 text-xs font-bold text-gold">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden flex-col items-start xl:flex gap-0.5">
                    <span className="text-xs font-medium text-foreground leading-tight whitespace-nowrap">
                      {userName}
                    </span>
                    <Badge
                      variant="outline"
                      className={`h-4 border px-1 text-[8px] font-semibold uppercase ${getRoleBadgeColor()}`}
                    >
                      {userRole === 'admin' && <ShieldCheck className="mr-0.5 size-2.5" />}
                      {userRole === 'dealer' && <Crown className="mr-0.5 size-2.5" />}
                      {userRole}
                    </Badge>
                  </div>
                </button>

                {/* Logout */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={logout}
                  className="text-muted-foreground transition-colors hover:text-red-400"
                  title="Logout"
                >
                  <LogOut className="size-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleNavClick('/login')}
                  className="text-muted-foreground transition-all duration-300 hover:text-gold"
                >
                  <LogIn className="mr-1.5 size-4" />
                  <span className="hidden sm:inline">Login</span>
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleNavClick('/register')}
                  className="border border-gold/30 bg-gradient-to-r from-gold/90 to-gold/70 text-black shadow-[0_0_15px_rgba(201,168,76,0.2)] transition-all duration-300 hover:from-gold hover:to-gold/90 hover:shadow-[0_0_25px_rgba(201,168,76,0.3)]"
                >
                  <UserPlus className="mr-1.5 size-4" />
                  <span className="hidden sm:inline">Register</span>
                </Button>
              </div>
            )}

            {/* Mobile Menu */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground transition-colors hover:text-gold lg:hidden"
                >
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-[300px] border-l border-gold/20 bg-[#0a0a0a] px-0"
              >
                <SheetHeader className="px-6 pb-4">
                  <SheetTitle className="flex items-center gap-2">
                    <div className="flex size-8 items-center justify-center rounded-lg border border-gold/30 bg-gradient-to-br from-gold/20 to-transparent">
                      <Car className="size-4 text-gold" />
                    </div>
                    <span className="gold-text text-lg font-bold tracking-wider">
                      DK Vroom
                    </span>
                  </SheetTitle>
                </SheetHeader>

                <Separator className="bg-gold/10" />

                {/* Mobile Search */}
                <div className="px-4 py-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search vehicles..."
                      value={searchQuery}
                      onChange={(e) => setSearch(e.target.value)}
                      className="h-10 border-border/50 bg-secondary/50 pl-9 pr-3 text-sm placeholder:text-muted-foreground/60 focus-visible:border-gold/40 focus-visible:bg-secondary"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearch('')}
className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-gold cursor-pointer"
                      >
                        <X className="size-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <Separator className="bg-gold/10" />

                {/* Mobile Nav Links */}
                <nav className="flex flex-col gap-1 overflow-y-auto px-3 py-4">
                  {navItems.map((item) => (
                    <button
                      key={item.path}
                      onClick={() => handleNavClick(item.path)}
                      className={`group flex items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-medium transition-all duration-300 cursor-pointer ${
                        isActive(item.path)
                          ? 'bg-gold/10 text-gold shadow-[inset_0_0_20px_rgba(201,168,76,0.05)]'
                          : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                      }`}
                    >
                      <span className="whitespace-nowrap">{item.label}</span>
                      {item.badge && (
                        <Badge
                          variant="outline"
                          className="h-5 border-gold/40 bg-gold/10 px-1.5 text-[10px] font-bold text-gold"
                        >
                          {item.badge}
                        </Badge>
                      )}
                      {isActive(item.path) && (
                        <span className="size-1.5 rounded-full bg-gold shadow-[0_0_8px_rgba(201,168,76,0.5)]" />
                      )}
                    </button>
                  ))}
                </nav>

                <Separator className="bg-gold/10" />

                {/* Mobile User Section */}
                <div className="mt-auto px-4 py-4">
                  {isLoggedIn ? (
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-3 rounded-xl border border-gold/10 bg-gold/5 p-3">
                        <Avatar className="size-10 border border-gold/30">
                          <AvatarFallback className="bg-gradient-to-br from-gold/20 to-gold/5 text-sm font-bold text-gold">
                            {getUserInitials()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm font-medium text-foreground whitespace-nowrap">
                            {userName}
                          </span>
                          <Badge
                            variant="outline"
                            className={`mt-0.5 w-fit border px-1.5 text-[9px] font-semibold uppercase ${getRoleBadgeColor()}`}
                          >
                            {userRole}
                          </Badge>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        onClick={() => handleNavClick(getDashboardPath())}
                        className="justify-start text-muted-foreground hover:text-gold"
                      >
                        <LayoutDashboard className="mr-2 size-4" />
                        Dashboard
                      </Button>

                      <Button
                        variant="ghost"
                        onClick={() => handleNavClick('/')}
                        className="justify-start text-muted-foreground hover:text-gold"
                      >
                        <User className="mr-2 size-4" />
                        My Profile
                      </Button>

                      <Button
                        variant="ghost"
                        onClick={() => { logout(); setMobileOpen(false) }}
                        className="justify-start text-red-400/80 hover:text-red-400 hover:bg-red-500/10"
                      >
                        <LogOut className="mr-2 size-4" />
                        Logout
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      <Button
                        onClick={() => handleNavClick('/login')}
                        className="w-full border border-gold/30 bg-transparent text-gold transition-all duration-300 hover:border-gold/60 hover:bg-gold/10"
                      >
                        <LogIn className="mr-2 size-4" />
                        Login
                      </Button>
                      <Button
                        onClick={() => handleNavClick('/register')}
                        className="w-full border border-gold/30 bg-gradient-to-r from-gold/90 to-gold/70 text-black shadow-[0_0_15px_rgba(201,168,76,0.2)] transition-all duration-300 hover:from-gold hover:to-gold/90 hover:shadow-[0_0_25px_rgba(201,168,76,0.3)]"
                      >
                        <UserPlus className="mr-2 size-4" />
                        Create Account
                      </Button>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* Bottom gold accent line */}
      <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-gold/20 to-transparent" />

      {/* Mobile search bar (visible when search is activated on mobile) */}
      {searchQuery && (
        <div className="border-t border-gold/10 bg-[#0a0a0a]/95 px-4 py-2 backdrop-blur-xl md:hidden">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gold" />
            <Input
              placeholder="Search vehicles..."
              value={searchQuery}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
              className="h-10 border-gold/30 bg-secondary/50 pl-9 pr-9 text-sm placeholder:text-muted-foreground/60 focus-visible:border-gold/50 focus-visible:bg-secondary"
            />
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-gold cursor-pointer"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      )}
    </header>
  )
}
