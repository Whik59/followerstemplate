export interface ReviewSummary {
  numberOfReviews: number;
  averageRating: number;
}

// Interface for a single detailed review (if needed in the future)
// export interface Review {
//   id: string;
//   productId: string;
//   rating: number; // e.g., 1-5
//   author: string;
//   date: string; // ISO date string
//   comment: string;
//   verifiedPurchase?: boolean;
// } 