'use strict';

/**
 * Module dependencies.
 */

const mongoose = require('mongoose');
const { redirect } = require('../../config/response');
const User = mongoose.model('User');

/**
 * Load
 */

exports.load = async function(_id, ctx, next) {
  const criteria = { _id };
  ctx.state.profile = await User.load({ criteria });
  if (!ctx.state.profile) throw new Error('User not found');
  return next();
};

/**
 * Create user
 */

exports.create = async function(ctx) {
  const user = new User(ctx.request.body);
  user.provider = 'local';
  try {
    await user.save();
    await ctx.login(user);
    redirect(ctx, '/');
  } catch (err) {
    const errors = Object.keys(err.errors).map(
      field => err.errors[field].message
    );

    await ctx.render('users/signup', {
      title: 'Sign up',
      errors,
      user
    });
  }
};

/**
 *  Show profile
 */

exports.show = async function(ctx) {
  const user = ctx.state.profile;
  await ctx.render('users/show', {
    title: user.name,
    user: user
  });
};

exports.signin = async function() {};

/**
 * Auth callback
 */

exports.authCallback = login;

/**
 * Show login form
 */

exports.login = async function(ctx) {
  await ctx.render('users/login', {
    title: 'Login'
  });
};

/**
 * Show sign up form
 */

exports.signup = async function(ctx) {
  await ctx.render('users/signup', {
    title: 'Sign up',
    user: new User()
  });
};

/**
 * Logout
 */

exports.logout = async function(ctx) {
  ctx.logout();
  redirect(ctx, '/login');
};

/**
 * Session
 */

exports.session = login;

/**
 * Login
 */

async function login(ctx) {
  const redirectTo = ctx.session.returnTo ? ctx.session.returnTo : '/';
  delete ctx.session.returnTo;
  redirect(ctx, redirectTo);
}
