/*
 Copyright 2017-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.

 Licensed under the Amazon Software License (the "License"). You may not use this file
 except in compliance with the License. A copy of the License is located at

 http://aws.amazon.com/asl/

 or in the "license" file accompanying this file. This file is distributed on an "AS IS"
 BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, express or implied. See the
 License for the specific language governing permissions and limitations under the License.
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
