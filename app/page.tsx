'use client';

import React, { useState } from 'react';

export default function URLCheckerPage() {
  const [url, setUrl] = useState('');
  const [result, setResult] = useState<{
    status: 'idle' | 'loading' | 'success' | 'error';
    message?: string;
    data?: any;
  }>({ status: 'idle' });

  // 토글 상태를 관리하는 상태 변수
  const [toggledItems, setToggledItems] = useState<{ [key: number]: boolean }>({});

  // 대시보드 데이터
  const dashboardItems = [
    { 
      title: '검사된 URL', 
      value: '1,234', 
      icon: '🔗', 
      color: 'blue',
      image: 'https://placehold.co/600x400/3b82f6/white?text=URL+통계',
      description: '지금까지 검사된 URL의 총 개수입니다.'
    },
    { 
      title: '안전한 URL', 
      value: '1,021', 
      icon: '✅', 
      color: 'green',
      image: 'https://placehold.co/600x400/10b981/white?text=안전한+URL+통계',
      description: '안전하다고 확인된 URL의 개수입니다.'
    },
    { 
      title: '의심스러운 URL', 
      value: '189', 
      icon: '⚠️', 
      color: 'yellow',
      image: 'https://placehold.co/600x400/f59e0b/white?text=의심스러운+URL+통계',
      description: '잠재적으로 위험한 요소가 있는 URL의 개수입니다.'
    },
    { 
      title: '유해한 URL', 
      value: '24', 
      icon: '❌', 
      color: 'red',
      image: 'https://placehold.co/600x400/ef4444/white?text=유해한+URL+통계',
      description: '악성코드나 피싱으로 확인된 URL의 개수입니다.'
    },
    { 
      title: '오늘 검사 횟수', 
      value: '87', 
      icon: '📊', 
      color: 'purple',
      image: 'https://placehold.co/600x400/8b5cf6/white?text=오늘의+검사+현황',
      description: '오늘 이 서비스를 통해 검사된 URL의 횟수입니다.'
    },
  ];

  // 토글 핸들러
  const handleToggle = (index: number) => {
    setToggledItems(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url) {
      setResult({ status: 'error', message: 'URL을 입력해주세요.' });
      return;
    }
    
    // URL 형식 검증
    try {
      new URL(url);
    } catch (e) {
      setResult({ status: 'error', message: '유효한 URL 형식이 아닙니다.' });
      return;
    }
    
    // 로딩 상태 설정
    setResult({ status: 'loading' });
    
    try {
      // 여기서는 간단한 URL 검사만 수행합니다.
      // 실제로는 서버로 요청을 보내 URL을 분석할 수 있습니다.
      setTimeout(() => {
        setResult({ 
          status: 'success', 
          message: 'URL 검사가 완료되었습니다.',
          data: {
            url: url,
            protocol: new URL(url).protocol,
            domain: new URL(url).hostname,
            path: new URL(url).pathname,
          }
        });
      }, 1500);
    } catch (error) {
      setResult({ 
        status: 'error', 
        message: '검사 중 오류가 발생했습니다.'
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-8 py-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-xl font-bold text-gray-800">URL 검사기</h1>
        </div>
      </header>

      <main className="py-12 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-medium mb-4">URL 검사하기</h2>
            
            <form onSubmit={handleSubmit}>
              <div className="flex">
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="검사할 URL을 입력하세요 (예: https://example.com)"
                  className="flex-1 px-4 py-2 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-r-md"
                  disabled={result.status === 'loading'}
                >
                  {result.status === 'loading' ? '검사 중...' : '검사하기'}
                </button>
              </div>
            </form>

            {result.status === 'error' && (
              <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md">
                {result.message}
              </div>
            )}

            {result.status === 'loading' && (
              <div className="mt-4 p-3 bg-blue-50 text-blue-700 rounded-md">
                URL을 검사하고 있습니다...
              </div>
            )}

            {result.status === 'success' && result.data && (
              <div className="mt-4 p-4 bg-green-50 text-green-800 rounded-md">
                <h3 className="font-medium mb-2">{result.message}</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">URL:</span> {result.data.url}</p>
                  <p><span className="font-medium">프로토콜:</span> {result.data.protocol}</p>
                  <p><span className="font-medium">도메인:</span> {result.data.domain}</p>
                  <p><span className="font-medium">경로:</span> {result.data.path || '/'}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* 대시보드 섹션 */}
      <section className="py-8 px-6 bg-gray-100">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-xl font-semibold mb-6 text-gray-700">대시보드</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {dashboardItems.map((item, index) => (
              <div key={index} className="flex flex-col">
                <div 
                  className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                  style={{ borderTop: `4px solid ${getBorderColor(item.color)}` }}
                  onClick={() => handleToggle(index)}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-gray-600">{item.title}</p>
                      <p className="text-2xl font-bold mt-1">{item.value}</p>
                    </div>
                    <div className="text-2xl">{item.icon}</div>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    클릭하여 {toggledItems[index] ? '숨기기' : '자세히 보기'}
                  </div>
                </div>
                
                {/* 토글된 상태에서 보여줄 상세 정보 */}
                {toggledItems[index] && (
                  <div className="mt-2 bg-white p-4 rounded-lg shadow-md overflow-hidden transition-all">
                    <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                    <img 
                      src={item.image} 
                      alt={`${item.title} 그래프`} 
                      className="w-full h-auto rounded-md"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

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
    </div>
  );
}

// 색상을 가져오는 함수
function getBorderColor(color: string): string {
  switch(color) {
    case 'blue': return '#3b82f6';
    case 'green': return '#10b981';
    case 'yellow': return '#f59e0b';
    case 'red': return '#ef4444';
    case 'purple': return '#8b5cf6';
    default: return '#6b7280';
  }
}