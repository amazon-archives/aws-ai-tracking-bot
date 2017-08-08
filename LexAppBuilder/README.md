# Lex Tracking App Builder

Tools to construct a Lex Bot and associated AWS resources which together
provide an end to end application (Web or Android) that provides self
reporting / tracking capabilities. 

## Overview
This tool creates a Lex Bot ([Amazon Lex](https://aws.amazon.com/lex/)) plus 
additional resources: IAM Role, DynamoDB tables, and a Python based Lambda function
which together provide a self reporting feature embeddable in mobile apps and
a web client. 

## Model
The model used for the application is defined in model/TrackingBotModel.json. The model 
defines how the Lex Bot will be constructed. All elements are required at the present time. Model 
validation is performed in masterBuild.js. An invalid model as detected by [jsonschema](https://www.npmjs.com/package/jsonschema) will
result in a build failure. json_schema.json contains the schema used for validation. 

A model can also be validated manually using the command:

```
node validate-model.js --model model/TrackingBotModel.json 
```

The outermost object in the model is "bot". The bot object defines configuration for the Lex Bot. 
"name", "description", and the Bot's "clarificationPrompt" and "abortStatement" must be be defined. 
These prompts are configured into the lex bot.

```
{
  "bot": {
    "name": "Resolutions",
    "description": "Defines Lex Bot for tracking New Years Resolutions",
    "clarificationPrompt": "Sorry, can you please repeat that?",
    "abortStatement": "Sorry, I could not understand. Goodbye.",
    "allowUserToClearMetrics": "true",
    
```

The "allowUserToClearMetrics" is used by the LexAppBuilder to inject intents which allows a user to clear 
all of the metrics for a given date such as "today" or "yesterday". If set to true, an intent will be
added to the bot which enables clearing of metrics on a given day. A user can also say "Reset All" to remove
every record they have stored in DynamoDB.

Following this is an array of categories. Each category will be mapped to an intent in the bot. Each category
has the following:

* name - identifies the intent. Must be unique in the model
* description - description to use for the intent
* verb - an object that defines an array of verbs
    * prefix - an array of strings. Each string will be added prior to the verb in a separate utterance
    * type - always the value 'custom'
    * values - array of strings which will be used as a slot (and slottype) in each utterance
    * prompt - string that will be used to prompt for this slot by lex
* qty - an object that defines the type of value collected for this category. Supported values at the present
are AMAZON.NUMBER and AMAZON.DURATION
    * prefix - an array of strings. Each string will be added prior to the qty in a separate utterance
    * type - Either AMAZON.DURATION or AMAZON.NUMBER
    * convertTo - For AMAZON.DURATION, the unit the value will be converted to prior to storage. This can be
    either MINUTES, HOURS, or DAYS
    * prompt - string that will be used to prompt for this slot by lex
    * default - a value used as the default if one is not stated by the user. A value of "NA" indicates a
    default will not be used. 
* units - an object representing a custom set of units to accept for this category
    * type - always the value 'custom'
    * values - which will be used as a slot (and slottype) in each utterance
    * default - a value used as the default if one is not stated by the user. A value of "NA" indicates a
    default will not be used. 
    * prompt - string that will be used to prompt for this slot by lex
* object - an object representing the possible subjects of the utterance
    * prefix - an array of strings. Each string will be added prior to the object in a separate utterance
    * type - always the value 'custom'
    * values - which will be used as a slot (and slottype) in each utterance 
    * default - a value to use as the default if not specified by the user in the utterance
    * prompt - string that will be used to prompt for this slot by lex
* date - an object representing the date the category metric will be recorded against
    * type - only AMAZON.DATE supported at the present time
    * default - the default date the utterance will use if not specified by the user. Only 'TODAY' supported
    at the present time
    * prompt - string that will be used to prompt for this slot by lex
* confirmation - the prompt lex will use confirming the value, date, and category to record for the user
* cancel - the string lex will use if the user cancels recording the metric
* Targets - the model must specify a numeric dailyTarget, weeklyTarget, or monthlyTarget. Only one target is supported. 
the other two must be set at "0". 


```
"categories": [
      {
        "name": "Volunteer",
        "description": "Tracks how many hours you volunteer",
        "verb": {
          "prefix": ["I", "We"],
          "type": "custom",
          "values": [
              "spent",
              "performed",
              "volunteered",
              "coached",
              "taught",
              "sold",
              "traveled",
              "educated",
              "mentored"
            ],
          "prompt": "How did you volunteer. Taught, coached, mentored?"
        },
        "qty": {
          "prefix": ["for"],
          "type": "AMAZON.DURATION",
          "convertTo": "MINUTES",
          "prompt": "How long did you spend on this activity?",
          "default": "NA"
        },
        "units": {
          "type": "custom",
          "values": [],
          "default": "NA",
          "prompt": "NA"
        },
        "object": {
          "prefix": [
            "the",
            "coaching the",
            "at the",
            "with",
            "with the"
          ],
          "type": "custom",
          "values": [
            "soccer team",
            "school",
            "church",
            "club"
          ],
          "default": "not specified",
          "prompt": "Whom did you volunteer with?"
        },
        "date": {
          "type": "AMAZON.DATE",
          "default": "TODAY",
          "prompt": "When did you perform this?"
        },
        "confirmation": "Thanks. I will record that {date} you spent {qty} minutes of time volunteering. Ok?",
        "cancel": "Sorry, please try again.",
        "dailyTarget": "0",
        "weeklyTarget": "60",
        "monthlyTarget": "0"
      },
      {
        "name": "Meet",
        "description": "Tracks how many community meetings you attend",
        "verb": {
          "prefix": ["I", "We"],
          "type": "custom",
          "values": [
            "met",
            "went to",
            "attended a meeting"
          ],
          "prompt": "What did you do?"
        },
        "qty": {
          "prefix": [],
          "type": "AMAZON.NUMBER",
          "convertTo": "NA",
          "default": "1",
          "prompt": "How many meetings did you attend?"
        },
        "units": {
          "type": "custom",
          "values": [],
          "default": "NA",
          "prompt": "NA"
        },
        "object": {
          "prefix": [
            "meeting with the",
            "with the",
            "at the"
          ],
          "type": "custom",
          "values": [
            "town hall",
            "home owners association",
            "board",
            "non-profit",
            "organization",
            "group",
            "society",
            "congress",
            "president",
            "committee"
          ],
          "default": "not specified",
          "prompt": "Whom did you meet with?"
        },
        "date": {
          "type": "AMAZON.DATE",
          "default": "TODAY",
          "prompt": "When did you perform this?"
        },
        "confirmation": "I will record that {date} you attended {qty} meetings. Ok?",
        "cancel": "Sorry, please try again.",
        "dailyTarget": "0",
        "weeklyTarget": "1",
        "monthlyTarget": "0"
      },

```
The model also allows several ui elements to be defined which drive the aws-lex-web-ui.
* titleBar - the text to use in the aws-lex-web-ui IFrame
* initialText - the text initially displayed in the aws-lex-web-ui IFrame
* initialSpeechInstruction - the text communicated via Polly whenever the microphone button is clicked

```
    , 
    "ui": {
      "titleBar": "New Years Resolutions",
      "initialText": "You can ask me to record New Years resolution updates. For example enter, `I donated 5 pairs of shoes today`.",
      "initialSpeachInstruction": "Say phrases like `I donated 5 pairs of shoes today`. "
    }
```
