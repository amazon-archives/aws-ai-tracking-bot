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

import java.io.Serializable;




public class Bot implements Serializable {

    private String botName;
    private String botAlias;
    private String description;
    private String region;
    private String[] helpCommands;
    private String botTitle;

    public String getBotName(){
        return this.botName;
    }

    public String getBotAlias(){
        return this.botAlias;
    }

    public String getDescription(){
        return this.description;
    }

    public String getRegion(){
        return this.region;
    }

    public String[] getHelpCommands() {
        return helpCommands;
    }

    public String getBotTitle() {
        return this.botTitle;
    }

    public Bot(final String botName,
               final String botAlias,
               final String botTitle,
               final String description,
               final String region,
               final String[] helpCommands){
        this.botName = botName;
        this.botAlias = botAlias;
        this.description  =description;
        this.region = region;
        this.helpCommands = helpCommands;
        this.botTitle = botTitle;
    }
}
