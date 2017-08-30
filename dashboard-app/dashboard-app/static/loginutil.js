/* eslint-disable prefer-template */

const CognitoAuth = AmazonCognitoIdentity.CognitoAuth;

const poolid = appIdentityPoolId;
const region = appRegion;
localStorage.setItem('poolid', poolid);
localStorage.setItem('awsregionname', region);
const token = localStorage.getItem('idtokenjwt');
const rd1 = window.location.protocol + '//' + window.location.hostname + '/index.html?loggedin';
const rd2 = window.location.protocol + '//' + window.location.hostname + '/index.html?loggedout';
const authData = {
  ClientId: appUserPoolClientId, // Your client id here
  AppWebDomain: appDomainName,
  TokenScopesArray: ['email', 'openid', 'profile'],
  RedirectUriSignIn: rd1,
  RedirectUriSignOut: rd2,
};

/* eslint-disable prefer-template, object-shorthand */

const auth = new CognitoAuth(authData);

function logout() {
  console.log('do logout');
  localStorage.removeItem('idtokenjwt');
  auth.signOut();
}

auth.userhandler = {
  onSuccess: function (result) {
    console.log('Sign in success: ' + JSON.stringify(result, null, 2));
  },
  onFailure: function (err) {
    console.log('Sign in failure: ' + JSON.stringify(err, null, 2));
  },
};

const curUrl = window.location.href;
if (curUrl.indexOf('home') >= 0) {
  if (token === null || token === undefined) {
    auth.getSession();
  } else {
    console.log('goto home');
    const session = auth.getSignInUserSession();
    if (!session.isValid()) {
      auth.getSession();
    }
  }
} else if (curUrl.indexOf('noauth') >= 0) {
  localStorage.setItem('noauth', 'true');
  localStorage.removeItem('idtokenjwt');
} else if (curUrl.indexOf('loggedin') >= 0) {
  const values = curUrl.split('?');
  const minurl = '/' + values[1];
  auth.parseCognitoWebResponse(minurl);
  const idToken = auth.getSignInUserSession().getIdToken();
  localStorage.setItem('username', auth.getUsername());
  localStorage.setItem('noauth', 'false');
  localStorage.setItem('idtokenjwt', idToken.getJwtToken());
  localStorage.setItem('poolname', appUserPoolName);
  window.location.href = 'index.html?home';
} else if (curUrl.indexOf('loggedout') >= 0) {
  console.log('logout complete');
  localStorage.removeItem('noauth');
  localStorage.removeItem('idtokenjwt');
  localStorage.removeItem('cognitoid');
  window.location.href = 'index.html';
} else if (curUrl.indexOf('index.html?dosignout') >= 0) {
  logout();
} else if (token) {
  window.location.href = 'index.html?home';
} else {
  window.location.href = 'indexnoauth.html';
}
