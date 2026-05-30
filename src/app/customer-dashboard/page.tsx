'use client'

import dynamic from 'next/dynamic'

const CustomerDashboard = dynamic(() => import('@/components/customer-dashboard'), { ssr: false })

export default function CustomerDashboardRoute() {
  return <CustomerDashboard />
}
