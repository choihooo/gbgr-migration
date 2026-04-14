# Data Model: 004-shared-ui-components

**Created**: 2026-04-14

## 컴포넌트 Props 모델

### TypographyProps

| 필드 | 타입 | 필수 | 기본값 | 설명 |
|------|------|------|--------|------|
| variant | TypographyVariant | 아니오 | 'body-md-regular' | 텍스트 스타일 변형 |
| children | ReactNode | 예 | - | 텍스트 콘텐츠 |
| className | string | 아니오 | - | 추가 CSS 클래스 |
| as | ElementType | 아니오 | 'p' | 렌더링할 HTML 태그 |

**TypographyVariant** (유니온 타입, 20가지):
```
title-4xl-bold | title-4xl-semibold
headline-3xl-regular | headline-3xl-medium | headline-3xl-semibold
headline-2xl-regular | headline-2xl-medium | headline-2xl-semibold
body-xl-regular | body-xl-medium | body-xl-semibold
body-lg-regular | body-lg-medium | body-lg-semibold
body-md-regular | body-md-medium | body-md-semibold
caption-sm-regular | caption-sm-medium | caption-sm-semibold
caption-2xs-regular | caption-2xs-medium
```

### LoadingSpinnerProps

| 필드 | 타입 | 필수 | 기본값 | 설명 |
|------|------|------|--------|------|
| className | string | 아니오 | - | 추가 CSS 클래스 |
| size | 'sm' \| 'md' \| 'lg' | 아니오 | 'md' | 스피너 크기 |
| text | string | 아니오 | - | 로딩 텍스트 |

### ModalProps

| 필드 | 타입 | 필수 | 기본값 | 설명 |
|------|------|------|--------|------|
| isOpen | boolean | 예 | - | 모달 열림 상태 |
| onClose | () => void | 예 | - | 모달 닫기 콜백 |
| children | ReactNode | 예 | - | 모달 콘텐츠 |
| className | string | 아니오 | - | 콘텐츠 영역 추가 클래스 |
| closeOnOverlayClick | boolean | 아니오 | true | 오버레이 클릭으로 닫기 |
| closeOnEsc | boolean | 아니오 | true | ESC 키로 닫기 |

### ToggleSwitchProps

| 필드 | 타입 | 필수 | 기본값 | 설명 |
|------|------|------|--------|------|
| checked | boolean | 예 | - | 토글 상태 |
| onChange | (checked: boolean) => void | 예 | - | 상태 변경 콜백 |
| uncheckedLabel | string | 아니오 | - | OFF 상태 레이블 |
| checkedLabel | string | 아니오 | - | ON 상태 레이블 |

### NotificationToggleSwitchProps

| 필드 | 타입 | 필수 | 기본값 | 설명 |
|------|------|------|--------|------|
| checked | boolean | 예 | - | 토글 상태 |
| onChange | (checked: boolean) => void | 예 | - | 상태 변경 콜백 |
| isDisabled | boolean | 아니오 | false | 비활성화 여부 |

### TimerProps

| 필드 | 타입 | 필수 | 기본값 | 설명 |
|------|------|------|--------|------|
| value | 0 \| 1 \| 2 \| 3 \| 4 \| 5 | 예 | - | 카운트다운 표시 값 |
| size | number | 아니오 | 64 | SVG 크기(px) |
| on | string | 아니오 | CSS 변수 | 활성 세그먼트 색상 |
| off | string | 아니오 | CSS 변수 | 비활성 세그먼트 색상 |

### PanelHeaderProps

| 필드 | 타입 | 필수 | 기본값 | 설명 |
|------|------|------|--------|------|
| children | ReactNode | 아니오 | - | 헤더 콘텐츠 |

### NotificateMessageProps

| 필드 | 타입 | 필수 | 기본값 | 설명 |
|------|------|------|--------|------|
| message | ReactNode | 예 | - | 알림 메시지 내용 |
| step | number | 예 | - | 단계 번호 |
| errorMessage | ReactNode | 아니오 | - | 에러 메시지 |
| variant | 'default' \| 'success' | 아니오 | 'default' | 알림 유형 |

## 컴포넌트 간 의존성

```
cn (shared/lib/cn)
├── Typography
├── LoadingSpinner
├── Modal (간접 - 내부에서만 사용)
├── ToggleSwitch
├── NotificationToggleSwitch
└── NotificateMessage (variantClasses에 사용)

SVG Icons (shared/ui/icons/)
├── PanelHeader → InfoIcon
└── NotificateMessage → SuccessIcon, ErrorIcon

Assets
└── LoadingSpinner → Loading.mov (video asset)
```

## 상태 전이

### ToggleSwitch
```
OFF ──(click/onChange(true))──→ ON
ON ──(click/onChange(false))──→ OFF
```

### Modal
```
closed ──(isOpen=true)──→ open ──(onClose/ESC/overlay click)──→ closed
```
