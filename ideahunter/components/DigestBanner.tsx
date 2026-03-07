'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Digest } from '@/types/idea';

export default function DigestBanner() {
  const [digest, setDigest] = useState<Digest | null>(null);

  useEffect(() => {
    fetch('/api/digest')
      .then((r) => {
        if (!r.ok) throw new Error('fetch failed');
        return r.json();
      })
      .then(setDigest)
      .catch((e) => console.error('[DigestBanner]', e));
  }, []);

  if (!digest?.top_ideas?.length) return null;

  return (
    <Link
      href="/digest"
      className="block mb-6 p-4 bg-gradient-to-r from-purple-900/40 to-blue-900/40
        border border-purple-700/50 rounded-xl hover:border-purple-500/50 transition-colors"
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-yellow-400">👑</span>
        <span className="font-bold text-white">오늘의 Hot 아이디어 TOP 10</span>
        <span className="text-xs text-gray-400">{digest.date}</span>
      </div>
      <p className="text-gray-400 text-sm">
        {digest.top_ideas?.[0]?.title} 외 {digest.top_ideas?.length - 1}개의 아이디어 →
      </p>
    </Link>
  );
}
