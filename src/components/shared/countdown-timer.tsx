'use client'

import { memo } from 'react'
import { useCountdown } from '@/hooks/use-api'

interface CountdownTimerProps {
  targetDate: string | Date
  className?: string
}

export const CountdownTimer = memo(function CountdownTimer({ targetDate, className = '' }: CountdownTimerProps) {
  const { days, hours, minutes, seconds, expired } = useCountdown(targetDate)

  if (expired) {
    return (
      <span className={`text-red-400 font-semibold text-sm ${className}`}>
        Auction Ended
      </span>
    )
  }

  const units = [
    { value: days, label: 'd' },
    { value: hours, label: 'h' },
    { value: minutes, label: 'm' },
    { value: seconds, label: 's' },
  ]

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {units.map((unit) => (
        <span key={unit.label} className="inline-flex items-center gap-0.5">
          <span className="text-[#f5f0e8] font-bold text-sm tabular-nums min-w-[1.5ch] text-center">
            {String(unit.value).padStart(2, '0')}
          </span>
          <span className="text-muted-foreground text-xs">{unit.label}</span>
        </span>
      ))}
    </div>
  )
})
