import { useState } from 'react';

interface StarRatingProps {
  productId: number;
  rating: number;
  onRate: (productId: number, rating: number) => void;
}

export default function StarRating({ productId, rating, onRate }: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0);
  const [flashStar, setFlashStar] = useState(0);

  const displayRating = hoverRating || rating;

  const handleRate = (star: number) => {
    onRate(productId, star);
    setFlashStar(star);
    setTimeout(() => setFlashStar(0), 500);
  };

  return (
    <div
      className="flex items-center gap-0.5"
      role="group"
      aria-label={`Rate this product${rating > 0 ? `, current rating: ${rating} out of 5` : ''}`}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = displayRating >= star;
        const isFlashing = flashStar >= star;
        return (
          <button
            key={star}
            onClick={() => handleRate(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
            aria-pressed={rating === star}
            data-testid={`star-${productId}-${star}`}
            className={[
              'w-10 h-10 flex items-center justify-center rounded-full',
              'transition-all duration-200 ease-out',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1',
              'active:scale-90',
              isFilled
                ? 'text-blue-500 scale-110 hover:scale-125 hover:text-blue-400'
                : 'text-gray-300 hover:scale-125 hover:text-blue-300',
              isFlashing ? 'animate-bounce' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            style={{
              fontSize: '1.75rem',
              filter: isFilled
                ? 'drop-shadow(0 0 8px rgba(59,130,246,0.85))'
                : undefined,
              textShadow: isFlashing
                ? '0 0 12px rgba(59,130,246,1)'
                : undefined,
            }}
          >
            ★
          </button>
        );
      })}
      {rating > 0 && (
        <span className="ml-1 text-sm font-semibold text-blue-500">{rating}/5</span>
      )}
    </div>
  );
}
