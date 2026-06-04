'use client'

import { useState } from 'react'
import { Star, Send, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { reviewApi } from '@/lib/api'

interface ReviewModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  targetType: 'car' | 'dealer'
  targetId: string
  targetName: string
  bookingId?: string
}

export function ReviewModal({ open, onClose, onSuccess, targetType, targetId, targetName, bookingId }: ReviewModalProps) {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!open) return null

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Please select a rating')
      return
    }

    setSubmitting(true)
    try {
      const payload: any = {
        targetType,
        rating,
        comment: comment.trim() || undefined,
      }
      if (targetType === 'car') payload.carId = targetId
      else payload.dealerId = targetId
      if (bookingId) payload.bookingId = bookingId

      await reviewApi.create(payload)
      toast.success('Review submitted successfully!')
      setRating(0)
      setComment('')
      onSuccess()
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit review')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-card border border-border rounded-xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold text-foreground">
            Review {targetType === 'car' ? 'Car' : 'Dealer'}
          </h3>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-muted-foreground hover:text-foreground h-7 w-7">
            <X className="size-4" />
          </Button>
        </div>

        <div className="p-4 sm:p-6 space-y-4">
          <div>
            <p className="text-body-sm text-muted-foreground mb-1">You are reviewing</p>
            <p className="font-medium text-foreground">{targetName}</p>
          </div>

          <div className="space-y-2">
            <p className="text-body-sm font-medium text-muted-foreground">Rating</p>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-0.5 transition-transform hover:scale-110"
                >
                  <Star
                    className={`size-8 cursor-pointer ${
                      star <= (hoverRating || rating)
                        ? 'fill-[#c9a84c] text-[#c9a84c]'
                        : 'fill-muted text-muted'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-body-sm font-medium text-muted-foreground">Comment (optional)</p>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience..."
              className="bg-secondary border-border text-foreground placeholder:text-muted-foreground/50 min-h-[100px] resize-none"
              maxLength={1000}
            />
            <p className="text-caption text-muted-foreground text-right">{comment.length}/1000</p>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={submitting || rating === 0}
            className="w-full bg-gold hover:bg-gold-dark text-primary-foreground font-semibold"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Submitting...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Send className="size-4" />
                Submit Review
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
