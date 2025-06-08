'use client';

import { useState, ReactNode } from 'react';

interface SlideshowProps {
  slides: ReactNode[];
}

export default function CustomSlideshow({ slides }: SlideshowProps) {
  const [index, setIndex] = useState(0);

  const goPrev = () => setIndex((prev) => Math.max(prev - 1, 0));
  const goNext = () => setIndex((prev) => Math.min(prev + 1, slides.length - 1));

  return (
    <div className="relative w-full max-w-4xl aspect-[16/9] mx-auto my-8 border rounded overflow-hidden bg-white shadow-md">
      <div className="w-full h-full flex items-center justify-center">
        {slides[index]}
      </div>
  
      {/* 좌우 이동 버튼 */}
      {index > 0 && (
        <button
          onClick={goPrev}
          className="absolute left-2 top-1/2 -translate-y-1/2 bg-gray-200 p-2 rounded-full shadow"
        >
          ←
        </button>
      )}
      {index < slides.length - 1 && (
        <button
          onClick={goNext}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-gray-200 p-2 rounded-full shadow"
        >
          →
        </button>
      )}
    </div>
  );
}
