'use client';

import Lottie from 'lottie-react';
import { useEffect, useState } from 'react';

export function LottieAnimation2() {
  const [animationData, setAnimationData] = useState(null);

  useEffect(() => {
    fetch('/lottie/animation2.json')
      .then((response) => response.json())
      .then((data) => setAnimationData(data))
      .catch((error) => console.error('Error loading Lottie animation 2:', error));
  }, []);

  if (!animationData) {
    return null; 
  }

  return <Lottie animationData={animationData} className="w-full max-w-xs mx-auto" />;
} 