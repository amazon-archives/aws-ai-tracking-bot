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
    <div class="username"> {{ username }} <button>logout</button></div>
  </div>
</template>

<script>

/* eslint-disable no-new, no-alert */
export default {
  name: 'UserProfile',
  data() {
    return {
      username: localStorage.getItem('username'),
    };
  },
  mounted() {
  },
  methods: {
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
