'use client'

import dynamic from 'next/dynamic'

const CarListing = dynamic(() => import('@/components/car-listing'), { ssr: false })

export default function BuyPage() {
  return <CarListing type="sale" />
}
