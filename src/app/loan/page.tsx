'use client'

import dynamic from 'next/dynamic'

const LoanPage = dynamic(() => import('@/components/loan-page'), { ssr: false })

export default function LoanRoute() {
  return <LoanPage />
}
