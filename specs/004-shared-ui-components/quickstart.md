# Quickstart: 004-shared-ui-components

**Created**: 2026-04-14

## 필수 준비

### 1. 의존성 설치

```bash
cd migration
bun add clsx tailwind-merge
```

### 2. cn 유틸리티 생성

`src/shared/lib/cn.ts` 생성 후 기존 Button, TextField의 `joinClasses`를 `cn`으로 교체.

### 3. 에셋 복사

레거시의 `Loading.mov`를 migration 프로젝트로 복사:
```
src/renderer/src/assets/video/Loading.mov → migration/src/assets/video/Loading.mov
```

## 컴포넌트 사용 예시

```tsx
// Typography
import { Typography } from '@/shared/ui/typography'
<Typography variant="headline-3xl-bold" as="h1">제목</Typography>

// LoadingSpinner
import { LoadingSpinner } from '@/shared/ui/loading-spinner'
<LoadingSpinner size="md" text="로딩 중..." />

// Modal
import { Modal } from '@/shared/ui/modal'
<Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
  <p>모달 콘텐츠</p>
</Modal>

// ToggleSwitch (레이블 있는 변형)
import { ToggleSwitch } from '@/shared/ui/toggle-switch'
<ToggleSwitch
  checked={isMonthly}
  onChange={setIsMonthly}
  uncheckedLabel="월간"
  checkedLabel="연간"
/>

// NotificationToggleSwitch (알림용 소형)
import { NotificationToggleSwitch } from '@/shared/ui/toggle-switch'
<NotificationToggleSwitch
  checked={enabled}
  onChange={setEnabled}
  isDisabled={false}
/>

// Timer (시각적 카운트다운)
import { Timer } from '@/shared/ui/timer'
<Timer value={3} size={64} />

// PanelHeader
import { PanelHeader } from '@/shared/ui/panel-header'
<PanelHeader>패널 제목</PanelHeader>

// NotificateMessage
import { NotificateMessage } from '@/shared/ui/notification-message'
<NotificateMessage message="설정 완료" step={1} variant="success" />
```

## 검증 방법

```bash
# 타입 체크
bun run typecheck

# 린트
bun run lint

# 테스트 (複잡한 컴포넌트만)
bun run test

# 시각 검증 - dev 서버 실행 후 각 컴포넌트 렌더링 비교
bun run dev
```
