'use client';

import React, { useState, useEffect } from 'react';
import DualImageViewer from '../components/DualImageViewer';
import EducationViewer from '../components/EducationViewer';
import CustomSlideshow from '../components/CustomSlideshow';
import PhishingViewer from '../components/PhishingViewer';

export default function URLCheckerPage() {
  interface ModuleResult {
    module: string;
    result: string;
    reasons: string[];
  }

  interface DetectionResult {
    summary: {
      overall_result: string;
      message: string;
    };
    modules: ModuleResult[];
  }
  
  const [url, setUrl] = useState('');
  const [taskId, setTaskId] = useState<string | null>(null);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [toggledItems, setToggledItems] = useState<{ [key: number]: boolean }>({});
  const [showExample, setShowExample] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);
  const [credentials, setCredentials] = useState<{ email: string; password: string }[]>([]);

  useEffect(() => {
    const fetchCredentials = async () => {
      try {
        const res = await fetch('https://Pooshoong-Pashoong-Phishing.com/api/forwarded');
        const data = await res.json();
        if (Array.isArray(data)) setCredentials(data);
      } catch (err) {
        console.error('💥 탈취 정보 fetch 실패:', err);
      }
    };

    fetchCredentials();
    const interval = setInterval(fetchCredentials, 1500); // 3초마다 새로고침

    return () => clearInterval(interval); // 언마운트 시 정리
  }, []);

  const getReasonCount = (moduleName: string) => {
    if (!result || !result.modules) return null;
    const mod = result.modules.find((m: ModuleResult) => m.module.includes(moduleName));
    if (!mod || mod.result === '정상' || !Array.isArray(mod.reasons)) return 0;
    return mod.reasons.length;
  };

  const getModuleReasons = (moduleName: string) => {
    if (!result || !result.modules) return [];
    const mod = result.modules.find((m: ModuleResult) => m.module.includes(moduleName));
    return Array.isArray(mod?.reasons) ? mod.reasons : [];
  };

  const dashboardItems = [
    { title: 'HTML/자바스크립트 분석', module: 'HTML/JS 분석', icon: '📄', color: 'blue', description: '의심스러운 HTML/자바스크립트 코드를 정적 분석하여 악성 스크립트를 탐지합니다.' },
    { title: 'URL 분석', module: 'URL 분석', icon: '🔍', color: 'green', description: '입력된 URL의 구조와 리디렉션 등을 분석하여 위험 여부를 판별합니다.' },
    { title: '블랙리스트 분석', module: '블랙리스트 분석', icon: '🚫', color: 'red', description: '국내외 보안 기관(GSB, OpenPhish)의 블랙리스트와 대조하여 악성 URL 여부를 확인합니다.' },
    { title: '페이지 구조 변조 분석', module: 'DOM 분석', icon: '⚙️', color: 'purple', description: '실제 페이지를 열고 초기 로딩 이후 새로 삽입된 버튼, 입력창 등의 변화를 분석하여 사용자 몰래 조작되는 흔적을 탐지합니다.' },
    { title: 'WASM 분석', module: 'WASM 분석', icon: '🧬', color: 'yellow', description: 'WebAssembly 파일을 분석하여 브라우저에서 실행될 수 있는 위험 요소를 확인합니다.' },
  ];

  const handleToggle = (index: number) => {
    setToggledItems(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return alert('URL을 입력해주세요.');
    try {
      new URL(url);
    } catch {
      return alert('유효한 URL 형식이 아닙니다.');
    }

    setResult(null);
    setLoading(true);

    const formData = new FormData();
    formData.append('url', url);

    try {
      const res = await fetch('http://localhost:8000/api/detect', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.detail || '서버 오류 발생');
      }

      const json = await res.json();
      setTaskId(json.task_id);
    } catch (err) {
      setLoading(false);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setResult({
        summary: {
          overall_result: '에러',
          message: errorMessage,
        },
        modules: [],
      });
    }
  };

  useEffect(() => {
    if (!taskId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/detect/result/${taskId}`);
        if (!res.ok) {
          const errJson = await res.json();
          throw new Error(errJson.detail || '결과 로딩 실패');
        }

        const json = await res.json();
        setResult(json);

        if (json.summary) {
          setLoading(false);
          clearInterval(interval);
        }
      } catch (err) {
        setLoading(false);
        const errorMessage = err instanceof Error ? err.message : String(err);
        setResult({
          summary: {
            overall_result: '에러',
            message: errorMessage,
          },
          modules: [],
        });
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [taskId]);

  const getBorderColor = (color: string) => {
    switch (color) {
      case 'blue': return '#3b82f6';
      case 'green': return '#10b981';
      case 'yellow': return '#f59e0b';
      case 'red': return '#ef4444';
      case 'purple': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  const getBgColor = (status: string) => {
    switch (status) {
      case '정상': return '#D1FAE5';
      case '의심': return '#FEF3C7';
      case '악성': return '#FECACA';
      case '에러': return '#FDE68A';
      default: return '#E5E7EB';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-8 py-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-xl font-bold text-gray-800">푸슝파슝피싱</h1>
        </div>
      </header>

      <main className="py-12 px-6">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-medium mb-4">계정 탈취 URL 검사하기</h2>
            <div className="flex">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="검사할 URL을 입력하세요 (예: https://example.com)"
                className="flex-1 px-4 py-2 border rounded-l-md"
              />
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-r-md" disabled={loading}>
                {loading ? '검사 중...' : '검사하기'}
              </button>
            </div>
          </form>

          {loading && (
            <div className="mt-4 p-3 bg-blue-50 text-blue-700 rounded-md">현재 분석 중입니다...</div>
          )}

          {result?.summary && (
            <div className="mt-4 p-4 rounded-md" style={{ backgroundColor: getBgColor(result.summary.overall_result) }}>
              <h1 className="text-lg font-bold mb-2">🔎 검사 결과: {result.summary.overall_result}</h1>
              <h2 className="whitespace-pre-line text-sm">{result.summary.message}</h2>
            </div>
          )}
        </div>
      </main>

      <section className="py-8 px-6 bg-gray-100">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-xl font-semibold mb-6 text-gray-700">대시보드</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {dashboardItems.map((item, index) => {
              const count = getReasonCount(item.module);
              const reasons = getModuleReasons(item.module);
              return (
                <div key={index} className="flex flex-col">
                  <div
                    className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                    style={{ borderTop: `4px solid ${getBorderColor(item.color)}` }}
                    onClick={() => handleToggle(index)}
                  >
                    <div className="flex items-start justify-between min-h-20">
                      <div>
                        <p className="text-sm text-gray-600">{item.title}</p>
                        <p className="text-2xl font-bold mt-1">{count !== null ? `${count}건` : '-'}</p>
                      </div>
                      <div className="text-2xl">{item.icon}</div>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">클릭하여 {toggledItems[index] ? '숨기기' : '자세히 보기'}</div>
                  </div>

                  {toggledItems[index] && (
                    <div className="mt-2 bg-white p-4 rounded-lg shadow-md overflow-hidden">
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
        </div>
      </section>

          {/* 예제 연습 페이지 섹션 (펼치기/접기 버튼 포함) */}
      <section className="py-20 bg-white px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">🧪 예제 연습 페이지</h2>
          <p className="text-gray-600 mb-6">
            이 섹션에서는 예제를 통해 URL 분석 로직을 실습해볼 수 있습니다.
          </p>

          {/* 펼치기 버튼 */}
          <button
            onClick={() => setShowExample((prev) => !prev)}
            className="mb-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-md transition"
          >
            {showExample ? '접기 ▲' : '펼치기 ▼'}
          </button>

          {showExample && (
            <div className="bg-white p-10 rounded-lg transition-all duration-300">
              <div className="text-gray-800 mb-20">
                {/* 실제 예제 내용 */}
                <DualImageViewer
                  image1="/education/real.png"
                  image2="/education/fake.png"
                  title1="원본 사이트"
                  title2="피싱 사이트"
                  url1="https://accounts.google.com"
                  url2="http://http://34.238.17.75/"
                />
              </div>
              <EducationViewer
                title="🤔 피싱 사이트가 뭐에요?"
                description="피싱 사이트는 정상 사이트처럼 보이지만 
                사용자의 개인 정보를 탈취하기 위해 만들어진 가짜 사이트입니다."
                // imageUrl="/education/phishing-example.png"
                tips={[
                  "최근 발견된 삼성전자 '채용 피싱 사이트 vs 실제 채용 사이트 구별법'",
                  "안랩, 연말연시 노린 '유명 기업 및 기관 사칭' 피싱 공격 주의",
                ]}
              />
              <EducationViewer
                title="🤔 피싱 사이트는 왜 위험한가요?"
                description="피싱 사이트는 진짜 사이트처럼 위장해 사용자의 로그인 정보나 금융 정보를 훔칩니다. 탈취된 정보는 계좌 해킹, 카드 결제, 사칭 등 2차 범죄에 악용될 수 있습니다. 눈으로 구분하기 어려울 만큼 정교하게 만들어져 피해를 입기 쉽습니다."
                tips={[
                  '실제로 피싱 사이트에 당하게 된다면??',
                  '1. 개인 정보가 유출됩니다. 주민등록번호, 연락처 등 민감한 정보가 공격자에게 넘어갑니다.',
                  '2. 금융 피해로 이어집니다. 탈취된 정보를 이용해 계좌 접근, 카드 결제, 인터넷 뱅킹 해킹으로 이어질 수 있습니다.',
                  '3. 2차 피해가 발생할 수 있습니다. 유출된 정보가 다크웹에 유통되거나, 공격자가 피해자를 사칭해 주변 지인에게 피해를 입힐 수 있습니다.',
                ]}
              />
              <EducationViewer
                title="🤔 피싱 사이트 유형은 어떤 것이 있나요?"
                description="Credential Harvesting, Redirection-based Phishing, Browser Injection phishing 등이 있습니다."
                tips={[
                  'credential harvesting : 사용자의 로그인 정보를 빼내는 가장 일반적이고 위험한 방식입니다. 가짜 로그인 페이지를 이용해 수행됩니다.',
                  'redirection-based phishing : 진짜 페이지로 가기 전 중간 피싱 페이지를 거치도록 유도합니다. QR 코드, 광고 클릭을 이용해 수행됩니다.',
                  'browser-injection phishing : 진짜 사이트에 스크립트를 삽입해 위조된 입력창을 보여주는 방식입니다. 확장 프로그램, xss 등으로 위조 폼을 삽입해 수행됩니다.',
                ]}
              />
              <EducationViewer
                title="🤔 이 사이트는 어떻게 동작하나요?"
                description="본 시스템은 피싱 사이트 중 자격 증명 수집(Credential Harvesting) 유형을 탐지하는 데 특화되어 설계되었습니다. 사용자가 입력한 URL에 대해 블랙리스트 조회, HTML 및 JavaScript 정적 분석, WebAssembly(WASM) 분석, URL 구조 분석, DOM 분석 등의 다중 검증 절차를 수행하며, 각 분석 결과를 종합적으로 판단하여 해당 URL의 위험 여부 및 보안 수준을 사용자에게 제공합니다."
              />
              <EducationViewer
                title="🤔 기존 피싱 탐지 사이트와 해당 사이트는 무엇이 다른가요?"
                description="작년에 발표된 논문 중 WebView를 사용해 피싱사이트를 구현할 경우, 일반적인 JS 분석만으로는 탐지가 되지 않는 경우가 존재했습니다. 저희는 wasm 기반 피싱을 탐지하기 위한 대응을 추가하였습니다. 구글에서 제공하는 url 기반 피싱 탐지 시스템은 탐지 결과만 돌려주며 탐지 결과에 대한 설명이 부족합니다. 저희는 탐지 근거를 시각화해서 보여드립니다. 일반 탐지 시스템은 성능 오버헤드로 동적 분석을 거의 사용하지 않습니다. 저희는 DOM 변화를 추적하며 정적분석과 동적분석을 같이 진행합니다."
                tips={[
                  '탐지 실패 영역 존재 -> wasm을 이용한 탐지 우회기법에 대한 대응 추가',
                  '결과 위주 출력 -> 판단 근거 제공 및 시각화',
                  '정적 분석 위주 -> DOM 변화 추적을 활용한 동적 분석 혼용',
                ]}
              />
            </div>
          )}
        </div>
      </section>

      {/* 탈취된 로그인 정보 예시 섹션 */}
      <section className="py-20 bg-white px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">🔐 탈취된 로그인 정보 예시</h2>
          <p className="text-gray-600 mb-6">
            사용자가 피싱 사이트에 입력한 정보가 어떻게 탈취되는지 보여줍니다.
          </p>

          {/* 펼치기 버튼 */}
          <button
            onClick={() => setShowCredentials((prev) => !prev)}
            className="mb-6 px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-md transition"
          >
            {showCredentials ? '접기 ▲' : '펼치기 ▼'}
          </button>
          <div className="max-w-4xl mx-auto">
            {showCredentials && (
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                {' '}
                피싱 정보는 아래 슬라이드에서 보여주는 순으로 탈취될 수 있습니다!
              </h3>
            )}
          </div>
          {/* 조건부 렌더링 슬라이드 쇼 */}
          {showCredentials && (
            <CustomSlideshow
              slides={[
                <img
                  key="1"
                  src="/education/example/screen_1.png"
                  alt="screen 1"
                  className="max-h-full"
                />,
                <img
                  key="2"
                  src="/education/example/screen_2.png"
                  alt="screen 2"
                  className="max-h-full"
                />,
                <img
                  key="3"
                  src="/education/example/screen_3.png"
                  alt="screen 3"
                  className="max-h-full"
                />,
                <img
                  key="4"
                  src="/education/example/screen_4.png"
                  alt="screen 4"
                  className="max-h-full"
                />,
              ]}
            />
          )}
        </div>
        <div className="max-w-7xl mx-auto text-center mt-8">
          <h2 className="text-3xl font-bold mb-4">🔐 직접 피싱 당해보기?</h2>
          <h4>피싱 사이트에 접속해 보세요!</h4>
          <div className="flex w-full h-[500px] border rounded-lg overflow-hidden shadow-md mb-20 text-left">
            {/* 왼쪽: 내가 쓴 텍스트 */}
            <div className="w-1/2 p-4 bg-gray-100">
              <h2 className="text-lg font-bold mb-2 text-center">가상의 피싱 메일</h2>

             <PhishingViewer
  txt={`보낸사람: 인하대학교 컴퓨터공학과 행정실 <admin@inha.ac.kr>
제목: [필독] 전공 수업 만족도 조사 및 장학금 추천 대상자 선정 안내

안녕하세요. 인하대학교 컴퓨터공학과 행정실입니다.

학과에서는 전공 수업에 대한 만족도 조사를 바탕으로  
2025학년도 2학기 장학금 추천 대상자를 우선 선정하고자 합니다.

본 조사는 학과 커리큘럼 개선과 장학금 대상자 선정을 위한 중요한 자료로 활용됩니다.  
※ 아래 설문 링크를 통해 참여해 주시기 바랍니다.

👉 \${url}

⚠️ 설문 응답은 24시간 이내에만 가능하며, 미참여 시 장학금 추천 대상에서 제외될 수 있습니다.  
※ 본 메일은 발신전용입니다. 문의사항은 학과 사무실로 연락 바랍니다.

감사합니다.  
인하대학교 컴퓨터공학과 행정실 드림`}
  url="http://34.238.17.75/"
/>


            </div>

            {/* 오른쪽: API 결과 */}
<div className="w-1/2 p-4 bg-white border-l overflow-y-auto">
  <h2 className="text-lg font-bold mb-2">탈취된 로그인 정보</h2>
  {credentials.length === 0 ? (
    <p className="text-gray-500">아직 수집된 정보가 없습니다.</p>
  ) : (
    <ul className="text-left text-sm space-y-1">
      {credentials.slice().reverse().map((cred, idx) => (
        <li key={idx} className="border-b py-1">
          <span className="font-semibold">Email: {cred.email}</span> / Password: {cred.password}
        </li>
      ))}
    </ul>
  )}
</div>

          </div>
        </div>
      </section>
    </div>
  );
}
