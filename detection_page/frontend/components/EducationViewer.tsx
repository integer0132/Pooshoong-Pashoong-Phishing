'use client';

import React from 'react';
interface EducationViewerProps {
  title: string;
  description: string;
  imageUrl?: string;
  tips?: string[];
}

export default function EducationViewer({
  title,
  description,
  imageUrl,
  tips,
}: EducationViewerProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-3xl mx-auto mb-4">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">{title}</h2>
      <p className="text-gray-700 mb-4">{description}</p>

      {imageUrl && <img src={imageUrl} alt={title} className="w-full h-auto rounded-md mb-4" />}

      {tips && tips.length > 0 && (
        <div className="bg-blue-50 bordler-l-4 border-blue-400 p-4 rounded text-sm text-blue-800">
          <p className="font-semibold mb-1">💡</p>
          <ul className="list-disc list-inside space-y-1 text-left">
            {tips.map((tip, idx) => (
              <li key={idx}>{tip} </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
