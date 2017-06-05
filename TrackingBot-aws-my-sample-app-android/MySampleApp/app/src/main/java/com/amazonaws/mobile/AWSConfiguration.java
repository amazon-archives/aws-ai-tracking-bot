/*
 Copyright 2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.

 Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the
 License. A copy of the License is located at

 http://aws.amazon.com/apache2.0/

 or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES
 OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions
 and limitations under the License.
 */

package com.amazonaws.mobile;

import android.content.res.Resources;

import com.amazonaws.mobilehelper.config.AWSMobileHelperConfiguration;
import com.amazonaws.regions.Regions;
import com.mysampleapp.R;
import com.mysampleapp.util.JSONResourceReader;

import org.json.JSONException;
import org.json.JSONObject;

/**
 * This class defines constants for the developer's resource
 * identifiers and API keys. This configuration should not
 * be shared or posted to any public source code repository.
 */
public class AWSConfiguration {

    private String AWS_CONFIGURED_BOTNAME = "";
    private String AWS_MOBILEHUB_USER_AGENT = "";
    private Regions AMAZON_COGNITO_REGION = null;
    private String  AMAZON_COGNITO_IDENTITY_POOL_ID = "";
    private Regions AMAZON_DYNAMODB_REGION = null;
    private Resources resources = null;
    private static AWSConfiguration instance = null;
    private static AWSMobileHelperConfiguration helperConfiguration = null;

    private static void init(Resources resources) {
        if (instance == null) {
            instance = new AWSConfiguration();
        }
        JSONResourceReader reader = new JSONResourceReader(resources, R.raw.awsconfig);
        JSONObject jsonObj = reader.constructUsingJson();
        JSONObject config = null;
        try {
            config = jsonObj.getJSONObject("config");
            instance.AWS_CONFIGURED_BOTNAME = config.getString("BOTNAME");
            instance.AWS_MOBILEHUB_USER_AGENT = config.getString("AWS_MOBILEHUB_USER_AGENT");
            instance.AMAZON_COGNITO_IDENTITY_POOL_ID = config.getString("AMAZON_COGNITO_IDENTITY_POOL_ID");
            String regionvalue = config.getString("AMAZON_COGNITO_REGION");
            instance.AMAZON_COGNITO_REGION = Regions.fromName(regionvalue);
            regionvalue = config.getString("AMAZON_DYNAMODB_REGION");
            instance.AMAZON_DYNAMODB_REGION = Regions.fromName(regionvalue);
            helperConfiguration = new AWSMobileHelperConfiguration.Builder()
                    .withCognitoRegion(instance.getAMAZON_COGNITO_REGION())
                    .withCognitoIdentityPoolId(instance.getAMAZON_COGNITO_IDENTITY_POOL_ID())
                    .build();
        } catch (JSONException e) {
            System.out.println("Failed to read config file");
            e.printStackTrace();
        }
    }

    public static AWSConfiguration getInstance(Resources resources) {
        if (instance == null) {
            init(resources);
        }
        return instance;
    }
    /**
     * @return the configuration for AWSKit.
     */
    public AWSMobileHelperConfiguration getAWSMobileHelperConfiguration() {
        return helperConfiguration;
    }

    public String getAWS_CONFIGURED_BOTNAME() { return AWS_CONFIGURED_BOTNAME; }

    public String getAWS_MOBILEHUB_USER_AGENT() {
        return AWS_MOBILEHUB_USER_AGENT;
    }

    public Regions getAMAZON_COGNITO_REGION() {
        return AMAZON_COGNITO_REGION;
    }

    public String getAMAZON_COGNITO_IDENTITY_POOL_ID() {
        return AMAZON_COGNITO_IDENTITY_POOL_ID;
    }

    public Regions getAMAZON_DYNAMODB_REGION() {
        return AMAZON_DYNAMODB_REGION;
    }
}
