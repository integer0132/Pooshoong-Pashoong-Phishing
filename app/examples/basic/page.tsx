import React from 'react';
import Link from 'next/link';

export default function BasicExamplesPage() {
  // 기본 예제 목록
  const basicExamples = [
    {
      id: 'variables',
      title: '변수와 상수',
      description: '프로그래밍에서 가장 기본이 되는 변수와 상수의 개념을 배웁니다.',
      code: `// 변수 선언
const name = "홍길동";
let age = 25;
      
// 변수 값 변경
age = 26;

console.log(name); // 출력: 홍길동
console.log(age);  // 출력: 26`
    },
    {
      id: 'conditionals',
      title: '조건문',
      description: '조건에 따라 다른 코드를 실행하는 조건문을 배웁니다.',
      code: `// if-else 조건문
const score = 85;

if (score >= 90) {
  console.log("A 등급");
} else if (score >= 80) {
  console.log("B 등급");
} else if (score >= 70) {
  console.log("C 등급");
} else {
  console.log("D 등급");
}

// 출력: B 등급`
    },
    {
      id: 'loops',
      title: '반복문',
      description: '코드를 반복해서 실행하는 반복문을 배웁니다.',
      code: `// for 반복문
for (let i = 1; i <= 5; i++) {
  console.log(i);
}
// 출력: 1, 2, 3, 4, 5

// while 반복문
let count = 0;
while (count < 3) {
  console.log(\`현재 카운트: \${count}\`);
  count++;
}
// 출력: 현재 카운트: 0, 현재 카운트: 1, 현재 카운트: 2`
    },
  ];

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="mb-6">
        <Link 
          href="/examples" 
          className="text-blue-500 hover:underline"
        >
          ← 예제 목록으로 돌아가기
        </Link>
      </div>
      
      <h1 className="text-3xl font-bold mb-6">기본 프로그래밍 예제</h1>
      <p className="mb-8">프로그래밍의 기본 개념을 배울 수 있는 예제들입니다.</p>
      
      <div className="space-y-8">
        {basicExamples.map((example) => (
          <div 
            key={example.id}
            className="border border-gray-200 rounded-lg p-6"
          >
            <h2 className="text-2xl font-semibold mb-2">{example.title}</h2>
            <p className="text-gray-600 mb-4">{example.description}</p>
            
            <div className="bg-gray-100 p-4 rounded-md mb-4">
              <pre className="whitespace-pre-wrap font-mono text-sm">
                {example.code}
              </pre>
            </div>
            
            <button 
              className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors mr-3"
              onClick={() => {
                // 실행 버튼 (실제로는 클라이언트 컴포넌트에서 구현해야 함)
                console.log(`실행: ${example.id}`);
              }}
            >
              코드 실행해보기
            </button>
            
            <button 
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
              onClick={() => {
                // 저장 버튼 (실제로는 클라이언트 컴포넌트에서 구현해야 함)
                console.log(`저장: ${example.id}`);
              }}
            >
              예제 저장하기
            </button>
          </div>
        ))}
      </div>
    </div>
  );
} 