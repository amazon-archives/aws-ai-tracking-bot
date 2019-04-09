/*
# Copyright 2017-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0.
 */

const cp = require('child_process');
const fs = require('fs');
const AWS = require('aws-sdk');
const UUID = require('uuid-js');
const argv = require('minimist')(process.argv.slice(2));
const bootstrap_bucket = (argv["bootstrap-bucket"] !== undefined) ? argv["bootstrap-bucket"] : undefined;
const bootstrap_bucket_artifacts = "artifacts";
const bootstrap_bucket_path = bootstrap_bucket + "/" + bootstrap_bucket_artifacts;
const botname = (argv.botname != undefined) ? argv.botname : process.env.BOTNAME;
const region = (argv.region != undefined) ? argv.region : process.env.AWS_DEFAULT_REGION;
const cognito_poolid = (argv["cognito-poolid"] !== undefined) ? argv["cognito-poolid"] : undefined;

function usage() {
  console.error("Invalid options or environment");
  console.error("node masterBuildAndroid.js " +
    "--bootstrap-bucket bucket " +
    "--botname botname " +
    "--cognito-poolid poolid " +
    "--region us-east-1 ");
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

updateAndroidConfigFile(cognito_poolid, botname, region).then(function (data) {
  makeAndroidApp(cp).then(function (data) {
    if (data) {
      console.log("finished building Android App");
    }
  }, function (error) {
    console.log("failed to build Android App: " + error);
    process.exitCode = 1;
  })
}, function (error) {
  console.log("failed to update Android configuration file: " + error);
  process.exitCode = 1;
});

function updateAndroidConfigFile(poolId, botname, region) {
  return new Promise(function (resolve) {
    obj = {};
    obj.config = {};
    let uuid4 = UUID.create();
    obj.config.BOTNAME = botname;
    obj.config.AWS_MOBILEHUB_USER_AGENT = "MobileHub " + uuid4.toString() + " aws-my-sample-app-android-v0.17";
    obj.config.AMAZON_COGNITO_REGION = region;
    obj.config.AMAZON_COGNITO_IDENTITY_POOL_ID = poolId;
    obj.config.AMAZON_DYNAMODB_REGION = region;
    fs.writeFileSync('TrackingBot-aws-my-sample-app-android/MySampleApp/app/src/main/res/raw/awsconfig.json', JSON.stringify(obj, null, 2) , 'utf-8');
    resolve("success");
  });
}

function makeAndroidApp(cp) {
  return new Promise(function (resolve, reject) {
    console.log("starting to build android app");
    let out = cp.spawnSync('sh', ['buildAndroid.sh']);
    console.log("stdout");
    console.log(out.stdout.toString("utf8"));
    console.log("stderr");
    console.log(out.stderr.toString("utf8"));
    if (out.status !== 0) {
      reject(out.error);
    }
    process.chdir('../..');
    resolve();
  });
}







