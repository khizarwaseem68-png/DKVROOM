'use client'

import dynamic from 'next/dynamic'

const PaymentPage = dynamic(() => import('@/components/payment-page'), { ssr: false })

export default function PaymentRoute() {
  return <PaymentPage />
}
