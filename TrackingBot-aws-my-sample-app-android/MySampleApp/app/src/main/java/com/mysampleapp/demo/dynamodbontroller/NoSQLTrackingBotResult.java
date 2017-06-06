package com.mysampleapp.demo.dynamodbontroller;

import com.amazonaws.services.dynamodbv2.model.AttributeValue;

import java.util.Map;

/**
 * Created by potterve on 1/17/17.
 */

public class NoSQLTrackingBotResult implements NoSQLResult {

    private final Map<String,AttributeValue> result;

    NoSQLTrackingBotResult(final Map<String,AttributeValue> result) {
        this.result = result;
    }

    public Map<String,AttributeValue> getResult() {
        return result;
    }
}
