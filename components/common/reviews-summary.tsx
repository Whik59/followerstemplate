import Link from 'next/link';
// import { ReviewTranslations } from '@/types';
// import fs from 'fs';
// import path from 'path';
import { getTranslations } from 'next-intl/server';
import { StarRating } from '@/components/common/star-rating';

// Helper function to load review-specific content (e.g., author, individual review texts)
// It should NOT be expected to return basedOnReviewsText or seeAllReviewsLinkText
// const getReviewSpecificContent = ...;

interface ReviewsSummaryProps {
  locale: string;
  averageRating: number;
  totalReviewsCount: number;
  ratingDescription: string;
}

export async function ReviewsSummary({ locale, averageRating, totalReviewsCount, ratingDescription }: ReviewsSummaryProps) {
  // Log the received locale to the server console for debugging
  console.log(`[ReviewsSummary] Rendering for locale: ${locale}, totalReviewsCount: ${totalReviewsCount}`);

  // const reviewSpecificContent = await getReviewSpecificContent(locale);

  let basedOnText: string;
  let seeAllReviewsText: string;

  try {
    const commonTranslations = await getTranslations({ locale, namespace: 'Common' });
    
    // Let next-intl handle the {count} replacement
    basedOnText = commonTranslations('basedOnReviewsText', { count: totalReviewsCount });
    seeAllReviewsText = commonTranslations('seeAllReviewsLinkText');

    // Check if the key was returned or if {count} is still present (meaning translation or replacement failed)
    // Also check if basedOnText is falsy (e.g. empty string from translation file)
    if (!basedOnText || basedOnText === 'Common.basedOnReviewsText' || basedOnText === 'basedOnReviewsText' || (basedOnText && basedOnText.includes('{count}'))) {
      console.warn(`[ReviewsSummary] 'basedOnReviewsText' translation was missing, returned key, or {count} placeholder replacement failed for ${locale}. Using hardcoded default.`);
      // Hardcoded fallback with count interpolated
      basedOnText = `Based on ${totalReviewsCount} reviews`; 
    }
    
    if (!seeAllReviewsText || seeAllReviewsText === 'Common.seeAllReviewsLinkText' || seeAllReviewsText === 'seeAllReviewsLinkText') {
      console.warn(`[ReviewsSummary] 'seeAllReviewsLinkText' not found or returned key for ${locale}, using hardcoded default.`);
      seeAllReviewsText = "See all reviews";
    }

  } catch (e) {
    const errorMessage = (e instanceof Error) ? e.message : String(e);
    console.error(`[ReviewsSummary] Failed to load common translations for locale ${locale}:`, errorMessage);
    // Fallback to English hardcoded strings if common translations fail entirely for these keys
    basedOnText = `Based on ${totalReviewsCount} reviews`; // Hardcoded fallback with count interpolated
    seeAllReviewsText = "See all reviews";
  }

  // const finalBasedOnText = basedOnText.replace('{count}', totalReviewsCount.toString()); // No longer needed

  return (
    <div className="flex flex-col items-center justify-center py-1 text-center">
      {/* Line 1: Stars, Rating, Description */}
      <div className="flex items-center justify-center flex-wrap gap-x-2">
        <div className="flex items-center space-x-1">
          <StarRating rating={averageRating} starSize={16} />
          <p className="text-sm font-semibold text-amber-700 dark:text-amber-500">
            {averageRating.toFixed(1)} / 5
          </p>
        </div>
        <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">
          {ratingDescription}
        </p>
      </div>

      {/* Line 2: "Based on X reviews", Link */}
      <div className="flex items-center justify-center flex-wrap gap-x-2 text-xs mt-0.5">
        <p className="text-slate-500 dark:text-slate-400">
          {basedOnText} {/* Use the processed basedOnText here */}
        </p>
        <Link 
          href="#reviews-section" 
          className="font-medium text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-500 underline hover:no-underline transition-colors"
        >
          {seeAllReviewsText}
        </Link>
      </div>
    </div>
  );
} 