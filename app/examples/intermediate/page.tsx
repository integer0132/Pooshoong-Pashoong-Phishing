import React from 'react';
import Link from 'next/link';

export default function IntermediateExamplesPage() {
  // 중급 예제 목록
  const intermediateExamples = [
    {
      id: 'arrays',
      title: '배열과 배열 메서드',
      description: '배열을 다루는 다양한 메서드와 활용 예제를 배웁니다.',
      code: `// 배열 선언과 조작
const fruits = ['사과', '바나나', '오렌지'];

// 배열 요소 추가
fruits.push('딸기');
console.log(fruits); // ['사과', '바나나', '오렌지', '딸기']

// 배열 메서드 활용
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(num => num * 2);
console.log(doubled); // [2, 4, 6, 8, 10]

// 필터링
const evenNumbers = numbers.filter(num => num % 2 === 0);
console.log(evenNumbers); // [2, 4]

// 합계 계산
const sum = numbers.reduce((total, num) => total + num, 0);
console.log(sum); // 15`
    },
    {
      id: 'objects',
      title: '객체와 객체 메서드',
      description: '자바스크립트 객체의 생성과 활용 방법을 배웁니다.',
      code: `// 객체 생성
const person = {
  name: '김철수',
  age: 30,
  job: '개발자',
  greet: function() {
    return \`안녕하세요, 저는 \${this.name}입니다.\`;
  }
};

console.log(person.name); // 김철수
console.log(person.greet()); // 안녕하세요, 저는 김철수입니다.

// 객체 속성 추가 및 수정
person.location = '서울';
person.age = 31;

// 객체 순회
for (const key in person) {
  if (typeof person[key] !== 'function') {
    console.log(\`\${key}: \${person[key]}\`);
  }
}`
    },
    {
      id: 'async',
      title: '비동기 프로그래밍',
      description: 'Promise와 async/await를 활용한 비동기 프로그래밍을 배웁니다.',
      code: `// Promise 예제
function fetchData() {
  return new Promise((resolve, reject) => {
    // 가상의 API 호출 (1초 후 데이터 반환)
    setTimeout(() => {
      const data = { id: 1, name: '상품 정보' };
      resolve(data);
      // 에러가 발생했다면: reject(new Error('데이터를 가져오는데 실패했습니다.'));
    }, 1000);
  });
}

// Promise 사용
fetchData()
  .then(data => {
    console.log('데이터:', data);
    return data.id;
  })
  .then(id => {
    console.log('ID:', id);
  })
  .catch(error => {
    console.error('에러:', error);
  });

// async/await 사용
async function getData() {
  try {
    const data = await fetchData();
    console.log('async/await 데이터:', data);
    return data;
  } catch (error) {
    console.error('async/await 에러:', error);
  }
}

getData();`
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
      
      <h1 className="text-3xl font-bold mb-6">중급 프로그래밍 예제</h1>
      <p className="mb-8">더 복잡한 프로그래밍 개념과 패턴을 배울 수 있는 예제들입니다.</p>
      
      <div className="space-y-10">
        {intermediateExamples.map((example) => (
          <div 
            key={example.id}
            className="border border-gray-200 rounded-lg p-6 shadow-sm"
          >
            <h2 className="text-2xl font-semibold mb-3">{example.title}</h2>
            <p className="text-gray-600 mb-5">{example.description}</p>
            
            <div className="bg-gray-800 text-white p-5 rounded-md mb-5 overflow-x-auto">
              <pre className="whitespace-pre-wrap font-mono text-sm">
                {example.code}
              </pre>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <button 
                className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors"
              >
                코드 실행해보기
              </button>
              
              <button 
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
              >
                예제 저장하기
              </button>
              
              <button 
                className="bg-purple-500 text-white px-4 py-2 rounded-md hover:bg-purple-600 transition-colors"
              >
                코드 수정하기
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 