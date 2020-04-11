const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');
const {execSync} = require('child_process');
const qs = require('querystring');

execSync('killall -V'); // check is has 'killall' command.

global.IS_PRO = process.env.NODE_ENV === 'production';
global.CONF = global.IS_PRO ? 
  require('./config.js') : 
  require('./dev-config.js');

  const {port, secure} = global.CONF;

if(os.userInfo().uid !== 0){
  console.error('must start as root');
  process.exit();
}

const {getUserList, createUser} = require('./routes/index.js');


let indexPath = path.join(__dirname, 'public/index.html');
const indexHtmlCache = fs.readFileSync(indexPath);
let indexEtag = fs.statSync(indexPath);
indexEtag = stattag(indexEtag);
indexPath = null;


let faviconPath = path.join(__dirname, 'LINUX-LOGO-32.png');
const faviconCache = fs.readFileSync(faviconPath);
let faviconEtag = fs.statSync(faviconPath);
faviconEtag = stattag(faviconEtag);
faviconPath = null;

const app = function(req, res){
  if(req.url === '/' || req.url === '/index.html'){
    if(req.headers['If-None-Match'] === indexEtag){
      res.statusCode = 304;
      res.end();
      return;
    }
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Length', indexHtmlCache.length);
    res.setHeader('Cache-Control', 'max-age=300');
    res.end(indexHtmlCache);

  } else if(req.url === '/favicon.ico'){
    if(req.headers['If-None-Match'] === faviconEtag){
      res.statusCode = 304;
      res.end();
      return;
    }
    res.setHeader('Content-Type', 'image/x-icon');
    res.setHeader('Content-Length', faviconCache.length);
    res.setHeader('Cache-Control', 'max-age=31536000');
    res.end(faviconCache);
  } else if(req.url === '/api'){
    if(req.method === 'GET'){
      getUserList(function(err, result){
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(result));
      });
    } else if(req.method === 'POST'){
      let data = '';
      req.on('data', function(chunk) {
        data = data + chunk.toString();
      });

      req.on('end', function() {
        try {
          data = qs.parse(data);
        } catch (e){
          res.statusCode = 400;
          res.setHeader('Content-Type', 'text/plain');
          res.end(e.name + ': ' + e.message);
          return;
        }
        createUser(data, function(err, result){
          if(err){
            if(err.code && err.msg){
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(err));
            } else {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'text/plain');
              res.end(err.name + ': ' + err.message);
            }
            return;
          } else {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(result));
          }
        })

      });
  
    }
  } else {
    res.statusCode = 404;
    res.end('Not Found');
  }
};
let server;
if(secure){
  
  const key = fs.readFileSync(secure.keyPath);
  const cert = fs.readFileSync(secure.certPath);
  server = https.createServer({
    key,
    cert
  }, app);
} else {
  server = http.createServer(app);
}

server.listen(port);

server.on('listening', function(){
  console.log('server listening on ' + port, 'pid: ' + process.pid);
  console.log('NODE_ENV', process.env.NODE_ENV)
});

// ------------------------- npm module etag -------------------------
// copyright https://github.com/jshttp/etag/
// MIT License
// modifed: mtime is geted. add W/
/**
 * Generate a tag for a stat.
 *
 * @param {object} stat
 * @return {string}
 * @private
 */

function stattag (statObj) {
  var mtime = statObj.mtime.toString(16);
  var size = statObj.size.toString(16);
  return 'W/"' + size + '-' + mtime + '"'
}
// ------------------------- npm module etag end -------------------------