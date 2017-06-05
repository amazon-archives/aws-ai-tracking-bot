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

import android.content.Context;
import android.support.v4.app.Fragment;

import com.mysampleapp.R;
import com.mysampleapp.demo.bots.Bot;
import com.mysampleapp.demo.bots.BotFactory;
import com.mysampleapp.demo.bots.ConversationalBotDemoFragment;
import com.mysampleapp.demo.bots.ConversationalBotVoiceFragment;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

public class DemoConfiguration {

    private static final List<DemoFeature> demoFeatures = new ArrayList<DemoFeature>();
    private static boolean initComplete = false;

    public static void initFeatures(Context context) {
        if (!initComplete) {

            BotFactory botFactory = BotFactory.Instance(context);
            List<DemoItem> demoItemList = new ArrayList<DemoItem>();
            List<Bot> bots = botFactory.getBots();
            for (int i = 0; i < bots.size(); i++) {
                Bot bot = bots.get(i);
                demoItemList.add(new DemoItem("Record - " + bot.getBotTitle(),
                        "Record - " + bot.getBotTitle(),
                        bot,
                        ConversationalBotDemoFragment.class, true));
            }
            DemoItem[] demoItems = new DemoItem[bots.size()];
            demoItemList.toArray(demoItems);

            String dashboardTitle = "Dashboard - " + bots.get(0).getBotTitle();
            addDemoFeature("dashboard", R.mipmap.statistics, R.string.feature_your_history_title, dashboardTitle,
                    R.string.feature_your_history_subtitle, R.string.feature_your_history_overview,
                    R.string.feature_your_history_description, R.string.feature_your_history_powered_by, true,
                    new DemoItem(R.string.main_fragment_title_your_history, R.mipmap.statistics,
                            R.string.feature_your_history_button, YourHistory.class, true));

            addDemoFeature("conversational_bots", R.mipmap.lex_bot_input,
                    R.string.feature_app_conversational_bots_title, demoItems[0].title,
                    R.string.feature_app_conversational_bots_subtitle,
                    R.string.feature_app_conversational_bots_overview,
                    R.string.feature_app_conversational_bots_description,
                    R.string.feature_app_conversational_bots_powered_by, true,
                    new DemoItem(R.string.feature_app_conversational_bots_voice_title, demoItems[0].title, R.mipmap.lex_bot_input,
                            R.string.feature_your_history_button, ConversationalBotVoiceFragment.class, true));
            initComplete = true;
        }
    }

    public static List<DemoFeature> getDemoFeatureList() {
        return Collections.unmodifiableList(demoFeatures);
    }

    public static DemoFeature getDemoFeatureByName(final String name) {
        for (DemoFeature demoFeature : demoFeatures) {
            if (demoFeature.name.equals(name)) {
                return demoFeature;
            }
        }
        return null;
    }

    private static void addDemoFeature(final String name, final int iconResId, final int titleResId, final String title,
                                       final int subtitleResId, final int overviewResId,
                                       final int descriptionResId, final int poweredByResId, final boolean directToFragment,
                                       final DemoItem... demoItems) {
        DemoFeature demoFeature = new DemoFeature(name, iconResId, titleResId, title, subtitleResId,
                overviewResId, descriptionResId, poweredByResId, directToFragment, demoItems);
        demoFeatures.add(demoFeature);
    }

    public static class DemoFeature {
        public String name;
        public int iconResId;
        public int titleResId;
        public String title;
        public int subtitleResId;
        public int overviewResId;
        public int descriptionResId;
        public int poweredByResId;
        public List<DemoItem> demos;
        public boolean directToFragment;

        public DemoFeature() {

        }

        public DemoFeature(final String name, final int iconResId, final int titleResId,
                           final int subtitleResId, final int overviewResId,
                           final int descriptionResId, final int poweredByResId,
                           final DemoItem... demoItems) {
            this(name, iconResId, titleResId, "", subtitleResId, overviewResId, descriptionResId, poweredByResId, false, demoItems);
        }

        public DemoFeature(final String name, final int iconResId, final int titleResId, final String title,
                           final int subtitleResId, final int overviewResId,
                           final int descriptionResId, final int poweredByResId,
                           final boolean directToFragment,
                           final DemoItem... demoItems) {
            this.name = name;
            this.title = title;
            this.iconResId = iconResId;
            this.titleResId = titleResId;
            this.subtitleResId = subtitleResId;
            this.overviewResId = overviewResId;
            this.descriptionResId = descriptionResId;
            this.poweredByResId = poweredByResId;
            this.demos = Arrays.asList(demoItems);
            this.directToFragment = directToFragment;
        }
    }

    public static class DemoItem {
        public int titleResId;
        public int iconResId;
        public int buttonTextResId;
        public String fragmentClassName;

        public String title;
        public String buttonText;
        public Serializable tag ;

        public Boolean directToFragment;

        public Boolean isDirectToFragment() {
            return directToFragment;
        }

        public DemoItem(final int titleResId, final int iconResId, final int buttonTextResId,
                        final Class<? extends Fragment> fragmentClass, Boolean directToFragment) {
            this.titleResId = titleResId;
            this.iconResId = iconResId;
            this.buttonTextResId = buttonTextResId;
            this.fragmentClassName = fragmentClass.getName();
            this.directToFragment = directToFragment;
        }

        public DemoItem(final int titleResId, final String title, final int iconResId, final int buttonTextResId,
                        final Class<? extends Fragment> fragmentClass, Boolean directToFragment) {
            this.title = title;
            this.titleResId = titleResId;
            this.iconResId = iconResId;
            this.buttonTextResId = buttonTextResId;
            this.fragmentClassName = fragmentClass.getName();
            this.directToFragment = directToFragment;
        }

        public DemoItem(final int titleResId, final String title, final int iconResId, String buttonText,
                        final Class<? extends Fragment> fragmentClass, Boolean directToFragment) {
            this.title = title;
            this.titleResId = titleResId;
            this.iconResId = iconResId;
            this.buttonTextResId = 0;
            this.buttonText = buttonText;
            this.fragmentClassName = fragmentClass.getName();
            this.directToFragment = directToFragment;
        }

        public DemoItem(final int titleResId, final int iconResId, final int buttonTextResId,
                        final Class<? extends Fragment> fragmentClass) {
            this(titleResId, iconResId, buttonTextResId, fragmentClass, new Boolean(false));
        }

        public DemoItem(final String title, final String buttonText, final Serializable tag, final Class<? extends  Fragment> fragmentClass, Boolean directToFragment){
            this.title = title;
            this.buttonText = buttonText;
            this.tag = tag;
            this.fragmentClassName = fragmentClass.getName();
            this.directToFragment = directToFragment;
        }

        public DemoItem(final String title, final String buttonText, final Serializable tag, final Class<? extends  Fragment> fragmentClass){
            this(title, buttonText, tag, fragmentClass, new Boolean(false));
        }
    }
}
