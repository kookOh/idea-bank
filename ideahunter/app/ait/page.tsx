'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import IdeaCard from '@/components/IdeaCard';
import type { Idea } from '@/types/idea';

export default function AitDashboard() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIdeas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ideas?sort=trend_score&limit=50');
      if (!res.ok) throw new Error(`API 오류 (${res.status})`);
      const data = await res.json();
      // platform_analysis가 있는 아이디어만 필터링, ait_score 순 정렬
      const aitIdeas = (data.ideas ?? [])
        .filter((idea: Idea) => idea.platform_analysis)
        .sort((a: Idea, b: Idea) => {
          const scoreA = a.platform_analysis?.ait_score ?? 0;
          const scoreB = b.platform_analysis?.ait_score ?? 0;
          return scoreB - scoreA;
        });
      setIdeas(aitIdeas);
    } catch (e) {
      setError(e instanceof Error ? e.message : '데이터를 불러올 수 없습니다');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchIdeas();
  }, [fetchIdeas]);

  // 카테고리별 분류
  const categories = ideas.reduce<Record<string, Idea[]>>((acc, idea) => {
    const cat = idea.platform_analysis?.ait_category ?? '기타';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(idea);
    return acc;
  }, {});

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100">
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between sticky top-0 bg-gray-950/95 backdrop-blur z-10">
        <div className="flex items-center gap-2">
          <span className="text-2xl">📱</span>
          <h1 className="text-xl font-bold">앱인토스 대시보드</h1>
          <span className="text-xs text-gray-500 ml-2">토스 미니앱 아이디어 큐레이션</span>
        </div>
        <nav className="flex gap-4 text-sm">
          <Link href="/" className="text-gray-400 hover:text-white">
            피드
          </Link>
          <Link href="/digest" className="text-gray-400 hover:text-white">
            오늘의 TOP 10
          </Link>
          <Link href="/ait" className="text-white font-medium">
            앱인토스
          </Link>
        </nav>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {loading && <div className="text-center py-8 text-gray-500">로딩 중...</div>}

        {error && (
          <div className="text-center py-8">
            <p className="text-red-400 mb-2">{error}</p>
            <button onClick={fetchIdeas} className="text-sm text-gray-400 hover:text-white underline">
              다시 시도
            </button>
          </div>
        )}

        {!loading && !error && ideas.length === 0 && (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">📱</div>
            <h3 className="text-lg font-semibold text-white mb-2">
              앱인토스 분석된 아이디어가 없습니다
            </h3>
            <p className="text-gray-400 text-sm">
              피드에서 아이디어의 &quot;앱인토스 분석&quot; 버튼을 클릭하면 여기에 표시됩니다
            </p>
          </div>
        )}

        {Object.entries(categories).map(([category, catIdeas]) => (
          <div key={category} className="mb-8">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span className="px-3 py-1 bg-teal-900/40 text-teal-300 rounded-full text-sm">
                {category}
              </span>
              <span className="text-gray-500 text-sm font-normal">{catIdeas.length}개</span>
            </h2>
            <div className="flex flex-col gap-4">
              {catIdeas.map((idea) => (
                <IdeaCard key={idea.id} idea={idea} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
