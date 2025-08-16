'use client';

import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'; // Using lucide-react for icons
import { Button } from '@/components/ui/button'; // Assuming you have a Button component
import { useRouter, usePathname, useSearchParams } from 'next/navigation'; // Import useRouter, usePathname, and useSearchParams
import { useTranslations } from 'next-intl'; // ADDED: Import useTranslations

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalItems: number;
  queryParamName?: string; // Optional query parameter name
}

export function PaginationControls({
  currentPage,
  totalPages,
  itemsPerPage,
  totalItems,
  queryParamName = 'page', // Default to 'page'
}: PaginationControlsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams(); // To get current search params for preserving others
  const t = useTranslations('Common'); // ADDED: Initialize useTranslations for 'Common' namespace

  if (totalPages <= 1) {
    return null; // Don't render pagination if there's only one page or less
  }

  const handlePageNavigation = (page: number) => {
    const currentParams = new URLSearchParams(Array.from(searchParams.entries())); // Create mutable copy
    currentParams.set(queryParamName, String(page)); // Use queryParamName
    router.push(`${pathname}?${currentParams.toString()}#products-section`, { scroll: false });
  };

  const handlePrevious = () => {
    handlePageNavigation(Math.max(1, currentPage - 1));
  };

  const handleNext = () => {
    handlePageNavigation(Math.min(totalPages, currentPage + 1));
  };

  // Calculate the range of items being displayed
  const firstItemIndex = (currentPage - 1) * itemsPerPage + 1;
  const lastItemIndex = Math.min(currentPage * itemsPerPage, totalItems);

  // Logic for displaying page numbers (simplified for brevity, can be expanded)
  const pageNumbers = [];
  const maxPageNumbersToShow = 5; // Max page buttons to show (e.g., 1 ... 3 4 5 ... 10)
  const halfMaxPages = Math.floor(maxPageNumbersToShow / 2);

  if (totalPages <= maxPageNumbersToShow) {
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(i);
    }
  } else {
    if (currentPage <= halfMaxPages) {
      for (let i = 1; i <= maxPageNumbersToShow - 1; i++) {
        pageNumbers.push(i);
      }
      pageNumbers.push('...');
      pageNumbers.push(totalPages);
    } else if (currentPage >= totalPages - halfMaxPages) {
      pageNumbers.push(1);
      pageNumbers.push('...');
      for (let i = totalPages - maxPageNumbersToShow + 2; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      pageNumbers.push(1);
      pageNumbers.push('...');
      for (let i = currentPage - halfMaxPages + 1; i <= currentPage + halfMaxPages -1; i++) {
        pageNumbers.push(i);
      }
      pageNumbers.push('...');
      pageNumbers.push(totalPages);
    }
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between mt-8 sm:mt-12 pt-4 border-t border-gray-200 dark:border-gray-700">
      <div className="text-sm text-gray-700 dark:text-gray-300 mb-4 sm:mb-0">
        {t.rich('paginationResultsText', {
          firstItem: firstItemIndex,
          lastItem: lastItemIndex,
          totalItems: totalItems,
          semibold: (chunks) => <span className="font-semibold">{chunks}</span>,
        })}
      </div>
      <nav aria-label="Pagination">
        <ul className="flex items-center -space-x-px h-10 text-base">
          <li>
            <Button
              variant="outline"
              size="icon"
              className={`h-10 w-10 p-0 rounded-l-md ${currentPage === 1 ? 'cursor-not-allowed opacity-50' : ''}`}
              onClick={handlePrevious}
              disabled={currentPage === 1}
              aria-label="Go to previous page"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </Button>
          </li>

          {/* Page Numbers - Rendered on larger screens, hidden on smaller for simplicity */}
          {pageNumbers.map((page, index) => (
            <li key={index} className="hidden sm:inline-block">
              {typeof page === 'number' ? (
                <Button
                  variant={page === currentPage ? 'default' : 'outline'}
                  className={`h-10 w-10 p-0 ${page === currentPage ? 'bg-amber-500 text-white dark:bg-amber-600' : ''}`}
                  onClick={() => handlePageNavigation(page)}
                  aria-current={page === currentPage ? 'page' : undefined}
                >
                  {page}
                </Button>
              ) : (
                <span className="flex items-center justify-center px-4 h-10 text-gray-500 dark:text-gray-400">{page}</span>
              )}
            </li>
          ))}
          
          <li>
            <Button
              variant="outline"
              size="icon"
              className={`h-10 w-10 p-0 rounded-r-md ${currentPage === totalPages ? 'cursor-not-allowed opacity-50' : ''}`}
              onClick={handleNext}
              disabled={currentPage === totalPages}
              aria-label="Go to next page"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </Button>
          </li>
        </ul>
      </nav>
    </div>
  );
} 