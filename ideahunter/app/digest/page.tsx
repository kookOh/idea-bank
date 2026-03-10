'use client';

import { useEffect, useState, useCallback } from 'react';
import IdeaCard from '@/components/IdeaCard';
import type { Digest } from '@/types/idea';

export default function DigestPage() {
  const [digest, setDigest] = useState<Digest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDigest = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch('/api/digest')
      .then((r) => {
        if (!r.ok) throw new Error(`API 오류 (${r.status})`);
        return r.json();
      })
      .then(setDigest)
      .catch((e) => setError(e instanceof Error ? e.message : '다이제스트를 불러올 수 없습니다'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchDigest();
  }, [fetchDigest]);

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
          <a href="/ait" className="text-gray-400 hover:text-white">
            앱인토스
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

        {digest?.hot_topics && digest.hot_topics.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
              🔥 오늘의 트렌드 키워드
            </h3>
            <div className="flex flex-wrap gap-2">
              {digest.hot_topics.map((topic, i) => (
                <span
                  key={i}
                  className="px-3 py-1 rounded-full text-sm font-medium bg-purple-900/50 text-purple-200 border border-purple-700/50"
                >
                  {topic}
                </span>
              ))}
            </div>
          </div>
        )}

        {digest?.market_insights && (
          <div className="mb-8 p-4 rounded-xl bg-blue-900/20 border border-blue-700/40">
            <h3 className="text-sm font-semibold text-blue-300 mb-2">📊 시장 인사이트</h3>
            <p className="text-gray-300 text-sm leading-relaxed">{digest.market_insights}</p>
          </div>
        )}

        <div className="flex flex-col gap-4">
          {digest?.top_ideas?.map((idea, i) => (
            <div key={idea.id ?? i} className="relative">
              <div className="absolute -left-8 top-5 text-2xl font-black text-gray-700">
                #{i + 1}
              </div>
              <IdeaCard idea={idea} />
            </div>
          ))}
        </div>
        {loading && <div className="text-center py-8 text-gray-500">로딩 중...</div>}
        {error && (
          <div className="text-center py-8">
            <p className="text-red-400 mb-2">{error}</p>
            <button onClick={fetchDigest} className="text-sm text-gray-400 hover:text-white underline">
              다시 시도
            </button>
          </div>
        )}
        {!loading && !error && !digest?.top_ideas?.length && (
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
