#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { spawn } = require('child_process')

const { packageJSONRewrite, packageLockJSONRewrite, findCmd } = require('../src')

let githubPatToken = process.env['GITHUB_PAT']

let processName = path.basename(process.argv[1])
let processArgs = process.argv.slice(2)
let processPath = process.env['PACKAGE_JSON_CMD'] || findCmd(process.env['PATH'], processName)
let processEnv = { ...process.env, PACKAGE_JSON_CMD: processPath }

if (process.argv[1] === __filename) {
  console.error('Need to symlink this file')
  process.exit(255)
}

if (
  githubPatToken &&
  fs.existsSync('package.json') &&
  !fs.existsSync('package.json.orig') &&
  !fs.existsSync('package-lock.json.orig')
) {
  try {
    console.log('Rewrite github git+ssh references and inject personal access token')
    const packageJSON = JSON.parse(fs.readFileSync('package.json'))
    if (packageJSONRewrite(packageJSON, githubPatToken)) {
      replace('package.json', JSON.stringify(packageJSON, null, 2))
    }
    if (fs.existsSync('package-lock.json')) {
      const packageLockJSON = JSON.parse(fs.readFileSync('package-lock.json'))
      if (packageLockJSONRewrite(packageLockJSON, githubPatToken)) {
        replace('package-lock.json', JSON.stringify(packageLockJSON, null, 2))
      }
    }

    runProcess(processPath, processArgs, { env: processEnv }).then(res => {
      console.log(`${processName} exit code: ${res.code}, signal: ${res.signal}`)
      restore()
      process.exit(res.code)
    })
  } catch (e) {
    console.error(e)
    restore()
    process.exit(255)
  }
} else {
  runProcess(processPath, processArgs, { env: processEnv }).then(res => {
    console.log(`${processName} exit code: ${res.code}, signal: ${res.signal}`)
    restore()
    process.exit(res.code)
  })
}

function runProcess(path, processArgs, options = {}) {
  const cmd = spawn(path, processArgs, { stdio: 'inherit', ...options })
  return new Promise(resolve => {
    cmd.on('exit', (code, signal) => {
      resolve({ code, signal })
    })
  })
}

function replace(filename, data) {
  fs.writeFileSync(`${filename}.new`, data)
  fs.renameSync(filename, `${filename}.orig`)
  fs.renameSync(`${filename}.new`, `${filename}`)
}

function restore() {
  try {
    fs.renameSync('package.json.orig', 'package.json')
  } catch (e) {
    // Don't care if it fail's
  }
  try {
    fs.renameSync('package-lock.json.orig', 'package-lock.json')
  } catch (e) {
    // Don't care if it fail's
  }
}
