import { ReviewMetadata, ReviewTranslations } from '@/types';
import { StarRating } from '@/components/common/star-rating';
import { VerifiedIcon } from '@/components/ui/verified-icon';
import { Sparkles } from 'lucide-react';

interface ReviewCardProps {
  review: ReviewMetadata;
  translations: ReviewTranslations;
}

export function ReviewCard({ review, translations }: ReviewCardProps) {
  const authorName = review.isAnonymous
    ? translations.anonymousAuthor
    : translations[review.authorKey];

  const text = translations[review.textKey];
  const productTitle = review.productShortTitleKey ? translations[review.productShortTitleKey] : null;

  return (
    <div className="group relative bg-gradient-to-b from-white via-amber-50/30 to-amber-50/50 
                    dark:from-gray-800 dark:via-amber-900/10 dark:to-amber-900/5
                    p-6 rounded-xl border border-amber-200 dark:border-amber-700/50
                    hover:border-amber-400 dark:hover:border-amber-500
                    shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(251,191,36,0.1)]
                    dark:shadow-none dark:hover:shadow-amber-600/10
                    backdrop-blur-sm
                    w-full max-w-md mx-auto flex flex-col h-full
                    transition-all duration-300 ease-in-out
                    hover:scale-[1.02] hover:-translate-y-1">
      {/* Decorative elements */}
      <div className="absolute -top-3 -right-3 w-6 h-6 bg-amber-400/20 rounded-full blur-xl 
                    group-hover:scale-[1.5] group-hover:bg-amber-400/30 transition-all duration-500" />
      <div className="absolute -bottom-3 -left-3 w-6 h-6 bg-amber-500/20 rounded-full blur-xl 
                    group-hover:scale-[1.5] group-hover:bg-amber-500/30 transition-all duration-500" />

      <div className="relative">
        <div className="mb-4 flex items-center justify-between">
          <StarRating rating={review.rating} starSize={20} />
          <Sparkles className="w-5 h-5 text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
        
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm sm:text-base mb-4 flex-grow">
          &ldquo;{text}&rdquo;
        </p>
        
        {productTitle && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 mb-3 italic">
            {translations.purchasedProductPrefix || ': '}{productTitle}
          </p>
        )}
        
        <div className="mt-auto pt-4 border-t border-amber-200/50 dark:border-amber-700/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                {authorName}
              </p>
            </div>
            {review.isVerified && (
              <div className="flex items-center text-green-600 dark:text-green-400 text-xs sm:text-sm 
                            bg-green-50 dark:bg-green-900/20 rounded-full py-1 px-2
                            border border-green-200 dark:border-green-700/30">
                <VerifiedIcon className="mr-1.5 h-4 w-4 sm:h-5 sm:w-5" />
                <span>{translations.verifiedBadgeText}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 