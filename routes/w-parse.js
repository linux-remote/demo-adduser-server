// 01:25:47 up 2 days,  6:42, 21 users,  load average: 1.88, 2.47, 2.66
// USER     TTY      FROM             LOGIN@   IDLE   JCPU   PCPU WHAT
// dw       tty7     :0               日18    2days  6:27   0.26s /sbin/upstart -
// dw       pts/18   ::ffff:192.168.5 22:20    3:05m  2:43   1.58s /usr/local/bin/

function wParse(stdout){
  stdout = stdout.trim();
  stdout = stdout.split('\n');
  stdout.splice(0, 2);
  return stdout.map(line => {
    line = line.trim();
    line = line.substr(0, line.indexOf(' '));
    return line;
  })
}
// const result = wParse(`01:25:47 up 2 days,  6:42, 21 users,  load average: 1.88, 2.47, 2.66
// USER     TTY      FROM             LOGIN@   IDLE   JCPU   PCPU WHAT
// dw       tty7     :0               日18    2days  6:27   0.26s /sbin/upstart -
// dw       pts/18   ::ffff:192.168.5 22:20    3:05m  2:43   1.58s /usr/local/bin/`);
// console.log('result', result);
module.exports = wParse;