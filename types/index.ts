export interface ReviewMetadata {
  id: string;
  rating: number;
  avatarUrl?: string; // Optional now
  authorKey: string; // Key for translation file, e.g., 'review_1_author' Key for translation file, e.g., 'review_1_company'
  textKey: string;    // Key for translation file, e.g., 'review_1_text'
  productShortTitleKey?: string; // Optional key for product title, e.g., 'review_1_product_title'
  isVerified?: boolean;
  isAnonymous?: boolean;
}

// This interface represents the structure of your reviews.json file
export interface ReviewTranslations {
  sectionTitle: string;
  verifiedBadgeText: string;
  anonymousAuthor: string;
  basedOnReviewsText: string; // e.g., "Based on {count} reviews"
  overallRatingText: string; // e.g., "Excellent"
  seeAllReviewsLinkText: string; // e.g., "See all reviews"

  // For individual review authors, texts, and product titles
  [key: string]: string | undefined; // Allow undefined for optional keys like product titles
}

// New interfaces for Key Highlights
export interface KeyHighlightMetadata {
  id: string;
  iconName: string; // To map to an icon component
  titleKey: string;
  descriptionKey?: string; // Optional description
}

export interface KeyHighlightsTranslations {
  [key: string]: string; // For titleKey, descriptionKey, etc.
} 