#/bin/sh
#
# Copyright 2017-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0 
#
cp LexAppBuilder/model/TrackingBotModel.json TrackingBot-aws-my-sample-app-android/MySampleApp/app/src/main/res/raw/trackingbotmodel.json
cd TrackingBot-aws-my-sample-app-android/MySampleApp 
ls -l
./gradlew dependencies || true
./gradlew assembleDebug

