'use client';

import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import type { PlatformAnalysis } from '@/types/idea';

type Phase = { step: number; title: string; prompt: string };
type Prompts = {
  project_name: string;
  overview: string;
  master_prompt: string;
  phases: Phase[];
  tech_stack: string[];
  free_services: string[];
};

export default function ImplementationModal({
  idea,
  open,
  onClose,
}: {
  idea: {
    id: string;
    title: string;
    recommended_stack?: string[] | null;
    platform_analysis?: PlatformAnalysis | null;
  };
  open: boolean;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [prompts, setPrompts] = useState<Prompts | null>(null);
  const [aitPrompts, setAitPrompts] = useState<Prompts | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'master' | 'phases' | 'appintoss'>('master');
  const [copied, setCopied] = useState('');
  const [usedProvider, setUsedProvider] = useState<string | null>(null);

  const isBridgeAlive = async (): Promise<boolean> => {
    try {
      const res = await fetch('http://localhost:3100/health', {
        signal: AbortSignal.timeout(3_000),
      });
      if (!res.ok) return false;
      const data = await res.json();
      return data.status === 'ok';
    } catch {
      return false;
    }
  };

  const tryLocalBridge = async (ideaData: typeof idea, platform?: 'appintoss') => {
    // Phase 1: 빠른 health probe (3초)
    const alive = await isBridgeAlive();
    if (!alive) return null;

    // Phase 2: 실제 생성 (90초 — CLI 실행 시간 충분히 확보)
    try {
      const res = await fetch('http://localhost:3100/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea: ideaData, platform }),
        signal: AbortSignal.timeout(90_000),
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (!data.master_prompt) return null;
      return data as { provider: string } & Prompts;
    } catch {
      return null;
    }
  };

  const saveToServer = async (ideaId: string, promptData: Prompts, platform?: 'appintoss') => {
    try {
      const url = platform
        ? `/api/ideas/${ideaId}/save-prompts?platform=${platform}`
        : `/api/ideas/${ideaId}/save-prompts`;
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(promptData),
      });
    } catch {
      // 캐시 저장 실패는 무시
    }
  };

  const generate = async (platform?: 'appintoss') => {
    setLoading(true);
    setError(null);
    setUsedProvider(null);
    try {
      // 1순위: 로컬 브릿지 (Claude Code CLI → Codex CLI)
      const localResult = await tryLocalBridge(idea, platform);
      if (localResult) {
        const { provider, ...promptData } = localResult;
        setUsedProvider(provider);
        if (platform === 'appintoss') {
          setAitPrompts(promptData);
          setActiveTab('appintoss');
        } else {
          setPrompts(promptData);
        }
        saveToServer(idea.id, promptData, platform);
        setLoading(false);
        return;
      }

      // 2순위: 서버 API (Groq)
      const url = platform
        ? `/api/ideas/${idea.id}/generate-prompts?platform=${platform}`
        : `/api/ideas/${idea.id}/generate-prompts`;
      const res = await fetch(url, { method: 'POST' });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error ?? '생성 실패');
      } else {
        setUsedProvider('groq');
        if (platform === 'appintoss') {
          setAitPrompts(data);
          setActiveTab('appintoss');
        } else {
          setPrompts(data);
        }
      }
    } catch {
      setError('네트워크 오류, 다시 시도해주세요');
    }
    setLoading(false);
  };

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(''), 2000);
  };

  const copyAll = () => {
    copy(prompts?.master_prompt ?? '', 'all');
  };

  const hasAitAnalysis = !!idea.platform_analysis;
  const tabs = hasAitAnalysis
    ? (['master', 'phases', 'appintoss'] as const)
    : (['master', 'phases'] as const);
  const tabLabels: Record<string, string> = {
    master: '🎯 마스터 프롬프트',
    phases: '📋 단계별',
    appintoss: '📱 앱인토스',
  };

  return (
    <Dialog.Root open={open} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-3xl max-h-[85vh] overflow-y-auto z-50 bg-gray-900 border border-gray-700 rounded-2xl p-6 shadow-2xl">
          {/* 헤더 */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <Dialog.Title className="text-xl font-bold text-white mb-1">
                ⚡ 프로젝트 자동 생성
              </Dialog.Title>
              <Dialog.Description className="text-gray-400 text-sm line-clamp-2">
                {idea.title}
              </Dialog.Description>
            </div>
            <Dialog.Close className="text-gray-500 hover:text-white text-xl ml-4" aria-label="닫기">
              ✕
            </Dialog.Close>
          </div>

          {/* 에러 상태 */}
          {error && !loading && (
            <div className="text-center py-12">
              <div className="text-5xl mb-4">⚠️</div>
              <p className="text-red-400 font-medium mb-4">{error}</p>
              <button
                onClick={() => generate()}
                className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-colors"
              >
                다시 시도
              </button>
            </div>
          )}

          {/* 생성 전 상태 */}
          {!prompts && !aitPrompts && !loading && !error && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🚀</div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Claude Code 프롬프트 세트 생성
              </h3>
              <p className="text-gray-400 text-sm mb-2">
                이 아이디어를 실제 서비스로 만들기 위한
              </p>
              <p className="text-gray-400 text-sm mb-6">
                완전한 프롬프트를 AI가 자동으로 설계합니다
              </p>
              <div className="flex flex-wrap justify-center gap-2 mb-8">
                {idea.recommended_stack?.map((s: string) => (
                  <span
                    key={s}
                    className="text-xs px-3 py-1 bg-gray-800 text-gray-300 rounded-full"
                  >
                    {s}
                  </span>
                ))}
              </div>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => generate()}
                  className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold rounded-xl transition-all text-lg flex items-center gap-2"
                >
                  <span>✨</span> 프롬프트 생성
                </button>
                {hasAitAnalysis && (
                  <button
                    onClick={() => generate('appintoss')}
                    className="px-8 py-4 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-bold rounded-xl transition-all text-lg flex items-center gap-2"
                  >
                    <span>📱</span> 앱인토스 프롬프트
                  </button>
                )}
              </div>
              <p className="text-gray-600 text-xs mt-3">
                로컬 CLI 우선 (Claude Code → Codex) · 폴백: Groq AI
              </p>
            </div>
          )}

          {/* 로딩 */}
          {loading && (
            <div className="text-center py-16">
              <div className="text-5xl mb-4 animate-spin">⚙️</div>
              <p className="text-gray-300 font-medium">AI가 프롬프트를 설계하는 중...</p>
              <p className="text-gray-500 text-sm mt-2">
                DB 스키마 · API · UI · 테스트 · 배포 프롬프트 생성 중
              </p>
            </div>
          )}

          {/* 생성 완료 */}
          {(prompts || aitPrompts) && (
            <div>
              {/* 프로젝트 정보 */}
              {(() => {
                const currentPrompts = activeTab === 'appintoss' ? aitPrompts : prompts;
                if (!currentPrompts) return null;
                return (
                  <div className="bg-gray-800/50 rounded-xl p-4 mb-6">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-green-400">✓</span>
                      <span className="font-semibold text-white">{currentPrompts.project_name}</span>
                      {usedProvider && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          usedProvider === 'claude-code' ? 'bg-orange-900/40 text-orange-300' :
                          usedProvider === 'codex' ? 'bg-emerald-900/40 text-emerald-300' :
                          'bg-blue-900/40 text-blue-300'
                        }`}>
                          {usedProvider === 'claude-code' ? 'Claude Code' :
                           usedProvider === 'codex' ? 'Codex' : 'Groq AI'}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-400 text-sm mb-3">{currentPrompts.overview}</p>
                    <div className="flex flex-wrap gap-2">
                      {currentPrompts.free_services?.map((s) => (
                        <span
                          key={s}
                          className="text-xs px-2 py-1 bg-green-900/30 text-green-400 rounded-full"
                        >
                          🆓 {s}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* 탭 */}
              <div className="flex gap-2 mb-4">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => {
                      if (tab === 'appintoss' && !aitPrompts) {
                        generate('appintoss');
                      } else {
                        setActiveTab(tab);
                      }
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === tab
                        ? tab === 'appintoss' ? 'bg-teal-600 text-white' : 'bg-purple-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:text-white'
                    }`}
                  >
                    {tabLabels[tab]}
                  </button>
                ))}
              </div>

              {/* 마스터 프롬프트 탭 */}
              {activeTab === 'master' && prompts && (
                <div>
                  <div className="relative">
                    <pre className="bg-gray-950 rounded-xl p-4 text-sm text-gray-300 overflow-auto max-h-64 whitespace-pre-wrap font-mono leading-relaxed">
                      {prompts.master_prompt}
                    </pre>
                    <button
                      onClick={() => copy(prompts.master_prompt, 'master')}
                      className="absolute top-3 right-3 px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs transition-colors"
                    >
                      {copied === 'master' ? '✓ 복사됨' : '복사'}
                    </button>
                  </div>

                  <div className="mt-4 p-4 bg-blue-900/20 border border-blue-800/50 rounded-xl">
                    <p className="text-blue-300 text-sm font-medium mb-2">
                      📌 Claude Code에서 사용하는 방법:
                    </p>
                    <div className="relative">
                      <code className="text-xs text-gray-300 font-mono bg-gray-950 block p-3 rounded-lg">
                        {`claude --dangerously-skip-permissions -p "위 프롬프트 내용"`}
                      </code>
                    </div>
                  </div>

                  <button
                    onClick={copyAll}
                    className="w-full mt-4 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    {copied === 'all'
                      ? '✓ 복사 완료! Claude Code에 붙여넣기 하세요'
                      : '⚡ 실행 스크립트 전체 복사 (Claude Code에 바로 사용)'}
                  </button>
                </div>
              )}

              {/* 단계별 프롬프트 탭 */}
              {activeTab === 'phases' && prompts && (
                <div className="flex flex-col gap-3">
                  {prompts.phases?.map((phase) => (
                    <div key={phase.step} className="bg-gray-800/50 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-purple-600 text-white text-xs flex items-center justify-center font-bold">
                            {phase.step}
                          </span>
                          <span className="font-medium text-white text-sm">{phase.title}</span>
                        </div>
                        <button
                          onClick={() => copy(phase.prompt, `phase-${phase.step}`)}
                          className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs transition-colors"
                        >
                          {copied === `phase-${phase.step}` ? '✓' : '복사'}
                        </button>
                      </div>
                      <p className="text-gray-400 text-xs font-mono leading-relaxed line-clamp-3">
                        {phase.prompt}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* 앱인토스 탭 */}
              {activeTab === 'appintoss' && aitPrompts && (
                <div>
                  {/* 플랫폼 정보 배지 */}
                  {idea.platform_analysis && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="text-xs px-3 py-1.5 bg-teal-900/40 text-teal-300 rounded-full font-medium">
                        {idea.platform_analysis.ait_target_type === 'react-native' ? '📱 React Native' : '🌐 WebView'}
                      </span>
                      <span className="text-xs px-3 py-1.5 bg-teal-900/40 text-teal-300 rounded-full font-medium">
                        적합도 {idea.platform_analysis.ait_score}점
                      </span>
                      <span className="text-xs px-3 py-1.5 bg-teal-900/40 text-teal-300 rounded-full font-medium">
                        {idea.platform_analysis.ait_category}
                      </span>
                    </div>
                  )}

                  {/* 마스터 프롬프트 */}
                  <div className="relative">
                    <pre className="bg-gray-950 rounded-xl p-4 text-sm text-gray-300 overflow-auto max-h-64 whitespace-pre-wrap font-mono leading-relaxed">
                      {aitPrompts.master_prompt}
                    </pre>
                    <button
                      onClick={() => copy(aitPrompts.master_prompt, 'ait-master')}
                      className="absolute top-3 right-3 px-3 py-1 bg-teal-700 hover:bg-teal-600 rounded-lg text-xs transition-colors"
                    >
                      {copied === 'ait-master' ? '✓ 복사됨' : '복사'}
                    </button>
                  </div>

                  {/* 심사 체크리스트 미리보기 */}
                  <div className="mt-4 p-4 bg-teal-900/20 border border-teal-800/50 rounded-xl">
                    <p className="text-teal-300 text-sm font-medium mb-3">📋 앱인토스 심사 체크리스트</p>
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
                      <div>☐ 운영 심사: 앱 이름/설명 가이드라인</div>
                      <div>☐ 디자인 심사: TDS 100% 사용</div>
                      <div>☐ 기능 심사: 핵심 기능 정상 동작</div>
                      <div>☐ 보안 심사: 외부 링크/앱 설치 차단</div>
                      <div>☐ SDK 2.0.1+ 사용</div>
                      <div>☐ .ait 빌드 산출물 확인</div>
                    </div>
                  </div>

                  <button
                    onClick={() => copy(aitPrompts.master_prompt, 'ait-all')}
                    className="w-full mt-4 py-4 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    {copied === 'ait-all'
                      ? '✓ 복사 완료! Claude Code에 붙여넣기 하세요'
                      : '📱 앱인토스 마스터 프롬프트 전체 복사'}
                  </button>
                </div>
              )}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
