package com.mysampleapp.demo.dynamodbontroller;

public abstract class NoSQLOperationBase implements NoSQLOperation {
    protected final String title, example;

    NoSQLOperationBase(final String title, final String example) {
        this.title = title;
        this.example = example;
    }

    @Override
    public String getTitle() {
        return title;
    }

    @Override
    public boolean isScan() {
        return false;
    }
}
