var express = require('express');
var router = express.Router();
const wParse = require('./w-parse');
const fs = require('fs');
const MAX_USERS = 4;
const BEFORE_LOGIN_KEEP_TIME = 1000 * 60 * 10;
const sas = require('sas');
const {exec} = require('child_process');

const reg = /^([0-9]|[a-z]|[A-Z]|_)+$/;
let users = fs.readdirSync('/home');
const registTime = Object.create(null);

router.get('/', function(req, res, next) {
  autoClear((err) => {
    // if(err){
    //   return next(err);
    // }

    res.json({
      users, 
      MAX_USERS, 
      isFull: err && err.name === 'fullError',
      isErr: Boolean(err),
      errMsg: err && err.message
    });
  })
  
});

router.post('/', function(req, res, next) {
  autoClear(err => {
    if(err){
      return res.send({
        code: 1,
        msg: err.message
      })
    }
    next();
  });
},function(req, res, next) {

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
  if(users.indexOf(username) !== -1){
    return res.send({
      code: 1,
      msg: 'User already exists'
    })
  }
  // useradd -p 不起作用. ubuntu and centos.
  exec(`useradd -m '${username}'`, function(err){
    if(err){
      return next(err);
    } 
    // console.log('useradd OK');
    const l = exec(`passwd '${username}'`, (err, stdout, stderr) => {
      // console.log('passwd end', stdout);
      if(err){
        return next(err);
      }
      users.push(username);
      registTime[username] = Date.now();
      res.end('ok');
      // autoClear((autoClearErr) => {
      //   if(autoClearErr){
      //     console.error(autoClearErr);
      //   }
      // });
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
let isStartAutoClear = false;
let callbacks_bak = [];
function autoClear(callback){
  console.log('autoClear');
  if(callback){
    callbacks_bak.push(callback);
  }
  
  if(isStartAutoClear){
    return;
  }
  isStartAutoClear = true;
  const done = (err2, result2) => {
    callbacks_bak.forEach(cb => {
      cb(err2, result2);
    })
    isStartAutoClear = false;
    callbacks_bak = [];
  }
  if(users.length >= MAX_USERS) {
    exec('w', (err, result) => {
      if(err){
        return done(err);
      }
      let onlineUser = wParse(result);
      const keepMap = new Map;
      onlineUser.forEach(name => {
        keepMap.set(name, true);
      })
      onlineUser = null;
      const now = Date.now();
      for(let i in registTime){
        if(now - registTime[i] < BEFORE_LOGIN_KEEP_TIME){
          keepMap.set(i, true)
        } else {
          delete(registTime[i]);
        }
      }
      if(keepMap.has('root')){
        keepMap.delete('root');
      }
      if(keepMap.size >= MAX_USERS){
        return done({
          name: 'fullError',
          message: 'Users have reached the upper limit.'
        })
      }

      let killList = [];
      
      users.forEach(k => {
        if(!keepMap.has(k)){
          killList.push(k);
        }
      });
      const sasTasks = [];
      console.log('killList', killList)
      killList.forEach(_name => {
        
        let name = _name;
        console.log('name' , name);
        sasTasks.push([
          cb => exec(`killall -u '${name}'`, {env: process.env}, (err)=> {
            if(err && err.code !== 1){
              return cb(err);
            }
            cb();
          }),
          cb => exec(`userdel -r '${name}'`, {env: process.env}, (err)  => {
            if(err && err.code !== 6){
              return cb(err);
            }
            cb();
          }),
          cb => {
            const i = users.indexOf(name);
            delete(registTime[name]);
            if(i !== -1){
              users.splice(i, 1);
            }
            cb();
          }
        ])
      });
      sas(sasTasks, done);
    })
  } else {
    done(null);
  }

//   killall -u linux-remote
// userdel -r linux-remote
}

module.exports = router;
