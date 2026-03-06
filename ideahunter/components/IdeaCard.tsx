'use client';

import { useState } from 'react';
import ImplementationModal from './ImplementationModal';

const SOURCE_ICONS: Record<string, string> = {
  hackernews: '🟠',
  reddit: '🟣',
  producthunt: '🔴',
  github: '⚫',
};

const SCORE_COLOR = (v: number) =>
  v >= 4 ? 'text-green-400' : v >= 3 ? 'text-yellow-400' : 'text-red-400';

export default function IdeaCard({ idea }: { idea: any }) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-600 transition-all group">
        {/* 상단: 소스 + 점수 */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>{SOURCE_ICONS[idea.source] ?? '📰'}</span>
            <span className="capitalize">{idea.source}</span>
            <span>•</span>
            <span>⬆ {idea.score?.toLocaleString()}</span>
            <span>•</span>
            <span>💬 {idea.comment_count}</span>
          </div>
          <div className="flex items-center gap-1 text-sm font-bold text-purple-400">
            🔥 {Math.round(idea.trend_score ?? 0)}
          </div>
        </div>

        {/* 제목 */}
        <a
          href={idea.source_url}
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
        {idea.difficulty && (
          <div className="grid grid-cols-3 gap-3 mb-4 p-3 bg-gray-800/50 rounded-lg">
            <div className="text-center">
              <div className={`text-lg font-bold ${SCORE_COLOR(idea.revenue_potential)}`}>
                {'★'.repeat(idea.revenue_potential)}
                {'☆'.repeat(5 - idea.revenue_potential)}
              </div>
              <div className="text-xs text-gray-500 mt-1">수익 잠재력</div>
            </div>
            <div className="text-center">
              <div className={`text-lg font-bold ${SCORE_COLOR(6 - idea.difficulty)}`}>
                {'★'.repeat(6 - idea.difficulty)}
                {'☆'.repeat(idea.difficulty - 1)}
              </div>
              <div className="text-xs text-gray-500 mt-1">구현 용이성</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-400">{idea.mvp_days}일</div>
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

        {/* 핵심 버튼 - 프로젝트 생성 */}
        <button
          onClick={() => setModalOpen(true)}
          className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold rounded-lg transition-all transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 text-sm"
        >
          <span>⚡</span>
          <span>이 아이디어로 프로젝트 생성하기</span>
          <span className="text-xs opacity-70">(Claude Code 프롬프트 자동 생성)</span>
        </button>
      </div>

      <ImplementationModal idea={idea} open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
