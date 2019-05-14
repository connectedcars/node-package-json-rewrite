#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { spawn } = require('child_process')

const { packageJSONRewrite, packageLockJSONRewrite } = require('../src')

let ssh = require('../src/ssh')

let processName = path.basename(process.argv[1])
let processArgs = process.argv.slice(2)

if (process.argv[1] === __filename) {
  console.error('Need to symlink this file')
  process.exit(255)
}

let githubPatToken = process.env['GITHUB_PAT']
let sshKeyPath = process.env['SSH_KEY_PATH']
let sshKeyPassword = process.env['SSH_KEY_PASSWORD']

// Clean up environment
delete process.env['GITHUB_PAT']
delete process.env['SSH_KEY_PATH']
delete process.env['SSH_KEY_PASSWORD']

// Use SSH agent method if we have a key
if (sshKeyPath && sshKeyPassword) {
  let killSshAgentProcess = () => {}
  ssh
    .startSshAgent()
    .then(sshAgent => {
      // Clean up the agent when the script stops
      killSshAgentProcess = () => {
        console.log('Closing ssh-agent')
        sshAgent.process.kill()
      }
      process.on('SIGINT', killSshAgentProcess)
      process.on('SIGTERM', killSshAgentProcess)
      process.on('exit', killSshAgentProcess)

      // Load the key
      ssh.sshAddKey(sshAgent.socket, sshKeyPath, sshKeyPassword)
      console.log('Loaded ssh keys:')
      console.log(ssh.sshListKeys(sshAgent.socket))

      runProcess(`/usr/local/bin/${processName}`, processArgs, {
        env: { ...process.env, SSH_AUTH_SOCK: sshAgent.socket }
      }).then(res => {
        console.log(`${processName} exit code: ${res.code}, signal: ${res.signal}`)
        process.exit(res.code)
      })
    })
    .catch(e => {
      console.log(e)
      process.exit(255)
    })
    .finally(() => {
      killSshAgentProcess()
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

    runProcess(`/usr/local/bin/${processName}`, processArgs).then(res => {
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
  runProcess(`/usr/local/bin/${processName}`, processArgs).then(res => {
    console.log(`${processName} exit code: ${res.code}, signal: ${res.signal}`)
    restore()
    process.exit(res.code)
  })
}

function runProcess(path, processArgs, options) {
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
