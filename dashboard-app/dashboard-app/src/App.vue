/*
Copyright 2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the
License. A copy of the License is located at

http://aws.amazon.com/apache2.0/

or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES
OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions
and limitations under the License.
*/

<template>
  <div id="app">
    <div id="reportContainer">
      <report ref="report"> </report>
    </div>
  </div>
</template>


<script>
/* eslint-disable no-console, prefer-arrow-callback, no-var, no-use-before-define
/* eslint-disable prefer-template, no-use-before-define, prefer-template */
/* eslint-disable no-undef, comma-dangle, no-multi-spaces, no-unused-vars, space-before-blocks */
/* eslint-disable no-unsafe-negation, no-shadow, no-extra-semi, eqeqeq, quotes */
/* eslint-disable space-before-function-paren, wrap-iife, func-names, max-len */
import botLoader from './bot-loader-vue';
import Report from './components/Report';

export default {
  name: 'app',
  components: {
    Report,
  },
  mounted() {
    var child = this.$refs.report;
    console.info('App Vue Mounted');
    botLoader(document, window, child);
  },
};

</script>


<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}

#reportContainer {
  margin-right: 50%
}
</style>
