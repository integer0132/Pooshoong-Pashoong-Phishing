import './globals.css';
import { ReactNode } from 'react';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-white">
        {/* 본문 */}
        {children}
        <footer className="bg-gray-800 text-gray-300 text-sm py-6 px-8 mt-auto">
        <div className="max-w-3xl mx-auto">
          <div className="flex flex-col items-start">
            <div>
              <p className="mb-1">© 2023 URL 검사기. All Rights Reserved.</p>
              <p className="text-xs text-gray-400">본 도구는 교육 및 정보 제공 목적으로 제작되었습니다.</p>
            </div>
            <div className="mt-3 text-xs text-gray-400">
              <p>개인정보 처리방침 | 이용약관</p>
            </div>
          </div>
        </div>
      </footer>
      </body>
      
    </html>
  );
} 