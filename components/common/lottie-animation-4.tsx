'use client';

import Lottie from 'lottie-react';
import { useEffect, useState } from 'react';

export function LottieAnimation4() {
  const [animationData, setAnimationData] = useState(null);

  useEffect(() => {
    fetch('/lottie/animation4.json')
      .then((response) => response.json())
      .then((data) => setAnimationData(data))
      .catch((error) => console.error('Error loading Lottie animation 4:', error));
  }, []);

  if (!animationData) {
    return null; 
  }

  return <Lottie animationData={animationData} className="w-24 max-w-[96px] mx-auto" />;
} 