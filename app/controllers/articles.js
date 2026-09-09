'use strict';

/**
 * Module dependencies.
 */

const mongoose = require('mongoose');
const only = require('only');
const { redirect } = require('../../config/response');
const Article = mongoose.model('Article');
const assign = Object.assign;

/**
 * Load
 */

exports.load = async function(id, ctx, next) {
  ctx.state.article = await Article.load(id);
  if (!ctx.state.article) throw new Error('Article not found');
  return next();
};

/**
 * List
 */

exports.index = async function(ctx) {
  const page = (ctx.query.page > 0 ? ctx.query.page : 1) - 1;
  const _id = ctx.query.item;
  const limit = 15;
  const options = {
    limit: limit,
    page: page
  };

  if (_id) options.criteria = { _id };

  const articles = await Article.list(options);
  const count = await Article.countDocuments();

  await ctx.render('articles/index', {
    title: 'Articles',
    articles: articles,
    page: page + 1,
    pages: Math.ceil(count / limit)
  });
};

/**
 * New article
 */

exports.new = async function(ctx) {
  await ctx.render('articles/new', {
    title: 'New Article',
    article: new Article()
  });
};

/**
 * Create an article
 */

exports.create = async function(ctx) {
  const article = new Article(only(ctx.request.body, 'title body tags'));
  article.user = ctx.state.user;
  try {
    await article.uploadAndSave();
    ctx.flash('success', 'Successfully created article!');
    redirect(ctx, `/articles/${article._id}`);
  } catch (err) {
    ctx.status = 422;
    await ctx.render('articles/new', {
      title: article.title || 'New Article',
      errors: [err.toString()],
      article
    });
  }
};

/**
 * Edit an article
 */

exports.edit = async function(ctx) {
  await ctx.render('articles/edit', {
    title: 'Edit ' + ctx.state.article.title,
    article: ctx.state.article
  });
};

/**
 * Update article
 */

exports.update = async function(ctx) {
  const article = ctx.state.article;
  assign(article, only(ctx.request.body, 'title body tags'));
  try {
    await article.uploadAndSave();
    redirect(ctx, `/articles/${article._id}`);
  } catch (err) {
    ctx.status = 422;
    await ctx.render('articles/edit', {
      title: 'Edit ' + article.title,
      errors: [err.toString()],
      article
    });
  }
};

/**
 * Show
 */

exports.show = async function(ctx) {
  await ctx.render('articles/show', {
    title: ctx.state.article.title,
    article: ctx.state.article
  });
};

/**
 * Delete an article
 */

exports.destroy = async function(ctx) {
  await ctx.state.article.remove();
  ctx.flash('info', 'Deleted successfully');
  redirect(ctx, '/articles');
};
