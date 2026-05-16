#!/usr/bin/env node

const includeIntelMacos =
  process.env.GITHUB_EVENT_NAME !== 'workflow_dispatch' ||
  process.env.INCLUDE_INTEL_MACOS !== 'false'

const include = [
  {
    platform: 'macos-latest',
    target: 'aarch64-apple-darwin',
    args: '--target aarch64-apple-darwin --config src-tauri/tauri.github-release.conf.json',
  },
  {
    platform: 'windows-latest',
    target: '',
    args: '--config src-tauri/tauri.github-release.conf.json',
  },
]

if (includeIntelMacos) {
  include.unshift({
    platform: 'macos-15-intel',
    target: 'x86_64-apple-darwin',
    args: '--target x86_64-apple-darwin --config src-tauri/tauri.github-release.conf.json',
  })
}

process.stdout.write(JSON.stringify({ include }))
