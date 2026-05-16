#!/usr/bin/env node

import { spawnSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const migrationDir = resolve(scriptDir, '..')
const packageManager = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'

function formatDuration(milliseconds) {
  const seconds = Math.round(milliseconds / 1000)
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60

  return `${minutes}m ${remainingSeconds}s`
}

function runTimed(label, command, args) {
  const start = Date.now()
  console.log(`::group::${label}`)
  console.log(`[release-timing] ${label} 시작`)
  console.log(`> ${[command, ...args].join(' ')}`)

  const result = spawnSync(command, args, {
    cwd: migrationDir,
    stdio: 'inherit',
    env: process.env,
  })

  const duration = Date.now() - start
  console.log(`[release-timing] ${label} 종료: ${formatDuration(duration)}`)
  console.log('::endgroup::')

  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

const totalStart = Date.now()
runTimed('Python sidecar 준비', packageManager, [
  'run',
  'build:posture-sidecar',
])
runTimed('frontend build', packageManager, ['run', 'build'])
console.log(
  `[release-timing] release frontend 준비 총 소요: ${formatDuration(
    Date.now() - totalStart,
  )}`,
)
