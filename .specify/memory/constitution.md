<!--
Sync Impact Report
- Version change: initial template -> 1.0.0
- Modified principles:
  - template principle 1 -> 프로세스 경계 우선
  - template principle 2 -> 계약된 브리지 우선
  - template principle 3 -> FSD 의존성 보존
  - template principle 4 -> 상태 책임 단일화
  - template principle 5 -> 실패 우선 품질 게이트
  - 신규 원칙 추가 -> 관측 가능한 릴리즈
- Added sections:
  - 전문
  - 강제 규칙
  - PR 체크리스트
  - 헌법 적용 예시
- Removed sections:
  - 없음
- Templates requiring updates:
  - ✅ .specify/templates/plan-template.md
  - ✅ .specify/templates/spec-template.md
  - ✅ .specify/templates/tasks-template.md
  - ✅ README.md
  - ⚠ pending: .specify/templates/commands/*.md (현재 저장소에 디렉터리 없음)
- Follow-up TODOs:
  - 없음
-->
# GBGR Constitution

## 전문

GBGR(거부기린)은 실시간 자세 인식과 데스크톱 시스템 통합을 동시에 다루는
Electron 앱이다. 이 프로젝트는 빠른 실험을 허용하되, renderer 보안 회귀,
preload API 오염, FSD 침식, 상태 책임 혼선, 릴리즈 실패를 허용하지 않는다.

이 헌법은 선언문이 아니라 PR, 리뷰, CI, 태그 릴리즈에서 즉시 집행되는 기준이다.
모든 변경은 아래 원칙과 강제 규칙을 동시에 만족해야 하며, 예외는 승인권자,
기록 방식, 만료일이 없는 한 무효다.

## Core Principles

| 원칙 | Why | Rule | Check |
| --- | --- | --- | --- |
| 1. 프로세스 경계 우선 | Electron 앱의 가장 큰 회귀는 renderer가 시스템 권한을 직접 획득하는 순간 발생한다. | renderer는 Node.js, Electron API, 파일 시스템, OS 권한 API에 직접 접근하지 않는다. 시스템 기능은 preload의 `contextBridge` 계약을 통해서만 노출한다. | 리뷰에서 renderer import 그래프와 전역 사용을 확인한다. CI에서 `electron`, `node:` 관련 import가 `src/renderer`에 존재하면 실패시킨다. |
| 2. 계약된 브리지 우선 | preload는 편의 계층이 아니라 renderer와 main 사이의 보안 경계다. 계약이 느슨하면 IPC와 배포가 동시에 불안정해진다. | preload 공개 API는 명시적 타입, 입력 검증, 반환 타입, 소유 모듈을 가진다. 계약 변경은 main/preload/renderer를 같은 PR에서 함께 갱신한다. | PR에 계약 변경 여부를 체크하고, typecheck와 preload 타입 생성 결과를 검증한다. |
| 3. FSD 의존성 보존 | feature가 shared를 침범하거나 하위 레이어가 상위를 참조하면 UI 속도는 빨라져도 구조는 빠르게 붕괴한다. | renderer는 `app > pages > widgets > features > entities > shared` 의존성 방향을 지킨다. `shared`는 범용 UI, util, config만 가진다. | 리뷰에서 import 경로를 확인하고, 구조 위반은 merge를 차단한다. 신규 공용 모듈은 재사용 근거 2곳 이상을 PR에 남긴다. |
| 4. 상태 책임 단일화 | 로컬 상태와 서버 상태를 혼용하면 세션, 대시보드, 위젯 동기화가 깨지고 디버깅 비용이 급증한다. | Zustand는 UI/디바이스/세션 진행 중 상태만 관리하고, TanStack Query는 서버 데이터 조회·캐시·동기화만 담당한다. 동일 데이터의 이중 소유를 금지한다. | 스토어와 쿼리 훅의 책임을 PR 설명에서 분리해 기록한다. 동일 데이터가 store와 query에 동시에 저장되면 반려한다. |
| 5. 실패 우선 품질 게이트 | 자세 판정, 세션, 알림은 작은 결함도 사용자 경험과 신뢰를 즉시 훼손한다. | Biome check, TypeScript typecheck, 빌드 검증 중 하나라도 실패하면 merge하지 않는다. 핵심 로직 변경은 회귀 검증 없이 배포하지 않는다. | CI 필수 체크를 브랜치 보호 규칙으로 연결한다. 회귀 테스트 또는 수동 검증 로그가 없는 PR은 승인하지 않는다. |
| 6. 관측 가능한 릴리즈 | 실시간 앱은 실패 원인을 남기지 않으면 hotfix와 롤백이 반복된다. | 모든 릴리즈는 태그, 변경 이력, 업데이트 메타데이터, 핵심 이벤트 로그 기준을 갖춘다. 장애 시점에는 재현보다 먼저 로그와 버전을 확보한다. | 릴리즈 PR과 태그에서 버전, 노트, 배포 산출물, 관측성 체크리스트를 확인한다. 운영 이슈는 로그 근거 없이 종료하지 않는다. |

## 강제 규칙

| ID | Why | Rule | Check |
| --- | --- | --- | --- |
| NR-01 Renderer 시스템 접근 금지 | renderer가 직접 권한을 가지면 XSS와 로컬 권한 상승이 바로 앱 취약점이 된다. | `src/renderer`에서는 `electron`, `node:*`, `fs`, `path`, `os`, `child_process`를 import하지 않는다. 시스템 기능 호출은 `window.electronAPI`, `window.bugi`, `window.nodeCrypto`처럼 preload가 노출한 API만 사용한다. | `rg "from 'electron'|from \\\"electron\\\"|node:|from 'fs'|from \\\"fs\\\"" src/renderer` 결과가 비어 있어야 한다. 리뷰에서 direct global access도 함께 확인한다. |
| NR-02 Preload API 계약 버전 관리 | preload 계약 변경은 런타임 오류와 보안 회귀를 동시에 만든다. | preload 공개 API는 타입 정의, 채널명, 입력/출력 스키마, 소유자를 PR 본문에 기록한다. breaking change는 minor 기능 PR로 숨기지 않고 별도 ADR 또는 명시적 마이그레이션으로 처리한다. | `src/preload/src/index.ts`와 renderer 호출부, main 핸들러가 동일 PR에 포함되어야 한다. typecheck가 세 프로세스 모두 통과해야 한다. |
| NR-03 IPC 채널 네이밍 규약 | 채널이 임의로 늘어나면 권한 경계와 책임 추적이 불가능해진다. | IPC 채널은 `domain:action` 또는 `domain:resource:action` 형식만 사용한다. 예: `widget:open`, `analytics:logEvent`, `updater:checkForUpdates`. 범용 채널명 `message`, `send`, `data`를 금지한다. | 신규 채널이 포함된 PR은 채널 목록과 소유 모듈을 설명해야 한다. 리뷰에서 네이밍과 도메인 소유를 확인한다. |
| NR-04 IPC 입력 검증과 최소 권한 | main 핸들러는 외부 입력 경계이므로 검증이 없으면 잘못된 상태와 보안 이슈가 직접 발생한다. | `ipcMain.handle`로 받는 모든 payload는 런타임 검증을 거친다. 핸들러는 필요한 인자만 받고, 파일 경로·URL·실행 명령·권한 변경은 allowlist 없이 허용하지 않는다. | 신규 또는 수정 핸들러는 검증 코드와 실패 경로를 포함해야 한다. 리뷰에서 검증 누락 시 반려한다. |
| NR-05 Main 프로세스 부작용 집중 | 알림, 업데이트, 파일 쓰기, 분석 전송이 흩어지면 디버깅과 권한 관리가 불가능해진다. | OS 부작용은 main에서만 수행한다. preload는 전달만 담당하고 renderer는 요청만 보낸다. renderer에서 Notification SDK, 파일 쓰기 우회 로직을 추가하지 않는다. | 변경 파일이 renderer에만 있고 실제 OS 부작용을 수행하면 반려한다. 알림·업데이트·로그·analytics는 main 소유 모듈을 통해서만 수행되어야 한다. |
| NR-06 FSD 상향 참조 금지 | 하위 레이어가 상위 레이어를 참조하면 재사용성과 변경 격리가 무너진다. | `shared`는 어떤 상위 레이어도 import하지 않는다. `entities`는 `features/widgets/pages/app`를 import하지 않는다. `features`는 `widgets/pages/app`를 import하지 않는다. | import 그래프 리뷰에서 상향 참조 발견 시 즉시 반려한다. 필요한 경우 코드 이동 또는 public API 재구성으로 해결한다. |
| NR-07 Shared 남용 금지 | `shared`가 쓰레기통이 되면 FSD는 명목상 구조만 남는다. | `shared`에는 범용 UI, 순수 유틸, 설정, 타입만 둔다. 도메인 용어, 세션 흐름, 자세 판정 정책, 알림 정책은 `entities` 또는 `features`로 이동한다. | `shared`에 도메인별 비즈니스 규칙이 추가되면 PR 본문에 배치 근거를 적게 하고, 근거가 없으면 반려한다. |
| NR-08 Zustand 책임 제한 | store가 서버 캐시와 계산 결과까지 소유하면 동기화 버그가 반복된다. | Zustand store는 카메라, 위젯 표시 상태, 현재 자세 상태, 로컬 설정처럼 즉시 반응하는 클라이언트 상태만 가진다. 서버 응답 원본, 장기 리포트, 대시보드 집계는 저장하지 않는다. | store 필드 추가 PR은 필드의 만료 시점과 소유 이유를 설명해야 한다. 서버 데이터 원본이 store에 들어가면 반려한다. |
| NR-09 TanStack Query 책임 고정 | 세션/통계 API는 캐시 정책이 핵심이므로 Query를 우회하면 일관성이 깨진다. | API 조회와 변이는 TanStack Query 훅으로 감싼다. 성공 후 무효화 대상 query key를 PR에 명시한다. renderer 컴포넌트 내부에서 ad-hoc fetch를 금지한다. | 신규 API 연동은 `entities/*/api` 또는 적절한 레이어의 query/mutation 훅을 포함해야 한다. invalidation 누락 시 수정 요청한다. |
| NR-10 핵심 로직 회귀 검증 의무 | 자세 판정, 세션, 알림은 작은 임계값 변화도 사용자 체감 오작동으로 이어진다. | 다음 영역을 변경하면 회귀 검증을 필수로 수행한다: `PostureClassifier`, `ScoreProcessor`, calibration 검증, 세션 생성/중지/재개, 알림 스케줄러, 위젯 동기화. 자동 테스트가 없으면 수동 검증 시나리오와 결과를 PR에 남긴다. | PR에 변경 영역별 검증 로그가 있어야 한다. 최소 기준은 입력 조건, 기대 결과, 실제 결과, 캡처 또는 로그 첨부다. |
| NR-11 CI 게이트와 경고 정책 | 경고를 방치하면 릴리즈 직전에 실패가 집중된다. | `pnpm lint:check`, `pnpm typecheck`, `pnpm build` 중 하나라도 실패하면 merge를 금지한다. 새로운 Biome/TypeScript 경고는 기술 부채 등록 없이 남기지 않는다. `@ts-ignore`는 이슈 번호와 제거 기한 없이 추가하지 않는다. | 브랜치 보호 규칙에서 필수 체크를 강제한다. PR 리뷰는 신규 경고, suppress 주석, 임시 우회 코드 존재 여부를 확인한다. |
| NR-12 Analytics 이벤트 명세 의무 | 퍼널과 장애 복기는 이벤트 명세가 없으면 해석이 불가능하다. | 신규 analytics 이벤트는 이름, 발생 시점, 필수 파라미터, 개인정보 제외 여부를 `shared/lib/analytics/schema` 수준의 명세와 함께 추가한다. renderer는 main의 analytics IPC만 사용한다. | 이벤트 추가 PR은 스키마와 호출 지점을 함께 수정해야 한다. Debug 모드 또는 로그 캡처로 전송 결과를 확인한다. |
| NR-13 장애 로그 기준 고정 | 운영 장애에서 로그가 없으면 hotfix가 감으로 진행된다. | 실패 처리에는 최소한 `appVersion`, `window type`, `channel or feature`, `error message`, `user-visible impact`가 남아야 한다. 복구 가능한 오류는 사용자 메시지와 개발자 로그를 분리한다. | 장애 대응 PR과 버그 수정 PR은 어떤 로그가 남는지 설명해야 한다. 로그 필드가 누락되면 승인하지 않는다. |
| NR-14 문서화 최소 요건 | 아키텍처와 배포 규칙은 코드만으로 전달되지 않는다. | 다음 변경은 문서 갱신이 필수다: 프로세스 경계 변경, preload 계약 변경, 새 IPC 도메인, FSD 구조 재배치, 릴리즈 절차 변경. 아키텍처 판단은 ADR, 사용자 영향은 릴리즈 노트, 운영 변경은 changelog에 남긴다. | PR 본문에 변경 문서 링크를 포함해야 한다. 문서 누락 시 승인자는 보완 전까지 승인을 보류한다. |
| NR-15 릴리즈/롤백/hotfix 절차 고정 | 태그 릴리즈가 불완전하면 auto-update와 플랫폼 배포가 동시에 깨진다. | 정식 릴리즈는 `vX.Y.Z` 태그로만 수행한다. mac/win 빌드와 업데이트 메타데이터 업로드가 모두 성공해야 완료로 본다. 배포 후 치명 결함이 1건이라도 재현되면 마지막 안정 태그로 롤백을 시작한다. hotfix는 `release/x.y.z` 또는 별도 hotfix 브랜치에서 수정 후 `vX.Y.Z+1`에 해당하는 패치 태그로 배포한다. | 릴리즈 체크리스트에 태그, 산출물, 메타데이터, 설치 검증, 롤백 기준 충족 여부를 기록한다. 태그 없는 배포와 수동 파일 교체는 금지한다. |

## Governance

### 개정 규칙

- 헌법 개정은 PR로만 수행한다.
- 원칙 추가, 제거, 의미 재정의는 MINOR 이상 버전을 올린다.
- 규칙의 집행 기준을 바꾸는 후방 비호환 변경은 MAJOR 버전을 올린다.
- 오탈자, 표현 명확화, 예시 보강은 PATCH 버전을 올린다.
- 개정 PR에는 변경 이유, 영향 범위, 기존 규칙과의 차이, 필요한 템플릿 동기화 결과를 반드시 포함한다.

### 예외 규칙

- 보안/프로세스 경계/IPC 예외 승인권자: Tech Lead 1인 + Main/Preload Owner 1인.
- FSD/상태관리/품질/릴리즈 예외 승인권자: Tech Lead 1인 + 해당 영역 Owner 1인.
- 예외 기록 방식: PR 본문과 `docs/adr/ADR-XXXX-<slug>.md`에 같은 내용을 남긴다.
- 예외 기록 필수 항목: 위반 조항, 필요한 이유, 대안 검토, 완화 조치, 담당자, 만료일.
- 예외 만료일은 승인일 기준 30일 이내로 설정한다. 만료일이 지난 예외는 자동 무효다.

### 위반 처리

- CI 실패, 규칙 누락, 예외 기록 누락 상태의 PR은 merge하지 않는다.
- 리뷰어는 위반 조항 ID를 명시해 반려한다.
- 릴리즈 후 발견된 위반은 다음 영업일 내에 회고 항목으로 등록하고, 재발 방지 액션을 owner와 기한과 함께 남긴다.

## PR 체크리스트

- [ ] renderer가 Node/Electron API를 직접 import하거나 호출하지 않았다.
- [ ] preload 계약 변경 시 main/preload/renderer와 타입 정의가 한 PR에 포함됐다.
- [ ] 신규 IPC 채널은 네이밍 규약과 입력 검증을 충족한다.
- [ ] FSD import 방향 위반과 `shared` 도메인 누수가 없다.
- [ ] Zustand와 TanStack Query의 상태 책임이 분리됐다.
- [ ] 자세 판정/세션/알림/위젯 동기화 변경 시 회귀 검증 결과를 첨부했다.
- [ ] `pnpm lint:check`, `pnpm typecheck`, `pnpm build` 결과가 모두 통과했다.
- [ ] analytics 이벤트 추가 또는 수정 시 스키마와 로그 확인 근거를 남겼다.
- [ ] 아키텍처 또는 운영 규칙 변경 시 ADR, changelog, 릴리즈 노트를 갱신했다.

## 헌법 적용 예시

| 사례 | 좋은 PR | 반려 PR |
| --- | --- | --- |
| 예시 1. 알림 기능 확장 | `notification:showStretchBreak` IPC를 추가하면서 preload 타입, main 검증, renderer 호출부, 수동 검증 로그를 한 PR에 포함한다. | renderer 컴포넌트에서 Web Notification 또는 Electron Notification을 직접 호출하고, main 변경 없이 UI만 추가한다. |
| 예시 2. 자세 판정 임계값 조정 | `PostureClassifier`와 `ScoreProcessor` 변경 후 기존 입력 샘플의 before/after 결과, 채터링 여부, 세션 종료 이벤트 영향까지 PR에 기록한다. | 임계값 숫자만 수정하고 회귀 검증 없이 "체감상 더 좋아 보임"만 남긴다. |
| 예시 3. 통계 API 추가 | Query 훅을 `entities/dashboard/api`에 추가하고 query key, invalidation 정책, analytics 이벤트 명세를 함께 등록한다. | 페이지 컴포넌트 안에서 직접 fetch를 호출하고 응답을 Zustand store에 영구 보관한다. |

**Version**: 1.0.0 | **Ratified**: 2026-03-27 | **Last Amended**: 2026-03-27
