/*
# Copyright 2017-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0.
 */

var exports = module.exports = {};
const AWS = require('aws-sdk');
const AdmZip = require('adm-zip');
const fs = require('fs');
const moment = require('moment');
const logger = require('./core/logger.js');
const SlotType = require("./lex/SlotType");
const Intent = require("./lex/Intent");
const Bot = require("./lex/Bot");
const targetOutputFolder = "./output";

let myRegion = '';
let computedStackName = '';
let currentLogLevel;

logger.setLogLevel('info');
currentLogLevel = 'info';

exports.setLogLevel = function (level) {
  logger.setLogLevel(level);
  currentLogLevel = level;
};

exports.constructModel = function (name, modelFile, s3bucket, region, generateYamlOnly) {

  const botName = enforceSyntax(name);
  computedStackName = botName + "LexAppStack";
  buildTargetOutputFolder(targetOutputFolder);
  fs.writeFileSync(targetOutputFolder + "/model.json", fs.readFileSync(modelFile));

  const model = {};
  model.data = readModel(modelFile);
  if (model.data === undefined) {
    logger.error("Model file read error. Processing stopped");
    process.exitCode = 1;
    return;
  }

  myRegion = region;
  const awsConfig = {
    region: region
  };
  AWS.config.update(awsConfig);

  fs.writeFileSync(targetOutputFolder + "/processBotInfo" + botName + ".py", fs.readFileSync("processBotInfo.py"));

  const timestamp = moment().unix();
  logger.info("timestamp is: " + timestamp);

  if (generateYamlOnly === true) {
    logger.info(buildBot(botName, model, "!GetAtt lambdaFunction.Arn"));
    return;
  }

  createServiceLinkedRoleForLex().then(function (result) {
    logger.debug("result from createServiceLinkedRoleForLex: " + JSON.stringify(result,null,2));
    buildFunctionZipInS3(botName, model, s3bucket, timestamp).then(function (result) {
      logger.debug("result from buildFunctionZipInS3: " + JSON.stringify(result,null,2));
      buildCFCustomResourcesZipInS3(botName, s3bucket, timestamp).then(function (result) {
        logger.debug("result from buildCFCustomResourcesZipInS3: " + JSON.stringify(result,null,2));
        const cf_file = buildBot(botName, model, "!GetAtt lambdaFunction.Arn");
        uploadYamlToS3(cf_file, botName, s3bucket).then(function (result) {
          logger.debug("result from uploadYamlToS3: " + JSON.stringify(result,null,2));
          executeCFTemplateFromS3ForLexApp(botName, computedStackName, s3bucket, timestamp, cf_file)
            .then(function (result) {
              logger.debug("result from executeCFTemplateFromS3ForLexApp: " + JSON.stringify(result,null,2));
              logger.info("Finished executing CF Template");
            }, function (err) {
              logger.error("Could not complete executing CF Template " + err, err);
              process.exitCode = 1;
            });
          }, function (err) {
          logger.error("Could not upload yaml file to s3" + err, err);
          process.exitCode = 1;
        })
      }, function (err) {
        logger.error("Could not build custom resources zip in s3" + err, err);
        process.exitCode = 1;
      });
    }, function (err) {
      logger.error("Could not build function zip in s3" + err, err);
      process.exitCode = 1;
    });
  }, function (err) {
    logger.error("Could not create service linked role for lex:" + err, err);
    process.exitCode = 1;
  });
};

function buildFunctionZipInS3(botName, model, s3bucket, timestamp) {
  return new Promise(function (resolve, reject) {
    const zip = new AdmZip();
    zip.addLocalFile(targetOutputFolder + "/model.json");
    zip.addLocalFile(targetOutputFolder + "/processBotInfo" + botName + ".py");
    const localZipName = targetOutputFolder + "/processBotInfo" + botName + ".zip";
    zip.writeZip(localZipName);

    const s3 = new AWS.S3();
    const params = {
      Bucket: s3bucket,
      Key: "artifacts/processBotInfo" + botName + timestamp + ".zip",
      Body: fs.createReadStream(localZipName)
    };

    s3.putObject(params, function (err, data) {
      if (err) {
        logger.error("Could not add zip to s3 bucket. Pipeline stopped: " + err, err.stack);
        reject(err);
      }
      else {
        logger.info("S3 put of Lambda function code successful.");
        logger.debug("S3 data " + JSON.stringify(params, null, 2));
        resolve(data);
      }
    });
  });
}

function uploadYamlToS3(yaml, botName, s3bucket) {
  return new Promise(function (resolve, reject) {
    const s3 = new AWS.S3();
    const params = {
      Bucket: s3bucket,
      Key: 'artifacts/lex' + botName + '.yaml',
      Body: fs.createReadStream(yaml)
    };

    s3.putObject(params, function (err, data) {
      if (err) {
        logger.error("Could not add yaml to s3 bucket. Pipeline stopped: " + err, err.stack);
        reject(err);
      }
      else {
        logger.info("S3 put of yaml template succeeded.");
        logger.debug("S3 data " + JSON.stringify(params, null, 2));
        resolve(data);
      }
    });
  });
}

function buildCFCustomResourcesZipInS3(botName, s3bucket, timestamp) {
  return new Promise(function (resolve, reject) {
    const zip = new AdmZip();
    zip.addLocalFile("cfresources/bothandler.js");
    zip.addLocalFile("cfresources/intenthandler.js");
    zip.addLocalFile("cfresources/slottypehandler.js");
    zip.addLocalFile("cfresources/package.json");
    zip.addLocalFolder("lex", "lex");
    zip.addLocalFolder("core", "core");
    const localZipName = targetOutputFolder + "/cfresources" + botName + ".zip";
    zip.writeZip(localZipName);

    const s3 = new AWS.S3();

    const params = {
      Bucket: s3bucket,
      Key: "artifacts/custom-resources" + timestamp + ".zip",
      Body: fs.createReadStream(localZipName)
    };

    s3.putObject(params, function (err, data) {
      if (err) {
        logger.error("Could not add zip to s3 bucket. Pipeline stopped: " + err, err.stack);
        reject(err);
      }
      else {
        logger.info("S3 put of cf handler functions code successful.");
        logger.debug("S3 data " + JSON.stringify(params, null, 2));
        resolve(data);
      }
    });
  });
}

function executeCFTemplateFromS3ForLexApp(botname, stackname, s3bucket, timestamp, file) {
  let body = "";
  return new Promise(function (resolve, reject) {
    const cloudformation = new AWS.CloudFormation();
    if (fs.existsSync(file)) {
      body = fs.readFileSync(file, 'utf8');
    } else {
      reject("File not found: " + file);
    }

    const createParams = {
      StackName: stackname,
      Capabilities: [
        'CAPABILITY_IAM', 'CAPABILITY_NAMED_IAM'
      ],
      OnFailure: 'DO_NOTHING',
      Parameters: [
        {
          ParameterKey: 'BaseModelName',
          ParameterValue: botname,
          UsePreviousValue: false
        },
        {
          ParameterKey: 'S3CodeBucket',
          ParameterValue: s3bucket,
          UsePreviousValue: false
        },
        {
          ParameterKey: 'CustomResourceCodeObject',
          ParameterValue: "artifacts/custom-resources" + timestamp + ".zip",
          UsePreviousValue: false
        },
        {
          ParameterKey: 'BotProcessorCodeObject',
          ParameterValue: "artifacts/processBotInfo" + botname + timestamp + ".zip",
          UsePreviousValue: false
        }
      ],
      TemplateURL: 'https://s3.amazonaws.com/' + s3bucket + '/artifacts/lex' + botname + '.yaml',
      TimeoutInMinutes: 45
    };

    const updateParams = {
      Capabilities: [
        'CAPABILITY_IAM', 'CAPABILITY_NAMED_IAM'
      ],
      Parameters: [
        {
          ParameterKey: 'BaseModelName',
          ParameterValue: botname,
          UsePreviousValue: false
        },
        {
          ParameterKey: 'S3CodeBucket',
          ParameterValue: s3bucket,
          UsePreviousValue: false
        },
        {
          ParameterKey: 'CustomResourceCodeObject',
          ParameterValue: "artifacts/custom-resources" + timestamp + ".zip",
          UsePreviousValue: false
        },
        {
          ParameterKey: 'BotProcessorCodeObject',
          ParameterValue: "artifacts/processBotInfo" + botname + timestamp + ".zip",
          UsePreviousValue: false
        }
      ],
      StackName: stackname,
      TemplateURL: 'https://s3.amazonaws.com/' + s3bucket + '/artifacts/lex' + botname + '.yaml'
    };

    findExistingCFStack(stackname).then(function (data) {
      if (data) {
        if (data.Stacks[0].StackStatus === "CREATE_COMPLETE" ||
          data.Stacks[0].StackStatus === "UPDATE_COMPLETE" ||
          data.Stacks[0].StackStatus === "UPDATE_ROLLBACK_COMPLETE") {
          logger.info("Stack already exists. Calling in update mode.");
          cloudformation.updateStack(updateParams, function (err, data) {
            logger.debug("data from updateStack: " + JSON.stringify(data, null, 2));
            if (err) {
              if (err.statusCode === 400 && err.code === "ValidationError"
                && err.message === "No updates are to be performed.") {
                logger.info("No updates to perform.");
                resolve(err);
              } else {
                logger.error(err, err.stack);
                reject(err);
              }
            }
            else {
              logger.info("Initiated update of cloud formation stack.");
              const waitParams = {
                StackName: stackname
              };
              cloudformation.waitFor('stackUpdateComplete', waitParams, function (err, data) {
                if (err) {
                  logger.error("Unsuccessful stack update");
                  reject(err);
                } else {
                  logger.info("Successful stack update");
                  resolve(data);
                }
              });
            }
          });
        } else {
          logger.error("Stack already exists however is not in a stack where the build can proceed.");
          logger.error("Please inspect the stack. To recover please delete the stack and rebuild.");
          logger.error(JSON.stringify(data,null,2));
          reject("Existing CloudFormation LexAppStack is in a state where the build can't proceed.");
        }
      } else {
        cloudformation.createStack(createParams, function (err, data) {
          if (err) {
            logger.error(err, err.stack);
            reject(err);
          }
          else {
            logger.debug("data from createStack: " + JSON.stringify(data,null,2));
            logger.info("Initiated creation of cloud formation stack.");
            const waitParams = {
              StackName: stackname
            };
            cloudformation.waitFor('stackCreateComplete', waitParams, function (err, data) {
              if (err) {
                logger.error("Unsuccessful stack creation");
                reject(err);
              } else {
                logger.info("Successful stack creation");
                resolve(data);
              }
            });
          }
        });
      }
    });
  });
}

function buildBot(botName, model, lambdaFunctionArn) {
  const bot = new Bot.Bot(botName, model.data.bot.description);
  bot.addAbortStatement(model.data.bot.abortStatement, "PlainText");
  bot.addClarificationPrompt(5, model.data.bot.clarificationPrompt, "PlainText");
  bot.setVoiceId("Joanna");
  bot.setProcessBehavior("BUILD");

  const numCategories = model.data.bot.categories.length;
  const intentsToCreate = [];
  const slotsToBuild = [];

  if (model.data.bot.allowUserToClearMetrics === "true") {
    let intentName = "ClearMetricsForDate" + botName;
    const intent = new Intent.Intent(intentName, "Intent to support clearing metrics for a specified date");
    intent.addSampleUtterance("Clear data for {DayPrefix}");
    intent.addSlot("DayPrefix", "auto generated", "AMAZON.DATE", "Required", "PlainText", "What day do you want to clear?", 3);
    intent.addConfirmationPrompt(3, "Are you sure you want to clear information for {DayPrefix}?", "PlainText");
    intent.addRejectionStatement("Ok, nothing has been changed.", "PlainText");
    intent.addConlusionStatement("I've completed your request.", "PlainText");
    intent.addFulfillmentActivity(lambdaFunctionArn);
    intentsToCreate[intentsToCreate.length] = intent;
    bot.addIntent("$LATEST", intentName);

    let intentNameReset = "ResetAllMetrics" + botName;
    const intentReset = new Intent.Intent(intentNameReset, "Intent to support clearing all info for a user");
    intentReset.addSampleUtterance("Reset all");
    intentReset.addConfirmationPrompt(3, "Are you sure you want to reset all your information?", "PlainText");
    intentReset.addRejectionStatement("Ok, nothing has been changed.", "PlainText");
    intentReset.addConlusionStatement("I've completed your request.", "PlainText");
    intentReset.addFulfillmentActivity(lambdaFunctionArn);
    intentsToCreate[intentsToCreate.length] = intentReset;
    bot.addIntent("$LATEST", intentNameReset);
  }

  for (let i = 0; i < numCategories; i++) {

    const slottypeVerbName = "Verb" + model.data.bot.categories[i].name + botName;
    const slottypeObjectName = "Object" + model.data.bot.categories[i].name + botName;
    const slottypeUnitsName = "Units" + model.data.bot.categories[i].name + botName;

    const slottypeVerb = generateSlotType(slottypeVerbName.toLowerCase(), model.data.bot.categories[i].verb.values, false);
    if (slottypeVerb) {
      slotsToBuild[slotsToBuild.length] = slottypeVerb;
    }

    let autoPlurals = false;
    if (model.data.bot.categories[i].object.autoPlurals && model.data.bot.categories[i].object.autoPlurals.toLowerCase() === 'yes') {
      autoPlurals = true;
    }
    const slottypeObject = generateSlotType(slottypeObjectName.toLowerCase(), model.data.bot.categories[i].object.values, autoPlurals);
    if (slottypeObject) {
      slotsToBuild[slotsToBuild.length] = slottypeObject;
    }

    const slottypeUnits = generateSlotType(slottypeUnitsName.toLowerCase(), model.data.bot.categories[i].units.values, false);
    if (slottypeUnits) {
      slotsToBuild[slotsToBuild.length] = slottypeUnits;
    }

    let intentName = model.data.bot.categories[i].name + botName;
    let intent = new Intent.Intent(intentName, model.data.bot.categories[i].description);
    logger.debug("Intent: " + intent.data.name);

    const amazonType = model.data.bot.categories[i].qty.type.split(".");
    const qtySlotName = "RawValue" + amazonType[1];
    const qtyDefinition = " {" + qtySlotName + "}";
    let slottypeUnitsToUse = "";
    if (slottypeUnits) {
      slottypeUnitsToUse = "{" + slottypeUnitsName + "}";
    }

    if (model.data.bot.categories[i].verb.prefix.length === 0) {
      model.data.bot.categories[i].verb.prefix[0] = "";
    }

    if (model.data.bot.categories[i].object.prefix.length === 0) {
      model.data.bot.categories[i].object.prefix[0] = "";
    }

    if (model.data.bot.categories[i].qty.prefix.length === 0) {
      model.data.bot.categories[i].qty.prefix[0] = "";
    }

    for (let x = 0; x<model.data.bot.categories[i].verb.prefix.length; x++) {
      for (let y = 0; y<model.data.bot.categories[i].object.prefix.length; y++) {
        for (let z = 0; z<model.data.bot.categories[i].qty.prefix.length; z++) {
          intent.addSampleUtterance(model.data.bot.categories[i].verb.prefix[x] + " {" + slottypeVerbName  + "} "
            + model.data.bot.categories[i].object.prefix[y] + " {" + slottypeObjectName +"} "
            + model.data.bot.categories[i].qty.prefix[z] + " " + qtyDefinition + " " + slottypeUnitsToUse + " {DayPrefix}");

          intent.addSampleUtterance(model.data.bot.categories[i].verb.prefix[x] + " {" + slottypeVerbName  + "} "
            + "{DayPrefix} " + model.data.bot.categories[i].object.prefix[y] + " {" + slottypeObjectName +"} "
            + model.data.bot.categories[i].qty.prefix[z] + " " + qtyDefinition + " " + slottypeUnitsToUse );

          intent.addSampleUtterance(model.data.bot.categories[i].verb.prefix[x] + " {" + slottypeVerbName  + "} "
            + model.data.bot.categories[i].qty.prefix[z] + " " + qtyDefinition + " " + slottypeUnitsToUse + " "
            + model.data.bot.categories[i].object.prefix[y] + " {" + slottypeObjectName +"} {DayPrefix}");

          intent.addSampleUtterance(model.data.bot.categories[i].qty.prefix[z] + " " + qtyDefinition + " " + slottypeUnitsToUse + " "
            + " {DayPrefix} " + model.data.bot.categories[i].verb.prefix[x] + " {" + slottypeVerbName  + "} "
            + model.data.bot.categories[i].object.prefix[y] + " {" + slottypeObjectName +"}");

          intent.addSampleUtterance("{DayPrefix} " + model.data.bot.categories[i].verb.prefix[x] + " {" + slottypeVerbName  + "} "
            + model.data.bot.categories[i].object.prefix[y] + " {" + slottypeObjectName +"} "
            + model.data.bot.categories[i].qty.prefix[z] + " " + qtyDefinition + " " + slottypeUnitsToUse );
        }
      }
    }

    intent.addSlot("DayPrefix", "auto generated", "AMAZON.DATE", "Required", "PlainText", model.data.bot.categories[i].date.prompt, 3);
    intent.addSlot(qtySlotName, "auto generated", model.data.bot.categories[i].qty.type, "Required", "PlainText", model.data.bot.categories[i].qty.prompt, 3);

    if (slottypeUnits) {
      intent.addSlot(slottypeUnitsName, "auto generated", slottypeUnitsName.toLowerCase(), "Required", "PlainText", model.data.bot.categories[i].units.prompt, 3);
    }

    if (slottypeObject) {
      intent.addSlot(slottypeObjectName, "auto generated", slottypeObjectName.toLowerCase(), "Required", "PlainText", model.data.bot.categories[i].object.prompt, 3);
    }

    if (slottypeVerb) {
      intent.addSlot(slottypeVerbName, "auto generated", slottypeVerbName.toLowerCase(), "Required", "PlainText", model.data.bot.categories[i].verb.prompt, 3);
    }

    let confirmPrompt = model.data.bot.categories[i].confirmation;
    confirmPrompt = confirmPrompt.replace(/date/i, "DayPrefix");
    confirmPrompt = confirmPrompt.replace(/qty/i, "RawValue" + amazonType[1]);
    confirmPrompt = confirmPrompt.replace(/units/i, slottypeUnitsName);
    confirmPrompt = confirmPrompt.replace(/object/i, slottypeObjectName);
    intent.addConfirmationPrompt(3, confirmPrompt, "PlainText");
    intent.addConlusionStatement("Thank you.", "PlainText");
    intent.addRejectionStatement(model.data.bot.categories[i].cancel, "PlainText");
    intent.addFulfillmentActivity(lambdaFunctionArn);
    intent.addDialogCodeHook(lambdaFunctionArn);

    bot.addIntent("$LATEST", intentName);

    intentsToCreate[intentsToCreate.length] = intent;
  }

  return (generateYaml(bot));

  function generateSlotType(name, values, autoPlural) {
    if (values.length > 0) {
      const res = new SlotType.SlotType(name);
      res.setDescription(name);
      for (let k of values) {
        res.addType(k);
        if (autoPlural) {
          res.addType(k + 's');
        }
      }
      return res;
    } else {
      return undefined;
    }
  }

  function generateYaml(bot) {
    let res = getYamlTemplateContents('bot_header_template.yaml');

    let prevSlot = undefined;
    for (let s in slotsToBuild) {
      res += slotsToBuild[s].toYaml(prevSlot);
      prevSlot = slotsToBuild[s];
    }

    let prevIntent = undefined;
    for (let i in intentsToCreate) {
      res += intentsToCreate[i].toYaml(prevIntent, prevSlot);
      prevIntent = intentsToCreate[i];
    }

    res += bot.toYaml();
    res += getYamlTemplateContents('bot_trailer_template.yaml');
    const fname = __dirname + '/output/' + 'lex' + bot.data.name + '.yaml';
    fs.writeFileSync(fname, res);
    logger.info("yaml file created: " + fname);
    return (fname);
  }

  function getYamlTemplateContents(fname) {
    return(fs.readFileSync(__dirname + "/yaml/" + fname, 'utf8'));
  }
}

function findExistingCFStack(stackname) {
  const cloudformation = new AWS.CloudFormation();
  return new Promise(function (resolve, reject) {
    const params = {
      NextToken: ' ',
      StackName: stackname
    };
    cloudformation.describeStacks(params, function (err, data) {
      if (err) {
        logger.info("CF stack does not exit");
        resolve(undefined);
      } else {
        resolve(data);
      }
    });
  });
}

function createServiceLinkedRoleForLex() {
  return new Promise(function (resolve, reject) {
    const params = {
      AWSServiceName: 'lex.amazonaws.com', /* required */
      Description: 'Service linked role for lex'
    };
    const iam = new AWS.IAM();
    iam.createServiceLinkedRole(params, function (err, data) {
      if (err) {
        if (err.code === "InvalidInput"
          && err.message === "Service role name AWSServiceRoleForLexBots has been taken in this account, please try a different suffix.") {
          resolve("AlreadyDefined");
        } else {
          logger.error("Could not create service linked role: " + err, err.stack);
          reject(err);
        }
      } else {
        resolve(data);
      }
    });
  });
}

function readModel(modelFile) {
  try {
    return(JSON.parse(fs.readFileSync(modelFile, 'utf8')));
  } catch (e) {
    logger.error(e);
    return undefined;
  }
}

function buildTargetOutputFolder(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
}

function enforceSyntax(a) {
  let b = a.replace(/[0]/g, 'a');
  b = b.replace(/[1]/g, 'b');
  b = b.replace(/[2]/g, 'c');
  b = b.replace(/[3]/g, 'd');
  b = b.replace(/[4]/g, 'e');
  b = b.replace(/[5]/g, 'f');
  b = b.replace(/[6]/g, 'g');
  b = b.replace(/[7]/g, 'h');
  b = b.replace(/[8]/g, 'i');
  b = b.replace(/[9]/g, 'j');
  b = b.replace(/[\-]/g, 'k');
  return b;
}

exports.validateModel = function(modelFile) {
  var data = {};
  data = readModel(modelFile);
  var schema = readModel("json_schema.json");

  return new Promise(function (resolve, reject) {
    const Validator = require('jsonschema').Validator;
    const v = new Validator();
    var result = v.validate(data, schema);
    if (result.valid === false) {
      reject (result);
    } else {
      resolve(result);
    }
  });
}
