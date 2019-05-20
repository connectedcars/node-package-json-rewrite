const ssh = require('../src/ssh')

test('ssh test', async () => {
  let sshAgent = null
  try {
    sshAgent = await ssh.startSshAgent()
    ssh.sshAddKey(sshAgent.socket, 'resources/id_rsa', 'Qwerty1234')
    expect(ssh.sshListKeys(sshAgent.socket)).toBe(
      'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDbdDj3X2w3QXHJnILaMEWYLHVYWRgT/ChPbsk+4VTfdp21W7n1c5YD+0ccFtrw5LNi14Be39NxcD/VGyqvYgElWDzXvOaL3xRF3bLqzwr591Uh5UXENcHnEV99XeKysmr4nQ4E7nagFy93OO8wKMzFXLvtx5Ef3Rb9HGQlYtWNDj4TJhzYFC3EZLYj1qTO5Pbrme2cy8eDbyCmvUYRXJoiqjzhIb/c7D8DJOHm/0/SgldtMnfjdx4CzRzlyyeOGDSxwQEkfPod5a9TLsCQ43Exdg2cniVvzQHkZ2zoCrrnuBm3lHlrwwe+lXvI56Hv5y4ih1qGmHsPXRXhWgp9U0+d f736trbe@tlbmac.local\n'
    )
  } finally {
    if (sshAgent != null) {
      sshAgent.process.kill()
    }
  }
})
