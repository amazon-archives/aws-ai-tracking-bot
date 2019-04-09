#
# Copyright 2017-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0.

import json
import decimal
import boto3
import datetime
import re
from decimal import Decimal
import math

from boto3.dynamodb.conditions import Key, Attr
from botocore.exceptions import ClientError

print('Loading function')
dynamodb = boto3.resource('dynamodb')
modelFileName = "model.json"
model = ""
tableRaw = ""
tableAggregate = ""

# Helper class to convert a DynamoDB item to JSON.
class DecimalEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, decimal.Decimal):
            if o % 1 > 0:
                return float(o)
            else:
                return int(o)
        return super(DecimalEncoder, self).default(o)

def setTableNames(bot):
    global tableRaw
    global tableAggregate
    tableRaw = dynamodb.Table(bot["name"]+"-Raw")
    tableAggregate = dynamodb.Table(bot["name"] + "-Aggregate")

def loadModelFromFile(name):
    global modelFileName
    global model
    modelFileName = name
    with open(modelFileName) as json_file:
        model = json.load(json_file)
        return model

def loadModel():
    return loadModelFromFile(modelFileName)

loadModel()

def findCategoryFromIntent(model, bot, intent):
    categories = model["bot"]["categories"]
    for category in categories:
        if (intent.endswith(category["name"] + bot["name"])):
            return category

def findTargetValues(model):
    categories = model["bot"]["categories"]
    target = {}
    for category in categories:
        target[category["name"]] = {}
        target[category["name"]]["dailyTarget"] = Decimal(category["dailyTarget"])
        target[category["name"]]["weeklyTarget"] = Decimal(category["weeklyTarget"])
        target[category["name"]]["monthlyTarget"] = Decimal(category["monthlyTarget"])
    return target

def findCategories(model):
    categories = model["bot"]["categories"]
    target = []
    for category in categories:
        target.append(category["name"])
    return target

def setLocalDynamodb(endpointurl):
    dynamodb = boto3.resource('dynamodb', endpoint_url=endpointurl)

def lambda_handler(event, context):
    print(json.dumps(event))
    if (event["invocationSource"] == "FulfillmentCodeHook"):
        return log_update(event)
    elif (event["invocationSource"] == "DialogCodeHook"):
        return log_dialogCodeHook(event)
    else:
        return failedResponse(event, "Error in function - unrecognised invocation source: %s" % event["invocationSource"] )

def log_update(event):
    print(json.dumps(model))
    bot = event["bot"]
    setTableNames(bot)
    intent = event["currentIntent"]
    intentName = intent["name"]
    slots = intent["slots"]

    dayPrefix=""
    rawValue=""
    rawUnits=""
    rawObject=""

    if (slots):
        if (slots["DayPrefix"]):
            dayPrefix = slots["DayPrefix"]

        if ("RawValueNUMBER" in slots):
            rawValue = slots["RawValueNUMBER"]
        elif ("RawValueDURATION" in slots):
            rawValue = slots["RawValueDURATION"]
        else:
            rawValue = 0

        u = "Units" + intentName
        o = "Object" + intentName
        if (u in slots):
            rawUnits = slots[u]
        elif ("RawValueDURATION" in slots):
            rawUnits = "Duration"
        else:
            rawUnits = "NA"

        if (o in slots):
            rawObject = slots[o]
        else:
            rawObject = "NA"

    current_datetime = datetime.datetime.now().date()
    if (dayPrefix):
        current_datetime = datetime.datetime.strptime(dayPrefix, '%Y-%m-%d').date()

    if "sessionAttributes" in event:
        if event["sessionAttributes"] is None:
            print("no session attributes")
        else:
            print("sessionAttributes is not None")
            if "clientDate" in event["sessionAttributes"].keys():
                user_datetime = event["sessionAttributes"]["clientDate"]
                print("Using client supplied date: " + user_datetime)
                if dayPrefix:
                    current_datetime = datetime.datetime.strptime(dayPrefix, '%Y-%m-%d').date()
                else:
                    current_datetime = datetime.datetime.strptime(user_datetime, '%Y-%m-%d').date()

    print("current intent is: " + intentName)
    if "ResetAllMetrics" in intentName:
        print("deleting items for userId: " + event["userId"])
        res = deleteItemsForUser(event["userId"])
        res2 = deleteRawItemsForUser(event["userId"])
        if res and res2:
            return clearResponse(True)
        else:
            return clearResponse(False)

    elif "ClearMetricsForDate" in intentName:
        deleteRawItemsForUserOnDay(event["userId"], dayPrefix)
        update = obtainItem(event["userId"], current_datetime)
        if update:
            print("found item for user to delete")
            deleteItem(update)
            return clearResponse(True)
        else:
            return clearResponse(False)
    else:
        appendRawInfo(event["userId"], intentName, dayPrefix, rawValue, rawUnits, rawObject)

    category = findCategoryFromIntent(model, bot, intentName)
    print(category)
    print("found current category: " + category["name"]);

    update = obtainItem(event["userId"], current_datetime)

    if update:
        print("found current item for user")
    else:
        update = defaultItem(model, event["userId"], current_datetime)
        putItem(update)

    if category["name"] in update:
        update[category["name"]] += int(rawValue)
    else:
        update[category["name"]] = int(rawValue)

    updateItem(model, update)
    return closeResponse(update)

def convertAmazonBaseType(bot,intent,rawValue):
    category = findCategoryFromIntent(model, bot, intent)
    ISO8601_PERIOD_REGEX = re.compile(
        r"^(?P<sign>[+-])?"
        r"P(?!\b)"
        r"(?P<years>[0-9]+([,.][0-9]+)?Y)?"
        r"(?P<months>[0-9]+([,.][0-9]+)?M)?"
        r"(?P<weeks>[0-9]+([,.][0-9]+)?W)?"
        r"(?P<days>[0-9]+([,.][0-9]+)?D)?"
        r"((?P<separator>T)(?P<hours>[0-9]+([,.][0-9]+)?H)?"
        r"(?P<minutes>[0-9]+([,.][0-9]+)?M)?"
        r"(?P<seconds>[0-9]+([,.][0-9]+)?S)?)?$")
    # regular expression to parse ISO duartion strings.

    match = ISO8601_PERIOD_REGEX.match(rawValue)
    if not match:
        print("Error parsing rawValue")
        return rawValue

    groups = match.groupdict()
    for key, val in groups.items():
        if key not in ('separator', 'sign'):
            if val is None:
                groups[key] = "0n"
            # print groups[key]
            if key in ('years', 'months'):
                groups[key] = Decimal(groups[key][:-1].replace(',', '.'))
            else:
                # these values are passed into a timedelta object,
                # which works with floats.
                groups[key] = float(groups[key][:-1].replace(',', '.'))

    print(groups)
    totalMinutes = int((groups["days"] * 24 * 60) + (groups["hours"] * 60) + (groups["minutes"]))

    if (category["qty"]["convertTo"] == "MINUTES"):
        print("total minutes:" + str(totalMinutes))
        return totalMinutes
    elif (category["qty"]["convertTo"] == "HOURS"):
        totalHours = int(math.ceil(float(totalMinutes) / 60.0))
        print("totalHours: " + str(totalHours))
        return totalHours
    elif (category["qty"]["convertTo"] == "DAYS"):
        totalDays = int(math.ceil(float(totalMinutes)/(24.0*60.0)))
        print("totalDays: " + str(totalDays))
        return totalDays
    else:
        print("Undefined conversion: " + category["qty"]["convertTo"])
        return 0

def log_dialogCodeHook(event):
    sessionAttributes = event["sessionAttributes"]
    intent = event["currentIntent"]["name"]
    slots = event["currentIntent"]["slots"]
    bot = event["bot"]
    complete = True
    slotToElicit = None

    if (event["currentIntent"]["confirmationStatus"] == "Confirmed"):
        return log_update(event)

    category = findCategoryFromIntent(model, bot, intent)
    for slot in slots:
        if (slot == 'DayPrefix' and slots[slot]==None and category["date"]["default"] == "TODAY"):
            slots[slot] = datetime.datetime.now().strftime('%Y-%m-%d')
        elif (slot == "RawValueNUMBER" and slots[slot]==None and category["qty"]["default"] != "NA"):
            slots[slot] = category["qty"]["default"]
        elif (slot == "RawValueDURATION" and slots[slot]==None and category["qty"]["default"] != "NA"):
            slots[slot] = category["qty"]["default"]
        elif (slot == "RawValueDURATION" and slots[slot]):
            slots[slot] = convertAmazonBaseType(bot,intent,slots[slot])
        elif (slots[slot]==None):
            if (slotToElicit==None):
                slotToElicit = slot
            complete = False
    if (complete):
        response = {
            'sessionAttributes':sessionAttributes,
            'dialogAction': {
                'type': 'Delegate',
                'slots': slots
            }
        }
        print("log_dialogCodeHook: " + str(response))
        return response
    else:
        return elicitSlotResponse(event, slotToElicit)

def elicitSlotResponse(event,slot):
    sessionAttributes = event["sessionAttributes"]
    intent= event["currentIntent"]["name"]
    slots =  event["currentIntent"]["slots"]
    response = {
        'sessionAttributes':sessionAttributes,
        'dialogAction': {
            'type': 'ElicitSlot',
            'intentName':intent,
            'slotToElicit':slot,
            'slots': slots
        }
    }
    print ("Response (ElicitSlot): " + json.dumps(response))
    return response

def delegateResponse(event):
    sessionAttributes = event["sessionAttributes"]
    intent= event["currentIntent"]["name"]
    slots =  event["currentIntent"]["slots"]
    response = {
        'sessionAttributes':sessionAttributes,
        'dialogAction': {
            'type': 'Delegate',
            'intentName':intent,
            'slots': slots
        }
    }
    print ("Response (Delegate): " + json.dumps(response))
    return response

def closeResponse(event):
    msg=summaryMessage(event,model)
    response =     {
        'dialogAction': {
            'type': 'Close',
            'fulfillmentState': 'Fulfilled',
            'message': {'contentType': 'PlainText', 'content': msg}
        }
    }
    print ("Response (Close): " + json.dumps(response))
    return response

def clearResponse(success):
    msg=""
    if (success):
        msg="I was able to clear the information previously stored."
    else:
        msg="I could not find any information to clear."

    response =     {
        'dialogAction': {
            'type': 'Close',
            'fulfillmentState': 'Fulfilled',
            'message': {'contentType': 'PlainText', 'content': msg}
        }
    }
    print ("Response (Close): " + json.dumps(response))
    return response

def failedResponse(event, message):
    response = {
        'dialogAction': {
            'type': 'Close',
            'fulfillmentState': 'Failed',
            'message': {'contentType': 'PlainText', 'content': message}
        }
    }
    return response

def summaryMessage(item, model):
    return "Great job, data stored."

def defaultItem(model, userId, currentDatetime):
    item = {
        "userId": userId,
        "reported_time": str(currentDatetime)
    }
    categories = findCategories(model)
    targetValues = findTargetValues(model)
    for t in categories:
        item[t] = 0
        item["target_"+t] = targetValues[t]
    return item

def putItem(item):
    return tableAggregate.put_item(Item=item)

def putItemRaw(item):
    return tableRaw.put_item(Item=item)

def appendRawInfo(userId, intentName, dayPrefix, rawValue, rawUnits, rawObject):
    item = {
        'userId': userId,
        'reported_time': str(datetime.datetime.now()),
        'intentName': intentName,
        'dayPrefix': dayPrefix,
        'rawValue': rawValue,
        'rawUnits': rawUnits,
        'rawObject': rawObject
    }
    print("appending raw info")
    print(item)
    putItemRaw(item)

def updateItem(model, item):
    print("Updating userId: " + item['userId'])
    print("Updating with content: ")
    print(item)
    categories = findCategories(model)
    expression = "set "
    idx = 0
    attributeValues = {}

    for t in categories:
        expression = expression + t + "=:i" + str(idx)
        attributeValues[":i"+str(idx)] = Decimal(item.get(t, "0"))
        if idx < (len(categories)-1):
            expression = expression+", "
        idx = idx + 1

    tableAggregate.update_item( Key={
        'userId': item['userId'],
        'reported_time': str(item['reported_time'])
        },
        UpdateExpression=expression,
        ExpressionAttributeValues=attributeValues,
        ReturnValues="UPDATED_NEW"
    )
    return


def obtainItem(userId,reportTime):
    try:
        response = tableAggregate.get_item(
            Key={
                'userId': userId,
                'reported_time': str(reportTime)
            },
            ConsistentRead=True
        )
    except ClientError as e:
        print(e.response['Error']['Message'])
        return
    else:
        try:
            item = response['Item']
            return item
        except:
            return
        else:
            return


def deleteItem(item):
    return tableAggregate.delete_item(
        Key={
            'userId': item["userId"],
            'reported_time': str(item["reported_time"])
        }
    )


def deleteRawItem(item):
    return tableRaw.delete_item(
        Key={
            'userId': item["userId"],
            'reported_time': str(item["reported_time"])
        }
    )


def deleteItemsForUser(userid):
    # Scan the table and delete all items which match the provided userId
    print('Deleting rows...')
    count = 0

    response = tableAggregate.query(
        KeyConditionExpression=Key('userId').eq(userid)
    )
    for i in response['Items']:
        deleteItem(i)
        count += 1

    while 'LastEvaluatedKey' in response:
        response = table.query(
            KeyConditionExpression=Key('userId').eq(userid),
            ExclusiveStartKey=response['LastEvaluatedKey']
        )
        for i in response['Items']:
            deleteItem(i)
            count += 1

    print('Deleted Aggregate {0} rows.'.format(count))
    if count > 0:
        return True
    else:
        return False


def deleteRawItemsForUserOnDay(userid,dayPrefix):
    # Scan the table and delete all items which match the provided userId
    print('Deleting raw rows...')
    count = 0

    response = tableRaw.query(
        KeyConditionExpression=Key('userId').eq(userid)
    )
    for i in response['Items']:
        if i['dayPrefix'] == dayPrefix:
            deleteRawItem(i)
        count += 1

    while 'LastEvaluatedKey' in response:
        response = table.query(
            KeyConditionExpression=Key('userId').eq(userid),
            ExclusiveStartKey=response['LastEvaluatedKey']
        )
        for i in response['Items']:
            if i['dayPrefix'] == dayPrefix:
                deleteRawItem(i)
            count += 1

    print('Deleted raw table {0} rows.'.format(count))
    if count > 0:
        return True
    else:
        return False


def deleteRawItemsForUser(userid):
    # Scan the table and delete all items which match the provided userId
    print('Deleting raw rows...')
    count = 0

    response = tableRaw.query(
        KeyConditionExpression=Key('userId').eq(userid)
    )
    for i in response['Items']:
        deleteRawItem(i)
        count += 1

    while 'LastEvaluatedKey' in response:
        response = table.query(
            KeyConditionExpression=Key('userId').eq(userid),
            ExclusiveStartKey=response['LastEvaluatedKey']
        )
        for i in response['Items']:
            deleteRawItem(i)
            count += 1

    print('Deleted raw table {0} rows.'.format(count))
    if count > 0:
        return True
    else:
        return False
