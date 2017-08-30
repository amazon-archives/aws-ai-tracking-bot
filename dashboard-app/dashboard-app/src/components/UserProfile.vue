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

import Vue from 'vue';
import Vuetify from 'vuetify';

Vue.use(Vuetify);

/* eslint-disable no-new, no-alert, no-console, func-names, no-unused-vars, object-shorthand */

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
