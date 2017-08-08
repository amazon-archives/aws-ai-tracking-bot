/*
 Copyright 2017-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.

 Licensed under the Amazon Software License (the "License"). You may not use this file
 except in compliance with the License. A copy of the License is located at

 http://aws.amazon.com/asl/

 or in the "license" file accompanying this file. This file is distributed on an "AS IS"
 BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, express or implied. See the
 License for the specific language governing permissions and limitations under the License.
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