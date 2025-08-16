import fs from 'fs/promises';
import path from 'path';
import type { Product } from '@/types/product';

export interface PaginatedProductsResponse {
  products: Product[];
  totalProducts: number;
  totalPages: number;
  currentPage: number;
  limit: number;
}

const PRODUCTS_FILE_PATH = path.join(process.cwd(), 'data/products.json');

// Use a global variable in development to prevent the cache from being cleared on hot reloads.
// This is a standard pattern in Next.js.
declare global {
  // eslint-disable-next-line no-var
  var productsCache: Product[] | undefined;
}

let productsCache: Product[] | null = null;

// Function to read and cache products from the single JSON file
async function getAndCacheAllProducts(): Promise<Product[]> {
  // In development, use the global cache to survive hot reloads.
  if (process.env.NODE_ENV === 'development') {
    if (global.productsCache) {
      return global.productsCache;
    }
  } else {
    // In production, use the simple module-level cache.
    if (productsCache) {
      return productsCache;
    }
  }

  try {
    const raw = await fs.readFile(PRODUCTS_FILE_PATH, 'utf8');
    const products = JSON.parse(raw) as Product[];

    // Set the appropriate cache.
    if (process.env.NODE_ENV === 'development') {
      global.productsCache = products;
    } else {
      productsCache = products;
    }
    
    return products;
  } catch (error) {
    console.error("Failed to read or parse products.json:", error);
    return []; // Return empty array on error
  }
}

export async function getAllProducts(params?: { categoryId?: number; categoryIds?: number[]; page?: number; limit?: number; excludeProductIds?: number[] }): Promise<PaginatedProductsResponse> {
  const { categoryId, categoryIds, page = 1, limit = 24, excludeProductIds } = params || {};

  const allProducts = await getAndCacheAllProducts();

  // Filter products in memory
  let filteredProducts = allProducts;

  if (categoryIds && categoryIds.length > 0) {
    filteredProducts = filteredProducts.filter(product =>
      product.categoryIds && product.categoryIds.some((id: number) => categoryIds.includes(id))
    );
  } else if (typeof categoryId === 'number') {
    filteredProducts = filteredProducts.filter(product =>
      product.categoryIds && product.categoryIds.includes(categoryId)
    );
  }

  if (excludeProductIds && excludeProductIds.length > 0) {
    filteredProducts = filteredProducts.filter(product => !excludeProductIds.includes(product.productId));
  }

  const totalProducts = filteredProducts.length;
  const totalPages = Math.ceil(totalProducts / limit);
  const currentPage = Math.max(1, Math.min(page, totalPages || 1));
  const start = (currentPage - 1) * limit;
  const end = start + limit;
  const paginated = filteredProducts.slice(start, end);

  return {
    products: paginated,
    totalProducts,
    totalPages,
    currentPage,
    limit,
  };
}

export async function getProductById(id: number): Promise<Product | undefined> {
  const allProducts = await getAndCacheAllProducts();
  return allProducts.find(product => product.productId === id);
} 