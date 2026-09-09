// Force https

// Taken from this answer on S.O
// https://stackoverflow.com/a/31144924

'use strict';

const { redirect } = require('../response');

module.exports = async function requireHTTPS(ctx, next) {
  // The 'x-forwarded-proto' check is for Heroku
  if (
    !ctx.secure &&
    ctx.get('x-forwarded-proto') !== 'https' &&
    process.env.NODE_ENV !== 'development' &&
    process.env.NODE_ENV !== 'test'
  ) {
    return redirect(ctx, 'https://' + ctx.get('host') + ctx.url);
  }
  return next();
};
