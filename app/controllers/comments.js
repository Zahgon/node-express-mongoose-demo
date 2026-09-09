'use strict';

/**
 * Module dependencies.
 */

const { redirect } = require('../../config/response');

/**
 * Load comment
 */

exports.load = async function(id, ctx, next) {
  ctx.state.comment = ctx.state.article.comments.find(
    comment => comment.id === id
  );

  if (!ctx.state.comment) throw new Error('Comment not found');
  return next();
};

/**
 * Create comment
 */

exports.create = async function(ctx) {
  const article = ctx.state.article;
  await article.addComment(ctx.state.user, ctx.request.body);
  redirect(ctx, `/articles/${article._id}`);
};

/**
 * Delete comment
 */

exports.destroy = async function(ctx) {
  await ctx.state.article.removeComment(ctx.params.commentId);
  ctx.flash('info', 'Removed comment');
  redirect(ctx, `/articles/${ctx.state.article.id}`);
};
