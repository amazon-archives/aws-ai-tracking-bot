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

/* eslint-disable no-new, no-unused-vars, prefer-template, prefer-arrow-callback, func-names, no-else-return */

import Vue from 'vue';
import { VTooltip } from 'v-tooltip';
import VueCookies from 'vue-cookies';
import AWS from 'aws-sdk';
import App from './App';
import Logger from './logger';

Vue.config.productionTip = false;
Vue.directive('my-tooltip', VTooltip);
Vue.use(VueCookies);

/**
 * Set in index.html to drive multiple components
 */
const poolId = localStorage.getItem('poolid');
const region = localStorage.getItem('awsregionname');
const idtoken = localStorage.getItem('idtokenjwt');
const poolName = localStorage.getItem('poolname');
const noauth = localStorage.getItem('noauth');

Logger.debug('idtoken is: ' + idtoken);

/**
 * Initializes credentials
 */
function initCredentials() {
  const logins = {};
  logins[poolName] = idtoken;
  if (noauth === 'true') {
    const credentials = new AWS.CognitoIdentityCredentials({
      IdentityPoolId: poolId,
    }, { region });
    return credentials;
  } else {
    const credentials = new AWS.CognitoIdentityCredentials({
      IdentityPoolId: poolId,
      Logins: logins,
    }, { region });
    return credentials;
  }
}

const credentials = initCredentials();

credentials.getPromise().then(function () {
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
  Logger.error('err: ' + err);
});

