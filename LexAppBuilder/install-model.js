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