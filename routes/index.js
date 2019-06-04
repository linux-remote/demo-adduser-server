var express = require('express');
var router = express.Router();
const path = require('path');
const fs = require('fs');
const maxUser = 100;
const {exec} = require('child_process');
/* GET home page. */
// router.get('/', function(req, res, next) {
//   fs.readdir('/home', (err, files) => {
//     if(err){
//       return next(err);
//     }
//     if(files.length >= maxUser){

//     }
//     res.sendFile(path.join(__dirname, '../public/index.html'));
//   })
  
// });
const reg = /^([0-9]|[a-z]|[A-Z]|_)+$/;
router.post('/', function(req, res, next) {
  const {username, password} = req.body;
  if(!reg.test(username)){
    return res.send({
      code: 1,
      msg: 'Username Can only contain ([0-9]|[a-z]|[A-Z]|_) '
    })
  }
  if(!reg.test(password)){
    return res.send({
      code: 1,
      msg: 'Password Can only contain ([0-9]|[a-z]|[A-Z]|_) '
    })
  }
  // useradd -p 不起作用. ubuntu and centos.
  exec(`useradd -m '${username}'`, function(err, result){
    if(err){
      return next(err);
    }
    // console.log('useradd OK');
    const l = exec(`passwd '${username}'`, (err, stdout, stderr) => {
      // console.log('passwd end', stdout);
      if(err){
        return next(err);
      }
      
      res.end('ok');
    });
    l.on('data', function(data){
      // console.log('on data', data);
    })
    setTimeout(() => {
      // console.log('passwd write 1');
      l.stdin.write(`${password}\n`);
      setTimeout(() => {
        // console.log('passwd write 2');
        l.stdin.write(`${password}\n`);
      }, 200);
    }, 200);
    
  })
});
function clear(){
//   killall -u linux-remote
// userdel -r linux-remote
}

module.exports = router;
