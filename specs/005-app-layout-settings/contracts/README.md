# UI Component Contracts: 005-app-layout-settings

**Created**: 2026-04-14

## 개요

이 프로젝트는 레이아웃 및 설정 UI 컴포넌트 마이그레이션이므로, 각 컴포넌트의 export 인터페이스가 계약에 해당한다. 또한 Tauri 플러그인 API 계약을 포함한다.

## Export 계약

### entities/theme

```typescript
// entities/theme/model/use-theme-store.ts
type ThemePreference = 'light' | 'dark' | 'system'

interface ThemeStore {
  preference: ThemePreference
  resolvedTheme: 'light' | 'dark'
  isDark: boolean
  setPreference: (pref: ThemePreference) => void
}

export const useThemeStore: UseBoundStore<StoreApi<ThemeStore>>
```

### app/providers/theme-provider

```typescript
// app/providers/theme-provider.tsx
export function ThemeProvider({ children }: { children: ReactNode }): JSX.Element
```

### features/layout/ui/Header

```typescript
export function Header(): JSX.Element
```

### features/layout/ui/DashboardHeader

```typescript
interface DashboardHeaderProps {
  onOpenNotification?: () => void
  onOpenSettings?: () => void
}

export function DashboardHeader(props: DashboardHeaderProps): JSX.Element
```

### features/settings/ui/SettingsModal

```typescript
interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SettingsModal(props: SettingsModalProps): JSX.Element
```

### features/notification-settings/ui/NotificationModal

```typescript
interface NotificationModalProps {
  isOpen: boolean
  onClose: () => void
}

export function NotificationModal(props: NotificationModalProps): JSX.Element
```

### features/notification-settings/ui/components/TimeControlSection

```typescript
interface TimeControlSectionProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  disabled?: boolean
}

export function TimeControlSection(props: TimeControlSectionProps): JSX.Element
```

### shared/ui/theme-toggle-switch

```typescript
interface ThemeToggleSwitchProps {
  checked: boolean
  onChange: (isDark: boolean) => void
}

export function ThemeToggleSwitch(props: ThemeToggleSwitchProps): JSX.Element
```

### shared/hooks/use-modal

```typescript
interface UseModalReturn {
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
}

export function useModal(): UseModalReturn
```

### features/notification-settings/model/use-notification-store

```typescript
interface NotificationStore {
  isAllow: boolean
  stretching: { isEnabled: boolean; interval: number }
  turtleNeck: { isEnabled: boolean; interval: number }
  setAllow: (allow: boolean) => void
  setStretching: (config: Partial<{ isEnabled: boolean; interval: number }>) => void
  setTurtleNeck: (config: Partial<{ isEnabled: boolean; interval: number }>) => void
}

export const useNotificationStore: UseBoundStore<StoreApi<NotificationStore>>
```

## Tauri 플러그인 API 계약

### tauri-plugin-autostart

```typescript
// @tauri-apps/plugin-autostart
export function enable(): Promise<void>
export function disable(): Promise<void>
export function isEnabled(): Promise<boolean>
```

### tauri-plugin-autostart (Rust)

```rust
// Cargo.toml: tauri-plugin-autostart = "2"
// src-tauri/src/lib.rs:
// .plugin(tauri_plugin_autostart::init(MacosLauncher::LaunchAgent, None))
```

### Capabilities

```json
{
  "permissions": ["autostart:default"]
}
```

## 호환성 규칙

- 레거시 컴포넌트의 Props 인터페이스와 동일한 필드명, 타입 유지
- Tauri 플러그인 API는 공식 문서 기반으로 사용
- useModal은 레거시와 동일한 인터페이스 (isOpen, open, close, toggle)
- ThemeToggleSwitch는 레거시와 동일한 Props (checked, onChange)
