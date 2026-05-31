'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/lib/store'
import dynamic from 'next/dynamic'

const CustomerDashboard = dynamic(() => import('@/components/customer-dashboard'), { ssr: false })

export default function CustomerDashboardRoute() {
  const router = useRouter()
  const user = useAppStore((state) => state.user)
  const isLoggedIn = useAppStore((state) => state.isLoggedIn)

  useEffect(() => {
    if (!isLoggedIn) return
    if (user?.role === 'customer') {
      router.replace('/')
    }
  }, [isLoggedIn, user, router])

  return <CustomerDashboard />
}
