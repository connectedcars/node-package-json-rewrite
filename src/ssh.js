const tmp = require('tmp')
const fs = require('fs')
const child_process = require('child_process')

/**
 * Add ssh key to agent
 * @param {string} keyPath private ssh key
 */
function sshAddKey(sshAuthSocket, keyPath, password = null) {
  let tmpdir = tmp.dirSync()
  let sshAskPassPath = `${tmpdir.name}/ssh-ask-pass`
  fs.writeFileSync(
    sshAskPassPath,
    `#/bin/bash
# Make sure we are only called once
if [ ! -f "${tmpdir.name}/ssh-askpass.done" ]; then
    echo $SSH_KEY_PASSWORD
    touch ${tmpdir.name}/ssh-askpass.done
    exit 0
else
    exit 1
fi`
  )
  fs.chmodSync(sshAskPassPath, '755')
  let res = child_process.spawnSync('ssh-add', [keyPath], {
    env: {
      DISPLAY: ':0',
      SSH_ASKPASS: sshAskPassPath,
      SSH_AUTH_SOCK: sshAuthSocket,
      SSH_KEY_PASSWORD: password ? password : ''
    },
    stdio: null
  })
  if (res.status !== 0) {
    throw new Error(
      `Could not load ssh key (${res.status}): ${res.stdout.toString('utf8')}, ${res.stderr.toString('utf8')},`
    )
  }
  return true
}

function startSshAgent() {
  let sshAgentProcess = child_process.spawn('ssh-agent', ['-D'])
  let stdout = ''
  return new Promise((resolve, reject) => {
    sshAgentProcess.stdout.on('data', chunk => {
      stdout += chunk.toString('utf8')
      let match = stdout.match(/SSH_AUTH_SOCK=([^;]+)/)
      if (match) {
        resolve({ socket: match[1], process: sshAgentProcess })
      }
    })
    stderr = ''
    sshAgentProcess.stderr.on('data', chunk => {
      stderr += chunk.toString('utf8')
    })
    sshAgentProcess.on('exit', (code, signal) => {
      reject({ code, signal, stdout, stderr })
    })
  })
}

module.exports = {
  sshAddKey,
  startSshAgent
}
