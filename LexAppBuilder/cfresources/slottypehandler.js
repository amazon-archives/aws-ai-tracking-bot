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
  logger.info("slottypehandler: " + JSON.stringify(event, null, 2));
  if (event.RequestType === "Create") {
    const properties = event.ResourceProperties;
    const slottypename = properties.SlotTypeName;
    const values = properties.Values;
    const slottype = new SlotType.SlotType(slottypename);
    slottype.setLogLevel(currentLogLevel);
    slottype.setDescription(slottypename);
    for (var k in values) {
      slottype.addType(values[k]);
    }
    slottype.createSlotType(function (err, data) {
      if (err) {
        logger.error("Could not create slot type: " + JSON.stringify(slottype, null, 2) + "\nError message: " + JSON.stringify(err, null, 2));
        sendResponse(event, context, "FAILED", err, undefined);
      } else {
        logger.info("Created slot type: " + slottype.name + "data: " + JSON.stringify(data,null,2));
        const respData = new Object();
        sendResponse(event, context, "SUCCESS", respData, undefined);
      }
    });
  } else if (event.RequestType === "Delete") {
    const properties = event.ResourceProperties;
    const slottypename = properties.SlotTypeName;
    const slottype = new SlotType.SlotType(slottypename);

    function performDelete(slottype, count) {
      slottype.delete(function (err,data) {
        if (err) {
          logger.error("Could not delete slot type: " + JSON.stringify(slottype, null, 2) + "\nError message: " + JSON.stringify(err, null, 2));
          if (err.code === "ConflictException" && count < 6) {
            const delay = randomIntFromInterval(5,30);
            logger.error("ConflictException retrying delete of SlotType in " + delay + " seconds");
            setTimeout(function () {
              performDelete(slottype, count+1);
            }, delay*1000);
          } else {
            sendResponse(event, context, "FAILED", err, undefined);
          }
        } else {
          logger.info("Deleted slot type: " + slottype.name + "data: " + JSON.stringify(data,null,2));
          const respData = new Object();
          sendResponse(event, context, "SUCCESS", respData, undefined);
        }
      });
    }
    performDelete(slottype,0);

  } else if (event.RequestType === "Update") {

    const physicalResourceId = event.PhysicalResourceId;
    const properties = event.ResourceProperties;
    const slottypename = properties.SlotTypeName;
    const values = properties.Values;
    const slottype = new SlotType.SlotType(slottypename);
    slottype.setLogLevel(currentLogLevel);

    function performUpdate(slottype, count) {
      slottype.update(function (err, data) {
        if (err) {
          logger.error("Could not update slot type: " + JSON.stringify(slottype, null, 2) + "\nError message: " + JSON.stringify(err, null, 2));
          if (err.code === "ConflictException" && count < 3) {
            logger.error("ConflictException retrying update of SlotType in 15 seconds");
            setTimeout(function () {
              performUpdate(slottype, count + 1);
            }, 15000);
          } else {
            sendResponse(event, context, "FAILED", err, physicalResourceId);
          }
        } else {
          logger.info("Update slot type: " + slottype.name + "data: " + JSON.stringify(data, null, 2));
          const respData = new Object();
          sendResponse(event, context, "SUCCESS", respData, physicalResourceId);
        }
      });
    }

    slottype.retrieveDefinition(function (err, data) {
      if (err) {
        logger.error("Update could not retrieve current slot type: " + JSON.stringify(slottype, null, 2) + "\nError message: " + JSON.stringify(err, null, 2));
        sendResponse(event, context, "FAILED", err, physicalResourceId);
      } else {
        var checksum = data.checksum;
        slottype.checksum = checksum;
        slottype.setDescription(slottypename);
        for (var k in values) {
          slottype.addType(values[k]);
        }
        performUpdate(slottype, 0);
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

function randomIntFromInterval(min,max) {
  return Math.floor(Math.random()*(max-min+1)+min);
}
