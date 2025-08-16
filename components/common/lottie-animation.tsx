'use client';

import Lottie from 'lottie-react';
import { useEffect, useState } from 'react';

export function LottieAnimation() {
  const [animationData, setAnimationData] = useState(null);

  useEffect(() => {
    fetch('/lottie/animation.json')
      .then((response) => response.json())
      .then((data) => setAnimationData(data))
      .catch((error) => console.error('Error loading Lottie animation:', error));
  }, []);

  if (!animationData) {
    return null; 
  }

  return <Lottie animationData={animationData} className="w-full max-w-xs mx-auto" style={{ marginTop: '-120px', marginBottom: '-40px' }} />;
} 