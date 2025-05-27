import React from 'react';
import Link from 'next/link';

export default function AdvancedExamplesPage() {
  // 고급 예제 목록
  const advancedExamples = [
    {
      id: 'design-patterns',
      title: '디자인 패턴',
      description: '자주 사용되는 디자인 패턴과 그 구현 방법을 배웁니다.',
      code: `// 싱글톤 패턴 예제
class Database {
  private static instance: Database;
  private constructor() {
    console.log('데이터베이스 연결 생성');
  }
  
  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }
  
  public query(sql: string): void {
    console.log(\`쿼리 실행: \${sql}\`);
  }
}

// 사용 예
const db1 = Database.getInstance();
db1.query('SELECT * FROM users');

const db2 = Database.getInstance();
db2.query('SELECT * FROM products');

console.log(db1 === db2); // true (같은 인스턴스)`
    },
    {
      id: 'data-structures',
      title: '자료구조 구현',
      description: '효율적인 데이터 처리를 위한 다양한 자료구조 구현 방법을 배웁니다.',
      code: `// 연결 리스트(Linked List) 구현
class Node {
  constructor(public data: any, public next: Node | null = null) {}
}

class LinkedList {
  private head: Node | null = null;
  private size: number = 0;
  
  // 노드 추가
  public append(data: any): void {
    const newNode = new Node(data);
    
    if (!this.head) {
      this.head = newNode;
    } else {
      let current = this.head;
      while (current.next) {
        current = current.next;
      }
      current.next = newNode;
    }
    
    this.size++;
  }
  
  // 노드 출력
  public printList(): void {
    let current = this.head;
    const values = [];
    
    while (current) {
      values.push(current.data);
      current = current.next;
    }
    
    console.log(values.join(' -> '));
  }
  
  // 특정 위치의 노드 삭제
  public removeAt(index: number): any {
    if (index < 0 || index >= this.size) return null;
    
    let current = this.head;
    let previous: Node | null = null;
    let count = 0;
    
    // head를 삭제하는 경우
    if (index === 0) {
      if (this.head) {
        this.head = this.head.next;
        this.size--;
        return current?.data;
      }
      return null;
    }
    
    // 중간이나 끝의 노드를 삭제하는 경우
    while (count < index) {
      previous = current;
      if (current) current = current.next;
      count++;
    }
    
    if (previous && current) {
      previous.next = current.next;
      this.size--;
      return current.data;
    }
    
    return null;
  }
  
  public getSize(): number {
    return this.size;
  }
}

// 사용 예
const list = new LinkedList();
list.append('A');
list.append('B');
list.append('C');

list.printList(); // A -> B -> C
console.log('크기:', list.getSize()); // 3

list.removeAt(1);
list.printList(); // A -> C`
    },
    {
      id: 'algorithms',
      title: '알고리즘 구현',
      description: '유용한 알고리즘과 효율적인 구현 방법을 배웁니다.',
      code: `// 퀵 정렬(Quick Sort) 구현
function quickSort(arr: number[]): number[] {
  if (arr.length <= 1) {
    return arr;
  }
  
  const pivot = arr[Math.floor(arr.length / 2)];
  const left: number[] = [];
  const middle: number[] = [];
  const right: number[] = [];
  
  for (const num of arr) {
    if (num < pivot) {
      left.push(num);
    } else if (num > pivot) {
      right.push(num);
    } else {
      middle.push(num);
    }
  }
  
  return [...quickSort(left), ...middle, ...quickSort(right)];
}

// 사용 예
const unsortedArray = [7, 2, 5, 1, 8, 4, 3, 6];
console.log('정렬 전:', unsortedArray);
const sortedArray = quickSort(unsortedArray);
console.log('정렬 후:', sortedArray); // [1, 2, 3, 4, 5, 6, 7, 8]

// 이진 검색(Binary Search) 구현
function binarySearch(arr: number[], target: number): number {
  let left = 0;
  let right = arr.length - 1;
  
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    
    if (arr[mid] === target) {
      return mid; // 대상을 찾음
    } else if (arr[mid] < target) {
      left = mid + 1; // 오른쪽 반에서 계속 검색
    } else {
      right = mid - 1; // 왼쪽 반에서 계속 검색
    }
  }
  
  return -1; // 대상을 찾지 못함
}

// 이진 검색 사용 예 (정렬된 배열에서만 작동)
const searchResult = binarySearch(sortedArray, 5);
console.log('검색 결과 인덱스:', searchResult); // 4`
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
      
      <h1 className="text-3xl font-bold mb-6">고급 프로그래밍 예제</h1>
      <p className="mb-8">실제 프로젝트에 적용할 수 있는 고급 기술과 패턴을 배울 수 있는 예제들입니다.</p>
      
      <div className="space-y-12">
        {advancedExamples.map((example) => (
          <div 
            key={example.id}
            className="border border-gray-200 rounded-lg p-8 shadow-md"
          >
            <h2 className="text-2xl font-bold mb-4">{example.title}</h2>
            <p className="text-gray-600 mb-6 text-lg">{example.description}</p>
            
            <div className="bg-gray-900 text-green-400 p-6 rounded-md mb-6 overflow-x-auto">
              <pre className="whitespace-pre-wrap font-mono text-sm">
                {example.code}
              </pre>
            </div>
            
            <div className="flex flex-wrap gap-4">
              <button 
                className="bg-green-600 text-white px-5 py-3 rounded-md hover:bg-green-700 transition-colors font-semibold"
              >
                코드 실행해보기
              </button>
              
              <button 
                className="bg-blue-600 text-white px-5 py-3 rounded-md hover:bg-blue-700 transition-colors font-semibold"
              >
                예제 저장하기
              </button>
              
              <button 
                className="border border-gray-300 text-gray-700 px-5 py-3 rounded-md hover:bg-gray-100 transition-colors font-semibold"
              >
                관련 자료 보기
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 