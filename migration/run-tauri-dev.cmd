@echo off
setlocal

call "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\Common7\Tools\VsDevCmd.bat" -arch=x64 -host_arch=x64
if errorlevel 1 (
  echo [ERROR] Failed to load Visual Studio Build Tools environment.
  exit /b 1
)

set "PATH=%USERPROFILE%\.cargo\bin;%PATH%"

cd /d "%~dp0"
bun run tauri dev

