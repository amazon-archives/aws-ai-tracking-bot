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
  <div>
    <div class="username">
      {{ username }}
      <v-btn v-on:click.native="logout();" round primary dark small>logout</v-btn>
    </div>
  </div>
</template>

<script>

import AWS from 'aws-sdk';
import Vue from 'vue';
import Vuetify from 'vuetify';

Vue.use(Vuetify);

/* eslint-disable no-new, no-alert, no-console, func-names, no-unused-vars, object-shorthand,
   prefer-arrow-callback, prefer-template */

export default {
  name: 'UserProfile',
  data() {
    return {
      username: '',
    };
  },
  mounted() {
    this.username = this.obtainUsername();
  },
  methods: {
    logout: function (e) {
      this.$emit('logout');
    },
    obtainUsername() {
      let v = localStorage.getItem('username');
      if (v === undefined) {
        v = '';
      }

      const accessToken = localStorage.getItem('accesstokenjwt');
      const CognitoIdentityServiceProvider = AWS.CognitoIdentityServiceProvider;
      const cisp = new CognitoIdentityServiceProvider({ region: 'us-east-1' });
      const params = {
        AccessToken: accessToken,
      };
      cisp.getUser(params, function (err, data) {
        if (err) console.log('UserProfile getUser err:' + err, err.stack); // an error occurred
        else console.log('UserProfile getUser: ' + JSON.stringify(data, null, 2));           // successful response
      });

      return v;
    },
  },
};
</script>

<style>

.username {
  margin-top: 25px;
  margin-bottom: 10px;
  font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
  font-size: medium;
  font-weight: bold;
}

</style>
