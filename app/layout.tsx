import type { Metadata } from "next";

// This metadata can be simple, as this layout only wraps the root redirect page.
export const metadata: Metadata = {
  title: "Latam Boost",
  description: "Welcome to Latam Boost. Redirecting...",
};

/**
 * This is the root layout for the entire application. It is required by Next.js.
 * It wraps the new `app/page.tsx` we created, which handles the initial,
 * fast redirect to the user's preferred language.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // The `lang` attribute is set to 'en' as a sensible default,
    // but the actual content will be shown under the correct locale path (e.g., /nl, /fr).
    <html lang="en">
      <body>{children}</body>
    </html>
  );
} 