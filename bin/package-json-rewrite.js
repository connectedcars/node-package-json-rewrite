#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { spawn } = require('child_process')

const { packageJSONRewrite, packageLockJSONRewrite, findCmd } = require('../src')

let ssh = require('../src/ssh')

let processName = path.basename(process.argv[1])
let processArgs = process.argv.slice(2)
let processPath = process.env['PACKAGE_JSON_REWRITE_CMD'] || findCmd(process.argv[1], process.env['PATH'], processName)
let processEnv = { ...process.env, PACKAGE_JSON_REWRITE_CMD: processPath }

// Support yocto build target
if (processEnv['OECORE_TARGET_ARCH']) {
  processArgs = [`--arch=${processEnv['OECORE_TARGET_ARCH']}`, ...processArgs]
}

if (process.argv[1] === __filename) {
  console.error('Need to symlink this file')
  process.exit(255)
}

let githubPatToken = process.env['GITHUB_PAT']
let sshKeyPath = process.env['SSH_KEY_PATH']
let sshKeyPassword = process.env['SSH_KEY_PASSWORD']

// Clean up environment
delete processEnv['GITHUB_PAT']
delete processEnv['SSH_KEY_PATH']
delete processEnv['SSH_KEY_PASSWORD']

// Use SSH agent method if we have a key
if (sshKeyPath && sshKeyPassword) {
  ssh
    .startSshAgent()
    .then(sshAgent => {
      // Clean up the agent when the script stops
      let killSshAgentProcess = () => {
        if (!sshAgent.killing) {
          console.log('Closing ssh-agent')
          sshAgent.process.kill()
          sshAgent.killing = true
        }
      }
      process.on('SIGINT', killSshAgentProcess)
      process.on('SIGTERM', killSshAgentProcess)
      process.on('exit', killSshAgentProcess)

      // Load the key
      ssh.sshAddKey(sshAgent.socket, sshKeyPath, sshKeyPassword)
      console.log('Loaded ssh keys:')
      console.log(ssh.sshListKeys(sshAgent.socket))
      console.log(sshAgent.socket)
      console.log(JSON.stringify(fs.statSync(sshAgent.socket)))

      runProcess(processPath, processArgs, {
        env: { ...processEnv, SSH_AUTH_SOCK: sshAgent.socket }
      }).then(res => {
        console.log(`${processName} exit code: ${res.code}, signal: ${res.signal}`)
        killSshAgentProcess()
        process.exit(res.code)
      })
    })
    .catch(e => {
      console.log(`Failed to start ssh agent:`)
      console.error(e)
      process.exit(255)
    })
} else if (
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
      console.log(`${processName} ${processArgs.join(' ')} exit code: ${res.code}, signal: ${res.signal}`)
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
    console.log(`${processName} ${processArgs.join(' ')} exit code: ${res.code}, signal: ${res.signal}`)
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
