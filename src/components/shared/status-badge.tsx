'use client'

import { Badge } from '@/components/ui/badge'
import { STATUS_COLORS } from '@/lib/constants'

interface StatusBadgeProps {
  status: string
  className?: string
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const colorClass = STATUS_COLORS[status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  const labels: Record<string, string> = {
    uploaded: 'Under Verification',
    payment_uploaded: 'Payment Under Verification',
    payment_pending: 'Payment Pending',
  }
  const label = labels[status] || status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

  return (
    <Badge className={`${colorClass} border text-xs font-medium ${className}`}>
      {label}
    </Badge>
  )
}
