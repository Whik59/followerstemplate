'use client';

import { ShoppingCart } from 'lucide-react';
// Link and useParams are not needed if we are opening a drawer instead of navigating

import { useCart } from '@/context/cart-context';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';

export function CartIcon() {
  const { itemCount, openDrawer } = useCart(); // Destructure openDrawer from useCart
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <Button 
      variant="outline" 
      size="icon" 
      className="relative border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-white"
      onClick={openDrawer} // Call openDrawer on click
      aria-label="Open shopping cart" // Accessibility: Informative label
    >
      <ShoppingCart className="h-5 w-5" />
      {isClient && itemCount > 0 && (
        <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white">
          {itemCount}
        </span>
      )}
      <span className="sr-only">View shopping cart</span>
    </Button>
  );
} 