# Tauri 배포/업데이트 핸드오프

작성일: 2026-05-16  
대상 저장소: `/Users/choiho/coding/gbgr/gbgr-migration`  
현재 기준 릴리즈: `tauri-v0.1.2`

## 1. 현재 완료된 상태

- Tauri 릴리즈 workflow는 macOS Apple Silicon, macOS Intel, Windows 산출물을 생성한다.
- macOS는 Developer ID 서명과 notarization이 적용된다.
- Windows Authenticode 코드서명은 없다. Windows는 Tauri updater artifact 서명만 적용된다.
- GitHub repository가 public이면 앱에서 updater metadata를 읽을 수 있다.
- 현재 updater endpoint는 아래 URL이다.

```text
https://github.com/choihooo/gbgr-migration/releases/latest/download/latest.json
```

## 2. 검증된 릴리즈

`tauri-v0.1.2` 배포가 성공했다.

- GitHub Actions: `https://github.com/choihooo/gbgr-migration/actions/runs/25957719851`
- Release: `https://github.com/choihooo/gbgr-migration/releases/tag/tauri-v0.1.2`
- `latest.json`의 `version`은 `0.1.2`다.
- 전체 배포 시간은 약 11분 39초였다.

## 3. 다음 릴리즈 절차

버전은 직접 여러 파일을 수정하지 말고 스크립트로 올린다.

```bash
cd /Users/choiho/coding/gbgr/gbgr-migration/migration
pnpm release:tauri 0.1.3 --commit --tag
git push origin master
git push origin tauri-v0.1.3
```

스크립트가 변경하는 파일:

- `/Users/choiho/coding/gbgr/gbgr-migration/migration/package.json`
- `/Users/choiho/coding/gbgr/gbgr-migration/migration/src-tauri/tauri.conf.json`
- `/Users/choiho/coding/gbgr/gbgr-migration/migration/src-tauri/Cargo.toml`
- `/Users/choiho/coding/gbgr/gbgr-migration/migration/src-tauri/Cargo.lock`

## 4. 업데이트 검증 방법

서버 metadata 확인:

```bash
curl -L https://github.com/choihooo/gbgr-migration/releases/latest/download/latest.json
```

설치된 앱 버전 확인:

```bash
plutil -p /Applications/GBGR.app/Contents/Info.plist | rg "CFBundleShortVersionString|CFBundleVersion"
```

업데이트 테스트는 반드시 이전 버전 설치본에서 수행한다. 예를 들어 `0.1.2`로 업데이트를 확인하려면 설치된 앱이 `0.1.1`이어야 한다.

## 5. 자동 재시작 변경

업데이트 설치 성공 후 macOS/Linux에서는 Rust command가 `app.request_restart()`를 호출한다. 따라서 사용자가 설정 화면에서 업데이트 설치를 누르면, 설치 완료 후 앱이 자동으로 종료되고 다시 실행되어야 한다.

Windows는 installer 동작 특성이 달라 `exits_on_install` 경로를 유지한다.

관련 파일:

- `/Users/choiho/coding/gbgr/gbgr-migration/migration/src-tauri/src/app_updates.rs`
- `/Users/choiho/coding/gbgr/gbgr-migration/migration/src/features/settings/ui/SettingsModal.tsx`
- `/Users/choiho/coding/gbgr/gbgr-migration/migration/src/shared/lib/update-api.ts`
- `/Users/choiho/coding/gbgr/gbgr-migration/migration/src/shared/lib/i18n/resources.ts`

## 6. 남은 주의점

- repository가 private이면 updater endpoint가 비로그인 요청에서 `404`가 되어 앱 업데이트가 동작하지 않는다.
- `tauri.conf.json` 기본 설정에는 updater endpoint가 비어 있다. GitHub Actions 릴리즈 빌드에서 `tauri.github-release.conf.json`을 생성해 endpoint와 public key를 주입한다.
- 로컬 `pnpm run tauri:build` 산출물은 release updater 설정이 없을 수 있으므로 업데이트 테스트에는 GitHub Release에서 받은 설치본을 사용한다.
- 다음 릴리즈 `0.1.3`에는 자동 재시작 변경이 포함되어야 실제 설치본에서 검증할 수 있다.
