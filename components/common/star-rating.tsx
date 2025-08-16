import { StarIcon } from '@/components/ui/star-icon';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  starSize?: number;
  className?: string;
}

export function StarRating({ rating, maxRating = 5, starSize = 24, className }: StarRatingProps) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;
  const emptyStars = maxRating - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className={`flex items-center ${className || ''}`} role="img" aria-label={`Rating: ${rating} out of ${maxRating} stars`}>
      {[...Array(fullStars)].map((_, index) => (
        <StarIcon key={`full-${index}`} isFilled={true} width={starSize} height={starSize} />
      ))}
      {hasHalfStar && <StarIcon key="half" isHalfFilled={true} width={starSize} height={starSize} />}
      {[...Array(emptyStars)].map((_, index) => (
        <StarIcon key={`empty-${index}`} isFilled={false} width={starSize} height={starSize} />
      ))}
    </div>
  );
} 