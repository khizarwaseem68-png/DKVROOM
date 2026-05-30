'use client'

import dynamic from 'next/dynamic'

const DealerDashboard = dynamic(() => import('@/components/dealer-dashboard'), { ssr: false })

export default function DealerDashboardRoute() {
  return <DealerDashboard />
}
