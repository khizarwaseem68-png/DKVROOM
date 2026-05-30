'use client'

import dynamic from 'next/dynamic'

const AuctionPage = dynamic(() => import('@/components/auction-page'), { ssr: false })

export default function AuctionRoute() {
  return <AuctionPage />
}
