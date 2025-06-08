'use client';

import React from 'react';

interface PhishingViewerProps {
  txt: string;
  url: string;
}

export default function PhishingViewer({ txt, url }: PhishingViewerProps) {
  const parts = txt.split('${url}');

  return (
    <div className="bg-gray-100 p-6 rounded-lg shadow-md whitespace-pre-wrap text-sm text-gray-800">
      {parts.map((part, index) => (
        <React.Fragment key={index}>
          {part}
          {index < parts.length - 1 && (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline break-all"
            >
              {url}
            </a>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
