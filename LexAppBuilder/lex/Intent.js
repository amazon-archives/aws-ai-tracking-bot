/*
# Copyright 2017-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0.
 */

var component = require('./component.js');
var exports = module.exports = {};
var logger = require('../core/logger.js');
logger.setLogLevel("info");

var Intent = function (name, description) {
  this.lex = new component.LexComponent();
  this.data = new Object();
  this.data.name = name;
  this.data.description = description;
  this.data.slots = new Array();
  this.data.sampleUtterances = new Array();

  // the following are optional
  this.data.confirmationPrompt = undefined;
  this.data.rejectionStatement = undefined;
  this.data.fulfillmentActivity = undefined;
  this.data.conclusionStatement = undefined;
  this.data.dialogCodeHook = undefined;
};

Intent.prototype.setLogLevel = function (logLevel) {
  logger.setLogLevel(logLevel);
};

Intent.prototype.retrieveDefinition = function (callback) {
  var params = {
    "name": this.data.name,
    "version": "$LATEST"
  }
  var obj = this;
  this.lex.lexsrv.getIntent(params, function (err, data) {
    if (err) {
      logger.info("Unable to find Intent:" + JSON.stringify(err, null, 2));
      callback(err, data);
    } else {
      logger.debug("Obtained Intent: " + obj.name + ":" + JSON.stringify(data, null, 2));
      obj.data = data;
      callback(err, data);
    }
  });
};

Intent.prototype.setDescription = function (description) {
  this.data.description = description;
};

Intent.prototype.delete = function (callback) {
  var params = {
    "name": this.data.name
  }

  var obj = this;

  this.lex.lexsrv.deleteIntent(params, function (err, data) {
    if (err) {
      logger.error("Unable to delete Intent:" + JSON.stringify(err, null, 2));
      callback(err, data);
    } else {
      logger.debug("Updated Intent: " + obj.name + ":" + JSON.stringify(data, null, 2));
      callback(err, data);
    }
  });
};

Intent.prototype.createIntent = function (callback) {
  var params = {
    "name": this.data.name,
    "description": this.data.description,
    "slots": this.data.slots,
    "sampleUtterances": this.data.sampleUtterances
  };

  if (this.data.confirmationPrompt) {
    params.confirmationPrompt = this.data.confirmationPrompt;
  }

  if (this.data.dialogCodeHook) {
    params.dialogCodeHook = this.data.dialogCodeHook;
  }

  if (this.data.fulfillmentActivity) {
    params.fulfillmentActivity = this.data.fulfillmentActivity;
  }

  if (this.data.rejectionStatement) {
    params.rejectionStatement = this.data.rejectionStatement;
  }

  if (this.data.conclusionStatement) {
    params.conclusionStatement = this.data.conclusionStatement;
  }

  var obj = this;
  this.lex.lexsrv.putIntent(params, function (err, data) {
    if (err) {
      logger.error("Unable to create Intent:" + JSON.stringify(err, null, 2));
      callback(err, data);
    } else {
      logger.debug("Created Intent: " + obj.name + ":" + JSON.stringify(data, null, 2));
      obj.data = data;
      callback(err, data);
    }
  });
};

Intent.prototype.updateIntent = function (callback) {
  var params = {
    "name": this.data.name,
    "description": this.data.description,
    "slots": this.data.slots,
    "sampleUtterances": this.data.sampleUtterances,
    "checksum": this.data.checksum
  };

  if (this.data.confirmationPrompt) {
    params.confirmationPrompt = this.data.confirmationPrompt;
  }

  if (this.data.dialogCodeHook) {
    params.dialogCodeHook = this.data.dialogCodeHook;
  }

  if (this.data.fulfillmentActivity) {
    params.fulfillmentActivity = this.data.fulfillmentActivity;
  }

  if (this.data.rejectionStatement) {
    params.rejectionStatement = this.data.rejectionStatement;
  }

  if (this.data.conclusionStatement) {
    params.conclusionStatement = this.data.conclusionStatement;
  }

  var obj = this;
  this.lex.lexsrv.putIntent(params, function (err, data) {
    if (err) {
      logger.error("Unable to update Intent:" + JSON.stringify(err, null, 2));
      callback(err, data);
    } else {
      logger.debug("Created Intent: " + obj.name + ":" + JSON.stringify(data, null, 2));
      obj.data = data;
      callback(err, data);
    }
  });
};

Intent.prototype.addSlot = function (name, description, slotType, slotConstraint, contentType, content, maxAttempts) {
  var slot = {
    'name': name,
    'description': description,
    'slotType': slotType,
    'slotConstraint': slotConstraint,
    'priority': 1,
    'valueElicitationPrompt': {
      'messages': [
        {
          'contentType': contentType,
          'content': content,
        }
      ],
      'maxAttempts': maxAttempts,
    }
  };
  if (!slotType.startsWith("AMAZON")) {
    slot.slotTypeVersion = "$LATEST";
  }
  this.data.slots[this.data.slots.length] = slot;
}

Intent.prototype.addSampleUtterance = function (value) {
  this.data.sampleUtterances[this.data.sampleUtterances.length] = value;
}

Intent.prototype.addConfirmationPrompt = function (maxAttempts, content, contentType) {
  var prompt = {
    "maxAttempts": maxAttempts,
    "messages": [
      {
        "content": content,
        "contentType": contentType
      }
    ]
  }
  this.data.confirmationPrompt = prompt;
}

Intent.prototype.addRejectionStatement = function (content, contentType) {
  var statement = {
    "messages": [
      {
        "content": content,
        "contentType": contentType
      }
    ]
  }
  this.data.rejectionStatement = statement;
}

Intent.prototype.addFulfillmentActivity = function (uri) {
  var fulfillmentActivity = {
    "type": "CodeHook",
    "codeHook": {
      "uri": uri,
      "messageVersion": "1.0"
    }
  }
  this.data.fulfillmentActivity = fulfillmentActivity;
}

Intent.prototype.addDialogCodeHook = function (uri) {
  var dialogCodeHook = {
    "uri": uri,
    "messageVersion": "1.0"
  }
  this.data.dialogCodeHook = dialogCodeHook;
}

Intent.prototype.addConlusionStatement = function (content, contentType) {
  var conclusionStatement = {
    "messages": [
      {
        "content": content,
        "contentType": contentType
      }
    ]
  }
  this.data.conclusionStatement = conclusionStatement;
}

function addIndents(val, num) {
  var indent = '  ';
  for (var i=0; i<num; i++) {
    val += indent;
  }
  return val;
}

function addPrompt(res, name, startIndents, includeMaxAttempts, data) {
  res = addIndents(res, startIndents) + name + ' \n';
  if (includeMaxAttempts) {
    res = addIndents(res, startIndents + 1) + 'MaxAttempts: ' + data.maxAttempts + ' \n';
  }
  res = addIndents(res, startIndents + 1) + 'Messages:\n';
  for (var j = 0; j < data.messages.length; j++) {
    res = addIndents(res, startIndents + 2) + '- ContentType: ' + data.messages[j].contentType + '\n';
    res = addIndents(res, startIndents + 2) + '  Content: ' + data.messages[j].content + '\n';
  }
  return res;
}

Intent.prototype.toYaml = function(prevIntent, lastSlotType) {
  var res = '';
  res = addIndents(res, 1) + this.data.name + ':\n';
  res = addIndents(res, 2) + 'DependsOn:\n';
  if (lastSlotType) {
    res = addIndents(res, 3) + '- ' + lastSlotType.name + '\n';
  }
  if (prevIntent) {
    res = addIndents(res, 3) + '- ' + prevIntent.data.name + '\n';
  }
  res = addIndents(res, 3) + '- lambdaFunction\n';
  for (var i=0; i<this.data.slots.length; i++) {
    if (! (this.data.slots[i].slotType.startsWith('AMAZON'))) {
      res = addIndents(res, 3) + '- ' + this.data.slots[i].slotType + '\n';
    }
  }
  res = addIndents(res, 2) + 'Type: Custom::LexIntentLambda\n';
  res = addIndents(res, 2) + 'Properties:\n';
  res = addIndents(res, 3) + 'Timestamp: ' + Date.now() + '\n';
  res = addIndents(res, 3) + 'ServiceToken: !GetAtt LexIntentLambda.Arn\n';
  res = addIndents(res, 3) + 'IntentName: ' + this.data.name + '\n';
  res = addIndents(res, 3) + 'Description: ' + this.data.description + '\n';
  if (this.data.slots.length>0) {
    res = addIndents(res, 3) + 'Slots:\n';
    for (var i = 0; i < this.data.slots.length; i++) {
      res = addIndents(res, 4) + '- Name: ' + this.data.slots[i].name + '\n';
      res = addIndents(res, 4) + '  Description: ' + this.data.slots[i].description + '\n';
      res = addIndents(res, 4) + '  SlotType: ' + this.data.slots[i].slotType + '\n';
      res = addIndents(res, 4) + '  SlotConstraint: ' + this.data.slots[i].slotConstraint + '\n';
      res = addIndents(res, 4) + '  Priority: ' + this.data.slots[i].priority + '\n';
      res = addIndents(res, 4) + '  ValueElicitationPrompt:\n';
      res = addIndents(res, 6) + 'Messages: \n';
      for (var j = 0; j < this.data.slots[i].valueElicitationPrompt.messages.length; j++) {
        res = addIndents(res, 7) + '- ContentType: ' + this.data.slots[i].valueElicitationPrompt.messages[j].contentType + '\n';
        res = addIndents(res, 7) + '  Content: ' + this.data.slots[i].valueElicitationPrompt.messages[j].content + '\n';
      }
      res = addIndents(res, 6) + 'MaxAttempts: ' + this.data.slots[i].valueElicitationPrompt.maxAttempts + '\n';
      if (this.data.slots[i].slotTypeVersion) {
        res = addIndents(res, 5) + 'SlotTypeVersion: ' + this.data.slots[i].slotTypeVersion + '\n';
      }
    }
  }
  res = addIndents(res, 3) + 'SampleUtterances: \n';
  for (var i=0; i<this.data.sampleUtterances.length; i++) {
    var t = this.data.sampleUtterances[i];
    t = t.replace(/\{/g,'\\{');
    t = t.replace(/\}/g,'\\}');
    res = addIndents(res, 4) + '- ' + t + '\n';
  }
  if (this.data.fulfillmentActivity) {
    res = addIndents(res, 3) + 'FulfillmentActivity: \n';
    res = addIndents(res, 4) + 'type: CodeHook\n';
    res = addIndents(res, 4) + 'CodeHook:\n';
    res = addIndents(res, 5) + 'Uri: ' + this.data.fulfillmentActivity.codeHook.uri + '\n';
    res = addIndents(res, 5) + 'MessageVersion: ' + this.data.fulfillmentActivity.codeHook.messageVersion + '\n';
  }
  if (this.data.dialogCodeHook) {
    res = addIndents(res, 3) + 'DialogCodeHook: \n';
    res = addIndents(res, 4) + 'Uri: ' + this.data.dialogCodeHook.uri + '\n';
    res = addIndents(res, 4) + 'MessageVersion: ' + this.data.dialogCodeHook.messageVersion + '\n';
  }
  if (this.data.confirmationPrompt) {
    res = addPrompt(res, 'ConfirmationPrompt:', 3, true, this.data.confirmationPrompt);
  }
  if (this.data.rejectionStatement) {
    res = addPrompt(res, 'RejectionStatement:', 3, false, this.data.rejectionStatement);
  }
  if (this.data.conclusionStatement) {
    res = addPrompt(res, 'ConclusionStatement:', 3, false, this.data.conclusionStatement);
  }

  res += '\n';
  return res;
};

exports.Intent = Intent;
