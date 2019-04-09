/*
# Copyright 2017-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0.
 */

var exports = module.exports = {};
var AWS = require('aws-sdk');

var LexComponent = function () {
  if (!(this instanceof LexComponent)) {
    return new LexComponent();
  }
  this.lexsrv = new AWS.LexModelBuildingService();
  this.logger = require('../core/logger.js');
  this.logger.setLogLevel('info');
}

LexComponent.prototype.setLogLevel = function (level) {
  this.logger.setLogLevel(level);
}

exports.LexComponent = LexComponent;
