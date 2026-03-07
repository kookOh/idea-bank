---
trigger: "앱인토스 프로젝트 생성|ait init|앱인토스 초기화"
---

# 앱인토스 프로젝트 초기화

사용자가 앱인토스(토스 미니앱) 프로젝트를 생성하려 합니다.

## 판단 기준: WebView vs React Native

**WebView 선택** (기본값):
- 콘텐츠 중심 앱 (뉴스, 정보, 유틸리티)
- 간단한 UI/UX
- 빠른 개발 필요
- 웹 기술만으로 충분

**React Native 선택**:
- 카메라, GPS, 센서 등 네이티브 기능 필요
- 복잡한 애니메이션
- 게임 또는 고성능 요구
- 네이티브 수준 UX 필요

## WebView 프로젝트 초기화

```bash
# 1. Vite + React + TypeScript 프로젝트 생성
npm create vite@latest my-ait-app -- --template react-ts
cd my-ait-app

# 2. 앱인토스 웹 프레임워크 설치
npm install @apps-in-toss/web-framework
npm install @toss/tds-mobile

# 3. granite.config.ts 생성
cat > granite.config.ts << 'EOF'
import { defineConfig } from '@apps-in-toss/web-framework';

export default defineConfig({
  appId: 'your-app-id',
  name: '앱 이름',
  version: '1.0.0',
  sdk: '2.0.1',
  entry: './src/main.tsx',
});
EOF

# 4. 빌드: granite build → .ait 파일 생성
```

## React Native 프로젝트 초기화

```bash
# 1. Granite 앱 생성
npm create granite-app my-ait-app
cd my-ait-app

# 2. 앱인토스 프레임워크 + TDS 설치
npm install @apps-in-toss/framework
npm install @toss/tds-react-native

# 3. granite.config.ts 확인 및 수정
# SDK 2.0.1+ 확인
```

## 공통 설정

1. **CLAUDE.md에 앱인토스 가이드라인 추가**:
   - TDS 컴포넌트 필수 사용
   - window.open, location.href 사용 금지
   - 외부 앱 설치 유도 금지
   - 금융/투자/디지털자산 콘텐츠 금지

2. **광고 SDK 보일러플레이트**:
   - AdMob IAA SDK 초기 설정
   - 광고 배치 포인트 설정

3. **심사 체크리스트 파일 생성**:
   - `docs/review-checklist.md` 생성
   - 운영/디자인/기능/보안 4단계 항목
