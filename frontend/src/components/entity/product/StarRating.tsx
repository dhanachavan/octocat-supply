import { useState, useEffect } from 'react';

interface StarRatingProps {
  productId: number;
  productName: string;
}

const STORAGE_KEY = 'product-ratings';

function loadRatings(): Record<number, number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<number, number>) : {};
  } catch {
    return {};
  }
}

function saveRating(productId: number, rating: number): void {
  const ratings = loadRatings();
  ratings[productId] = rating;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ratings));
}

export default function StarRating({ productId, productName }: StarRatingProps) {
  const [rating, setRating] = useState<number>(0);
  const [hovered, setHovered] = useState<number>(0);
  const [justRated, setJustRated] = useState(false);

  useEffect(() => {
    const ratings = loadRatings();
    setRating(ratings[productId] ?? 0);
  }, [productId]);

  const handleRate = (value: number) => {
    setRating(value);
    saveRating(productId, value);
    setJustRated(true);
    setTimeout(() => setJustRated(false), 800);
  };

  const activeIndex = hovered || rating;

  return (
    <div className="flex flex-col items-start gap-1">
      <div
        className="flex items-center gap-1"
        role="group"
        aria-label={`Rate ${productName}`}
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const isActive = star <= activeIndex;
          return (
            <button
              key={star}
              type="button"
              aria-label={`Rate ${productName} ${star} star${star !== 1 ? 's' : ''}`}
              aria-pressed={rating === star}
              onClick={() => handleRate(star)}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              className={[
                'w-9 h-9 flex items-center justify-center rounded-full transition-all duration-200',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-1',
                'hover:scale-125 active:scale-110',
                isActive
                  ? 'text-blue-500 drop-shadow-[0_0_6px_rgba(59,130,246,0.8)]'
                  : 'text-gray-300 hover:text-blue-300',
                justRated && star <= rating ? 'animate-bounce' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill={isActive ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth={isActive ? '0' : '1.5'}
                className="w-6 h-6"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"
                />
              </svg>
            </button>
          );
        })}
      </div>
      <p
        className="text-xs text-blue-400 font-medium min-h-[1rem]"
        aria-live="polite"
        aria-atomic="true"
      >
        {rating > 0 ? `Your rating: ${rating} / 5` : 'Click a star to rate'}
      </p>
    </div>
  );
}
