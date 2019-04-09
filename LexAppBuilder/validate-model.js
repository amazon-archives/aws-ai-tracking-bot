/*
# Copyright 2017-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0.
 */

const processor = require('./ModelBuilder.js');

function usage() {
  console.log("Invalid command system. Please use: ");
  console.log("node validate-model.js --model jsonfilepath");
}

const argv = require('minimist')(process.argv.slice(2));

if (argv.model === undefined) {
  usage();
  return;
}


processor.validateModel(argv.model).then(function(data) {
  console.log("Model validated");
}, function (error) {
  for (let x = 0; x<error.errors.length; x++) {
    const idx = x+1;
    console.error("Error: " + idx);
    console.error(JSON.stringify(error.errors[x].property));
    console.error(JSON.stringify(error.errors[x].message));
  }
});
