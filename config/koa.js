'use strict';

/**
 * Module dependencies.
 */

const session = require('koa-session');
const compress = require('koa-compress');
const morgan = require('koa-morgan');
const { koaBody } = require('koa-body');
const CSRF = require('koa-csrf');
const cors = require('@koa/cors');
const helmet = require('koa-helmet');
const serve = require('koa-static');
const views = require('koa-views');

const winston = require('winston');
const ultimatePagination = require('ultimate-pagination');
const requireHttps = require('./middlewares/require-https');
const config = require('./');
const pkg = require('../package.json');

const env = process.env.NODE_ENV || 'development';

/**
 * Expose
 */

module.exports = function (app, passport) {
  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'script-src': ["'self'", 'code.jquery.com'],
          'style-src': ["'self'", "'unsafe-inline'", 'netdna.bootstrapcdn.com'],
          'img-src': ["'self'", 'data:', 'github.com'],
          'frame-src': ["'self'", 'ghbtns.com'],
        },
      },
    })
  );
  app.use(requireHttps);

  // Compression middleware (should be placed before koa-static)
  app.use(
    compress({
      threshold: 512,
    })
  );

  app.use(
    cors({
      origin: ['http://localhost:3000', 'https://reboil-demo.fly.dev'],
      credentials: true,
    })
  );

  // Static files middleware
  app.use(serve(config.root + '/public'));

  // Use winston on production
  let log = 'dev';
  if (env !== 'development') {
    log = {
      stream: {
        write: (message) => winston.info(message),
      },
    };
  }

  // Don't log during tests
  // Logging middleware
  if (env !== 'test') app.use(morgan(log));

  // set views path and template engine (pug)
  app.use(
    views(config.root + '/app/views', {
      extension: 'pug',
      options: { pretty: env === 'development' },
    })
  );

  // expose package.json to views
  app.use(function (ctx, next) {
    ctx.state.pkg = pkg;
    ctx.state.env = env;
    return next();
  });

  // body parsing: json, urlencoded and multipart (supertest .field() posts)
  app.use(
    koaBody({
      multipart: true,
      urlencoded: true,
      json: true,
    })
  );

  // method override: honour a _method field in urlencoded/multipart bodies
  app.use(function (ctx, next) {
    const body = ctx.request.body;
    if (body && typeof body === 'object' && '_method' in body) {
      ctx.method = body._method;
      delete body._method;
    }
    return next();
  });

  // session (cookie store); keys must be set before session/passport
  app.keys = [pkg.name];
  app.use(
    session(
      {
        key: pkg.name,
        rolling: true,
      },
      app
    )
  );

  // connect flash for flash messages - should be declared after sessions
  app.use(flash());

  // use passport session
  app.use(passport.initialize());
  app.use(passport.session());

  // view-helpers parity: expose the request and an isActive(path) helper to
  // templates (app/views/includes/header.pug relies on both on every render)
  app.use(function (ctx, next) {
    ctx.state.req = {
      isAuthenticated: () => ctx.isAuthenticated(),
      get user() {
        return ctx.state.user;
      },
    };
    ctx.state.isActive = (path) => ctx.path === path;
    return next();
  });

  if (env !== 'test') {
    app.use(new CSRF());

    // This could be moved to view-helpers :-)
    app.use(function (ctx, next) {
      ctx.state.csrf_token = ctx.csrf;
      ctx.state.paginate = ultimatePagination.getPaginationModel;
      return next();
    });
  }
};

/**
 * Session-backed flash messages, mirroring connect-flash: `flash(type, msg)`
 * queues a message and returns the new count; `flash(type)` returns and clears
 * that type; `flash()` returns and clears every type.
 */

function flash() {
  return function (ctx, next) {
    ctx.flash = function (type, msg) {
      const store = (ctx.session.flash = ctx.session.flash || {});
      if (type && msg) {
        const arr = (store[type] = store[type] || []);
        arr.push(msg);
        return arr.length;
      }
      if (type) {
        const arr = store[type] || [];
        delete store[type];
        return arr;
      }
      ctx.session.flash = {};
      return store;
    };
    return next();
  };
}
