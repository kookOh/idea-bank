'use client';

import { useEffect, useState } from 'react';
import IdeaCard from '@/components/IdeaCard';

export default function DigestPage() {
  const [digest, setDigest] = useState<any>(null);

  useEffect(() => {
    fetch('/api/digest')
      .then((r) => r.json())
      .then(setDigest)
      .catch(() => {});
  }, []);

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100">
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between sticky top-0 bg-gray-950/95 backdrop-blur z-10">
        <div className="flex items-center gap-2">
          <a href="/" className="flex items-center gap-2">
            <span className="text-2xl">💡</span>
            <h1 className="text-xl font-bold">IdeaHunter</h1>
          </a>
        </div>
        <nav className="flex gap-4 text-sm">
          <a href="/" className="text-gray-400 hover:text-white">
            피드
          </a>
          <a href="/digest" className="text-white font-medium">
            오늘의 TOP 10
          </a>
        </nav>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h2 className="text-4xl font-bold mb-2">👑 오늘의 Hot 아이디어</h2>
          <p className="text-gray-400">
            {digest?.date} · AI가 선정한 TOP {digest?.top_ideas?.length ?? 0}개
          </p>
        </div>
        <div className="flex flex-col gap-4">
          {digest?.top_ideas?.map((idea: any, i: number) => (
            <div key={idea.id ?? i} className="relative">
              <div className="absolute -left-8 top-5 text-2xl font-black text-gray-700">
                #{i + 1}
              </div>
              <IdeaCard idea={idea} />
            </div>
          ))}
        </div>
        {!digest?.top_ideas?.length && (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">📭</div>
            <h3 className="text-lg font-semibold text-white mb-2">오늘의 다이제스트가 아직 없습니다</h3>
            <p className="text-gray-400 text-sm">데이터 수집 후 자동으로 생성됩니다</p>
          </div>
        )}
      </div>
    </main>
  );
}
