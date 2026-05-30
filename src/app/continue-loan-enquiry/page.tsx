'use client'

import dynamic from 'next/dynamic'

const ContinueLoanEnquiry = dynamic(() => import('@/components/continue-loan-enquiry'), { ssr: false })

export default function ContinueLoanEnquiryRoute() {
  return <ContinueLoanEnquiry />
}
