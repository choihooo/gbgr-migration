# Quickstart: 005-app-layout-settings

**Created**: 2026-04-14

## 통합 시나리오

### 1. ThemeProvider 적용 (app/providers)

```tsx
// migration/src/app/App.tsx 또는 최상위 진입점
import { ThemeProvider } from '@/app/providers/theme-provider'

function App() {
  return (
    <ThemeProvider>
      {/* 기존 Provider들 */}
    </ThemeProvider>
  )
}
```

### 2. 인증 후 레이아웃에 헤더 추가

```tsx
// migration/src/app/layouts/RootLayout.tsx
import { Header } from '@/features/layout'

function RootLayout() {
  return (
    <>
      <Header />
      <Outlet />
    </>
  )
}
```

### 3. 대시보드 페이지에 DashboardHeader + 모달 적용

```tsx
// migration/src/pages/dashboard-page/index.tsx
import { DashboardHeader } from '@/features/layout'
import { SettingsModal } from '@/features/settings'
import { NotificationModal } from '@/features/notification-settings'
import { useModal } from '@/shared/hooks/use-modal'

function DashboardPage() {
  const settingsModal = useModal()
  const notificationModal = useModal()

  return (
    <>
      <DashboardHeader
        onOpenNotification={notificationModal.open}
        onOpenSettings={settingsModal.open}
      />
      {/* 대시보드 콘텐츠 */}
      <SettingsModal isOpen={settingsModal.isOpen} onClose={settingsModal.close} />
      <NotificationModal isOpen={notificationModal.isOpen} onClose={notificationModal.close} />
    </>
  )
}
```

### 4. 테마 토글 사용

```tsx
import { useThemeStore } from '@/entities/theme'

function ThemeExample() {
  const { isDark, setPreference } = useThemeStore()

  return <ThemeToggleSwitch checked={isDark} onChange={(dark) => setPreference(dark ? 'dark' : 'light')} />
}
```

### 5. 알림 설정 스토어 사용

```tsx
import { useNotificationStore } from '@/features/notification-settings'

function NotificationExample() {
  const { isAllow, stretching, setAllow, setStretching } = useNotificationStore()

  return (
    <div>
      <NotificationToggleSwitch checked={isAllow} onChange={setAllow} />
      <TimeControlSection
        value={stretching.interval}
        onChange={(v) => setStretching({ interval: v })}
      />
    </div>
  )
}
```

## Tauri 플러그인 설정

### autostart 플러그인 설치

```bash
# Rust
cd migration/src-tauri && cargo add tauri-plugin-autostart

# JavaScript
cd migration && npm install @tauri-apps/plugin-autostart
```

### Rust 등록 (src-tauri/src/lib.rs)

```rust
.plugin(tauri_plugin_autostart::init(
    tauri_plugin_autostart::MacosLauncher::LaunchAgent,
    None,
))
```

### Capabilities 추가

```json
{
  "permissions": ["autostart:default"]
}
```

## 검증 체크리스트

- [ ] ThemeProvider 적용 후 라이트/다크 전환 동작
- [ ] Header가 인증 후 페이지에 표시
- [ ] DashboardHeader 탭 전환 동작
- [ ] 설정 모달 열기/닫기 + OS 자동 시작 토글
- [ ] 알림 모달 열기/닫기 + 시간 편집 인터랙션
- [ ] 앱 재시작 후 테마 설정 유지
- [ ] typecheck + lint 통과
