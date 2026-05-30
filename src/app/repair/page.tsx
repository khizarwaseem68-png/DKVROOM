'use client'

import dynamic from 'next/dynamic'

const RepairPage = dynamic(() => import('@/components/repair-page'), { ssr: false })

export default function RepairRoute() {
  return <RepairPage />
}
