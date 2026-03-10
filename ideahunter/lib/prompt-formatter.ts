import { AIT_MASTER_PROMPT_TEMPLATE } from './templates/ait-master-prompt';
import type { PlatformAnalysis } from '@/types/idea';

export function formatAitPrompt(
  idea: {
    title: string;
    summary_ko?: string | null;
    tags?: string[] | null;
    recommended_stack?: string[] | null;
    revenue_potential?: number | null;
    market_size?: string | null;
  },
  platformAnalysis: PlatformAnalysis
): string {
  const ideaText = `${idea.title}${idea.summary_ko ? ' — ' + idea.summary_ko : ''}`;

  const platformRationale = platformAnalysis.ait_target_type === 'react-native'
    ? '복잡한 네이티브 기능(카메라, GPS, 애니메이션 등)이 필요하여 React Native 선택'
    : '콘텐츠/유틸리티 중심으로 WebView가 더 효율적';

  const monetization = platformAnalysis.ait_ad_revenue_estimate !== '추정 불가'
    ? `인앱광고(AdMob IAA) — ${platformAnalysis.ait_ad_revenue_estimate}`
    : '인앱광고(AdMob IAA) + 인앱결제(IAP)';

  const goal = idea.revenue_potential && idea.revenue_potential >= 4
    ? `높은 수익 잠재력 (${idea.market_size ?? '시장 규모 미정'}) — 토스 3,000만 유저 대상 빠른 성장`
    : `토스 3,000만 유저 대상 서비스 검증 및 점진적 성장`;

  const targetUsers = (idea.tags ?? []).includes('B2B')
    ? '토스 비즈니스 사용자 (직장인, 프리랜서)'
    : '토스 일반 사용자 (만 19세 이상 MZ세대 중심)';

  let prompt = AIT_MASTER_PROMPT_TEMPLATE;
  const replacements: Record<string, string> = {
    '[INSERT_IDEA]': ideaText,
    '[AIT_SCORE]': String(platformAnalysis.ait_score),
    '[AIT_CATEGORY]': platformAnalysis.ait_category,
    '[TARGET_TYPE]': platformAnalysis.ait_target_type,
    '[BLOCKED_REASON]': platformAnalysis.ait_blocked_reason ?? '없음',
    '[PLATFORM_RATIONALE]': platformRationale,
    '[OPTIONAL_NAME]': idea.title.split(/[\s:—-]/)[0].slice(0, 20),
    '[TARGET_USERS]': targetUsers,
    '[MONETIZATION]': monetization,
    '[GOAL]': goal,
    '[TEAM_SIZE]': '1인',
    '[TIMELINE]': '2주',
    '[LEAN_OR_NORMAL]': 'LEAN',
  };

  for (const [key, value] of Object.entries(replacements)) {
    prompt = prompt.replaceAll(key, value);
  }

  return prompt.trim();
}
