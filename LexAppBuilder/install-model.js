/*
# Copyright 2017-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0.
 */

const processor = require('./ModelBuilder.js');
let generateYamlOnly = false;

function usage() {
  console.log("Invalid command system. Please use: ");
  console.log("node install-model.js --botname YourBotName --model jsonfilepath --s3 s3bucketname [--region us-east-1] --generateYamlOnly");
}

const argv = require('minimist')(process.argv.slice(2));

if (argv.botname === undefined) {
  usage();
  return;
}

if (argv.model === undefined) {
  usage();
  return;
}

if (argv.s3 === undefined) {
  usage();
  return;
}

let region = argv.region;
if (region === undefined || region === true || region.length === 0) {
  region = process.env.AWS_REGION;
  if (region === undefined || region.length === 0) {
    console.error("Please either specify the region use --region or set the environment variable AWS_REGION");
    usage();
    return;
  }
}

if (argv.generateYamlOnly) {
  generateYamlOnly = true;
}

processor.constructModel(argv.botname, argv.model, argv.s3, region, generateYamlOnly);
