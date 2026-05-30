'use client'

import dynamic from 'next/dynamic'

const LoanApplication = dynamic(() => import('@/components/loan-application'), { ssr: false })

export default function ApplyLoanRoute() {
  return <LoanApplication />
}
