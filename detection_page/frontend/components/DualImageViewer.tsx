'use client';
import React, { useState } from 'react';

interface DualImageViewerProps {
  image1: string;
  image2: string;
  title1?: string;
  title2?: string;
  url1?: string;
  url2?: string;
}

export default function DualImageViewer({
  image1,
  image2,
  title1,
  title2,
  url1,
  url2,
}: DualImageViewerProps) {
  const [zoomed, setZoomed] = useState<string | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-center gap-6">
        <div>
          {title1 && (
            <p className="text-center text-2xl font-medium text-gray-700 mb-2">{title1}</p>
          )}
          <p className="text-center text-base font-serif mb-2">{url1}</p>
          <img
            src={image1}
            alt="이미지 1"
            className="rounded-lg w-full h-auto cursor-pointer hover:scale-105 transition-transform"
            onClick={() => setZoomed(image1)}
          />
        </div>

        {/* VS 텍스트 */}
        <div className="text-center text-xl font-bold text-gray-500 hidden md:block">VS</div>

        <div>
          {title2 && (
            <p className="text-center text-2xl font-medium text-gray-700 mb-2">{title2}</p>
          )}
          <p className="text-center text-base font-serif mb-2">{url2}</p>
          <img
            src={image2}
            alt="이미지 2"
            className="rounded-lg w-full h-auto cursor-pointer hover:scale-105 transition-transform"
            onClick={() => setZoomed(image2)}
          />
        </div>
      </div>

      {/* 확대 이미지 */}
      {zoomed && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setZoomed(null)}
        >
          <img
            src={zoomed}
            alt="확대 이미지"
            className="max-w-[80%] max-h-[80%] rounded-lg shadow-lg transition-transform duration-300 cursor-pointer"
          />
        </div>
      )}
    </>
  );
}
