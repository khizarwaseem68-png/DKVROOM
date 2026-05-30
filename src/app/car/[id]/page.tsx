'use client'

import { useParams } from 'next/navigation'
import { useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useAppStore } from '@/lib/store'

const CarDetail = dynamic(() => import('@/components/car-detail'), { ssr: false })

export default function CarDetailPage() {
  const params = useParams()
  const selectCar = useAppStore((s) => s.selectCar)
  const selectedCarId = useAppStore((s) => s.selectedCarId)

  useEffect(() => {
    const id = params.id as string
    if (id && id !== selectedCarId) {
      selectCar(id, '') // carType will be determined from the data
    }
  }, [params.id, selectedCarId, selectCar])

  return <CarDetail />
}
