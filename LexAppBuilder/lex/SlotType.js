/*
# Copyright 2017-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0.
 */

var component = require('./component.js');
var exports = module.exports = {};
var logger = require('../core/logger.js');
logger.setLogLevel("info");

var SlotType = function (name) {
  this.lex = new component.LexComponent();
  this.name = name;
  this.enumerationValues = new Array();
  this.description = "";
  this.actualValues = new Set();
}

SlotType.prototype.setLogLevel = function (logLevel) {
  logger.setLogLevel(logLevel);
}

SlotType.prototype.retrieveDefinition = function (callback) {
  var params = {
    "name": this.name,
    "version": "$LATEST"
  }
  var obj = this;
  this.lex.lexsrv.getSlotType(params, function (err, data) {
    if (err) {
      logger.info("Unable to find slottype:" + JSON.stringify(err, null, 2));
      callback(err, data);
    } else {
      logger.debug("Obtained slottype: " + obj.name + ":" + JSON.stringify(data, null, 2));
      obj.description = data.description;
      obj.enumerationValues = data.enumerationValues;
      for (k in obj.enumerationValues) {
        obj.actualValues.add(obj.enumerationValues[k]["value"]);
      }
      callback(err, data);
    }
  });
}

SlotType.prototype.setDescription = function (description) {
  this.description = description;
}

SlotType.prototype.addType = function (value) {
  logger.debug("searching for: " + value);
  logger.debug("actual values: " + JSON.stringify(this.actualValues, null, 2));
  if (this.actualValues.has(value)) {
    return;
  }
  this.enumerationValues[this.enumerationValues.length] = {"value": value};
  this.actualValues.add(value);
}

SlotType.prototype.removeType = function (value) {
  logger.debug("searching for: " + value);
  logger.debug("actual values: " + JSON.stringify(this.actualValues, null, 2));
  if (!this.actualValues.has(value)) {
    logger.debug("type to remove is not present: " + value);
    return;
  }
  this.actualValues.delete(value);
  this.enumerationValues = new Array();
  for (let k of this.actualValues.keys()) {
    this.enumerationValues[this.enumerationValues.length] = {"value": k};
  }
  logger.debug("current enumerationValues after remove:" + JSON.stringify(this.enumerationValues, null, 2));
}

SlotType.prototype.existsType = function (value) {
  if (this.actualValues.has(value)) {
    return true;
  } else {
    return false;
  }
}

SlotType.prototype.update = function (callback) {
  var params = {
    "name": this.name,
    "description": this.description,
    "enumerationValues": this.enumerationValues,
    "checksum": this.checksum
  };
  var obj = this;
  this.lex.lexsrv.putSlotType(params, function (err, data) {
    if (err) {
      logger.error("Unable to update slottype:" + JSON.stringify(err, null, 2));
      callback(err, data);
    } else {
      logger.debug("Updated slottype: " + obj.name + ":" + JSON.stringify(data, null, 2));
      callback(err, data);
    }
  });
};

SlotType.prototype.delete = function (callback) {
  var params = {
    "name": this.name
  }

  var obj = this;

  this.lex.lexsrv.deleteSlotType(params, function (err, data) {
    if (err) {
      logger.error("Unable to delete slottype:" + JSON.stringify(err, null, 2));
      callback(err, data);
    } else {
      logger.debug("Updated slottype: " + obj.name + ":" + JSON.stringify(data, null, 2));
      callback(err, data);
    }
  });
};

SlotType.prototype.createSlotType = function (callback) {
  var params = {
    "name": this.name,
    "description": this.description,
    "enumerationValues": this.enumerationValues
  };
  var obj = this;
  this.lex.lexsrv.putSlotType(params, function (err, data) {
    if (err) {
      logger.error("Unable to create slottype:" + JSON.stringify(err, null, 2));
      callback(err, data);
    } else {
      logger.debug("Created slottype: " + obj.name + ":" + JSON.stringify(data, null, 2));
      callback(err, data);
    }
  });
};


SlotType.prototype.toYaml = function(prevSlot) {
  var res = '';
  var indent = '  ';

  res += indent + this.name + ':\n';
  if (prevSlot) {
    res += indent + indent + 'DependsOn: ' + prevSlot.name + '\n';
  }
  res += indent + indent + 'Type: Custom::LexSlotTypeLambda\n';
  res += indent + indent + 'Properties:\n';
  res += indent + indent + indent + 'ServiceToken: !GetAtt LexSlotTypeLambda.Arn\n';
  res += indent + indent + indent + 'SlotTypeName: ' + this.name + '\n';
  res += indent + indent + indent + 'Values:\n';
  for (let k of this.actualValues.keys()) {
    res += indent + indent + indent + indent + '- ' + k + '\n';
  }
  res += '\n';
  return res;
};

exports.SlotType = SlotType;
