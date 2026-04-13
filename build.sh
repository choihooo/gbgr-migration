#!/bin/sh
set -e  # 에러 발생 시 즉시 종료

# 스크립트가 있는 디렉토리의 상위 디렉토리로 이동
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR/.."

# output 디렉토리 생성 (이미 존재해도 에러 없음)
mkdir -p output

# 현재 디렉토리의 모든 내용을 output으로 복사
# 숨김 파일 포함, .git과 node_modules는 제외
for item in .* *; do
  # 스킵할 항목들
  case "$item" in
    '.' | '..' | '.git' | 'node_modules' | 'output')
      continue
      ;;
  esac
  
  # 파일/디렉토리가 존재하는지 확인 후 복사
  [ -e "$item" ] && cp -R "$item" output/
done

# zighang-zighang-frontend 디렉토리로 복사 (존재하는 경우에만)
if [ -d "gubugionandon-FE" ]; then
  cp -R output/* gubugionandon-FE/ 2>/dev/null || true
fi