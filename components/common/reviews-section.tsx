'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { reviewsMetadata } from '@/lib/data/reviews-metadata';
import { ReviewTranslations } from '@/types';
import { Star } from 'lucide-react';
import dynamic from 'next/dynamic';
const ReviewCard = dynamic(() => import('@/components/common/review-card').then(mod => mod.ReviewCard));
const PaginationControls = dynamic(() => import('@/components/common/pagination-controls').then(mod => mod.PaginationControls));

// RECOMMENDATION: Import this component dynamically in your page for optimal bundle splitting:
// const ReviewsSection = dynamic(() => import('@/components/common/reviews-section'), { ssr: false });

async function getReviewTranslations(locale: string): Promise<ReviewTranslations> {
  try {
    const res = await fetch(`/api/translations/${locale}/reviews`); // Updated to use the new API route
    if (!res.ok) {
      // Log the status and statusText for better debugging if the API route itself fails
      console.error(`API route error: ${res.status} ${res.statusText} for locale ${locale}`);
      // Attempt fallback through the API route if the initial locale fetch failed
      if (locale !== 'en') {
        console.warn(`Attempting fallback to 'en' via API for locale ${locale}`);
        const fallbackRes = await fetch(`/api/translations/en/reviews`);
        if (!fallbackRes.ok) {
          console.error(`API route error (fallback): ${fallbackRes.status} ${fallbackRes.statusText}`);
          throw new Error('Failed to fetch translations and fallback from API.');
        }
        return await fallbackRes.json() as ReviewTranslations;
      }
      throw new Error(`Failed to fetch translations from API for locale ${locale}: ${res.statusText}`);
    }
    return await res.json() as ReviewTranslations;
  } catch (error) {
    // This catch block handles network errors or if JSON parsing fails
    const err = error as Error;
    console.error(`Error in getReviewTranslations for locale ${locale}:`, err.message);
    // Final attempt for English fallback if an error occurred that wasn't a !res.ok from primary locale
    // This path might be hit for network issues, or if the primary try block threw before fallback logic
    if (locale !== 'en') {
        console.warn(`General error for ${locale}, attempting fallback to 'en' via API.`);
        try {
            const fallbackRes = await fetch(`/api/translations/en/reviews`);
            if (!fallbackRes.ok) {
                console.error(`API route error (general error fallback): ${fallbackRes.status} ${fallbackRes.statusText}`);
                throw new Error('Failed to fetch translations from API during general error fallback.');
            }
            return await fallbackRes.json() as ReviewTranslations;
        } catch (fallbackNetworkError) {
            const fbNetErr = fallbackNetworkError as Error;
            console.error('Network or JSON error during fallback API call:', fbNetErr.message);
        }
    }
    throw new Error(`Failed to load review translations for ${locale} after all attempts. Original error: ${err.message}`);
  }
}

interface ReviewsSectionProps {
  locale: string; 
}

const REVIEWS_PER_PAGE = 10;

export function ReviewsSection({ locale }: ReviewsSectionProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [translations, setTranslations] = useState<ReviewTranslations | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const searchParams = useSearchParams();
  const tCommon = useTranslations('Common');

  const totalReviews = reviewsMetadata.length;
  const totalPages = Math.ceil(totalReviews / REVIEWS_PER_PAGE);

  useEffect(() => {
    const pageFromQuery = searchParams.get('reviewPage');
    let newPage = 1; // Default to page 1

    if (pageFromQuery) {
      const pageNum = parseInt(pageFromQuery, 10);
      if (!isNaN(pageNum) && pageNum > 0) {
        if (totalPages > 0) {
          newPage = Math.max(1, Math.min(pageNum, totalPages)); // Clamp between 1 and totalPages
        } else {
          // If totalPages is 0, newPage should remain 1 only if pageNum is 1, otherwise it's an invalid state for page > 1
          // However, Math.max(1, ...) above will handle making it 1 if pageNum was < 1.
          // If totalPages is 0, any pageNum > 0 will be clamped to 1 by Math.min(pageNum, totalPages) if totalPages was positive.
          // For totalPages = 0, pageNum > 0: result of Math.min(pageNum, 0) is 0. Then Math.max(1,0) is 1.
          // This ensures newPage is always at least 1.
          // If pageNum is 1 and totalPages is 0, newPage becomes Math.max(1, Math.min(1,0)) = Math.max(1,0) = 1.
          newPage = 1; // Correctly ensures page is 1 if no content
        }
      }
      // If pageNum is NaN or <= 0, newPage remains the default of 1.
    }
    // If no pageFromQuery, newPage also remains the default of 1.

    // Set the current page. React's setCurrentPage will handle not re-rendering if the value is the same.
    setCurrentPage(newPage);

  }, [searchParams, totalPages]); // Removed currentPage from dependencies

  useEffect(() => {
    async function loadTranslations() {
      setIsLoading(true);
      try {
        const fetchedTranslations = await getReviewTranslations(locale);
        setTranslations(fetchedTranslations);
      } catch (error) {
        console.error("Failed to load translations in ReviewsSection:", error);
        // Handle error state, maybe set default translations or show error message
      }
      setIsLoading(false);
    }
    loadTranslations();
  }, [locale]);

  if (isLoading || !translations) {
    return (
      <section className="relative py-12 overflow-hidden">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="text-center mb-10 md:mb-16 animate-pulse">
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-center">
              <span className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 dark:from-amber-400 dark:via-orange-400 dark:to-red-500 text-transparent bg-clip-text">
                {tCommon('reviewsGlobalTitle') || 'Loading Reviews...'}
              </span>
            </h2>
          </div>
        </div>
      </section>
    );
  }

  const indexOfLastReview = currentPage * REVIEWS_PER_PAGE;
  const indexOfFirstReview = indexOfLastReview - REVIEWS_PER_PAGE;
  const currentReviews = reviewsMetadata.slice(indexOfFirstReview, indexOfLastReview);

  return (
    <section id="reviews-section" className="relative py-16 sm:py-20 lg:py-24 overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-amber-200 dark:bg-amber-900/30 rounded-full mix-blend-multiply dark:mix-blend-soft-light blur-3xl opacity-50 animate-blob" />
        <div className="absolute -top-4 right-1/4 w-72 h-72 bg-orange-200 dark:bg-orange-900/30 rounded-full mix-blend-multiply dark:mix-blend-soft-light blur-3xl opacity-50 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-8 left-1/3 w-72 h-72 bg-amber-100 dark:bg-amber-800/30 rounded-full mix-blend-multiply dark:mix-blend-soft-light blur-3xl opacity-50 animate-blob animation-delay-4000" />
      </div>

      <div className="relative px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        {tCommon('reviewsGlobalTitle') && tCommon('reviewsGlobalTitle').trim() !== '' && (
          <div className="text-center mb-12 md:mb-20">
            <div className="flex justify-center mb-4">
              <div className="inline-block bg-gradient-to-r from-amber-500 to-yellow-500 dark:from-amber-400 dark:to-yellow-400 px-6 py-3 rounded-2xl shadow-md border border-amber-500 dark:border-amber-700">
                <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-wide text-white dark:text-amber-100 m-0">
                  {tCommon('reviewsGlobalTitle')}
                </h2>
              </div>
            </div>
            <div className="flex justify-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i} 
                  className="w-5 h-5 text-amber-400 fill-amber-400 animate-pulse" 
                  style={{ animationDelay: `${i * 200}ms` }}
                />
              ))}
            </div>
          </div>
        )}

        {currentReviews.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:gap-8 lg:gap-10 lg:grid-cols-3 xl:grid-cols-3 sm:grid-cols-2">
            {currentReviews.map((review, index) => (
              <div key={review.id} 
                   className="transform transition-all duration-500"
                   style={{ 
                     animationDelay: `${index * 100}ms`,
                     opacity: 0,
                     animation: 'fadeInUp 0.5s ease forwards'
                   }}>
                <ReviewCard review={review} translations={translations} />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-600 dark:text-gray-400">
            {translations.noReviewsText || "No reviews to display for this page."}
          </p>
        )}

        <div className="mt-12">
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={REVIEWS_PER_PAGE}
            totalItems={totalReviews}
            queryParamName="reviewPage"
          />
        </div>
      </div>
    </section>
  );
} 