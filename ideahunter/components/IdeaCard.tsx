'use client';

import { useState } from 'react';
import ImplementationModal from './ImplementationModal';
import type { Idea, PlatformAnalysis } from '@/types/idea';

const SOURCE_ICONS: Record<string, string> = {
  hackernews: '🟠',
  reddit: '🟣',
  producthunt: '🔴',
  github: '⚫',
  playstore: '🟢',
  appstore: '🔵',
};

const SCORE_COLOR = (v: number) =>
  v >= 4 ? 'text-green-400' : v >= 3 ? 'text-yellow-400' : 'text-red-400';

export default function IdeaCard({ idea }: { idea: Idea }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [aitLoading, setAitLoading] = useState(false);
  const [platformAnalysis, setPlatformAnalysis] = useState<PlatformAnalysis | null>(
    idea.platform_analysis ?? null
  );

  const analyzeAit = async () => {
    setAitLoading(true);
    try {
      const res = await fetch(`/api/ideas/${idea.id}/analyze-ait`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setPlatformAnalysis(data);
      }
    } catch {
      // 실패 시 무시
    }
    setAitLoading(false);
  };

  const aitScore = platformAnalysis?.ait_score ?? 0;
  const isAitSuitable = platformAnalysis && aitScore >= 70 && !platformAnalysis.ait_blocked_reason;

  return (
    <>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-600 transition-all group">
        {/* 상단: 소스 + 점수 + AIT 뱃지 */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>{SOURCE_ICONS[idea.source] ?? '📰'}</span>
            <span className="capitalize">{idea.source}</span>
            <span>•</span>
            <span>⬆ {(idea.score ?? 0).toLocaleString()}</span>
            <span>•</span>
            <span>💬 {idea.comment_count ?? 0}</span>
          </div>
          <div className="flex items-center gap-2">
            {isAitSuitable && (
              <span className="text-xs px-2 py-0.5 bg-teal-900/50 text-teal-300 rounded-full font-medium">
                앱인토스 {aitScore}점
              </span>
            )}
            {platformAnalysis?.ait_blocked_reason && (
              <span className="text-xs px-2 py-0.5 bg-red-900/50 text-red-300 rounded-full font-medium">
                AIT 부적합
              </span>
            )}
            <div className="flex items-center gap-1 text-sm font-bold text-purple-400">
              🔥 {Math.round(idea.trend_score ?? 0)}
            </div>
          </div>
        </div>

        {/* 제목 */}
        <a
          href={idea.source_url?.startsWith('http') ? idea.source_url : '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="text-lg font-semibold text-white hover:text-purple-300 transition-colors block mb-2"
        >
          {idea.title}
        </a>

        {/* AI 요약 */}
        {idea.summary_ko && (
          <p className="text-gray-400 text-sm leading-relaxed mb-4">{idea.summary_ko}</p>
        )}

        {/* 분석 지표 */}
        {idea.difficulty != null && idea.revenue_potential != null && (
          <div className="grid grid-cols-3 gap-3 mb-4 p-3 bg-gray-800/50 rounded-lg">
            <div className="text-center">
              <div className={`text-lg font-bold ${SCORE_COLOR(Number(idea.revenue_potential) || 0)}`}>
                {'★'.repeat(Math.max(0, Math.min(5, Number(idea.revenue_potential) || 0)))}
                {'☆'.repeat(Math.max(0, 5 - (Number(idea.revenue_potential) || 0)))}
              </div>
              <div className="text-xs text-gray-500 mt-1">수익 잠재력</div>
            </div>
            <div className="text-center">
              <div className={`text-lg font-bold ${SCORE_COLOR(6 - (Number(idea.difficulty) || 0))}`}>
                {'★'.repeat(Math.max(0, Math.min(5, 6 - (Number(idea.difficulty) || 0))))}
                {'☆'.repeat(Math.max(0, (Number(idea.difficulty) || 0) - 1))}
              </div>
              <div className="text-xs text-gray-500 mt-1">구현 용이성</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-400">{idea.mvp_days ?? '?'}일</div>
              <div className="text-xs text-gray-500 mt-1">MVP 예상</div>
            </div>
          </div>
        )}

        {/* 태그 + 스택 */}
        <div className="flex flex-wrap gap-2 mb-4">
          {idea.tags?.map((tag: string) => (
            <span
              key={tag}
              className="text-xs px-2 py-1 bg-purple-900/40 text-purple-300 rounded-full"
            >
              {tag}
            </span>
          ))}
          {idea.recommended_stack?.slice(0, 3).map((s: string) => (
            <span
              key={s}
              className="text-xs px-2 py-1 bg-blue-900/40 text-blue-300 rounded-full"
            >
              {s}
            </span>
          ))}
        </div>

        {/* 버튼 영역 */}
        <div className="flex gap-2">
          {/* 핵심 버튼 - 프로젝트 생성 */}
          <button
            onClick={() => setModalOpen(true)}
            className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold rounded-lg transition-all transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 text-sm"
          >
            <span>⚡</span>
            <span>프로젝트 생성하기</span>
          </button>

          {/* 앱인토스 분석/생성 버튼 */}
          {!platformAnalysis && (
            <button
              onClick={analyzeAit}
              disabled={aitLoading}
              className="px-4 py-3 bg-teal-700 hover:bg-teal-600 disabled:opacity-50 text-white font-medium rounded-lg transition-all text-sm whitespace-nowrap"
            >
              {aitLoading ? '분석 중...' : '앱인토스 분석'}
            </button>
          )}
          {isAitSuitable && (
            <button
              onClick={() => { setModalOpen(true); }}
              className="px-4 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-medium rounded-lg transition-all text-sm whitespace-nowrap"
            >
              앱인토스로 만들기
            </button>
          )}
        </div>
      </div>

      <ImplementationModal
        idea={{ ...idea, platform_analysis: platformAnalysis }}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
