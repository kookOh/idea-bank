'use client';

const SOURCES = ['hackernews', 'reddit', 'producthunt', 'github', 'playstore', 'appstore'];
const TAGS = ['SaaS', 'AI', 'B2B', 'Mobile', 'B2C', 'No-code', 'API', 'EdTech'];

export default function FilterBar({
  sort,
  source,
  tag,
  aitOnly,
  onSort,
  onSource,
  onTag,
  onAitOnly,
}: {
  sort: string;
  source: string;
  tag: string;
  aitOnly?: boolean;
  onSort: (s: string) => void;
  onSource: (s: string) => void;
  onTag: (t: string) => void;
  onAitOnly?: (v: boolean) => void;
}) {
  return (
    <div className="flex flex-wrap gap-3 items-center">
      <div className="flex gap-2 bg-gray-800 rounded-lg p-1">
        {(
          [
            ['trend_score', '🔥 트렌딩'],
            ['latest', '🕐 최신'],
            ['ait_score', '📱 앱인토스'],
          ] as const
        ).map(([v, l]) => (
          <button
            key={v}
            onClick={() => onSort(v)}
            className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
              sort === v ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            {l}
          </button>
        ))}
      </div>
      <select
        value={source}
        onChange={(e) => onSource(e.target.value)}
        aria-label="소스 필터"
        className="bg-gray-800 text-gray-300 rounded-lg px-3 py-2 text-sm border border-gray-700"
      >
        <option value="">전체 소스</option>
        {SOURCES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <select
        value={tag}
        onChange={(e) => onTag(e.target.value)}
        aria-label="태그 필터"
        className="bg-gray-800 text-gray-300 rounded-lg px-3 py-2 text-sm border border-gray-700"
      >
        <option value="">전체 태그</option>
        {TAGS.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
      {onAitOnly && (
        <button
          onClick={() => onAitOnly(!aitOnly)}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${
            aitOnly
              ? 'bg-teal-700 border-teal-600 text-white'
              : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white'
          }`}
        >
          📱 앱인토스 적합
        </button>
      )}
    </div>
  );
}
