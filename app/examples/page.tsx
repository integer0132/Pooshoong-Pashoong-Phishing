import React from 'react';
import Link from 'next/link';

export default function ExamplesPage() {
  // 교육용 예제 목록
  const examples = [
    {
      id: 'basic',
      title: '기본 예제',
      description: '프로그래밍의 기본 개념을 배울 수 있는 예제입니다.',
    },
    {
      id: 'intermediate',
      title: '중급 예제',
      description: '조금 더 복잡한 알고리즘과 자료구조를 배울 수 있는 예제입니다.',
    },
    {
      id: 'advanced',
      title: '고급 예제',
      description: '실제 프로젝트에 적용할 수 있는 고급 기술을 배울 수 있는 예제입니다.',
    },
  ];

  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6">교육용 예제 모음</h1>
      <p className="mb-8">다양한 난이도의 프로그래밍 예제를 통해 학습해보세요.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {examples.map((example) => (
          <div 
            key={example.id}
            className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
          >
            <h2 className="text-xl font-semibold mb-2">{example.title}</h2>
            <p className="text-gray-600 mb-4">{example.description}</p>
            <Link 
              href={`/examples/${example.id}`}
              className="inline-block bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
            >
              학습하기
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
} 