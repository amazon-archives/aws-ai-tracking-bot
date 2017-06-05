package com.mysampleapp.demo.dynamodbontroller;

import android.content.Context;

import com.amazonaws.mobile.AWSMobileClient;
import com.amazonaws.services.dynamodbv2.AmazonDynamoDBClient;
import com.amazonaws.services.dynamodbv2.model.AttributeValue;
import com.amazonaws.services.dynamodbv2.model.ComparisonOperator;
import com.amazonaws.services.dynamodbv2.model.Condition;
import com.amazonaws.services.dynamodbv2.model.QueryRequest;
import com.amazonaws.services.dynamodbv2.model.QueryResult;
import com.mysampleapp.R;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.HashMap;
import java.util.Iterator;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.TimeZone;

public class QueryWithPartitionKeyAndSortKeyCondition extends NoSQLOperationBase {

    private AmazonDynamoDBClient dbclient;
    private QueryResult queryResult;
    private List<Map<String,AttributeValue>> queryItems;
    private Iterator<Map<String,AttributeValue>> resultsIterator;

    private static final int QUERYLIMIT = 365;
    private static final int RESULTS_PER_RESULT_GROUP = 31; // This represents at most a months worth of data for this table per use

    QueryWithPartitionKeyAndSortKeyCondition(final Context context) {
        super(context.getString(R.string.nosql_operation_title_query_by_partition_and_sort_condition_text),
                String.format(context.getString(R.string.nosql_operation_example_query_by_partition_and_sort_condition_text),
                        "userId", AWSMobileClient.defaultMobileClient().getIdentityManager().getCachedUserID(),
                        "reported_time", fourWeeksAgo()));
        dbclient = AWSMobileClient.defaultMobileClient().getDynamoDBClient();
    }

    @Override
    public boolean executeOperation(String botName) {

        Map<String,String> expressionAttributesNames = new HashMap<>();
        expressionAttributesNames.put("#userId","userId");
        Map<String,AttributeValue> expressionAttributeValues = new HashMap<>();
        expressionAttributeValues.put(":userIdValue",new AttributeValue().withS(AWSMobileClient.defaultMobileClient().getIdentityManager().getCachedUserID()));

        final Condition userIdCondition = new Condition()
                .withComparisonOperator(ComparisonOperator.EQ.toString())
                .withAttributeValueList(new AttributeValue().withS(AWSMobileClient.defaultMobileClient().getIdentityManager().getCachedUserID()));

        final Condition rangeKeyCondition = new Condition()
                .withComparisonOperator(ComparisonOperator.LT.toString())
                .withAttributeValueList(new AttributeValue().withS("demo-reported_time-500000"));

        Map<String,Condition> conditionMap = new HashMap<>();
        conditionMap.put("reported_time", rangeKeyCondition);
        conditionMap.put("userId", userIdCondition);

        String tablename = botName + "-Aggregate";
        QueryRequest queryRequest = new QueryRequest()
                .withTableName(tablename)
                .withKeyConditions(conditionMap)
                .withConsistentRead(true)
                .withLimit(QUERYLIMIT);;
        queryResult = dbclient.query(queryRequest);

        if (queryResult != null) {
            queryItems = queryResult.getItems();
            resultsIterator = queryItems.iterator();
            return true;
        }
        return false;
    }

    /**
     * Gets the next page of results from the query.
     * @return list of results, or null if there are no more results.
     */
    public List<NoSQLResult> getNextResultGroup() {
        return getNextResultsGroupFromIterator(resultsIterator);
    }

    @Override
    public void resetResults() {
        resultsIterator = queryItems.iterator();
    }

    /**
     * Helper Method to handle retrieving the next group of query results.
     * @param resultsIterator the iterator for all the results (makes a new service call for each result group).
     * @return the next list of results.
     */
    private static List<NoSQLResult> getNextResultsGroupFromIterator(final Iterator<Map<String,AttributeValue>> resultsIterator) {
        if (!resultsIterator.hasNext()) {
            return null;
        }
        List<NoSQLResult> resultGroup = new LinkedList<>();
        int itemsRetrieved = 0;
        do {
            // Retrieve the item from the paginated results.
            final Map<String,AttributeValue> item = resultsIterator.next();
            // Add the item to a group of results that will be displayed later.
            resultGroup.add(new NoSQLTrackingBotResult(item));
            itemsRetrieved++;
        } while ((itemsRetrieved < RESULTS_PER_RESULT_GROUP) && resultsIterator.hasNext());
        return resultGroup;
    }

    private static String fourWeeksAgo() {
        long fourWeeksAgoMilli = (new Date()).getTime() - (28L*24L*60L*60L*1000L);
        Date fourWeeksAgo = new Date();
        fourWeeksAgo.setTime(fourWeeksAgoMilli);
        SimpleDateFormat dateFormatter = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
        dateFormatter.setTimeZone(TimeZone.getTimeZone("UTC"));
        String fourWeeksAgoStr = dateFormatter.format(fourWeeksAgo);
        return fourWeeksAgoStr;
    }
}
