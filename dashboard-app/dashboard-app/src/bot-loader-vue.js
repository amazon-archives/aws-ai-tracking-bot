/* eslint-disable max-len */

/*
# Copyright 2017-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0.
 */

/* eslint-disable no-console, prefer-arrow-callback, no-var, no-use-before-define */
/* eslint-disable prefer-template, no-use-before-define, prefer-template */
/* eslint-disable no-undef, comma-dangle, no-multi-spaces, no-unused-vars, space-before-blocks */
/* eslint-disable no-unsafe-negation, no-shadow, no-extra-semi, eqeqeq, quotes */
/* eslint-disable space-before-function-paren, wrap-iife, func-names, max-len, no-multi-assign */

import model from './assets/TrackingBotModel.json';

export default function loadBot(document, window, child) {
  var OPTIONS = {
    // div container class to insert iframe
    containerClass: 'lex-chat',

    // iframe source uri. use embed=true query string when loading as iframe
    iframeSrcPath: '/index.html#/?embed=true',

    // AWS SDK script dynamically added to the DOM
    // https://github.com/aws/aws-sdk-js
    sdkLink: 'https://sdk.amazonaws.com/js/aws-sdk-2.46.0.min.js',
  };

  var config = {};
  var configUrl = '/static/iframe/config.json';
  var iframe;
  var container;
  var messageHandler = {};

  if (isSupported()) {
    // initialize iframe once the DOM is loaded
    document.addEventListener('DOMContentLoaded', main, false);
  } else {
    console.warn('chat bot not loaded - unsupported browser');
  }

  /**
   * Check if modern browser features used by chat bot are supported
   */
  function isSupported() {
    var features = [
      'localStorage',
      'Audio',
      'Blob',
      'Promise',
      'URL',
    ];
    return features.every(function(feature) {
      return feature in window;
    });
  }

  function main() {
    loadConfig(configUrl)
    .then(function assignConfig(conf) {
      config = conf;
      return Promise.resolve();
    })
    .then(function addContainerPromise() {
      return addContainer(OPTIONS.containerClass);
    })
    .then(function assignContainer(containerParam) {
      container = containerParam;
      return Promise.resolve();
    })
    .then(function addAwsSdkPromise() {
      return addAwsSdk(container, config);
    })
    .then(function initCredentialsPromise() {
      return initCredentials(config);
    })
    .then(function getCredentialsPromise() {
      return getCredentials();
    })
    .then(function addMessageHandler() {
      window.addEventListener('message', onMessage, false);
      return Promise.resolve();
    })
    .then(function addIframePromise() {
      return addIframe(container);
    })
    .then(function assignIframe(iframeParam) {
      iframe = iframeParam;
      return Promise.resolve();
    })
    .then(function parentReady() {
      iframe.contentWindow.postMessage(
        { event: 'parentReady' },
        config.iframeOrigin
      );
      child.performUpdate(AWS.config.credentials, config.aws.botName, config.aws.region);
    })
    .catch(function initError(error) {
      console.error('could not initialize chat bot -', error);
    });
  }

  /**
   * Loads the bot config from a JSON file URL
   */
  function loadConfig(url) {
    return new Promise(function loadConfigPromise(resolve, reject) {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', url);
      xhr.responseType = 'json';
      xhr.onerror = function configOnError() {
        reject('error getting chat bot config from url: ' + url);
      };
      xhr.onload = function configOnLoad() {
        if (xhr.status == 200) {
          if (xhr.response) {
            resolve(xhr.response);
          } else {
            reject('invalid chat bot config object');
          }
        } else {
          reject('failed to get chat bot config with status: ' + xhr.status);
        }
      };
      xhr.send();
    });
  };

  /**
   * Adds a div container to document body which will wrap the chat bot iframe
   */
  function addContainer(containerClass) {
    var divElement = document.querySelector('.' + containerClass);
    if (!containerClass) {
      return Promise.reject('invalid chat bot container class: ' + containerClass);
    }
    if (divElement) {
      return Promise.resolve(divElement);
    }
    divElement = document.createElement('div');
    divElement.classList.add(containerClass);
    document.body.appendChild(divElement);

    return Promise.resolve(divElement);
  }

  /**
   * Adds a script tag to dynamically load the AWS SDK under the application
   * div container. Avoids loading the SDK if the AWS SDK seems to be loaded
   * or the tag exists
   */
  function addAwsSdk(divElement) {
    return new Promise(function addAwsSdkPromise(resolve, reject) {
      var sdkScriptElement =
        document.querySelector('.' + OPTIONS.containerClass + ' script');
      if (sdkScriptElement || 'AWS' in window) {
        resolve(sdkScriptElement);
      }

      sdkScriptElement = document.createElement('script');
      sdkScriptElement.setAttribute('type', 'text/javascript');

      sdkScriptElement.onerror = function  sdkOnError() {
        reject('failed to load AWS SDK link:' + OPTIONS.sdkLink);
      };
      sdkScriptElement.onload = function  sdkOnLoad() {
        resolve(sdkScriptElement);
      };

      sdkScriptElement.setAttribute('src', OPTIONS.sdkLink);

      divElement.appendChild(sdkScriptElement);
    });
  }

  /**
   * Initializes credentials
   */
  function initCredentials(config) {
    if (!'AWS' in window) {
      return Promise.reject('unable to find AWS object');
    }

    AWS.config.region = config.aws.region;
    AWS.config.credentials = new AWS.CognitoIdentityCredentials({
      IdentityPoolId: config.aws.cognitoPoolId,
    });

    return Promise.resolve();
  }

  /**
   * Get credentials - cognito
   */
  function getCredentials() {
    var identityId = localStorage.getItem('cognitoid');

    if (identityId != null){
      console.log('[INFO] found existing identity ID: ', identityId);
    }

    if (!('getPromise' in AWS.config.credentials)) {
      console.error('getPromise not found in credentials');
      return Promise.reject('getPromise not found in credentials');
    }

    return AWS.config.credentials.getPromise()
    .then(function storeIdentityId() {
      console.log('[INFO] storing identity ID:',
        AWS.config.credentials.identityId
      );
      localStorage.setItem('cognitoid', AWS.config.credentials.identityId);
      identityId = localStorage.getItem('cognitoid');
    })
    .then(function getCredentialsPromise() {
      return Promise.resolve(AWS.config.credentials);
    });
  }

  /**
   * Adds chat bot iframe under the application div container
   */
  function addIframe(divElement) {
    var iframeElement =
      document.querySelector('.' + OPTIONS.containerClass + ' iframe');
    if (iframeElement) {
      return Promise.resolve(iframeElement);
    }

    iframeElement = document.createElement('iframe');
    iframeElement.setAttribute('src', config.iframeOrigin + OPTIONS.iframeSrcPath);
    iframeElement.setAttribute('frameBorder', '0');
    iframeElement.setAttribute('scrolling', 'no');

    divElement.appendChild(iframeElement);

    return new Promise(function loadIframePromise(resolve, reject) {
      var timeoutId = setTimeout(onIframeTimeout, 10000);
      iframeElement.addEventListener('load', onIframeLoaded, false);

      function onIframeLoaded(evt) {
        clearTimeout(timeoutId);
        toggleShowUi();
        return resolve(iframeElement);
      };

      function onIframeTimeout() {
        iframeElement.removeEventListener('load', onIframeLoaded, false);
        return reject('iframe load timeout');
      };
    });
  }

  /**
   * Toggle between showing/hiding chat bot ui
   */
  function toggleShowUi() {
    container.classList.toggle(OPTIONS.containerClass + '--show');
  }

  /**
   * Message handler - receives postMessage events from iframe
   */
  function onMessage(evt) {
    // security check
    if (evt.origin !== config.iframeOrigin) {
      console.error('postMessage from invalid origin', evt.origin);
      return;
    }
    if (!evt.ports) {
      console.error('postMessage not sent over MessageChannel', evt);
      return;
    }

    switch (evt.data.event) {
      case 'getCredentials':
        messageHandler.onGetCredentials(evt);
        break;
      case 'initIframeConfig':
        messageHandler.onInitIframeConfig(evt);
        break;
      case 'toggleExpandUi':
        messageHandler.onToggleExpandUi(evt);
        break;
      case 'updateLexState':
        messageHandler.onUpdateLexState(evt);
        break;
      default:
        console.error('unnknown message in event', evt);
        break;
    }
  }

  messageHandler = {
    onGetCredentials: function onGetCredentials(evt) {
      return getCredentials()
      .then(function resolveGetCredentials(creds) {
        evt.ports[0].postMessage({
          event: 'resolve',
          type: 'getCredentials',
          data: creds,
        });
      })
      .catch(function onGetCredentialsError(error) {
        console.error('failed to get credentials', error);
        evt.ports[0].postMessage({
          event: 'reject',
          type: 'getCredentials',
          error: 'failed to get credentials',
        });
      });
    },
    onInitIframeConfig: function onInitIframeConfig(evt) {
      var iframeConfig = config.iframeConfig;
      try {
        iframeConfig.cognito = {
          poolId: config.aws.cognitoPoolId,
        };
        iframeConfig.lex = {
          botName: config.aws.botName,
          initialText: model.bot.ui.initialText,
          initialSpeechInstruction: model.bot.ui.initialSpeechInstruction,
        };
        iframeConfig.ui.toolbarTitle = model.bot.ui.titleBar;
        iframeConfig.ui.favIcon = '';
        iframeConfig.ui.toolbarLogo = '';
        iframeConfig.region = config.aws.region;
      } catch (e) {
        evt.ports[0].postMessage({
          event: 'reject',
          type: 'initIframeConfig',
          error: 'failed to obtain a valid iframe config',
        });
        console.error('failed to assign iframe config', e);
        return;
      }
      evt.ports[0].postMessage({
        event: 'resolve',
        type: 'initIframeConfig',
        data: iframeConfig,
      });
    },
    onToggleExpandUi: function onToggleExpandUi(evt) {
      container.classList.toggle(OPTIONS.containerClass + '--minimize');
      evt.ports[0].postMessage({ event: 'resolve', type: 'toggleShowUi' });
    },
    onUpdateLexState: function onUpdateLexState(evt) {
      console.log('[INFO] bot state update', JSON.stringify(evt.data.state.dialogState, null, 2));
      if (evt.data.state.dialogState === 'Fulfilled') {
        child.performUpdate(AWS.config.credentials, config.aws.botName, config.aws.region);
      }
      evt.ports[0].postMessage({ event: 'resolve', type: 'updateLexState' });
    },
  };
}
