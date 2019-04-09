/*
# Copyright 2017-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0.
 */

var exports = module.exports = {};
const logger = require('./core/logger.js');
const SlotType = require("./lex/SlotType");
const Intent = require("./lex/Intent");
const Bot = require("./lex/Bot");
var currentLogLevel='info';

logger.setLogLevel(currentLogLevel);

exports.handler = (event, context, callback) => {
  logger.info("bothandler: " + JSON.stringify(event, null, 2));

  if (event.RequestType === "Create") {
    const properties = event.ResourceProperties;
    const botname = properties.Name;
    const description = properties.Description;
    const voiceID = properties.VoiceID;
    const idleSessionTTLInSeconds = properties.IdleSessionTTLInSeconds;
    const intents = properties.Intent;
    const clarificationPrompt = properties.ClarificationPrompt;
    const abortStatement = properties.AbortStatement;
    const locale = properties.Locale;
    const childDirected = properties.ChildDirected;

    const bot = new Bot.Bot(botname, description);
    bot.setLogLevel(currentLogLevel);
    bot.setVoiceId(voiceID);
    bot.setIdleSessionTTLInSeconds(idleSessionTTLInSeconds);
    bot.setLocale(locale);
    bot.setChildDirected(childDirected);

    if (properties.ProcessBehavior) {
      bot.setProcessBehavior(properties.processBehavior);
    }

    for (var i in intents) {
      bot.addIntent(intents[i].IntentVersion, intents[i].IntentName);
    }

    bot.addClarificationPrompt(clarificationPrompt.MaxAttempts, clarificationPrompt.Messages[0].Content, clarificationPrompt.Messages[0].ContentType);
    bot.addAbortStatement(abortStatement.Messages[0].Content, abortStatement.Messages[0].ContentType);

    bot.createBot(function (err, data) {
      if (err) {
        logger.error("Could not create bot: " + JSON.stringify(bot, null, 2) + "\nError message: " + JSON.stringify(err, null, 2));
        sendResponse(event, context, "FAILED", err, undefined);
      } else {
        logger.info("Created bot : " + bot.data.name + "data: " + JSON.stringify(data,null,2));
        const respData = new Object();
        sendResponse(event, context, "SUCCESS", respData, undefined);
      }
    });
  } else if (event.RequestType === "Delete") {
    const properties = event.ResourceProperties;
    const bot = new Bot.Bot(properties.Name, properties.Description);

    function performDelete(bot, count) {
      bot.delete(function (err,data) {
        if (err) {
          logger.error("Could not delete bot: " + JSON.stringify(bot, null, 2) + "\nError message: " + JSON.stringify(err, null, 2));
          if (err.code === "ConflictException" && count < 3) {
            logger.error("ConflictException retrying delete of Bot in 30 seconds");
            setTimeout(function () {
              performDelete(bot, count+1);
            }, 30000);
          } else {
            sendResponse(event, context, "FAILED", err, undefined);
          }
        } else {
          logger.info("Deleted bot: " + bot.data.name + "data: " + JSON.stringify(data,null,2));
          const respData = new Object();
          sendResponse(event, context, "SUCCESS", respData, undefined);
        }
      });
    }
    performDelete(bot,0);

  } else if (event.RequestType === "Update") {
    const physicalResourceId = event.PhysicalResourceId;
    const properties = event.ResourceProperties;
    const botname = properties.Name;
    const description = properties.Description;
    const voiceID = properties.VoiceID;
    const idleSessionTTLInSeconds = properties.IdleSessionTTLInSeconds;
    const intents = properties.Intent;
    const clarificationPrompt = properties.ClarificationPrompt;
    const abortStatement = properties.AbortStatement;
    const locale = properties.Locale;
    const childDirected = properties.ChildDirected;
    var bot = new Bot.Bot(botname, description);

    bot.retrieveDefinition(function (err, data) {
      if (err) {
        logger.error("Could not retrieve bot: " + JSON.stringify(bot, null, 2) + "\nError message: " + JSON.stringify(err, null, 2));
        sendResponse(event, context, "FAILED", err, physicalResourceId);
      } else {
        logger.info("Retrieved bot : " + bot.data.name + "data: " + JSON.stringify(data, null, 2));

        const checksum = data.checksum;
        bot = new Bot.Bot(botname, description);
        bot.data.checksum = checksum;
        bot.setLogLevel(currentLogLevel);
        bot.setVoiceId(voiceID);
        bot.setIdleSessionTTLInSeconds(idleSessionTTLInSeconds);
        bot.setLocale(locale);
        bot.setChildDirected(childDirected);
        bot.setProcessBehavior(properties.ProcessBehavior);

        for (var i in intents) {
          bot.addIntent(intents[i].IntentVersion, intents[i].IntentName);
        }

        bot.addClarificationPrompt(clarificationPrompt.MaxAttempts, clarificationPrompt.Messages[0].Content, clarificationPrompt.Messages[0].ContentType);
        bot.addAbortStatement(abortStatement.Messages[0].Content, abortStatement.Messages[0].ContentType);

        bot.updateBot(function (err, data) {
          if (err) {
            logger.error("Could not update bot: " + JSON.stringify(bot, null, 2) + "\nError message: " + JSON.stringify(err, null, 2));
            sendResponse(event, context, "FAILED", err, physicalResourceId);
          } else {
            logger.info("Updated bot : " + bot.data.name + "data: " + JSON.stringify(data, null, 2));
            const respData = new Object();
            sendResponse(event, context, "SUCCESS", respData, physicalResourceId);
          }
        });
      }
    });
  } else {
    const err = new Error("Invalid event: " + JSON.stringify(event, null, 2));
    sendResponse(event, context, "FAILED", err);
  }
};

// Send response to the pre-signed S3 URL
function sendResponse(event, context, responseStatus, responseData, physicalResourceId) {

  // all updates will reuse the same physicalResourceid. Use the previous value for updates.
  var resourceId = physicalResourceId;
  if (resourceId === undefined) {
    resourceId = context.logStreamName;
  }

  const responseBody = JSON.stringify({
    Status: responseStatus,
    Reason: "See the details in CloudWatch Log Stream: " + context.logStreamName,
    PhysicalResourceId: resourceId,
    StackId: event.StackId,
    RequestId: event.RequestId,
    LogicalResourceId: event.LogicalResourceId,
    Data: responseData
  });

  logger.info("RESPONSE BODY:\n", responseBody);

  const https = require("https");
  const url = require("url");

  const parsedUrl = url.parse(event.ResponseURL);
  const options = {
    hostname: parsedUrl.hostname,
    port: 443,
    path: parsedUrl.path,
    method: "PUT",
    headers: {
      "content-type": "",
      "content-length": responseBody.length
    }
  };

  logger.info("SENDING RESPONSE...\n");

  const request = https.request(options, function(response) {
    logger.info("STATUS: " + response.statusCode);
    logger.info("HEADERS: " + JSON.stringify(response.headers));
    // Tell AWS Lambda that the function execution is done
    context.done();
  });

  request.on("error", function(error) {
    logger.info("sendResponse Error:" + error);
    // Tell AWS Lambda that the function execution is done
    context.done();
  });

  // write data to request body
  request.write(responseBody);
  request.end();
}
