# Tauri 프로덕션 릴리즈 절차

작성일: 2026-04-26  
대상: `migration/` Tauri + React 앱

## 릴리즈 전 품질 게이트

아래 명령은 `migration/` 디렉터리에서 실행한다.

```bash
bun run lint:check
bun run typecheck
bun run test
bun run build
bun run tauri:build
```

Rust 단독 검증은 `migration/src-tauri/`에서 실행한다.

```bash
cargo check
```

2026-04-26 기준 위 명령은 모두 통과했다. `bun run test`에서는 `--localstorage-file` 경고가 출력되지만 테스트 실패로 이어지지 않는다.

## 릴리즈 산출물

`bun run tauri:build` 성공 후 산출물 위치는 다음과 같다.

| 산출물 | 경로 | 용도 |
| --- | --- | --- |
| macOS 앱 번들 | `migration/src-tauri/target/release/bundle/macos/GBGR.app` | 로컬 실행, 서명/노타라이즈 검증 |
| macOS DMG | `migration/src-tauri/target/release/bundle/dmg/GBGR_0.1.0_aarch64.dmg` | 사용자 배포 |
| 실행 바이너리 | `migration/src-tauri/target/release/gbgr-app` | 디버깅, 프로세스 확인 |

DMG 파일명에는 `tauri.conf.json`의 `version`과 빌드 대상 아키텍처가 반영된다.

## 버전 bump 기준

릴리즈 버전은 아래 세 파일을 같은 값으로 맞춘다.

- `migration/package.json`
- `migration/src-tauri/tauri.conf.json`
- `migration/src-tauri/Cargo.toml`

버전 규칙은 SemVer를 따른다.

- `patch`: UI/동작 회귀 수정, 릴리즈 절차 보완, 작은 안정화
- `minor`: 새 사용자 기능, 새 패널, 새 데스크톱 기능
- `major`: 저장소/API 계약, 인증 흐름, 배포 호환성을 깨는 변경

## 업데이트 설정

현재 앱은 설정 모달에서 업데이트 확인/설치를 호출할 수 있지만, 프로덕션 업데이트 채널은 아직 확정되지 않았다.

릴리즈 전에 결정해야 할 항목:

- updater 서명 키 생성 및 보관 위치
- `VITE_UPDATER_PUBLIC_KEY` 주입 방식
- `VITE_UPDATER_ENDPOINTS` 배포 위치
- 업데이트 메타데이터 업로드 위치
- 개발/스테이징/프로덕션 endpoint 분리 여부

업데이트 키와 endpoint가 확정되기 전까지는 앱 내부 업데이트 버튼이 “업데이트 서버 미설정” 상태를 반환하는 것이 정상이다.

## 업로드 절차

1. 품질 게이트를 모두 통과시킨다.
2. `GBGR.app`을 실행해 핵심 화면과 자세 엔진 smoke 검증을 수행한다.
3. `GBGR_0.1.0_aarch64.dmg`를 마운트해 앱 실행, sidecar 실행 파일 존재, 카메라 권한 흐름을 확인한다.
4. macOS Developer ID 서명과 notarization을 적용한다.
5. 서명/노타라이즈 완료 후 DMG를 배포 채널에 업로드한다.
6. updater를 사용하는 릴리즈라면 업데이트 메타데이터와 서명 파일을 같은 릴리즈에 업로드한다.

## 롤백 절차

프로덕션 릴리즈 후 차단 회귀가 발견되면 다음 순서로 처리한다.

1. 배포 채널에서 신규 DMG 다운로드 링크를 이전 안정 버전으로 되돌린다.
2. updater metadata endpoint가 새 버전을 가리키고 있다면 이전 안정 버전으로 되돌리거나 metadata를 비활성화한다.
3. 문제가 된 버전의 Git 태그, 커밋, 산출물 경로, 실패 증상을 기록한다.
4. 핫픽스 브랜치를 만들어 `patch` 버전을 올린다.
5. 품질 게이트와 패키징 검증을 다시 통과한 뒤 새 DMG를 배포한다.

## 남은 수동 검증

릴리즈 후보마다 아래 항목은 실제 패키징 앱에서 확인한다.

- 인증, 온보딩, 보정, 메인, 위젯 핵심 플로우
- CSP 적용 후 이미지, 비디오, Tauri IPC, API 호출 동작
- 카메라 권한 허용/거부 후 복구 흐름
- 알림 권한 허용/거부/이미 허용 상태
- 자동 실행 토글
- deep link `gbgr://` 실행
- 앱 종료 후 `gbgr-app` 및 posture sidecar 잔여 프로세스 없음
