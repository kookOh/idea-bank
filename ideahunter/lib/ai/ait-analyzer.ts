import { getGroqClient } from './groq-client';
import type { PlatformAnalysis } from '@/types/idea';

const BLOCKED_CATEGORIES = [
  '금융', '투자', '디지털자산', '암호화폐', '주식', '펀드', '보험',
  '대출', '증권', '가상자산', 'crypto', 'finance', 'investment', 'stock', 'loan',
];

export async function analyzeAitSuitability(baseAnalysis: {
  title: string;
  summary_ko?: string | null;
  tags?: string[] | null;
  difficulty?: number | null;
  revenue_potential?: number | null;
  market_size?: string | null;
  recommended_stack?: string[] | null;
}): Promise<PlatformAnalysis> {
  // 1. 금지 카테고리 사전 필터링
  const allText = [
    baseAnalysis.title,
    baseAnalysis.summary_ko ?? '',
    ...(baseAnalysis.tags ?? []),
  ].join(' ').toLowerCase();

  const blockedReason = BLOCKED_CATEGORIES.find((cat) => allText.includes(cat.toLowerCase()));
  if (blockedReason) {
    return {
      ait_score: 0,
      ait_category: '차단됨',
      ait_blocked_reason: `금지 카테고리: ${blockedReason} (앱인토스 정책 위반 - 금융/투자/디지털자산 관련 앱 제출 불가)`,
      ait_ad_revenue_estimate: '해당 없음',
      ait_target_type: 'webview',
    };
  }

  // 2. Groq AI 분석
  const prompt = `다음 비즈니스 아이디어의 "앱인토스(토스 미니앱)" 적합성을 분석해서 JSON으로만 응답해 (다른 텍스트 없이):

아이디어: ${baseAnalysis.title}
설명: ${baseAnalysis.summary_ko ?? ''}
태그: ${(baseAnalysis.tags ?? []).join(', ')}
난이도: ${baseAnalysis.difficulty ?? 3}/5
수익잠재력: ${baseAnalysis.revenue_potential ?? 3}/5

앱인토스 플랫폼 제약:
- 토스 앱 내 WebView 또는 React Native로 동작
- TDS(토스 디자인 시스템) 필수
- 금융상품/투자추천/디지털자산/외부앱설치유도 금지
- 수익: 인앱광고(AdMob IAA) + 인앱결제(IAP)
- 사용자: 3,000만 토스 유저 (만 19세 이상)
- 심사 4단계: 운영, 디자인, 기능, 보안

응답 형식:
{
  "ait_score": 75,
  "ait_category": "유틸리티",
  "ait_blocked_reason": null,
  "ait_ad_revenue_estimate": "월 예상 광고수익 300-500만원 (DAU 5만 기준 eCPM 3,000원)",
  "ait_target_type": "webview"
}

ait_score: 0-100 (앱인토스 적합도. 광고수익잠재력 30%, 사용자참여도 30%, 구현용이성 20%, 심사통과가능성 20%)
ait_category: 토스 앱 내 카테고리 (유틸리티/라이프스타일/엔터테인먼트/교육/건강/소셜/게임/생산성 중 하나)
ait_blocked_reason: 금지 사유 (없으면 null)
ait_ad_revenue_estimate: DAU/체류시간 기반 eCPM 추정
ait_target_type: "webview" (간단한 콘텐츠/유틸) 또는 "react-native" (복잡한 네이티브 기능 필요)`;

  try {
    const res = await getGroqClient().chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500,
      temperature: 0.3,
    });
    const text = res.choices[0].message.content ?? '{}';
    const json = text.match(/\{[\s\S]*\}/)?.[0] ?? '{}';
    const parsed = JSON.parse(json);

    return {
      ait_score: Math.min(100, Math.max(0, parsed.ait_score ?? 50)),
      ait_category: parsed.ait_category ?? '기타',
      ait_blocked_reason: parsed.ait_blocked_reason ?? null,
      ait_ad_revenue_estimate: parsed.ait_ad_revenue_estimate ?? '추정 불가',
      ait_target_type: parsed.ait_target_type === 'react-native' ? 'react-native' : 'webview',
    };
  } catch {
    return {
      ait_score: 50,
      ait_category: '기타',
      ait_blocked_reason: null,
      ait_ad_revenue_estimate: '추정 불가',
      ait_target_type: 'webview',
    };
  }
}
