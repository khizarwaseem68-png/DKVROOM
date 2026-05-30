'use client'

import dynamic from 'next/dynamic'

const InsurancePage = dynamic(() => import('@/components/insurance-page'), { ssr: false })

export default function InsuranceRoute() {
  return <InsurancePage />
}
