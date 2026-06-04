'use client'

import { Star } from 'lucide-react'
import { FEATURES } from '@/lib/config'

interface StarRatingProps {
  rating: number
  size?: 'sm' | 'md' | 'lg'
  showValue?: boolean
}

const sizeMap = {
  sm: { star: 'size-3', text: 'text-xs', gap: 'gap-0.5' },
  md: { star: 'size-3.5', text: 'text-xs', gap: 'gap-0.5' },
  lg: { star: 'size-4', text: 'text-sm', gap: 'gap-1' },
}

export function StarRating({ rating, size = 'md', showValue = true }: StarRatingProps) {
  if (!FEATURES.showReviewModule) return null
  const config = sizeMap[size]
  return (
    <div className={`flex items-center ${config.gap}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${config.star} ${
            star <= Math.floor(rating)
              ? 'fill-[#c9a84c] text-[#c9a84c]'
              : star <= rating
                ? 'fill-[#c9a84c]/50 text-[#c9a84c]'
                : 'fill-muted text-muted'
          }`}
        />
      ))}
      {showValue && (
        <span className={`ml-1 ${config.text} text-muted-foreground`}>
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  )
}
