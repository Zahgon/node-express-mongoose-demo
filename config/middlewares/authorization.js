'use strict';

/**
 * Module dependencies.
 */

const { redirect } = require('../response');

/*
 *  Generic require login routing middleware
 */

exports.requiresLogin = async function(ctx, next) {
  if (ctx.isAuthenticated()) return next();
  if (ctx.method == 'GET') ctx.session.returnTo = ctx.originalUrl;
  redirect(ctx, '/login');
};

/*
 *  User authorization routing middleware
 */

exports.user = {
  hasAuthorization: async function(ctx, next) {
    if (ctx.state.profile.id != ctx.state.user.id) {
      ctx.flash('info', 'You are not authorized');
      return redirect(ctx, '/users/' + ctx.state.profile.id);
    }
    return next();
  }
};

/*
 *  Article authorization routing middleware
 */

exports.article = {
  hasAuthorization: async function(ctx, next) {
    if (ctx.state.article.user.id != ctx.state.user.id) {
      ctx.flash('info', 'You are not authorized');
      return redirect(ctx, '/articles/' + ctx.state.article.id);
    }
    return next();
  }
};

/**
 * Comment authorization routing middleware
 */

exports.comment = {
  hasAuthorization: async function(ctx, next) {
    // if the current user is comment owner or article owner
    // give them authority to delete
    if (
      ctx.state.user.id === ctx.state.comment.user.id ||
      ctx.state.user.id === ctx.state.article.user.id
    ) {
      return next();
    } else {
      ctx.flash('info', 'You are not authorized');
      redirect(ctx, '/articles/' + ctx.state.article.id);
    }
  }
};
