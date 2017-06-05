package com.mysampleapp.demo.dynamodbontroller;

import android.content.Context;

//import com.amazonaws.mobile.models.nosql.AhaheartdasttestmobileDO;

import java.util.ArrayList;
import java.util.List;

/**
 * The DynamoDbController provides one method to obtain the metrics for a user over the lastg 30 days.
 * This is a syncrhonous request. The caller is expected to have properly threaded the use of
 * this method.
 */

public class DynamoDbController {

    private final Context appContext;

    public DynamoDbController(Context appContext) {
        this.appContext = appContext;
    }

    public List<NoSQLTrackingBotResult> userLastThirtyDayMetrics(String botName) {
        QueryWithPartitionKeyAndSortKeyCondition query = new QueryWithPartitionKeyAndSortKeyCondition(appContext);
        query.executeOperation(botName);
        List<NoSQLResult> items = query.getNextResultGroup();
        ArrayList<NoSQLTrackingBotResult> result = new ArrayList<NoSQLTrackingBotResult>();
        if (items!=null && items.size()>0) {
            for (NoSQLResult r : items) {
                NoSQLTrackingBotResult obj = (NoSQLTrackingBotResult) r;
                result.add(obj);
            }
        }
        return result;
    }
}
