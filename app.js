var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var bodyParser = require('body-parser');

var index = require('./routes/index');

var app = express();

// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, 'LINUX-LOGO-32.png')));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use('/api', index);

app.use(express.static(path.join(__dirname, 'public')));

 

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // render the error page
  res.status(err.status || 500);
  res.end(err.message);
});

module.exports = app;
