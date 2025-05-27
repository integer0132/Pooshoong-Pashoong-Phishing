// app/layout.tsx

import './globals.css';
import { ReactNode } from 'react';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-white">
        {/* 본문 */}
        {children}
      </body>
    </html>
  );
}
