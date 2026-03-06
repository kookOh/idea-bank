'use client';

const SOURCES = ['hackernews', 'reddit', 'producthunt', 'github'];
const TAGS = ['SaaS', 'AI', 'B2B', 'Mobile', 'B2C', 'No-code', 'API', 'EdTech'];

export default function FilterBar({
  sort,
  source,
  tag,
  onSort,
  onSource,
  onTag,
}: {
  sort: string;
  source: string;
  tag: string;
  onSort: (s: string) => void;
  onSource: (s: string) => void;
  onTag: (t: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-3 items-center">
      <div className="flex gap-2 bg-gray-800 rounded-lg p-1">
        {(
          [
            ['trend_score', '🔥 트렌딩'],
            ['latest', '🕐 최신'],
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
        className="bg-gray-800 text-gray-300 rounded-lg px-3 py-2 text-sm border border-gray-700"
      >
        <option value="">전체 태그</option>
        {TAGS.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
    </div>
  );
}
