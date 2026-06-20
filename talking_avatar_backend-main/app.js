var createError = require('http-errors');
var express = require('express');
var path = require('path');
var logger = require('morgan');
var cors = require('cors');

var indexRouter = require('./routes/index');

var app = express();

var corsOptions = {
  origin: '*'
};
app.use(cors(corsOptions));
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler API ONLY
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.json({ error: err.message });
});

console.log('[DATA] Sistema actualizado: referencias institucionales normalizadas a "Alumnado"');

module.exports = app;
