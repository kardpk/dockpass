import { createClient } from '@/lib/supabase/server'
import { cn } from '@/lib/utils'

export async function TripReviewsSummary({
  tripId, operatorId,
}: {
  tripId: string
  operatorId: string
}) {
  const supabase = await createClient()

  const { data: reviews } = await supabase
    .from('trip_reviews')
    .select('id, rating, feedback_text, is_public, created_at')
    .eq('trip_id', tripId)
    .order('created_at', { ascending: false })

  if (!reviews || reviews.length === 0) return null

  const avgRating = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
  
  return (
    <div className="bg-white rounded-[20px] border border-[#D0E2F3] shadow-[0_1px_4px_rgba(12,68,124,0.06)] overflow-hidden mt-4">
      <div className="px-5 py-4 border-b border-[#F5F8FC]">
        <div className="flex items-center justify-between">
          <h2 className="text-[16px] font-semibold text-[#0D1B2A]">
            Reviews
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-[20px] text-[#E5910A]">★</span>
            <span className="text-[16px] font-bold text-[#0D1B2A]">
              {avgRating.toFixed(1)}
            </span>
            <span className="text-[13px] text-[#6B7C93]">
              ({reviews.length})
            </span>
          </div>
        </div>
      </div>

      <div className="divide-y divide-[#F5F8FC]">
        {reviews.map(review => (
          <div key={review.id} className="px-5 py-4">
            <div className="flex items-center justify-between mb-1">
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map(s => (
                  <span
                    key={s}
                    className={cn(
                      'text-[18px]',
                      s <= review.rating
                        ? 'text-[#E5910A]'
                        : 'text-[#D0E2F3]'
                    )}
                  >★</span>
                ))}
              </div>
              <div className="flex items-center gap-2">
                {review.is_public ? (
                  <span className="text-[11px] font-semibold text-[#1D9E75] bg-[#E8F9F4] px-2 py-0.5 rounded-full">
                    Public
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold text-[#6B7C93] bg-[#F5F8FC] px-2 py-0.5 rounded-full">
                    Private
                  </span>
                )}
                <span className="text-[12px] text-[#6B7C93]">
                  {new Date(review.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
            {review.feedback_text && (
              <p className="text-[14px] text-[#6B7C93] leading-relaxed mt-1">
                "{review.feedback_text}"
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
