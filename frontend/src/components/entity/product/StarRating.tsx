import { useState } from 'react';
import { useTheme } from '../../../context/ThemeContext';

interface StarRatingProps {
  productId: number;
  productName: string;
}

export default function StarRating({ productId, productName }: StarRatingProps) {
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const { darkMode } = useTheme();

  const displayRating = hoverRating || rating;

  return (
    <div
      className="flex flex-col gap-1 mt-2"
      data-testid={`star-rating-${productId}`}
    >
      <span
        className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
      >
        Rate this product:
      </span>
      <div
        className="flex items-center gap-1"
        role="group"
        aria-label={`Star rating for ${productName}`}
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = displayRating >= star;
          return (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star === rating ? 0 : star)} // clicking the active star again clears the rating
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              aria-label={`Rate ${productName} ${star} star${star > 1 ? 's' : ''}`}
              aria-pressed={rating === star}
              data-testid={`star-${productId}-${star}`}
              className={[
                'relative w-10 h-10 flex items-center justify-center rounded-full',
                'transition-all duration-200 ease-in-out',
                'focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1',
                isFilled
                  ? 'text-blue-500 scale-110 drop-shadow-[0_0_8px_rgba(59,130,246,0.85)]'
                  : `hover:scale-125 hover:text-blue-400 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`,
              ].join(' ')}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill={isFilled ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth={isFilled ? 0 : 1.5}
                className="w-7 h-7"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                />
              </svg>
            </button>
          );
        })}
      </div>
      {rating > 0 && (
        <span
          className="text-xs font-semibold text-blue-500 animate-fade-in-once"
          aria-live="polite"
          data-testid={`rating-feedback-${productId}`}
        >
          You rated: {rating} / 5 ★
        </span>
      )}
    </div>
  );
}
