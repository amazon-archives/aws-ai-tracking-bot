# dashboard-app

This project demonstrates a POC dashboard for a personal tracking system. A common model, TrackingBotModel.json, is
shared with both the LexAppBuilder and the aws-lex-web-ui.

The LexAppBuilder generates a Lex Bot and associated resources: DynamoDB tables, roles, lambda functions, etc.

The aws-lex-web-ui provides a browser based interface (voice and text) for this Bot and lives in an s3 bucket.

The dashboard-app provides a sample dashboard which makes use of the IFrame capability in the aws-lex-web-ui.

The contents of TrackingBotModel.json at src/assets/TrackingBotModel.json defines the model used by this
dashboard app and the model injected into Lex using the LexAppBuilder.

This application is based on [Vue.js](https://vuejs.org/). 

* A component, Report.vue, was created which handles display of the dashboard. 
* The LexWebUI is loaded into an IFrame in bot-loader-vue.js. 
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
