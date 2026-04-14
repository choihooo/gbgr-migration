# UI Component Contracts: 004-shared-ui-components

**Created**: 2026-04-14

## 개요

이 프로젝트는 UI 컴포넌트 라이브러리이므로, 외부 API나 서비스 인터페이스가 아닌 **컴포넌트 공개 API(Props)**가 계약에 해당한다. 각 컴포넌트의 export 인터페이스가 곧 계약이다.

## Export 계약

### shared/ui/typography

```typescript
export function Typography(props: TypographyProps): JSX.Element
```

### shared/ui/loading-spinner

```typescript
export function LoadingSpinner(props: LoadingSpinnerProps): JSX.Element
```

### shared/ui/modal

```typescript
export function Modal(props: ModalProps): JSX.Element
```

### shared/ui/toggle-switch

```typescript
export const ToggleSwitch: React.ForwardRefExoticComponent<ToggleSwitchProps>
export const NotificationToggleSwitch: React.ForwardRefExoticComponent<NotificationToggleSwitchProps>
```

### shared/ui/timer

```typescript
export const Timer: React.FC<TimerProps>
```

### shared/ui/panel-header

```typescript
export const PanelHeader: React.ForwardRefExoticComponent<PanelHeaderProps>
```

### shared/ui/notification-message

```typescript
export function NotificateMessage(props: NotificateMessageProps): JSX.Element
```

### shared/lib/cn

```typescript
export function cn(...inputs: ClassValue[]): string
```

## 호환성 규칙

- 레거시 컴포넌트의 Props 인터페이스와 동일한 필드명, 타입 유지
- `forwardRef` 패턴은 레거시에서 사용한 컴포넌트에만 적용 (ToggleSwitch, NotificationToggleSwitch, PanelHeader)
- 새로운 선택적 prop 추가은 허용하되, 기존 prop의 의미 변경은 금지
