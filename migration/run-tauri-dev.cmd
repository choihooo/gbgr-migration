@echo off
setlocal

set "VSDEV_CMD="

for %%I in (
  "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\Common7\Tools\VsDevCmd.bat"
  "C:\Program Files\Microsoft Visual Studio\2022\Community\Common7\Tools\VsDevCmd.bat"
  "C:\Program Files\Microsoft Visual Studio\2022\Professional\Common7\Tools\VsDevCmd.bat"
  "C:\Program Files\Microsoft Visual Studio\2022\Enterprise\Common7\Tools\VsDevCmd.bat"
) do (
  if exist %%~I (
    set "VSDEV_CMD=%%~I"
    goto load_vs_env
  )
)

echo [ERROR] Visual Studio Developer Command Prompt를 찾지 못했습니다.
exit /b 1

:load_vs_env
call "%VSDEV_CMD%" -arch=x64 -host_arch=x64
if errorlevel 1 (
  echo [ERROR] Visual Studio Build Tools 환경을 불러오지 못했습니다.
  exit /b 1
)

set "PATH=%USERPROFILE%\.cargo\bin;%PATH%"

cd /d "%~dp0"
bun run tauri dev

