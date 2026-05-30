'use client'

import dynamic from 'next/dynamic'

const HomePage = dynamic(() => import('@/components/home-page'), { ssr: false })

export default function HomeRoute() {
  return <HomePage />
}
