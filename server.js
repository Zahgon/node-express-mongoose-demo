'use strict';

/*
 * nodejs-express-mongoose-demo
 * Copyright(c) 2013 Madhusudhan Srinivasa <madhums8@gmail.com>
 * MIT Licensed
 */

/**
 * Module dependencies
 */

require('dotenv').config();

const fs = require('fs');
const join = require('path').join;
const Koa = require('koa');
const mongoose = require('mongoose');
const passport = require('koa-passport');
const config = require('./config');

const models = join(__dirname, 'app/models');
const port = process.env.PORT || 3000;
const app = new Koa();

// Bootstrap models
fs.readdirSync(models)
  .filter(file => ~file.search(/^[^.].*\.js$/))
  .forEach(file => require(join(models, file)));

// Bootstrap passport, middleware and routes
require('./config/passport')(passport);
require('./config/koa')(app, passport);
require('./config/routes')(app, passport);

/**
 * Expose
 */

module.exports = app.callback();

connect();

function listen() {
  if ((process.env.NODE_ENV || 'development') === 'test') return;
  app.listen(port);
  console.log('Koa app started on port ' + port);
}

function connect() {
  mongoose.connection
    .on('error', console.log)
    .on('disconnected', connect)
    .once('open', listen);
  return mongoose.connect(config.db, {
    keepAlive: 1,
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
}
