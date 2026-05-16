#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const projectRoot = join(scriptDir, '..')
const repoRoot = join(projectRoot, '..')

const args = process.argv.slice(2)
const nextVersion = args.find(arg => !arg.startsWith('--'))
const shouldVerify = !args.includes('--no-verify')
const shouldCommit = args.includes('--commit')
const shouldTag = args.includes('--tag')

const semverPattern = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/

function fail(message) {
  console.error(message)
  process.exit(1)
}

function run(command, commandArgs, options = {}) {
  console.log(`> ${[command, ...commandArgs].join(' ')}`)
  execFileSync(command, commandArgs, {
    cwd: options.cwd ?? repoRoot,
    stdio: 'inherit',
    env: process.env,
  })
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

function writeJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`)
}

function replaceRequired(path, pattern, replacement) {
  const before = readFileSync(path, 'utf8')
  const after = before.replace(pattern, replacement)

  if (before === after) {
    fail(`${path} 파일에서 버전 문자열을 찾지 못했습니다.`)
  }

  writeFileSync(path, after)
}

function assertCleanEnough() {
  const output = execFileSync('git', ['status', '--porcelain'], {
    cwd: repoRoot,
    encoding: 'utf8',
  }).trim()

  if (output) {
    fail(
      [
        '작업 트리가 깨끗하지 않습니다. 릴리즈 버전 변경 전에 기존 변경사항을 먼저 정리하세요.',
        output,
        '',
        '예외적으로 진행해야 한다면 수동으로 파일을 수정하는 편이 안전합니다.',
      ].join('\n'),
    )
  }
}

if (!nextVersion) {
  fail(
    [
      '사용법: pnpm release:tauri <version> [--no-verify] [--commit] [--tag]',
      '',
      '예시:',
      '  pnpm release:tauri 0.1.2',
      '  pnpm release:tauri 0.1.2 --commit --tag',
    ].join('\n'),
  )
}

if (!semverPattern.test(nextVersion)) {
  fail(`버전은 semver 형식이어야 합니다. 입력값: ${nextVersion}`)
}

if (shouldCommit || shouldTag) {
  assertCleanEnough()
}

const packageJsonPath = join(projectRoot, 'package.json')
const tauriConfigPath = join(projectRoot, 'src-tauri', 'tauri.conf.json')
const cargoTomlPath = join(projectRoot, 'src-tauri', 'Cargo.toml')

const packageJson = readJson(packageJsonPath)
const currentVersion = packageJson.version

if (currentVersion === nextVersion) {
  fail(`이미 ${nextVersion} 버전입니다.`)
}

packageJson.version = nextVersion
writeJson(packageJsonPath, packageJson)

const tauriConfig = readJson(tauriConfigPath)
tauriConfig.version = nextVersion
writeJson(tauriConfigPath, tauriConfig)

replaceRequired(
  cargoTomlPath,
  /^version = "([^"]+)"$/m,
  `version = "${nextVersion}"`,
)

console.log(
  `Tauri 릴리즈 버전을 ${currentVersion} -> ${nextVersion}로 변경했습니다.`,
)

if (shouldVerify) {
  run('cargo', ['test'], { cwd: join(projectRoot, 'src-tauri') })
  run('pnpm', ['run', 'lint:check'], { cwd: projectRoot })
  run('pnpm', ['run', 'typecheck'], { cwd: projectRoot })
}

if (shouldCommit) {
  run('git', [
    'add',
    'migration/package.json',
    'migration/src-tauri/tauri.conf.json',
    'migration/src-tauri/Cargo.toml',
    'migration/src-tauri/Cargo.lock',
  ])
  run('git', ['commit', '-m', `chore: bump Tauri release to ${nextVersion}`])
}

if (shouldTag) {
  run('git', ['tag', `tauri-v${nextVersion}`])
}

console.log('')
console.log('다음 단계:')
console.log('  git diff --stat')
console.log('  git push origin master')
console.log(`  git push origin tauri-v${nextVersion}`)
