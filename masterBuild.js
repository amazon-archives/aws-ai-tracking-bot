/*
# Copyright 2017-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0.
 */

const cp = require('child_process');
const fs = require('fs');
const AWS = require('aws-sdk');
const argv = require('minimist')(process.argv.slice(2));
const bootstrap_bucket = (argv["bootstrap-bucket"] !== undefined) ? argv["bootstrap-bucket"] : undefined;
const bootstrap_bucket_artifacts = "artifacts";
const bootstrap_bucket_path = bootstrap_bucket + "/" + bootstrap_bucket_artifacts;
const webapp_bucket_dashboard = (argv["webapp-bucket-dashboard"] != undefined) ? argv["webapp-bucket-dashboard"] : process.env.WEBAPP_BUCKET_DASHBOARD;
const botname = (argv.botname != undefined) ? argv.botname : process.env.BOTNAME;
const region = (argv.region != undefined) ? argv.region : process.env.AWS_DEFAULT_REGION;
let model = (argv.model != undefined) ? argv.model : process.env.MODEL;
const cognito_poolid = (argv["cognito-poolid"] !== undefined) ? argv["cognito-poolid"] : undefined;

function usage() {
  console.error("Invalid options or environment");
  console.error("node masterBuild.js " +
    "--bootstrap-bucket bucket " +
    "--webapp-bucket-dashboard bucket" +
    "--botname botname " +
    "--model modelfilepath "  +
    "--cognito-poolid poolid " +
    "--region us-east-1 ");
}

if (webapp_bucket_dashboard === undefined) {
  usage();
  return;
} else {
  process.env.WEBAPP_BUCKET_DASHBOARD =  webapp_bucket_dashboard;
}

if (bootstrap_bucket === undefined) {
  usage();
  return;
} else {
  process.env.BOOTSTRAP_BUCKET_PATH =  bootstrap_bucket_path;
}

if (region === undefined) {
  usage();
  return;
} else {
  const awsConfig = {
    region: region
  };
  AWS.config.update(awsConfig);
  process.env.AWS_REGION = region;
}

if (botname === undefined) {
  usage();
  return;
} else {
  process.env.BOT_NAME =  botname;
}

if (cognito_poolid === undefined) {
  usage();
  return;
} else {
  process.env.POOL_ID =  cognito_poolid;
}

if (model === undefined) {
  model = "LexAppBuilder/model/TrackingBotModel.json";
}

validateModel(model).then(function (result) {
  console.info("Model validation complete");
}, function (error) {
  console.error("Invalid model detected");
  process.exitCode = 1;
  process.exit(process.exitCode);
});

/**
 * Copy TrackingBotModel to dashboard-app for use in the dashboard
 */

copyFile(model,"dashboard-app/dashboard-app/src/assets/TrackingBotModel.json")
  .then( function(data) {
    console.info("data returned: " + JSON.stringify(data,null,2));
    if (data) {
      console.info("Lex Model copy complete to dashboard-app");
    }
    makeDashboardUi(cp).then(function (data) {
      if (data) {
        console.info("finished making dashboard ui");
      }
      makeLexApp(cp).then(function (data) {
        if (data) {
          console.info("finished making lex bot");
        }
      }, function(error) {
        console.error("failed to create lex app and bot: " + JSON.stringify(error,null,2));
        process.exitCode = 1;
      });
    }, function (error) {
      console.error("failed to create dashboard web ui: " + JSON.stringify(error,null,2));
      process.exitCode = 1;
    })
  }, function(error) {
    console.info("Lex Model copy to dashboard-app failed: " + JSON.stringify(error,null,2));
    process.exitCode = 1;
  });

function makeDashboardUi(cp) {
  return new Promise(function (resolve, reject) {
    process.chdir('dashboard-app');
    let out = cp.spawnSync('make', ['build']);
    console.log("stdout");
    console.log(out.stdout.toString("utf8"));
    console.log("stderr");
    console.log(out.stderr.toString("utf8"));
    if (out.status !== 0) {
      reject(out.error);
    }
    out = cp.spawnSync('make', ['s3deploy']);
    console.log("stdout");
    console.log(out.stdout.toString("utf8"));
    console.log("stderr");
    console.log(out.stderr.toString("utf8"));
    if (out.status !== 0) {
      reject(out.error);
    }
    process.chdir('..');
    resolve();
  });
}

function makeLexApp(cp) {
  return new Promise(function (resolve, reject) {
    const absModelPath = fs.realpathSync(model);
    process.chdir('LexAppBuilder');
    const out = cp.spawnSync('node', ['install-model.js',
      '--botname', botname,
      '--model', absModelPath,
      '--s3', bootstrap_bucket,
      '--region', region]);
    console.info("stdout");
    console.info(out.stdout.toString("utf8"));
    console.info("stderr");
    console.info(out.stderr.toString("utf8"));
    if (out.status !== 0) {
      reject(out.error);
    }
    process.chdir('..');
    resolve();
  });
}

function copyFile(source, target) {
  return new Promise(function(resolve, reject) {
    if (!fs.existsSync(source)) {
      reject("Source does not exist");
    }
    const rd = fs.createReadStream(source);
    rd.on('error', (err)=>{
      rd.destroy();
      wr.end();
      reject(err);
    });
    const wr = fs.createWriteStream(target);
    wr.on('error', (err)=>{
      rd.destroy();
      wr.end();
      reject(err);
    });
    wr.on('finish', ()=>{
      wr.end();
      resolve("success");
    });
    rd.pipe(wr);
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

function validateModel(model) {
  let data = {};
  data = readModel(model);
  const schema = readModel("LexAppBuilder/json_schema.json");

  return new Promise(function (resolve, reject) {
    const Validator = require('jsonschema').Validator;
    const v = new Validator();
    const result = v.validate(data, schema);
    if (result.valid === false) {
      console.error("Model failed to validate: " + JSON.stringify(result.errors,null,2));
      reject (result);
    } else {
      resolve(result);
    }
  });
}






