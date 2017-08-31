/*
Copyright 2017-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.

Licensed under the Amazon Software License (the "License"). You may not use this file
except in compliance with the License. A copy of the License is located at

http://aws.amazon.com/asl/

or in the "license" file accompanying this file. This file is distributed on an "AS IS"
BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, express or implied. See the
License for the specific language governing permissions and limitations under the License.
*/

<template>
  <div id="app">
    <div id="userProfile">
      <userprofile ref="userprofile" @logout="logout"></userprofile>
    </div>
    <div id="reportContainer">
      <report ref="report"> </report>
    </div>
    <lex-web-ui v-on:updateLexState="onUpdateLexState"></lex-web-ui>
  </div>
</template>


<script>
/* eslint-disable no-console, prefer-arrow-callback, no-var, no-use-before-define
/* eslint-disable prefer-template, no-use-before-define, prefer-template */
/* eslint-disable no-undef, comma-dangle, no-multi-spaces, no-unused-vars, space-before-blocks */
/* eslint-disable no-unsafe-negation, no-shadow, no-extra-semi, eqeqeq, quotes */
/* eslint-disable space-before-function-paren, wrap-iife, func-names, max-len, no-alert, object-shorthand */

import Vue from 'vue';
import Vuex from 'vuex';
import Vuetify from 'vuetify';
import AWS from 'aws-sdk';
import LexRuntime from 'aws-sdk/clients/lexruntime';
import Polly from 'aws-sdk/clients/polly';
import { Plugin as LexWebUi, Store as LexWebUiStore } from 'aws-lex-web-ui';
import Report from './components/Report';
import UserProfile from './components/UserProfile';

Vue.use(Vuetify);
Vue.use(Vuex);

/**
 * defined in index.html for use in multiple components
 */
const poolId = localStorage.getItem('poolid');
const region = localStorage.getItem('awsregionname');
const idtoken = localStorage.getItem('idtokenjwt');
const poolName = localStorage.getItem('poolname');
const noauth = localStorage.getItem('noauth');

const config = {
  cognito: { poolId },
  lex: { botName: 'resolutionsdev', initialText: 'How can I help you?' },
  ui: { toolbarLogo: '', toolbarTitle: 'Resolutions' },
};

let credentials;
const logins = {};
logins[poolName] = idtoken;

if (noauth === 'true') {
  credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: poolId,
  }, { region });
} else {
  credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: poolId,
    Logins: logins,
  }, { region });
}

const localConfig = new AWS.Config({ region, credentials });
const store = new Vuex.Store(LexWebUiStore);
const lexRuntimeClient = new LexRuntime(localConfig);
const pollyClient = new Polly(localConfig);

Vue.component('report', Report);
Vue.component('userprofile', UserProfile);

Vue.use(LexWebUi, { config, awsConfig: localConfig, lexRuntimeClient, pollyClient, store });

export default {
  name: 'app',
  data() {
    return {
    };
  },
  props: ['awsconfig'],
  store: store,
  beforeCreate() {
  },
  mounted() {
    console.log('awsconfig pass as properties: ' + JSON.stringify(this.awsconfig, null, 2));
    console.log('region', this.awsconfig.region);
    const child = this.$refs.report;
    child.setCredentials(this.awsconfig.credentials);
    child.performUpdate(this.awsconfig.credentials, config.lex.botName, region);
    console.info('App Vue Mounted');
  },
  methods: {
    onUpdateLexState(lexState) {
      console.log('handle update: ' + JSON.stringify(lexState, null, 2));
      if (lexState.dialogState === 'Fulfilled') {
        const child = this.$refs.report;
        child.performUpdate(this.awsconfig.credentials, config.lex.botName, region);
      }
    },
    logout () {
      console.log('logout');
      window.location.href = 'index.html?dosignout';
    }
  },
};

</script>

<style>
  @import '../node_modules/roboto-fontface/css/roboto/roboto-fontface.css';
  @import '../node_modules/material-design-icons/iconfont/material-icons.css';
  @import '../node_modules/vuetify/dist/vuetify.min.css';
  @import '../node_modules/aws-lex-web-ui/dist/lex-web-ui.css';
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 15px;
}

#userProfile {
  width: 100%;
}


#lex-web {
  width: 35%;
  height: 85%;
  position: absolute;
  right: 0px;
  top: 0px;
  margin-right: 10px;
}
</style>
