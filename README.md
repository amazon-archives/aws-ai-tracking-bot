# tracking-bot

A sample application that uses Lex, Polly, Cognito, and DynamobDB for a 
the implementation of a tracking application. A model described in a json file drives 
the creation of a Lex Bot using CloudFormation custom resources. 

A tracking application provides the ability to easily record and report on 
metrics about activities being completed by an individual. For example, the 
sample Resolutions model provided as a starting point records goals one might 
typically make during a new years party for the upcoming year. For example these might be to volunteer more time, 
to give more funds to charity, to donate more articles to charity, to participate in more community
events, etc. 

There are four main components in this application: LexAppBuilder, LexWebUi 
(in the submodules folder), dashboard-app, and an Android App contained in the
TrackingBot-aws-my-sample-app-android folder. 

## LexAppBuilder

Responsible for building the Lex implementation based on a model. The model 
used in the sample Resolutions app is defined at LexAppBuilder/model/TrackingBotModel.json. 
This component is home to the backend processing performed by a python Lambda
function which takes input from the Lex service for dialog and fulfilment
code hooks and aggregates responses in DynamoDB based on categories defined in the model. 

The LexAppBuilder uses the model to create the Lex stack. One can change the model and updates 
will be automatically produced in via CodePipeline. 

The LexAppBuilder uses the model to create a Lex Bot automatically. A Bot consists
of a set of Intents, Utterances, Slots, and SlotTypes. The model drives this creation. Other 
than editing the model, no additional work is needed at the Bot level. 

## LexWebUi

This component is responsible for providing a web base interface to interact with Lex. It is
incorporated as a submodule and presented as an iframe in the dashboard-app. 
The LexWebUi can be used as a component in other chat based applications.

## dashboard-app

Provides a sample dashboard generating simple radial pie charts to show
progress towards goals specified in the tracking bot model. The dashboard-app presents results
based on categories defined in the model. It also presents the LexWebUi as an IFrame to allow
easy user interaction. 

## TrackingBot-aws-my-sample-app-android

The Android app provides a second mechanism for recording results. The Android App, much like the
web UI, allows a user to input information via voice using Lex and 
see a quick summary of results in a simple dashboard embedded in the App. It is similar 
to the dashboard-app however it is a bit less sophisticated. In its present form this app only enables voice
input. A similar chat style interface could also be developed. 

The model defined in the LexAppBuilder is automatically incorporated into the Android App. With edits to the 
model committed to githup, the Android app will be rebuilt. 

## CodePipeline and CodeBuild

The logic to build and deploy the applications is driven by the master-cft.yaml
file. It contains the logic to create the initial stack via CloudFormation. A single CodePipeline with 
two actions is created. 

The first action calls masterBuild.js. This nodejs based script performs the following:

* builds the aws-lex-web-ui and stores this in an S3 bucket
* builds the dashboard-app and stores this in a separate S3 bucket. The dashboard-app 
integrates the aws-lex-web-ui as an IFrame.
* builds the LexAppBuilder which creates a stack based on the supplied model. This stack 
includes setting up DynamoDB tables and setting up the Lex Bot using custom
resources implemented to build Lex runtime components. 

The second action calls masterBuildAndroid.js. This build is
responsible for compiling the Android app and uploading the apk to an S3 artifact
bucket. The buildAndroid.sh script is as utilized to support building the
android app. 

After the initial stack has been deployed using master-cft.yaml, the build process will
create a second CloudFormation stack which builds up the Lex Bot. Several outputs are provided
by master-cft.yaml:

* a link to the dashboard-app  
* a link to the android apk file 
* a link to the CodePipeline in the AWS Console

CloudWatch logs for each build will provide detail results of the build process. The logs also 
indicate exactly how masterBuild.js and masterBuildAndroid.js are invoked. 

# Sample code only

The code provided in this example is sample code. It is used to demonstrate the
art of the possible. It tells a story about how multiple AWS services
can be integrated into a functioning app. It demonstrates how a model can be used to drive the create of a Lex Bot.

Note, there are many areas for improvement. As time progresses we hope to 
integrate new AWS services / features into this sample and improve the overall code base.

