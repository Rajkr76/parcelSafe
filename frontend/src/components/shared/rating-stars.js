import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function RatingStars({ rating, size = 'sm', showValue = true, interactive = false, onChange }) {
  const stars = [1, 2, 3, 4, 5];
  const sizeClass = size === 'sm' ? 'h-4 w-4' : size === 'md' ? 'h-5 w-5' : 'h-6 w-6';

  return (
    <div className="flex items-center gap-1">
      {stars.map((star) => (
        <Star
          key={star}
          className={cn(
            sizeClass,
            'transition-colors',
            star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-neutral-600',
            interactive && 'cursor-pointer hover:text-yellow-400'
          )}
          onClick={() => interactive && onChange?.(star)}
        />
      ))}
      {showValue && rating > 0 && (
        <span className="text-sm text-muted-foreground ml-1">
          {typeof rating === 'number' ? rating.toFixed(1) : rating}
        </span>
      )}
    </div>
  );
}
