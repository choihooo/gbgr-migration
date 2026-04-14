# Data Model: 005-app-layout-settings

**Created**: 2026-04-14

## 엔티티 모델

### ThemeState (Zustand Store)

| 필드 | 타입 | 필수 | 기본값 | 설명 |
|------|------|------|--------|------|
| preference | 'light' \| 'dark' \| 'system' | 아니오 | 'system' | 사용자 테마 설정 |
| resolvedTheme | 'light' \| 'dark' | 파생 | 시스템 감지 | 실제 적용된 테마 |
| setPreference | (pref: ThemePreference) => void | 예 | - | 테마 설정 변경 |
| isDark | boolean (파생) | 아니오 | false | 현재 다크 모드 여부 |

**영속화**: Zustand persist → localStorage, 키: `theme-preference`

**상태 전이**:
```
system ──(setPreference('light'))──→ light
system ──(setPreference('dark'))──→ dark
light ──(setPreference('dark'))──→ dark
dark ──(setPreference('light'))──→ light
* ──(setPreference('system'))──→ system ──(OS 테마 감지)──→ light|dark
```

---

### ThemeToggleSwitchProps

| 필드 | 타입 | 필수 | 기본값 | 설명 |
|------|------|------|--------|------|
| checked | boolean | 예 | - | 다크 모드 여부 |
| onChange | (isDark: boolean) => void | 예 | - | 테마 변경 콜백 |

---

### NavigationTab

| 필드 | 타입 | 필수 | 기본값 | 설명 |
|------|------|------|--------|------|
| id | string | 예 | - | 탭 식별자 |
| label | string | 예 | - | 탭 표시 이름 |
| icon | React.FC | 예 | - | 탭 아이콘 |
| disabled | boolean | 아니오 | false | 비활성화 여부 |
| path | string | 아니오 | - | 외부 링크 (리포트, 리뷰) |

**탭 목록** (고정):
- `dashboard` — 대시보드 (내부 상태 전환)
- `settings` — 설정 (내부 상태 전환)
- `report` — 오류 제보 (외부 링크)
- `review` — 후기 등록 (외부 링크)

---

### NotificationSettings (Zustand Store)

| 필드 | 타입 | 필수 | 기본값 | 설명 |
|------|------|------|--------|------|
| isAllow | boolean | 아니오 | false | 알림 허용 여부 |
| stretching | StretchingConfig | 아니오 | { isEnabled: false, interval: 30 } | 스트레칭 알림 설정 |
| turtleNeck | TurtleNeckConfig | 아니오 | { isEnabled: false, interval: 10 } | 거북목 경고 설정 |
| setAllow | (allow: boolean) => void | 예 | - | 알림 허용 변경 |
| setStretching | (config: Partial<StretchingConfig>) => void | 예 | - | 스트레칭 설정 변경 |
| setTurtleNeck | (config: Partial<TurtleNeckConfig>) => void | 예 | - | 거북목 설정 변경 |

**영속화**: Zustand persist → sessionStorage, 키: `notification-settings-storage`

**하위 타입**:
- `StretchingConfig`: `{ isEnabled: boolean, interval: number }` (interval: 1-300분)
- `TurtleNeckConfig`: `{ isEnabled: boolean, interval: number }` (interval: 1-300분)

---

### TimeControlSectionProps

| 필드 | 타입 | 필수 | 기본값 | 설명 |
|------|------|------|--------|------|
| value | number | 예 | - | 현재 시간 값 (분) |
| onChange | (value: number) => void | 예 | - | 값 변경 콜백 |
| min | number | 아니오 | 1 | 최소값 |
| max | number | 아니오 | 300 | 최대값 |
| step | number | 아니오 | 5 | 증감 단위 |
| disabled | boolean | 아니오 | false | 비활성화 여부 |

---

### SettingsModalProps

| 필드 | 타입 | 필수 | 기본값 | 설명 |
|------|------|------|--------|------|
| isOpen | boolean | 예 | - | 모달 열림 상태 |
| onClose | () => void | 예 | - | 모달 닫기 콜백 |

---

### NotificationModalProps

| 필드 | 타입 | 필수 | 기본값 | 설명 |
|------|------|------|--------|------|
| isOpen | boolean | 예 | - | 모달 열림 상태 |
| onClose | () => void | 예 | - | 모달 닫기 콜백 |

---

### HeaderProps

| 필드 | 타입 | 필수 | 기본값 | 설명 |
|------|------|------|--------|------|
| (없음 — 인증 상태는 스토어에서 구독) | | | | |

### DashboardHeaderProps

| 필드 | 타입 | 필수 | 기본값 | 설명 |
|------|------|------|--------|------|
| onOpenNotification | () => void | 아니오 | - | 알림 모달 열기 콜백 |
| onOpenSettings | () => void | 아니오 | - | 설정 모달 열기 콜백 |

## 엔티티 간 의존성

```
ThemeState (entities/theme)
├── ThemeToggleSwitch (shared/ui)
├── Header (features/layout)
└── DashboardHeader (features/layout)

NotificationSettings (features/notification-settings/model)
├── NotificationModal (features/notification-settings/ui)
└── TimeControlSection (features/notification-settings/ui/components)

useModal (shared/hooks)
├── SettingsModal (features/settings)
└── NotificationModal (features/notification-settings)

Modal (shared/ui — 004 구현)
├── SettingsModal (features/settings)
└── NotificationModal (features/notification-settings)

NotificationToggleSwitch (shared/ui — 004 구현)
├── SettingsModal (OS 자동 시작 토글)
└── NotificationModal (알림 허용 토글)

BrandLogo, BrandSymbol (shared/ui/icons — 004 구현)
├── Header
└── DashboardHeader
```
