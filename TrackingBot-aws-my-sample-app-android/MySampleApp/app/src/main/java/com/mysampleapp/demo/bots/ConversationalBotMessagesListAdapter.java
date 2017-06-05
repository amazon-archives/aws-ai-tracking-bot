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

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.BaseAdapter;
import android.widget.TextView;

import com.amazonaws.mobile.bots.Conversation;
import com.amazonaws.mobile.bots.TextMessage;
import com.mysampleapp.R;

public class ConversationalBotMessagesListAdapter extends BaseAdapter {
    private Context context;
    private int count;
    private static LayoutInflater layoutInflater;

    public ConversationalBotMessagesListAdapter(Context context) {
        this.context = context;
        count = Conversation.getCount();
        layoutInflater = (LayoutInflater) context.getSystemService(Context.LAYOUT_INFLATER_SERVICE);
    }

    @Override
    public int getCount() {
        return count;
    }

    @Override
    public Object getItem(int position) {
        return position;
    }

    @Override
    public long getItemId(int position) {
        return position;
    }

    @Override
    public View getView(int position, View convertView, ViewGroup parent) {
        Holder holder;

        TextMessage item = Conversation.getMessage(position);

        if (convertView == null) {
            if ("tx".equals(item.getFrom())) {
                convertView = layoutInflater
                        .inflate(R.layout.conversational_bot_user_message_layout, null);
                holder = new Holder();
                holder.message = (TextView) convertView
                        .findViewById(R.id.editTextUserInput);
            } else {
                convertView = layoutInflater
                        .inflate(R.layout.conversational_bot_response_message_layout, null);
                holder = new Holder();
                holder.message = (TextView) convertView
                        .findViewById(R.id.editTextBotResponse);
            }
            convertView.setTag(holder);
        } else {
            holder = (Holder) convertView.getTag();
        }

        holder.message.setText(item.getMessage());
        return convertView;
    }

    // Helper class to recycle View's
    static class Holder {
        TextView message;
    }

    // Add new items
    public void refreshList(TextMessage message) {
        Conversation.add(message);
        notifyDataSetChanged();
    }

}
