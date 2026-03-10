/** 이미 너무 유명하거나 대형 기업의 앱 패키지 필터링 */
const MEGA_APP_PREFIXES = [
  // Big Tech
  'com.facebook.', 'com.meta.', 'com.google.', 'com.apple.',
  'com.microsoft.', 'com.amazon.', 'com.samsung.', 'com.huawei.',
  // 소셜/메신저
  'com.whatsapp', 'com.instagram.', 'com.snapchat.', 'com.twitter.',
  'com.zhiliaoapp.', 'org.telegram.', 'com.discord', 'com.pinterest.',
  'com.linkedin.', 'com.reddit.', 'com.tumblr.',
  // 스트리밍/엔터
  'com.spotify.', 'com.netflix.', 'com.disney.', 'tv.twitch.',
  'com.hbo.', 'com.pandora.', 'com.soundcloud.',
  // 이커머스/결제
  'com.einnovation.temu', 'com.shopee.', 'com.alibaba.',
  'com.ebay.', 'com.paypal.', 'com.stripe.', 'com.shopify.',
  'com.walmart.', 'com.target.', 'com.costco.',
  // 배달/모빌리티
  'com.uber.', 'com.lyft.', 'com.dd.doordash', 'com.doordash.',
  'com.grubhub.', 'com.instacart.',
  // 금융/핀테크
  'com.venmo.', 'com.squareup.', 'com.robinhood.', 'com.coinbase.',
  'com.intuit.', 'com.wise.', 'com.revolut.',
  // 생산성 (대형)
  'com.slack.', 'com.dropbox.', 'com.zoom.', 'us.zoom.',
  'com.adobe.', 'com.canva.',
  // 동아시아 대형
  'jp.naver.line.', 'com.kakao.', 'com.tencent.', 'com.bytedance.',
  'com.ss.android.', 'com.baidu.', 'com.alibaba.',
  // 게임 대형
  'com.supercell.', 'com.king.', 'com.rovio.', 'com.ea.',
  'com.activision.', 'com.epicgames.', 'com.riotgames.',
  // 기타 대형
  'com.indeed.', 'com.airbnb.', 'com.booking.',
  'com.tripadvisor.', 'com.yelp.', 'com.duolingo.',
];

/** 패키지 ID가 대형 앱에 해당하는지 확인 */
export function isMegaApp(appId: string): boolean {
  return MEGA_APP_PREFIXES.some((prefix) => appId.startsWith(prefix));
}

/** 앱인토스 미니앱으로 부적합한 카테고리 목록 (게임 등) */
const EXCLUDED_GENRE_IDS = [
  'GAME', 'GAME_ACTION', 'GAME_ADVENTURE', 'GAME_ARCADE', 'GAME_BOARD',
  'GAME_CARD', 'GAME_CASINO', 'GAME_CASUAL', 'GAME_EDUCATIONAL',
  'GAME_MUSIC', 'GAME_PUZZLE', 'GAME_RACING', 'GAME_ROLE_PLAYING',
  'GAME_SIMULATION', 'GAME_SPORTS', 'GAME_STRATEGY', 'GAME_TRIVIA',
  'GAME_WORD',
];

/** genreId가 앱인토스 미니앱으로 부적합한 카테고리에 해당하는지 확인 */
export function isExcludedCategory(genreId: string): boolean {
  return EXCLUDED_GENRE_IDS.some((id) => genreId.toUpperCase().startsWith(id));
}
