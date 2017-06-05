/*
 Copyright 2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.

 Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the
 License. A copy of the License is located at

 http://aws.amazon.com/apache2.0/

 or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES
 OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions
 and limitations under the License.
 */

package com.mysampleapp;

import android.content.Context;
import android.support.multidex.MultiDexApplication;
import android.util.Log;

import com.amazonaws.mobile.AWSMobileClient;
import com.mysampleapp.demo.DemoConfiguration;

/**
 * Application class responsible for initializing singletons and other common components.
 */
public class Application extends MultiDexApplication {
    private static final String LOG_TAG = Application.class.getSimpleName();
    @Override
    public void onCreate() {
        Log.d(LOG_TAG, "Application.onCreate - Initializing application...");
        super.onCreate();
        initializeApplication();
        Log.d(LOG_TAG, "Application.onCreate - Application initialized OK");
    }

    private void initializeApplication() {
        AWSMobileClient.initializeMobileClientIfNecessary(getApplicationContext());
        DemoConfiguration.initFeatures(getApplicationContext());
        // ...Put any application-specific initialization logic here...
    }
}
