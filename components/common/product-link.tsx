'use client';

import Link from 'next/link';
import type { LinkProps } from 'next/link';
import React from 'react';

interface ProductLinkProps extends LinkProps {
  productNameCanonical: string;
  productSlug: string;
  productUrl: string;
  children: React.ReactNode;
  className?: string;
}

export function ProductLink({ 
  href, 
  productNameCanonical, 
  productSlug, 
  productUrl, 
  children, 
  className 
}: ProductLinkProps) {
  const handleClick = () => {
    console.log(`[TTFB Debug] Product card clicked for product: ${productNameCanonical}, slug: ${productSlug}, URL: ${productUrl}, timestamp: ${new Date().toISOString()}`);
  };

  return (
    <Link href={href} className={className} onClick={handleClick}>
      {children}
    </Link>
  );
} 