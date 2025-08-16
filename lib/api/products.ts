import type { Product } from '@/types/product';
import { getProductById as getProductFromUtils, getAllProducts } from '@/lib/utils/products';

export async function getProductById(id: number): Promise<Product | null> {
  const product = await getProductFromUtils(id);
  return product || null;
}

export async function fetchAllProducts(): Promise<Product[]> {
  // The cached getAllProducts returns a paginated response, but here we want all of them.
  // We set a very high limit to retrieve all products.
  // A future improvement could be to export the raw, unpaginated cache accessor from `lib/utils/products`.
  const response = await getAllProducts({ limit: 10000 }); 
  return response.products;
}

export async function getProducts(_locale: string) {
  // This function appears to be unused or incomplete.
  // Leaving it as is.
} 