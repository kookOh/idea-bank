'use client';

import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';

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
  idea: any;
  open: boolean;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [prompts, setPrompts] = useState<Prompts | null>(null);
  const [activeTab, setActiveTab] = useState<'master' | 'phases'>('master');
  const [copied, setCopied] = useState('');

  const generate = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/ideas/${idea.id}/generate-prompts`, { method: 'POST' });
      const data = await res.json();
      setPrompts(data);
    } catch {
      alert('생성 실패, 다시 시도해주세요');
    }
    setLoading(false);
  };

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(''), 2000);
  };

  const copyAll = () => {
    const fullScript = `#!/bin/bash\n# IdeaHunter 자동 생성 프롬프트: ${idea.title}\n\nclaude --dangerously-skip-permissions -p "\n${prompts?.master_prompt}\n"`;
    copy(fullScript, 'all');
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
            <Dialog.Close className="text-gray-500 hover:text-white text-xl ml-4">
              ✕
            </Dialog.Close>
          </div>

          {/* 생성 전 상태 */}
          {!prompts && !loading && (
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
              <button
                onClick={generate}
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold rounded-xl transition-all text-lg flex items-center gap-2 mx-auto"
              >
                <span>✨</span> 프롬프트 생성 시작
              </button>
              <p className="text-gray-600 text-xs mt-3">
                Groq AI 사용 (무료) · 약 10-20초 소요
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
          {prompts && (
            <div>
              {/* 프로젝트 정보 */}
              <div className="bg-gray-800/50 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-green-400">✓</span>
                  <span className="font-semibold text-white">{prompts.project_name}</span>
                </div>
                <p className="text-gray-400 text-sm mb-3">{prompts.overview}</p>
                <div className="flex flex-wrap gap-2">
                  {prompts.free_services?.map((s) => (
                    <span
                      key={s}
                      className="text-xs px-2 py-1 bg-green-900/30 text-green-400 rounded-full"
                    >
                      🆓 {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* 탭 */}
              <div className="flex gap-2 mb-4">
                {(['master', 'phases'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === tab
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:text-white'
                    }`}
                  >
                    {tab === 'master' ? '🎯 원클릭 마스터 프롬프트' : '📋 단계별 프롬프트'}
                  </button>
                ))}
              </div>

              {/* 마스터 프롬프트 탭 */}
              {activeTab === 'master' && (
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
              {activeTab === 'phases' && (
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
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
