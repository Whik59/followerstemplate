import { SVGProps } from 'react';

interface StarIconProps extends SVGProps<SVGSVGElement> {
  isFilled?: boolean;
  isHalfFilled?: boolean;
}

export function StarIcon({ isFilled = true, isHalfFilled = false, className, ...props }: StarIconProps) {
  // Base classes for the SVG container, controls stroke color for empty/half stars if not overridden by polygon
  const svgBaseClass = isFilled || isHalfFilled ? "text-amber-500" : "text-amber-400"; 

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      // stroke="currentColor" // Stroke will be handled by polygon or specific classes
      strokeWidth="1.5" // Slightly thinner stroke for a more refined look
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`${svgBaseClass} ${className || ''}`}
      {...props}
    >
      <defs>
        <linearGradient id="amber-half-fill">
          {/* CurrentColor will be text-amber-500 if isHalfFilled is true due to svgBaseClass */}
          <stop offset="50%" stopColor="currentColor" /> 
          <stop offset="50%" stopColor="#FEFBEB" /> {/* amber-50 for the lighter half */}
        </linearGradient>
      </defs>
      <polygon
        points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
        className={
          isHalfFilled 
            ? "fill-[url(#amber-half-fill)] stroke-amber-500" 
            : isFilled 
              ? "fill-amber-500 stroke-amber-600" 
              : "fill-amber-50 stroke-amber-400" // Empty star: light amber fill, darker amber stroke
        }
      />
    </svg>
  );
} 