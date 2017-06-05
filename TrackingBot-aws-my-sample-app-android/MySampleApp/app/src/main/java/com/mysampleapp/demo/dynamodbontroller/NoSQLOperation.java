package com.mysampleapp.demo.dynamodbontroller;

import java.util.List;

public interface NoSQLOperation {
    /**
     * Synchronously Execute the Demo NoSQL operation.
     * @return true if there were results, otherwise return false.
     */
    boolean executeOperation(String botName);

    /**
     * Synchronously retrieve the next group of results from the last
     * operation that was executed.  The first time this is called after
     * calling executeOperation(), results will be available immediately.
     * Subsequent calls will block to retrieve the next page of results
     * synchronously.
     * @return the next group of results or null if there are no more results.
     */
    List<NoSQLResult> getNextResultGroup();

    /**
     * Reset the results of the last executed operation to the beginning of the results list.
     */
    void resetResults();

    /**
     * @return The title of the operation.
     */
    String getTitle();

    /**
     * @return true if this operation is a scan.
     */
    boolean isScan();
}
