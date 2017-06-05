/*
 Copyright 2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.

 Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the
 License. A copy of the License is located at

 http://aws.amazon.com/apache2.0/

 or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES
 OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions
 and limitations under the License.
 */

package com.mysampleapp.demo;

import android.app.AlertDialog;
import android.content.Context;
import android.os.Bundle;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.TextView;

import com.amazonaws.mobile.AWSMobileClient;
import com.amazonaws.mobilehelper.auth.IdentityHandler;
import com.amazonaws.mobilehelper.auth.IdentityManager;
import com.amazonaws.mobilehelper.auth.SignInStateChangeListener;
import com.amazonaws.mobilehelper.auth.user.IdentityProfile;
import com.mysampleapp.R;

 public class IdentityDemoFragment extends DemoFragmentBase {
    /** Logging tag for this class. */
    private static final String LOG_TAG = IdentityDemoFragment.class.getSimpleName();

    /** The identity manager used to keep track of the current user account. */
    private IdentityManager identityManager;

    /** This fragment's view. */
    private View mFragmentView;

    /** Text view for showing the user identity. */
    private TextView userIdTextView;

    /** Text view for showing the user name. */
    private TextView userNameTextView;

    /** Image view for showing the user image. */
    private ImageView userImageView;

    @Override
    public View onCreateView(final LayoutInflater inflater, final ViewGroup container,
                             final Bundle savedInstanceState) {

        // Inflate the layout for this fragment
        mFragmentView = inflater.inflate(R.layout.fragment_demo_identity, container, false);
        userNameTextView = (TextView) mFragmentView.findViewById(R.id.textView_demoIdentityUserName);
        userIdTextView = (TextView) mFragmentView.findViewById(R.id.textView_demoIdentityUserID);
        userImageView = (ImageView)mFragmentView.findViewById(R.id.imageView_demoIdentityUserImage);

        // Obtain a reference to the identity manager.
        identityManager = AWSMobileClient.defaultMobileClient()
            .getIdentityManager();
        fetchUserIdentity();
        return mFragmentView;
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
    }


    /**
     * Fetches the user identity safely on the background thread.  It may make a network call.
     */
    private void fetchUserIdentity() {
        Log.d(LOG_TAG, "fetchUserIdentity");

        // Pre-fetched to avoid race condition where fragment is no longer active.
        final String unknownUserIdentityText =
                getString(R.string.identity_demo_unknown_identity_text);

        AWSMobileClient.defaultMobileClient()
                .getIdentityManager()
                .getUserID(new IdentityHandler() {

            @Override
            public void onIdentityId(String identityId) {

                // We have successfully retrieved the user's identity. You can use the
                // user identity value to uniquely identify the user. For demonstration
                // purposes here, we will display the value in a text view.
                userIdTextView.setText(identityId);
            }

            @Override
            public void handleError(Exception exception) {

                // We failed to retrieve the user's identity. Set unknown user identifier
                // in text view.
                userIdTextView.setText(unknownUserIdentityText);

                final Context context = getActivity();

                if (context != null && isAdded()) {
                    new AlertDialog.Builder(getActivity())
                            .setTitle(R.string.identity_demo_error_dialog_title)
                            .setMessage(getString(R.string.identity_demo_error_message_failed_get_identity)
                                    + exception.getMessage())
                            .setNegativeButton(R.string.identity_demo_dialog_dismiss_text, null)
                            .create()
                            .show();
                }
            }
        });
    }
}
