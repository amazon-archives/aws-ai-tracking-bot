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


import android.Manifest;
import android.content.Context;
import android.content.DialogInterface;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.support.v4.app.ActivityCompat;
import android.support.v4.app.Fragment;
import android.support.v4.content.ContextCompat;
import android.support.v7.app.ActionBar;
import android.support.v7.app.AppCompatActivity;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import com.amazonaws.mobileconnectors.lex.interactionkit.Response;
import com.amazonaws.mobileconnectors.lex.interactionkit.config.InteractionConfig;
import com.mysampleapp.R;
import com.amazonaws.auth.AWSCredentialsProvider;
import com.amazonaws.mobile.AWSMobileClient;
import com.amazonaws.mobileconnectors.lex.interactionkit.ui.InteractiveVoiceView;
import com.amazonaws.mobilehelper.util.ViewHelper;

import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * A simple {@link Fragment} subclass.
 */
public class ConversationalBotVoiceFragment extends Fragment implements InteractiveVoiceView.InteractiveVoiceListener{

    final private String TAG = "ConversationalBotVoice";
    private Context context;
    private Bot currentBot ;
    private InteractiveVoiceView voiceView;
    private static String ARGUMENT_DEMO_CONVERSATIONAL_BOT = "BOT";
    private static final int MY_PERMISSIONS_REQUEST_RECORD_AUDIO = 100;
    private Boolean mAudioPermissionGranted = false;
    private Boolean mShowRationale = true;
    private AWSCredentialsProvider credentialsProvider;

    public static ConversationalBotVoiceFragment newInstance(Bot curentBot) {
        ConversationalBotVoiceFragment fragment = new ConversationalBotVoiceFragment();
        Bundle args = new Bundle();
        args.putSerializable(ConversationalBotVoiceFragment.ARGUMENT_DEMO_CONVERSATIONAL_BOT, curentBot);
        fragment.setArguments(args);
        return fragment;
    }

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        // Inflate the layout for this fragment
        return inflater.inflate(R.layout.fragment_conversational_bot_voice, container, false);
    }

    @Override
    public void onViewCreated(View view, Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        context = getContext();
        final Bundle args = getArguments();
        currentBot = (Bot) args.getSerializable(ARGUMENT_DEMO_CONVERSATIONAL_BOT);
        if (currentBot==null) {
            BotFactory botFactory = BotFactory.Instance(getContext());
            List<Bot> bots =  botFactory.getBots();
            currentBot = bots.get(0);
        }
        voiceView = (InteractiveVoiceView) view.findViewById(R.id.voiceInterface);
        voiceView.setEnabled(false);

        // Set the title for the instruction fragment.
        final ActionBar actionBar = ((AppCompatActivity)getActivity()).getSupportActionBar();
        if (actionBar != null) {
            actionBar.setTitle(getString(R.string.feature_app_conversational_bots_title));
        }

        //request microphone permissions
        requestPermission();
    }

    private void requestPermission(){
        // Here, thisActivity is the current activity
        if (ContextCompat.checkSelfPermission(getActivity(),
                Manifest.permission.RECORD_AUDIO)
                != PackageManager.PERMISSION_GRANTED) {

            if (ActivityCompat.shouldShowRequestPermissionRationale(getActivity(),
                    Manifest.permission.RECORD_AUDIO) && mShowRationale) {
                mShowRationale = false;
                ViewHelper.showDialog(getActivity(),
                        getString(R.string.feature_app_conversational_bots_permissions_header),
                        getString(R.string.feature_app_conversational_bots_permissions_string),
                        "Proceed", new DialogInterface.OnClickListener(){

                            @Override
                            public void onClick(DialogInterface dialog, int which) {
                                requestPermission();
                            }
                        },
                        "Cancel", new DialogInterface.OnClickListener(){

                            @Override
                            public void onClick(DialogInterface dialog, int which) {
                                //do nothing
                            }
                        });
            } else {
                ActivityCompat.requestPermissions(getActivity(),
                        new String[]{Manifest.permission.RECORD_AUDIO},
                        MY_PERMISSIONS_REQUEST_RECORD_AUDIO);

            }
        }else{
            mAudioPermissionGranted = true;
            voiceView.setEnabled(true);
            initializeLexSDK();
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode,
                                           String permissions[], int[] grantResults) {
        switch (requestCode) {
            case MY_PERMISSIONS_REQUEST_RECORD_AUDIO: {
                if (grantResults.length > 0
                        && grantResults[0] == PackageManager.PERMISSION_GRANTED) {

                    mAudioPermissionGranted = true;
                    voiceView.setEnabled(true);
                    initializeLexSDK();
                } else {
                    mAudioPermissionGranted = false;
                    mShowRationale = true;
                }
                return;
            }
        }
    }

    @Override
    public void onResume() {
        super.onResume();
        if (currentBot == null) {
            final Bundle args = getArguments();
            currentBot = (Bot) args.getSerializable(ARGUMENT_DEMO_CONVERSATIONAL_BOT);
        }
        credentialsProvider = AWSMobileClient.defaultMobileClient()
                .getIdentityManager().getUnderlyingProvider();

    }

    /**
     * Initializes Lex client.
     */
    private void initializeLexSDK() {
        if (mAudioPermissionGranted) {
            Log.d(TAG, "Lex Client");
            credentialsProvider = AWSMobileClient.defaultMobileClient()
                    .getIdentityManager().getUnderlyingProvider();
            voiceView.setInteractiveVoiceListener(this);
            voiceView.getViewAdapter().setAwsRegion(currentBot.getRegion());
            voiceView.getViewAdapter().setCredentialProvider(credentialsProvider);
            voiceView.getViewAdapter().setInteractionConfig(new InteractionConfig(currentBot.getBotName(), currentBot.getBotAlias()));
        }
    }

    @Override
    public void dialogReadyForFulfillment(final Map<String, String> slots, final String intent) {
        Log.d(TAG, String.format(
                Locale.US,
                "Dialog ready for fulfillment:\n\tIntent: %s\n\tSlots: %s",
                intent,
                slots.toString()));
    }

    @Override
    public void onResponse(final Response response) {
        Log.d(TAG, "Bot response: " + response.getTextResponse());
    }

    @Override
    public void onError(final String responseText, final Exception e) {
        Log.e(TAG, "Error: " + responseText, e);
    }
}
