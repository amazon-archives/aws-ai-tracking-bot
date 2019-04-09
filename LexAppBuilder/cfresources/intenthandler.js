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
  logger.info("intenthandler: " + JSON.stringify(event, null, 2));

  if (event.RequestType === "Create") {
    const properties = event.ResourceProperties;
    const intentname = properties.IntentName;
    const slots = properties.Slots;
    const utterances = properties.SampleUtterances;
    const confirmPrompt = properties.ConfirmationPrompt;

    var intent = new Intent.Intent(intentname, properties.Description);
    intent.setLogLevel(currentLogLevel);
    if (slots) {
      for (var s in slots) {
        intent.addSlot(slots[s].Name,
          slots[s].Description,
          slots[s].SlotType,
          slots[s].SlotConstraint,
          slots[s].ValueElicitationPrompt.Messages[0].ContentType,
          slots[s].ValueElicitationPrompt.Messages[0].Content,
          slots[s].ValueElicitationPrompt.MaxAttempts);
      }
    }

    for (var u in utterances) {
      var s = utterances[u];
      s = s.replace(/\\{/g, '\{');
      s = s.replace(/\\}/g, '\}');
      intent.addSampleUtterance(s);
    }

    if (confirmPrompt) {
      var messages = confirmPrompt.Messages[0];
      intent.addConfirmationPrompt(confirmPrompt.MaxAttempts, messages.Content, messages.ContentType);
    }

    const rejectPrompt = properties.RejectionStatement;
    if (rejectPrompt) {
      messages = rejectPrompt.Messages[0];
      intent.addRejectionStatement(messages.Content, messages.ContentType);
    }

    const conclusionStatement = properties.ConclusionStatement;
    if (conclusionStatement) {
      messages = conclusionStatement.Messages[0];
      intent.addConlusionStatement(messages.Content, messages.ContentType);
    }

    const fulfillmentActivity = properties.FulfillmentActivity;
    if (fulfillmentActivity) {
      intent.addFulfillmentActivity(fulfillmentActivity.CodeHook.Uri);
    }

    const dialogCodeHook = properties.DialogCodeHook;
    if (dialogCodeHook) {
      intent.addDialogCodeHook(dialogCodeHook.Uri);
    }

    intent.createIntent(function (err, data) {
      if (err) {
        logger.error("Could not create intent type: " + JSON.stringify(intent, null, 2) + "\nError message: " + JSON.stringify(err, null, 2));
        sendResponse(event, context, "FAILED", err, undefined);
      } else {
        logger.info("Created intent : " + intent.data.name + "data: " + JSON.stringify(data,null,2));
        const respData = new Object();
        sendResponse(event, context, "SUCCESS", respData, undefined);
      }
    });
  } else if (event.RequestType === "Delete") {
    const properties = event.ResourceProperties;
    const intentname = properties.IntentName;

    var intent = new Intent.Intent(intentname, properties.Description);

    function performDelete(intent, count) {
      intent.delete(function (err,data) {
        if (err) {
          logger.error("Could not delete intent type: " + JSON.stringify(intent, null, 2) + "\nError message: " + JSON.stringify(err, null, 2));
          if (err.code === "ConflictException" && count < 6) {
            logger.error("ConflictException retrying delete of Intent in 30 seconds");
            setTimeout(function () {
              performDelete(intent, count+1);
            }, 30000);
          } else {
            sendResponse(event, context, "FAILED", err, undefined);
          }
        } else {
          logger.info("Deleted intent: " + intent.name + "data: " + JSON.stringify(data,null,2));
          const respData = new Object();
          sendResponse(event, context, "SUCCESS", respData, undefined);
        }
      });
    }
    var count = 0;
    performDelete(intent,count);

  } else if (event.RequestType === "Update") {
    const physicalResourceId = event.PhysicalResourceId;
    const properties = event.ResourceProperties;
    const intentname = properties.IntentName;
    const slots = properties.Slots;
    const utterances = properties.SampleUtterances;
    const confirmPrompt = properties.ConfirmationPrompt;

    var intent = new Intent.Intent(intentname, properties.Description);

    intent.retrieveDefinition(function (err, data) {
      if (err) {
        logger.error("Could not retrieve intent: " + JSON.stringify(intent, null, 2) + "\nError message: " + JSON.stringify(err, null, 2));
        sendResponse(event, context, "FAILED", err, undefined);
      } else {
        logger.info("Retrieved intent : " + intent.data.name + "data: " + JSON.stringify(data, null, 2));

        const checksum = data.checksum;

        intent = new Intent.Intent(intentname, properties.Description);
        intent.data.checksum = checksum;

        intent.setLogLevel(currentLogLevel);
        if (slots) {
          for (var s in slots) {
            intent.addSlot(slots[s].Name,
              slots[s].Description,
              slots[s].SlotType,
              slots[s].SlotConstraint,
              slots[s].ValueElicitationPrompt.Messages[0].ContentType,
              slots[s].ValueElicitationPrompt.Messages[0].Content,
              slots[s].ValueElicitationPrompt.MaxAttempts);
          }
        }

        for (var u in utterances) {
          var s = utterances[u];
          s = s.replace(/\\{/g, '\{');
          s = s.replace(/\\}/g, '\}');
          intent.addSampleUtterance(s);
        }

        if (confirmPrompt) {
          var messages = confirmPrompt.Messages[0];
          intent.addConfirmationPrompt(confirmPrompt.MaxAttempts, messages.Content, messages.ContentType);
        }

        const rejectPrompt = properties.RejectionStatement;
        if (rejectPrompt) {
          messages = rejectPrompt.Messages[0];
          intent.addRejectionStatement(messages.Content, messages.ContentType);
        }

        const conclusionStatement = properties.ConclusionStatement;
        if (conclusionStatement) {
          messages = conclusionStatement.Messages[0];
          intent.addConlusionStatement(messages.Content, messages.ContentType);
        }

        const fulfillmentActivity = properties.FulfillmentActivity;
        if (fulfillmentActivity) {
          intent.addFulfillmentActivity(fulfillmentActivity.CodeHook.Uri);
        }

        const dialogCodeHook = properties.DialogCodeHook;
        if (dialogCodeHook) {
          intent.addDialogCodeHook(dialogCodeHook.Uri);
        }

        intent.updateIntent(function (err, data) {
          if (err) {
            logger.error("Could not update intent type: " + JSON.stringify(intent, null, 2) + "\nError message: " + JSON.stringify(err, null, 2));
            sendResponse(event, context, "FAILED", err, physicalResourceId);
          } else {
            logger.info("Updated intent : " + intent.data.name + "data: " + JSON.stringify(data, null, 2));
            const respData = new Object();
            sendResponse(event, context, "SUCCESS", respData, physicalResourceId);
          }
        });
      }
    });
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

  console.log("RESPONSE BODY:\n", responseBody);

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

  console.log("SENDING RESPONSE...\n");

  const request = https.request(options, function(response) {
    console.log("STATUS: " + response.statusCode);
    console.log("HEADERS: " + JSON.stringify(response.headers));
    // Tell AWS Lambda that the function execution is done
    context.done();
  });

  request.on("error", function(error) {
    console.log("sendResponse Error:" + error);
    // Tell AWS Lambda that the function execution is done
    context.done();
  });

  // write data to request body
  request.write(responseBody);
  request.end();
}
