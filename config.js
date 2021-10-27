module.exports = {
  port : 3001,
  secure: {
    keyPath: '/etc/letsencrypt/live/demo.linux-remote.org/privkey.pem',
    certPath: '/etc/letsencrypt/live/demo.linux-remote.org/fullchain.pem'
  },
  MAX_USERS: 30,
  BEFORE_LOGIN_KEEP_TIME: 1000 * 60 * 10
}