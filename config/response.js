'use strict';

/**
 * Small response helper for Koa handlers.
 *
 * Koa's native `ctx.redirect()` defaults the response body to `text/html`.
 * This project's redirects are asserted as `text/plain` ("Redirecting to <url>"),
 * so this helper sets an explicit 302 + Location + `text/plain` body.
 */

exports.redirect = function redirect(ctx, url) {
  ctx.status = 302;
  ctx.set('Location', url);
  ctx.type = 'text/plain; charset=utf-8';
  ctx.body = 'Redirecting to ' + url;
};
