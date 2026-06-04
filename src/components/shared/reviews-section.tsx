'use client'

import { useState, useEffect, useCallback } from 'react'
import { reviewApi } from '@/lib/api'
import { formatDate } from '@/lib/constants'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { EmptyState, LoadingState, StatusBadge, StarRating } from '@/components/shared'

export default function ReviewsSection() {
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchReviews = useCallback(async () => {
    setLoading(true)
    try {
      const result = await reviewApi.list()
      setReviews((result.data ?? []) as any[])
    } catch {
      setReviews([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { queueMicrotask(() => fetchReviews()) }, [fetchReviews])

  if (loading) return <LoadingState message="Loading reviews..." />

  if (reviews.length === 0) {
    return <EmptyState title="No reviews yet" description="Reviews from customers will appear here." />
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="dash-heading-sm">Customer Reviews ({reviews.length})</h2>
      </div>

      <div className="space-y-3">
        {reviews.map((review: any) => (
          <Card key={review.id} className="bg-card border-border">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <Avatar className="size-10 border border-gold/20 shrink-0">
                    <AvatarFallback className="bg-gold/10 text-gold text-xs font-bold">
                      {(review.user?.name || 'U').charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-foreground text-body-sm">
                        {review.user?.name || 'Anonymous'}
                      </span>
                      {review.car && (
                        <span className="text-caption text-muted-foreground">
                          on {review.car.brand} {review.car.model}
                        </span>
                      )}
                      {review.dealer && (
                        <span className="text-caption text-muted-foreground">
                          on {review.dealer.companyName}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <StarRating rating={review.rating} size="sm" />
                      <StatusBadge status={review.status} />
                    </div>
                    {review.comment && (
                      <p className="text-body-sm text-muted-foreground mt-2">{review.comment}</p>
                    )}
                    <p className="text-caption text-muted-foreground/50 mt-2">
                      {formatDate(review.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
