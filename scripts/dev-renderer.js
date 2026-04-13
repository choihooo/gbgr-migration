#!/usr/bin/env node

const { spawn } = require('node:child_process')
const path = require('node:path')

// Start renderer dev server
const rendererProcess = spawn('npm', ['run', 'dev'], {
  cwd: path.join(__dirname, '../layers/renderer'),
  stdio: 'inherit',
  shell: true,
})

rendererProcess.on('error', error => {
  console.error('Failed to start renderer dev server:', error)
  process.exit(1)
})

rendererProcess.on('exit', code => {
  console.log(`Renderer dev server exited with code ${code}`)
  process.exit(code)
})

// Handle process termination
process.on('SIGINT', () => {
  rendererProcess.kill('SIGINT')
})

process.on('SIGTERM', () => {
  rendererProcess.kill('SIGTERM')
})
