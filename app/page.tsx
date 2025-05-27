'use client';

import React, { useState } from 'react';

export default function URLCheckerPage() {
  const [url, setUrl] = useState('');
  const [result, setResult] = useState<{
    status: 'idle' | 'loading' | 'success' | 'error';
    message?: string;
    data?: any;
  }>({ status: 'idle' });

  const [toggledItems, setToggledItems] = useState<{ [key: number]: boolean }>({});

  const dashboardItems = [
    {
      title: '자바스크립트 분석',
      value: '152건',
      icon: '📄',
      color: 'blue',
      image: 'https://placehold.co/600x400/3b82f6/white?text=자바스크립트+분석',
      description: '의심스러운 자바스크립트 코드를 정적 분석하여 악성 스크립트를 탐지합니다.',
    },
    {
      title: 'URL 분석',
      value: '327건',
      icon: '🔍',
      color: 'green',
      image: 'https://placehold.co/600x400/10b981/white?text=URL+분석',
      description: '입력된 URL의 구조와 리디렉션 등을 분석하여 위험 여부를 판별합니다.',
    },
    {
      title: '블랙리스트 분석',
      value: '89건',
      icon: '🚫',
      color: 'red',
      image: 'https://placehold.co/600x400/ef4444/white?text=블랙리스트+분석',
      description: '국내외 보안 기관의 블랙리스트와 대조하여 악성 URL 여부를 확인합니다.',
    },
    {
      title: '동적 실행 분석',
      value: '64건',
      icon: '⚙️',
      color: 'purple',
      image: 'https://placehold.co/600x400/8b5cf6/white?text=동적+실행+분석',
      description: 'URL에 포함된 리소스를 실제로 실행해 보고 이상 행위를 감지합니다.',
    },
    {
      title: 'WASM 분석',
      value: '18건',
      icon: '🧬',
      color: 'yellow',
      image: 'https://placehold.co/600x400/facc15/black?text=WASM+분석',
      description: 'WebAssembly 파일을 분석하여 브라우저에서 실행될 수 있는 위험 요소를 확인합니다.',
    }
  ];

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
    
    try {
      new URL(url);
    } catch (e) {
      setResult({ status: 'error', message: '유효한 URL 형식이 아닙니다.' });
      return;
    }

    setResult({ status: 'loading' });

    try {
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

      
    </div>
  );
}

// 색상을 가져오는 함수
function getBorderColor(color: string): string {
  switch (color) {
    case 'blue': return '#3b82f6';
    case 'green': return '#10b981';
    case 'yellow': return '#f59e0b';
    case 'red': return '#ef4444';
    case 'purple': return '#8b5cf6';
    default: return '#6b7280';
  }
}
