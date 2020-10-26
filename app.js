'use strict';

const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const io = require('socket.io')();

const indexRouter = require('./routes/index');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);

// send a message on successful socket connection
// socket.on('connection', function(){
//  socket.emit('message', 'Successfully connected.');
// });

const namespaces = io.of(/^\/[a-z]{3}-[a-z]{4}-[a-z]{3}$/);

namespaces.on('connection', function(socket) {
  console.log('A client connected...');
  // Use the `namespace` var only for diagnostic purposes...
  const namespace = socket.nsp;
  // ...and therefore use the namespaced socket, `io`, for
  // emitting and listening for events.
  socket.emit('message', `Successfully connected on namespace: ${namespace.name}`);
  // Broadcast a dataless 'calling' event from the caller to the callee
  socket.on('calling', function() {
    socket.broadcast.emit('calling');
  });
  // Handle all signalling events and their destructured data
  socket.on('signal', function({description, candidate}) {
    console.log(`Signal received from ${socket.id}:`);
    console.log({description, candidate});
    // Broadcast emit so client doesn't receive own description/candidate
    socket.broadcast.emit('signal', {description, candidate});
  });
});


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = {app, io};
