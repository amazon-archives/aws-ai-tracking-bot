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

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.util.Log;
import android.view.MotionEvent;
import com.amazonaws.mobile.AWSMobileClient;
import com.amazonaws.mobilehelper.auth.IdentityManager;
import com.amazonaws.mobilehelper.auth.IdentityProvider;
import com.amazonaws.mobilehelper.auth.StartupAuthErrorDetails;
import com.amazonaws.mobilehelper.auth.StartupAuthResult;
import com.amazonaws.mobilehelper.auth.StartupAuthResultHandler;
import com.amazonaws.mobilehelper.auth.signin.AuthException;
import com.amazonaws.mobilehelper.auth.signin.ProviderAuthException;

/**
 * Splash Activity is the start-up activity that appears until a delay is expired
 * or the user taps the screen.  When the splash activity starts, various app
 * initialization operations are performed.
 */
public class SplashActivity extends Activity {

    private static final String LOG_TAG = SplashActivity.class.getSimpleName();

    private final StartupAuthResultHandler authResultHandler = new StartupAuthResultHandler() {
        @Override
        public void onComplete(final StartupAuthResult authResult) {
            if (authResult.isUserAnonymous()) {
                Log.d(LOG_TAG, "Continuing with unauthenticated (guest) identity.");
            } else {
                final StartupAuthErrorDetails errors = authResult.getErrorDetails();
                Log.e(LOG_TAG, "No Identity could be obtained. Continuing with no identity.",
                    errors.getUnauthenticatedErrorException());
            }
            goMain(SplashActivity.this);
        }
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        Log.d(LOG_TAG, "onCreate");

        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_splash);

        AWSMobileClient.initializeMobileClientIfNecessary(getApplicationContext());
        final IdentityManager identityManager = AWSMobileClient.defaultMobileClient().getIdentityManager();

        identityManager.doStartupAuth(this, authResultHandler, 2000);

    }

    /** Go to the main activity. */
    private void goMain(final Activity callingActivity) {
        callingActivity.startActivity(new Intent(callingActivity, MainActivity.class)
            .setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP));
        callingActivity.finish();
    }

    @Override
    public boolean onTouchEvent(MotionEvent event) {
        // Touch event bypasses waiting for the splash timeout to expire.
        AWSMobileClient.defaultMobileClient()
            .getIdentityManager()
            .expireSignInTimeout();
        return true;
    }
}
