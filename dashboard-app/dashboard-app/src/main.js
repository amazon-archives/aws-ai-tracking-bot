/* eslint-disable max-len */

/*
 Copyright 2017-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.

 Licensed under the Amazon Software License (the "License"). You may not use this file
 except in compliance with the License. A copy of the License is located at

 http://aws.amazon.com/asl/

 or in the "license" file accompanying this file. This file is distributed on an "AS IS"
 BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, express or implied. See the
 License for the specific language governing permissions and limitations under the License.
 */

// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.

/* eslint-disable no-new, no-console, no-unused-vars, prefer-template, prefer-arrow-callback, func-names */

import Vue from 'vue';
import { VTooltip } from 'v-tooltip';
import VueCookies from 'vue-cookies';
import AWS from 'aws-sdk';
import App from './App';

Vue.config.productionTip = false;
Vue.directive('my-tooltip', VTooltip);
Vue.use(VueCookies);

/**
 * Set in index.html to drive multiple components
 */
const poolId = localStorage.getItem('poolid');
const region = localStorage.getItem('awsregionname');
const idtoken = localStorage.getItem('idtokenjwt');

console.log('idtoken is: ' + idtoken);
/**
 * Initializes credentials
 */
function initCredentials() {
  const credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: poolId,
    Logins: {
      'cognito-idp.us-east-1.amazonaws.com/us-east-1_K8EefyX8P': idtoken,
    },
  }, { region });
  return credentials;
}

const credentials = initCredentials();

credentials.getPromise().then(function () {
  console.log('promise returned: ' + JSON.stringify(credentials, null, 2));
  console.log('identityid: ' + credentials.identityId);
  localStorage.setItem('cognitoid', credentials.identityId);
  const awsConfig = new AWS.Config({ region, credentials });
  const app = new Vue({
    el: '#app',
    template: '<App :awsconfig=awsconfig />',
    components: {
      App,
    },
    data: {
      awsconfig: awsConfig,
    },
  });
}, function (err) {
  console.log('err: ' + err);
});

