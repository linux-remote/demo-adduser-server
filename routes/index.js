const wParse = require('./w-parse');
const fs = require('fs');
const {MAX_USERS, BEFORE_LOGIN_KEEP_TIME} = global.CONF;

const sas = require('sas');
const {exec} = require('child_process');
const reg = /^([0-9]|[a-z]|[A-Z]|_)+$/;
let users = fs.readdirSync('/home');
const registTime = Object.create(null);

function getUserList(callback){
  callback(null, {
    users, 
    MAX_USERS, 
    isFull: users.length >= MAX_USERS,
    isErr: false,
    errMsg: null
  });
}

function createUser(data, callback){
  // autoClear(err => {
  //   if(err){
  //     callback({
  //       code: 1,
  //       msg: err.message
  //     });
  //     return;
  //   }

    const {username, password} = data;
    if(!reg.test(username)){
      return callback({
        code: 1,
        msg: 'Username Can only contain ([0-9]|[a-z]|[A-Z]|_) '
      })
    }
    if(!reg.test(password)){
      return callback({
        code: 1,
        msg: 'Password Can only contain ([0-9]|[a-z]|[A-Z]|_) '
      })
    }
    if(users.indexOf(username) !== -1 || username === 'root'){
      return callback({
        code: 1,
        msg: 'User already exists'
      })
    }
    // useradd -p 不起作用. ubuntu and centos.
    exec(`useradd -m '${username}'`, function(err){
      if(err){
        return callback(err);
      } 
      // console.log('useradd OK');
      const l = exec(`passwd '${username}'`, (err, stdout, stderr) => {
        // console.log('passwd end', stdout);
        if(err){
          return callback(err);
        }
        users.push(username);
        registTime[username] = Date.now();
        callback(null, 'ok');
        autoClear();
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


  // });
}



let isStartAutoClear = false;
let callbacks_bak = [];
function autoClear(callback){
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
        if(k === 'ubuntu'){
          return;
        }
        if(!keepMap.has(k)){
          killList.push(k);
        }
      });
      const sasTasks = [];
      killList.forEach(_name => {
        
        let name = _name;
        // console.log('name' , name);
        sasTasks.push(cbAll => {
          sas([
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
          cb => exec(`rm -rf /home/${name}`, {env: process.env}, cb),
          cb => {
            const i = users.indexOf(name);
            delete(registTime[name]);
            if(i !== -1){
              users.splice(i, 1);
            }
            cb();
          }
          ], () => {
            cbAll();
          })
        })
      });
      sas(sasTasks, done);
    })
  } else {
    done(null);
  }

//   killall -u linux-remote
// userdel -r linux-remote
}

module.exports = {
  getUserList,
  createUser
};
