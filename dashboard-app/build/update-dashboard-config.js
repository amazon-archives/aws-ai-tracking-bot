/**
 * Updates config values in the aws-lex-web-ui
 * This is called during build process by CodeBuild
 */
var fs = require('fs');

const defaultsStreamOpts = {
  flags: 'w',
  defaultEncoding: 'utf8',
  autoClose: true
};

var stream = fs.createWriteStream('./dashboard-app/static/appconfig.js',defaultsStreamOpts);
stream.once('open', function(fd) {
  stream.write('var appUserPoolClientId = \'' + process.env.USER_POOL_CLIENT_ID + '\';\n');
  stream.write('var appIdentityPoolId = \'' + process.env.IDENTITY_POOL_ID + '\';\n');
  stream.write('var appRegion = \'' + process.env.AWS_DEFAULT_REGION + '\';\n');
  stream.write('var appDomainName = \'' + process.env.APP_DOMAIN_NAME + '\'.toLowerCase();\n');
  stream.write('var appUserPoolName = \'' + process.env.USER_POOL_NAME + '\';\n');
  stream.write('var appBotName = \'' + process.env.CLEAN_STACK_NAME + '\';\n');
  stream.end();
});