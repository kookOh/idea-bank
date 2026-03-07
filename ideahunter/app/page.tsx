'use client';

import { useState, useEffect, useCallback } from 'react';
import IdeaCard from '@/components/IdeaCard';
import FilterBar from '@/components/FilterBar';
import DigestBanner from '@/components/DigestBanner';

export default function Home() {
  const [ideas, setIdeas] = useState<any[]>([]);
  const [sort, setSort] = useState('trend_score');
  const [source, setSource] = useState('');
  const [tag, setTag] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  const fetchIdeas = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ sort, page: String(page) });
    if (source) params.set('source', source);
    if (tag) params.set('tag', tag);
    try {
      const res = await fetch(`/api/ideas?${params}`);
      if (!res.ok) throw new Error(`API 오류 (${res.status})`);
      const data = await res.json();
      setIdeas((prev) => (page === 0 ? (data.ideas ?? []) : [...prev, ...(data.ideas ?? [])]));
    } catch (e) {
      setError(e instanceof Error ? e.message : '데이터를 불러올 수 없습니다');
    }
    setLoading(false);
  }, [sort, source, tag, page]);

  useEffect(() => {
    setPage(0);
  }, [sort, source, tag]);
  useEffect(() => {
    fetchIdeas();
  }, [fetchIdeas]);

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100">
      {/* 헤더 */}
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between sticky top-0 bg-gray-950/95 backdrop-blur z-10">
        <div className="flex items-center gap-2">
          <span className="text-2xl">💡</span>
          <h1 className="text-xl font-bold">IdeaHunter</h1>
          <span className="text-xs text-gray-500 ml-2">AI 비즈니스 아이디어 큐레이터</span>
        </div>
        <nav className="flex gap-4 text-sm">
          <a href="/" className="text-white font-medium">
            피드
          </a>
          <a href="/digest" className="text-gray-400 hover:text-white">
            오늘의 TOP 10
          </a>
        </nav>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <DigestBanner />
        <FilterBar
          sort={sort}
          source={source}
          tag={tag}
          onSort={(s) => setSort(s)}
          onSource={(s) => setSource(s)}
          onTag={(t) => setTag(t)}
        />

        <div className="mt-6 flex flex-col gap-4">
          {ideas.map((idea: any) => (
            <IdeaCard key={idea.id} idea={idea} />
          ))}
        </div>

        {loading && <div className="text-center py-8 text-gray-500">로딩 중...</div>}

        {error && (
          <div className="text-center py-8">
            <p className="text-red-400 mb-2">{error}</p>
            <button onClick={() => fetchIdeas()} className="text-sm text-gray-400 hover:text-white underline">
              다시 시도
            </button>
          </div>
        )}

        {!loading && !error && ideas.length === 0 && (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold text-white mb-2">아직 수집된 아이디어가 없습니다</h3>
            <p className="text-gray-400 text-sm">
              Supabase를 설정하고 /api/cron/collect을 실행하면 아이디어가 수집됩니다
            </p>
          </div>
        )}

        {ideas.length > 0 && (
          <button
            onClick={() => setPage((p) => p + 1)}
            className="w-full mt-6 py-3 rounded-lg border border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-200 transition-colors"
          >
            더 보기
          </button>
        )}
      </div>
    </main>
  );
}
