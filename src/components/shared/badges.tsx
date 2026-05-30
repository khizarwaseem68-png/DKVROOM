'use client'

import { Badge } from '@/components/ui/badge'
import { VEHICLE_TYPE_CONFIG, type VehicleType, CONDITION_CATEGORIES, RUNNING_STATUS, SALVAGE_STATUS } from '@/lib/constants'

interface VehicleTypeBadgeProps {
  type: VehicleType | string
}

export function VehicleTypeBadge({ type }: VehicleTypeBadgeProps) {
  const config = VEHICLE_TYPE_CONFIG[type as VehicleType]
  if (!config) return null
  return (
    <Badge className={`${config.color} text-xs font-medium border`}>
      {config.label}
    </Badge>
  )
}

interface ConditionBadgeProps {
  category: string
}

export function ConditionCategoryBadge({ category }: ConditionBadgeProps) {
  const cat = CONDITION_CATEGORIES.find(c => c.key === category)
  if (!cat) return null
  return (
    <Badge variant="outline" className={`${cat.color} ${cat.bgColor} ${cat.borderColor} text-xs`}>
      {cat.label}
    </Badge>
  )
}

interface RunningStatusBadgeProps {
  status: string
}

export function RunningStatusBadge({ status }: RunningStatusBadgeProps) {
  const config = RUNNING_STATUS[status as keyof typeof RUNNING_STATUS]
  if (!config) return null
  return (
    <Badge variant="outline" className={`${config.color} border-current/30 text-xs`}>
      {config.label}
    </Badge>
  )
}

interface SalvageStatusBadgeProps {
  status: string
}

export function SalvageStatusBadge({ status }: SalvageStatusBadgeProps) {
  const config = SALVAGE_STATUS[status as keyof typeof SALVAGE_STATUS]
  if (!config) return null
  return (
    <Badge variant="outline" className={`${config.color} border-current/30 text-xs`}>
      {config.label}
    </Badge>
  )
}
