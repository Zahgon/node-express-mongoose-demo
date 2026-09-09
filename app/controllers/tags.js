'use strict';

/**
 * Module dependencies.
 */

const mongoose = require('mongoose');
const Article = mongoose.model('Article');

/**
 * List items tagged with a tag
 */

exports.index = async function(ctx) {
  const criteria = { tags: ctx.params.tag };
  const page = (ctx.params.page > 0 ? ctx.params.page : 1) - 1;
  const limit = 30;
  const options = {
    limit: limit,
    page: page,
    criteria: criteria
  };

  const articles = await Article.list(options);
  const count = await Article.countDocuments(criteria);

  await ctx.render('articles/index', {
    title: 'Articles tagged ' + ctx.params.tag,
    articles: articles,
    page: page + 1,
    pages: Math.ceil(count / limit)
  });
};
