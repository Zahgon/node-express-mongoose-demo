'use strict';

/*
 * Module dependencies.
 */

const Router = require('@koa/router');
const users = require('../app/controllers/users');
const articles = require('../app/controllers/articles');
const comments = require('../app/controllers/comments');
const tags = require('../app/controllers/tags');
const auth = require('./middlewares/authorization');

/**
 * Route middlewares
 */

const requiresLogin = auth.requiresLogin;
const articleAuth = [requiresLogin, auth.article.hasAuthorization];
const commentAuth = [requiresLogin, auth.comment.hasAuthorization];

const fail = {
  failureRedirect: '/login'
};

/**
 * Expose routes
 */

module.exports = function(app, passport) {
  const pauth = passport.authenticate.bind(passport);
  const router = new Router();

  // param preloaders
  router.param('userId', users.load);
  router.param('id', articles.load);
  router.param('commentId', comments.load);

  // user routes
  router.get('/login', users.login);
  router.get('/signup', users.signup);
  router.get('/logout', users.logout);
  router.post('/users', users.create);
  router.post(
    '/users/session',
    pauth('local', {
      failureRedirect: '/login',
      failureFlash: 'Invalid email or password.'
    }),
    users.session
  );
  router.get('/users/:userId', users.show);
  router.get('/auth/github', pauth('github', fail), users.signin);
  router.get(
    '/auth/github/callback',
    pauth('github', fail),
    users.authCallback
  );
  router.get('/auth/twitter', pauth('twitter', fail), users.signin);
  router.get(
    '/auth/twitter/callback',
    pauth('twitter', fail),
    users.authCallback
  );
  router.get(
    '/auth/google',
    pauth('google', {
      failureRedirect: '/login',
      scope: [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email'
      ]
    }),
    users.signin
  );
  router.get(
    '/auth/google/callback',
    pauth('google', fail),
    users.authCallback
  );
  router.get(
    '/auth/linkedin',
    pauth('linkedin', {
      failureRedirect: '/login',
      scope: ['r_emailaddress']
    }),
    users.signin
  );
  router.get(
    '/auth/linkedin/callback',
    pauth('linkedin', fail),
    users.authCallback
  );

  // article routes
  router.get('/articles', articles.index);
  router.get('/articles/new', requiresLogin, articles.new);
  router.post('/articles', requiresLogin, articles.create);
  router.get('/articles/:id', articles.show);
  router.get('/articles/:id/edit', ...articleAuth, articles.edit);
  router.put('/articles/:id', ...articleAuth, articles.update);
  router.delete('/articles/:id', ...articleAuth, articles.destroy);

  // home route
  router.get('/', articles.index);

  // comment routes
  router.post('/articles/:id/comments', requiresLogin, comments.create);
  router.get('/articles/:id/comments', requiresLogin, comments.create);
  router.delete(
    '/articles/:id/comments/:commentId',
    ...commentAuth,
    comments.destroy
  );

  // tag routes
  router.get('/tags/:tag', tags.index);

  /**
   * Error handling and 404 (outermost middleware)
   */

  app.use(async function(ctx, next) {
    try {
      await next();
    } catch (err) {
      // treat as 404
      if (
        err.message &&
        (~err.message.indexOf('not found') ||
          ~err.message.indexOf('Cast to ObjectId failed'))
      ) {
        return notFound(ctx);
      }

      console.error(err.stack);

      if (err.stack.includes('ValidationError')) {
        ctx.status = 422;
        return ctx.render('422', { error: err.stack });
      }

      // error page
      ctx.status = 500;
      return ctx.render('500', { error: err.stack });
    }

    // assume 404 since no route responded
    if (ctx.status === 404 && ctx.body == null) {
      return notFound(ctx);
    }
  });

  app.use(router.routes());
  app.use(router.allowedMethods());
};

function notFound(ctx) {
  const payload = {
    url: ctx.originalUrl,
    error: 'Not found'
  };
  ctx.status = 404;
  if (ctx.accepts('json')) {
    ctx.body = payload;
    return;
  }
  return ctx.render('404', payload);
}
