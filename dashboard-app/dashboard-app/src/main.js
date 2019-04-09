/* eslint-disable max-len */

/*
# Copyright 2017-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0.
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

