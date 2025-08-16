export interface GiftTier {
  id: string;
  thresholdUSD: number;
  giftValueUSD: number;
  nameKey: string; // For translation like "a ${giftValue} gift"
  unlockMessageKey: string; // e.g., "You've unlocked [giftName]!"
  progressMessageKey: string; // e.g., "Add ${amountNeeded} more for [giftName]!"
}

export const GIFT_TIERS: GiftTier[] = [
  {
    id: 'gift1',
    thresholdUSD: 50,
    giftValueUSD: 20,
    nameKey: 'giftTier_name_20', // Changed dot to underscore
    unlockMessageKey: 'giftTier_unlocked_20', // Changed dot to underscore
    progressMessageKey: 'giftTier_progress_20' // Changed dot to underscore
  },
  {
    id: 'gift2',
    thresholdUSD: 80,
    giftValueUSD: 30,
    nameKey: 'giftTier_name_30', // Changed dot to underscore
    unlockMessageKey: 'giftTier_unlocked_30', // Changed dot to underscore
    progressMessageKey: 'giftTier_progress_30' // Changed dot to underscore
  },
  {
    id: 'gift3',
    thresholdUSD: 150,
    giftValueUSD: 50,
    nameKey: 'giftTier_name_50', // Changed dot to underscore
    unlockMessageKey: 'giftTier_unlocked_50', // Changed dot to underscore
    progressMessageKey: 'giftTier_progress_50' // Changed dot to underscore
  }
].sort((a, b) => a.thresholdUSD - b.thresholdUSD); // Ensure tiers are sorted by threshold

// Helper to get localized string with placeholder replacement (basic example)
// You would typically use next-intl's t() function with rich text capabilities for this in the component.
export function getFormattedGiftMessage(messageKey: string, params?: Record<string, string | number>): string {
  // This is a placeholder. In a real scenario, you'd use your i18n library.
  // For example, if messageKey is "Add {amountNeeded} for {giftName}!"
  // and params is { amountNeeded: "$10", giftName: "a $20 gift" }
  // it would return "Add $10 for a $20 gift!"
  // This function is more for conceptualizing how messages would be formed.
  // The actual formatting will happen in the component using useTranslations.
  let message = messageKey; // In reality, this would be t(messageKey)
  if (params) {
    for (const key in params) {
      message = message.replace(`{${key}}`, String(params[key]));
    }
  }
  return message;
} 