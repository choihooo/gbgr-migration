# Quickstart: PosePatternPanel 정적 패널 이관

**Feature**: 013-pose-pattern-panel-migration
**Date**: 2026-04-15

## 개발 환경 설정

```bash
cd migration
bun install
```

## 수정 파일

단일 파일만 수정:

- `migration/src/features/main-panels/ui/PosePatternPanel.tsx`

## 주요 변경 사항

1. `PanelBaseProps` 인터페이스 적용 (className prop 추가)
2. `cn()` 유틸리티 import 및 적용
3. 레거시와 시각적 동일성 확인 (이미 대부분 일치)

## 검증

```bash
# 타입 체크
bun run typecheck

# 린트
bun run lint

# 빌드
bun run build
```

시각적 검증: 마이그레이션 패널과 레거시 패널을 나란히 렌더링하여 비교
