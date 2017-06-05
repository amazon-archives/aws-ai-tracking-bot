/*
 Copyright 2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.

 Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the
 License. A copy of the License is located at

 http://aws.amazon.com/apache2.0/

 or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES
 OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions
 and limitations under the License.
 */

package com.mysampleapp.demo.bots;

import android.content.Context;

import com.amazonaws.mobile.AWSConfiguration;
import com.mysampleapp.R;
import com.mysampleapp.util.JSONResourceReader;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

public class BotFactory {

    private static BotFactory instance;
    private Context context;

    private BotFactory(Context context){
        this.context = context;
    }

    public static BotFactory Instance(Context context){
        if(instance==null)
            instance= new BotFactory(context);

        return instance;
    }

    public List<Bot> getBots(){
        List<Bot> botList = new ArrayList<Bot>();

        JSONResourceReader reader = new JSONResourceReader(context.getResources(), R.raw.trackingbotmodel);
        JSONObject jsonObj = reader.constructUsingJson();
        String botName = null;
        String botDescription = null;
        try {
            botName = jsonObj.getJSONObject("bot").getString("name");
            botDescription = jsonObj.getJSONObject("bot").getString("description");
        } catch (JSONException e) {
            e.printStackTrace();
        }

        AWSConfiguration awsConfiguration = AWSConfiguration.getInstance(context.getResources());
        String runtimeBotName = awsConfiguration.getAWS_CONFIGURED_BOTNAME();

        botList.add(new Bot(runtimeBotName,
                            "$LATEST",
                            botName,
                            botDescription,
                            "us-east-1",
                            new String[]{
                                  }));
        

        return botList;
    }



}
