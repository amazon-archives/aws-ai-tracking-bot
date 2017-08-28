/**
 * Updates config values in the aws-lex-web-ui
 * This is called during build process by CodeBuild
 */
var fs = require('fs');

var confFile = {
  iframe:
    process.env.IFRAME_CONFIG ||
    '../dashboard-app/static/iframe/config.json',
};

console.log('Reading config file content: ',
  confFile.iframe
);

var configs = {
  iframe: {
    file: confFile.iframe,
    conf: require(confFile.iframe),
  },
};

// two level merge of config objects
function mergeConfig(baseConfig, envConfig) {
  return Object.keys(envConfig)
  .map(function (key) {
    var mergedConfig = {};
    var value = envConfig[key];
    if (key in baseConfig) {
      value = (typeof envConfig[key] === 'object') ?
        Object.assign({}, baseConfig[key], envConfig[key]) :
        envConfig[key];
    }
    mergedConfig[key] = value;
    return mergedConfig;
  })
  .reduce(function (merged, configItem) {
      return Object.assign({}, merged, configItem);
    },
    {}
  );
}

[
  'AWS_DEFAULT_REGION',
  'BOT_NAME',
  'IFRAME_ORIGIN',
  'POOL_ID',
].forEach(function (envVar) {
  console.log('[INFO] Env var - %s: [%s]', envVar, process.env[envVar]);
});

var iframeConfig = {
  iframeOrigin:
    process.env.IFRAME_ORIGIN || configs.iframe.conf.iframeOrigin,
  aws: {
    cognitoPoolId:
      process.env.POOL_ID || configs.iframe.conf.aws.cognitoPoolId,
    region:
      process.env.AWS_DEFAULT_REGION || configs.iframe.conf.aws.region,
    botName:
      process.env.BOT_NAME || configs.iframe.conf.aws.botName,
  },
  iframeConfig: configs.iframe.conf.iframeConfig || {},
};
configs.iframe.conf = mergeConfig(configs.iframe.conf, iframeConfig);

console.log('[INFO] Updating config files: ',
  confFile.iframe
);

Object.keys(configs)
.map(function (confKey) { return configs[confKey]; })
.forEach(function (item) {
  fs.writeFile(item.file, JSON.stringify(item.conf, null, 2), function (err) {
    if (err) {
      console.error('[ERROR] could not write file: ', err);
      process.exit(1);
    }
    console.log('[INFO] Updated file: ', item.file);
    console.log('[INFO] Config contents: ', JSON.stringify(item.conf));
  });
});


var stream = fs.createWriteStream("../dashboard-app/static/appconfig.js");
stream.once('open', function(fd) {
  stream.write('var appUserPoolClientId = \'' + process.env.USER_POOL_CLIENT_ID + '\';\n');
  stream.write('var appIdentityPoolId = \'' + process.env.IDENTITY_POOL_ID + '\';\n');
  stream.write('var appRegion = \'' + process.env.AWS_DEFAULT_REGION + '\';\n');
  stream.write('var appDomainName = \'' + process.env.APP_DOMAIN_NAME + '\';\n');
  stream.end();
});