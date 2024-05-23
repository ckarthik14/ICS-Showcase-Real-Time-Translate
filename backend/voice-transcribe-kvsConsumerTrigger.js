/**********************************************************************************************************************
 *  Copyright 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved                                            *
 *                                                                                                                    *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated      *
 *  documentation files (the "Software"), to deal in the Software without restriction, including without limitation   *
 *  the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and  *
 *  to permit persons to whom the Software is furnished to do so.                                                     *
 *                                                                                                                    *
 *  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO  *
 *  THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE    *
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF         *
 *  CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS *
 *  IN THE SOFTWARE.                                                                                                  *
 **********************************************************************************************************************/

'use strict';
const AWS = require('aws-sdk');
const lambda = new AWS.Lambda();
var docClient = new AWS.DynamoDB.DocumentClient();

exports.handler = (event, context, callback) => {

    console.log("Received event from Amazon Connect " + JSON.stringify(event));
    
    // Function to update the dyamoDB with initial customer information
    updateDynamo(event);

    let payload = "";

    payload = {
        streamARN: event.streamARN.value,
        startFragmentNum: event.startFragmentNum.value,
        connectContactId: event.connectContactId.value,
        transcriptionEnabled: event.transcribeCall.value === "true" ? true : false,
        saveCallRecording: event.saveCallRecording.value === "false" ? false : true,
        transcribeLanguageCode: event.transcribeLanguageCode,
        translateFromLanguageCode: event.translateFromLanguageCode,
        translateToLanguageCode: event.translateToLanguageCode,
        pollyLanguageCode: event.pollyLanguageCode,
        pollyVoiceId: event.pollyVoiceId,
        // These default to true for backwards compatability purposes
        streamAudioFromCustomer: event.streamAudioFromCustomer === "false" ? false : true,
        streamAudioToCustomer: event.streamAudioToCustomer === "false" ? false : true
    };

    console.log("Trigger event passed to transcriberFunction" + JSON.stringify(payload));

    const params = {
        // not passing in a ClientContext
        'FunctionName': process.env.transcriptionFunction,
        // InvocationType is RequestResponse by default
        // LogType is not set so we won't get the last 4K of logs from the invoked function
        // Qualifier is not set so we use $LATEST
        'InvokeArgs': JSON.stringify(payload)
    };

    lambda.invokeAsync(params, function(err, data) {
        if (err) {
            throw (err);
        } else {
            console.log(JSON.stringify(data));
            if (callback)
                callback(null, buildResponse());
            else
                console.log('nothing to callback so letting it go');
        }
    });

    callback(null, buildResponse());
};

function buildResponse() {
    return {
        // we always return "Success" for now
        lambdaResult:"Success"
    };
}

function updateDynamo(event){
    let customerPhoneNumber = event.customerPhoneNumber.value;
    let contactId = event.connectContactId.value;

    //Sets the timezone environment variable for the Lambda function to east coast. You can change this to your preferred timezone, or remove this line to use UTC
    process.env.TZ = "America/New_York";
    var tableName = process.env.table_name;
    var currentTimeStamp = new Date().toString();
    var currentDate = new Date().toLocaleDateString();

    //set up the database query to be used to update the customer information record in DynamoDB
    var paramsUpdate = {
        TableName: tableName,
        Key: {
            "contactId": contactId
        },

        ExpressionAttributeValues: {
            ":var1": customerPhoneNumber,
            ":var2": currentDate,
            ":var3": currentTimeStamp
        },

        UpdateExpression: "SET customerPhoneNumber = :var1, callDate = :var2, callTimestamp = :var3"
    };

    //update the customer record in the database with the new call information using the paramsUpdate query we setup above:
    docClient.update(paramsUpdate, function (err, data) {
        if (err) {
            console.log("Unable to update item. Error: ", JSON.stringify(err, null, 2));
        } else console.log("Updated item succeeded!: ", JSON.stringify(data, null, 2));

    });
}