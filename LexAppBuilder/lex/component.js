/*
 Copyright 2017-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.

 Licensed under the Amazon Software License (the "License"). You may not use this file
 except in compliance with the License. A copy of the License is located at

 http://aws.amazon.com/asl/

 or in the "license" file accompanying this file. This file is distributed on an "AS IS"
 BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, express or implied. See the
 License for the specific language governing permissions and limitations under the License.
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
