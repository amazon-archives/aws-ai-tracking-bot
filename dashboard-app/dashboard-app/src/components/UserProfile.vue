/*
# Copyright 2017-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0.
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
import Logger from '../logger';

const jwt = require('jsonwebtoken');

Vue.use(Vuetify);

/* eslint-disable no-new, no-alert, func-names, no-unused-vars, object-shorthand,
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
    Logger.debug('mounted UserProfile. user: ' + this.username);
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
      const decoded = jwt.decode(localStorage.getItem('idtokenjwt'), { complete: true });
      if (decoded) {
        if (decoded.payload) {
          if (decoded.payload.email) {
            v = decoded.payload.email;
          }
          if (decoded.payload.preferred_username) {
            v = decoded.payload.preferred_username;
          }
        }
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
