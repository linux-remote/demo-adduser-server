module.exports = {
  port : 3001,
  secure: {
    keyPath: '/opt/linux-remote/ssl/demo.linux-remote.org/privkey.pem',
    certPath: '/etc/letsencrypt/live/demo.linux-remote.org/cert.pem'
  },
  MAX_USERS: 30
}