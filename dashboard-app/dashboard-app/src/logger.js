/*
# Copyright 2017-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0.
 */

/* eslint-disable no-underscore-dangle, prefer-arrow-callback, no-console */

/**
 * Current log level. Purposely not mutable. It's only for dev.
 * Do not check in after modified.
 * @type {string}
 */
let debugLevel = 'info';
const levels = ['error', 'warn', 'info', 'debug', 'trace'];

module.exports = {
  _log(level, msg) {
    if (levels.indexOf(level) <= levels.indexOf(debugLevel)) {
      console.log(`<${level}> ${msg}`);
    }
  },

  /**
   * Prints trace logs to stdout with newline.
   * @param msg message to print.
   */
  trace(msg) {
    this._log('trace', msg);
  },

  /**
   * Prints debug logs to stdout with newline.
   * @param msg message to print.
   */
  debug(msg) {
    this._log('debug', msg);
  },

  /**
   * Prints info logs to stdout with newline.
   * @param msg message to print.
   */
  info(msg) {
    this._log('info', msg);
  },

  /**
   * Prints warn logs to stdout with newline.
   * @param msg message to print.
   */
  warn(msg) {
    this._log('warn', msg);
  },

  /**
   * Prints error logs to stdout with newline.
   * @param msg message to print.
   */
  error(msg) {
    this._log('error', msg);
  },

  /**
   * Change log level. If the given logLevel is not valid, nothing would happen.
   *
   * @param logLevel ['error', 'warn', 'info', 'debug', 'trace']
   */
  setLogLevel(logLevel) {
    if (levels.indexOf(logLevel) > -1) {
      debugLevel = logLevel;
    }
  },
};
