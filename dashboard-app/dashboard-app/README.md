# dashboard-app

This project demonstrates a POC dashboard for a personal tracking system. A common model, TrackingBotModel.json, is
shared with both the LexAppBuilder and the aws-lex-web-ui.

The LexAppBuilder generates a Lex Bot and associated resources: DynamoDB tables, roles, lambda functions, etc.

The dashboard-app provides a sample dashboard which makes use of the npm module capability of the aws-lex-web-ui.

The dashboard-app provides for both un-authenticated access and authenticated access. Authenticated access allows the user
to login from multiple systems or mobile devices and remain connected with data provided from any device.
Un-authenticated access provides access to data specific to the system you have logged in from. 

When using authentication, a user will need to sign up via the link provided on the authentication form.

The authentication form can be customized using the AWS Console. 
* Goto the Cognito service in the console
* Select the user pool created  by the Cloud Formation template. It will be the name of the stack appended with 'CognitoUserPool'
* Click on UI customization from the menu
* Drag in a logo to use or Update CSS customizations


The contents of TrackingBotModel.json at src/assets/TrackingBotModel.json defines the model used by the
dashboard app and the model injected into Lex using the LexAppBuilder.

This application is based on [Vue.js](https://vuejs.org/). 

* The component, Report.vue, handles display of the dashboard. 
* The component, StackedBar.vue, handles display of a D3 based stacked bar chart
* The component, UserProfile.vue, handles initial display of logged in user data and settings
* The LexWebUI is now loaded as npm module within the dashboard
* App.vue is the primary entry point to the dashboard. 
* main.js loads the application. 

## Build Setup

``` bash
# install dependencies
npm install

# serve with hot reload at localhost:8080
npm run dev

# build for production with minification
npm run build

# build for production and view the bundle analyzer report
npm run build --report

# run unit tests
npm run unit

# run e2e tests
npm run e2e

# run all tests
npm test
```
