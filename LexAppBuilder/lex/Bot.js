/*
# Copyright 2017-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0.
 */

var component = require('./component.js');
var exports = module.exports = {};
var logger = require('../core/logger.js');
var fs = require('fs');

logger.setLogLevel("info");

var Bot = function (name, description) {
    this.lex = new component.LexComponent();
    this.data = new Object();
    this.data.name = name;
    this.data.description = description;
    this.data.voiceId = "Joanna";
    this.data.version = "$LATEST";
    this.data.idleSessionTTLInSeconds = 300;
    this.data.intents = new Array();
    this.data.clarificationPrompt = new Object();
    this.data.abortStatement = new Object();
    this.data.BotToOverrideId = "";
    this.data.childDirected = false;
    this.data.processBehavior = "SAVE";
    this.data.locale = "en-US";
};

Bot.prototype.setVoiceId = function(voiceId) {
  this.data.voiceId = voiceId;
};

Bot.prototype.setVersion = function(version) {
  this.data.version = version;
};

Bot.prototype.setProcessBehavior= function(processBehavior) {
  this.data.processBehavior = processBehavior;
};

Bot.prototype.setIdleSessionTTLInSeconds = function(idleSessionTTLInSeconds) {
  this.data.idleSessionTTLInSeconds = idleSessionTTLInSeconds;
};

Bot.prototype.setChildDirected = function(childDirected) {
  if (childDirected === "true" || childDirected === true) {
    this.data.childDirected = true;
  } else {
    this.data.childDirected = false;
  }
};

Bot.prototype.setLocale = function(locale) {
  this.data.locale = locale;
};

Bot.prototype.setLogLevel = function(logLevel) {
    logger.setLogLevel(logLevel);
};

Bot.prototype.setDescription = function(description) {
    this.data.description = description;
};

Bot.prototype.retrieveDefinition = function( callback ) {
    var params = {
        "name": this.data.name,
        "versionOrAlias": this.data.version
    }
    var obj = this;
    this.lex.lexsrv.getBot(params, function (err, data) {
        if (err) {
            logger.info("Unable to find Bot:"+ JSON.stringify(err, null, 2));
            callback(err,data);
        } else {
            logger.debug("Obtained Bot: " + obj.name +":" + JSON.stringify(data, null, 2));
            obj.data = data;
            callback(err,data);
        }
    });
};

Bot.prototype.delete = function( callback ) {
    var params = {
        "name": this.data.name
    };

    var obj = this;

    this.lex.lexsrv.deleteBot(params, function (err, data) {
        if (err) {
            logger.error("Unable to delete Bot:"+ JSON.stringify(err, null, 2));
            callback(err,data);
        } else {
            logger.debug("Updated Bot: " + obj.name +":" + JSON.stringify(data, null, 2));
            callback(err,data);
        }
    });
};

Bot.prototype.createBot = function(callback ) {
    var params = {
        "name": this.data.name,
        "description": this.data.description,
        "intents": this.data.intents,
        "clarificationPrompt": this.data.clarificationPrompt,
        "abortStatement": this.data.abortStatement,
        "idleSessionTTLInSeconds": this.data.idleSessionTTLInSeconds,
        "voiceId": this.data.voiceId,
        "locale": this.data.locale,
        "childDirected": this.data.childDirected,
        "processBehavior": this.data.processBehavior
    };

    var obj = this;
    this.lex.lexsrv.putBot(params, function (err, data) {
        if (err) {
            logger.error("Unable to create Bot:"+ JSON.stringify(err, null, 2));
            callback(err,data);
        } else {
            logger.debug("Created Bot: " + obj.name +":" + JSON.stringify(data, null, 2));
            obj.data = data;
            callback(err,data);
        }
    });
};

Bot.prototype.updateBot = function(callback ) {
  var params = {
    "name": this.data.name,
    "description": this.data.description,
    "intents": this.data.intents,
    "clarificationPrompt": this.data.clarificationPrompt,
    "abortStatement": this.data.abortStatement,
    "idleSessionTTLInSeconds": this.data.idleSessionTTLInSeconds,
    "voiceId": this.data.voiceId,
    "locale": this.data.locale,
    "childDirected": this.data.childDirected,
    "checksum": this.data.checksum,
    "processBehavior": this.data.processBehavior
  };

  var obj = this;
  this.lex.lexsrv.putBot(params, function (err, data) {
    if (err) {
      logger.error("Unable to update Bot:"+ JSON.stringify(err, null, 2));
      callback(err,data);
    } else {
      logger.debug("Updated Bot: " + obj.name +":" + JSON.stringify(data, null, 2));
      obj.data = data;
      callback(err,data);
    }
  });
};

Bot.prototype.addIntent = function(intentVersion,intentName) {
    var intent = {
        'intentVersion': intentVersion,
        'intentName': intentName,
    }
    this.data.intents[this.data.intents.length]=intent;
};


Bot.prototype.addClarificationPrompt = function(maxAttempts, content, contentType) {
    var prompt =  {
        "maxAttempts": maxAttempts,
            "messages": [
            {
                "content": content,
                "contentType": contentType
            }
        ]
    }
    this.data.clarificationPrompt = prompt;
};

Bot.prototype.addAbortStatement = function(content, contentType) {
    var statement = {
        "messages": [
            {
                "content": content,
                "contentType": contentType
            }
        ]
    }
    this.data.abortStatement = statement;
};

Bot.prototype.setIdleSessionTTLInSeconds = function(seconds) {
    this.data.idleSessionTTLInSeconds = seconds;
};

Bot.prototype.setVoiceId = function( voiceId ) {
    this.data.voiceId = voiceId;
};

Bot.prototype.setVersion = function(version) {
    this.data.version = version;
};

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

Bot.prototype.toYaml = function() {
  var res = '';
  res = addIndents(res, 1) + this.data.name + ':\n';
  res = addIndents(res, 2) + 'DependsOn:\n';
  for (var i=0; i<this.data.intents.length; i++) {
    res = addIndents(res, 3) + '- ' + this.data.intents[i].intentName + '\n';
  }
  res = addIndents(res, 2) + 'Type: Custom::LexBotLambda\n';
  res = addIndents(res, 2) + 'Properties:\n';
  res = addIndents(res, 3) + 'Timestamp: ' + Date.now() + '\n';
  res = addIndents(res, 3) + 'ServiceToken: !GetAtt LexBotLambda.Arn\n';
  res = addIndents(res, 3) + 'Name: ' + this.data.name+ '\n';
  res = addIndents(res, 3) + 'Description: ' + this.data.description + '\n';
  res = addIndents(res, 3) + 'VoiceID: ' + this.data.voiceId + '\n';
  res = addIndents(res, 3) + 'IdleSessionTTLInSeconds: ' + this.data.idleSessionTTLInSeconds + '\n';
  res = addIndents(res, 3) + 'Intent:\n';
  for (var i=0; i<this.data.intents.length; i++) {
    res = addIndents(res, 4) + '- IntentVersion: ' + this.data.intents[i].intentVersion + '\n';
    res = addIndents(res, 4) + '  IntentName: ' + this.data.intents[i].intentName + '\n';
  }
  res = addPrompt(res, 'ClarificationPrompt:', 3, true, this.data.clarificationPrompt);
  res = addPrompt(res, 'AbortStatement:', 3, false, this.data.abortStatement);
  res = addIndents(res, 3) + 'Locale: ' + this.data.locale + '\n';
  res = addIndents(res, 3) + 'ChildDirected: ' + this.data.childDirected + '\n';
  res = addIndents(res, 3) + 'ProcessBehavior: ' + this.data.processBehavior + '\n';

  res += '\n';
  return res;
};

exports.Bot = Bot;
