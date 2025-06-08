'use client';

import React, { useState, useRef } from 'react';

export default function URLCheckerPage() {
  const [url, setUrl] = useState('');
  const [result, setResult] = useState<{
    status: 'idle' | 'loading' | 'success' | 'error';
    message?: string;
    data?: any;
  }>({ status: 'idle' });

  const [toggledItems, setToggledItems] = useState<{ [key: number]: boolean }>({});
  const exampleRef = useRef<HTMLDivElement | null>(null);

  const getReasonCount = (moduleName: string) => {
    if (!result.data || !result.data.modules) return null;
    const mod = result.data.modules.find((m: any) => m.module.includes(moduleName));
    if (!mod || mod.result === '정상') return 0;
    return mod.reasons.length;
  };

  const getModuleReasons = (moduleName: string) => {
    if (!result.data || !result.data.modules) return [];
    const mod = result.data.modules.find((m: any) => m.module.includes(moduleName));
    return mod ? mod.reasons : [];
  };

  const dashboardItems = [
    { title: '자바스크립트 분석', module: 'HTML/JS 분석', icon: '📄', color: 'blue', description: '의심스러운 자바스크립트 코드를 정적 분석하여 악성 스크립트를 탐지합니다.' },
    { title: 'URL 분석', module: 'URL 분석', icon: '🔍', color: 'green', description: '입력된 URL의 구조와 리디렉션 등을 분석하여 위험 여부를 판별합니다.' },
    { title: '블랙리스트 분석', module: '블랙리스트 분석', icon: '🚫', color: 'red', description: '국내외 보안 기관의 블랙리스트와 대조하여 악성 URL 여부를 확인합니다.' },
    { title: '동적 실행 분석', module: 'DOM 분석', icon: '⚙️', color: 'purple', description: 'URL에 포함된 리소스를 실제로 실행해 보고 이상 행위를 감지합니다.' },
    { title: 'WASM 분석', module: 'WASM 분석', icon: '🧬', color: 'yellow', description: 'WebAssembly 파일을 분석하여 브라우저에서 실행될 수 있는 위험 요소를 확인합니다.' },
  ];

  const handleToggle = (index: number) => {
    setToggledItems(prev => ({ ...prev, [index]: !prev[index] }));
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
      const formData = new FormData();
      formData.append('url', url);
      const response = await fetch('http://localhost:8000/api/detect', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.detail || `서버 오류 (status ${response.status})`);
      }

      const json = await response.json();
      setResult({ status: 'success', message: json.result.summary.message, data: json.result });
    } catch (e: any) {
      setResult({ status: 'error', message: e.message });
    }
  };

  const scrollToExample = () => {
    if (exampleRef.current) {
      exampleRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const getBgColor = (status: string) => {
    switch (status) {
      case '정상': return '#D1FAE5';
      case '의심': return '#FEF3C7';
      case '악성': return '#FECACA';
      default: return '#E5E7EB';
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
              <div
                className="mt-4 p-4 rounded-md"
                style={{ backgroundColor: getBgColor(result.data.summary.overall_result) }}
              >
                <h2 className="text-lg font-bold mb-2">
                  🔎 검사 결과: {result.data.summary.overall_result}
                </h2>
                <p className="whitespace-pre-line text-sm">
                  {result.data.summary.message}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      <section className="py-8 px-6 bg-gray-100">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-xl font-semibold mb-6 text-gray-700">대시보드</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {dashboardItems.map((item, index) => {
              const reasonCount = getReasonCount(item.module);
              const reasons = getModuleReasons(item.module);
              return (
                <div key={index} className="flex flex-col">
                  <div
                    className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                    style={{ borderTop: `4px solid ${getBorderColor(item.color)}` }}
                    onClick={() => handleToggle(index)}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-gray-600">{item.title}</p>
                        <p className="text-2xl font-bold mt-1">{reasonCount !== null ? `${reasonCount}건` : '-'}</p>
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
                      <pre className="text-sm whitespace-pre-line text-gray-800">
                        {reasons.length > 0 ? reasons.join('\n') : '의심 활동 없음'}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-10 text-center">
            <button
              onClick={scrollToExample}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-full shadow-md transition"
            >
              예제 연습 페이지로 이동 ↓
            </button>
          </div>
        </div>
      </section>

      <section ref={exampleRef} className="py-20 bg-white px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">🧪 예제 연습 페이지</h2>
          <p className="text-gray-600 mb-6">이 섹션에서는 다양한 예제를 통해 URL 분석 로직을 실습해볼 수 있습니다.</p>
          <div className="bg-gray-100 p-6 rounded-lg shadow-inner">
            <p className="text-gray-800">여기에 예제 코드, 실습 가이드 또는 컴포넌트를 추가하세요.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

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
