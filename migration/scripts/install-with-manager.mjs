import { spawn } from 'node:child_process'
import { existsSync, rmSync } from 'node:fs'
import { join } from 'node:path'

const manager = process.argv[2]

const INSTALLERS = {
  bun: {
    command: 'bun',
    args: ['install', '--force'],
    description: 'bun 개발 환경 설치',
  },
  'npm-ci': {
    command: 'npm',
    args: ['ci'],
    description: 'npm 릴리스 환경 설치',
  },
  'npm-install': {
    command: 'npm',
    args: ['install'],
    description: 'npm lockfile 동기화 설치',
  },
}

const installer = INSTALLERS[manager]

if (!installer) {
  console.error(
    '지원하지 않는 설치 모드입니다. bun | npm-ci | npm-install 중 하나를 사용하세요.',
  )
  process.exit(1)
}

const workspaceRoot = process.cwd()
const nodeModulesPath = join(workspaceRoot, 'node_modules')

if (existsSync(nodeModulesPath)) {
  console.log(`[install] 기존 node_modules 정리: ${nodeModulesPath}`)
  rmSync(nodeModulesPath, {
    recursive: true,
    force: true,
  })
}

console.log(`[install] ${installer.description} 시작`)

const child = spawn(installer.command, installer.args, {
  cwd: workspaceRoot,
  stdio: 'inherit',
  shell: true,
})

child.on('exit', code => {
  process.exit(code ?? 1)
})

child.on('error', error => {
  console.error(`[install] 설치 실행 실패: ${error.message}`)
  process.exit(1)
})
