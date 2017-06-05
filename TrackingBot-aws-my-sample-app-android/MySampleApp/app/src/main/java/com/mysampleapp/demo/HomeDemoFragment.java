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
import android.os.Bundle;
import android.support.v4.app.Fragment;
import android.support.v4.app.FragmentTransaction;
import android.support.v7.app.ActionBar;
import android.support.v7.app.AppCompatActivity;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.AdapterView;
import android.widget.ArrayAdapter;
import android.widget.ImageView;
import android.widget.ListView;
import android.widget.TextView;

import com.mysampleapp.R;

public class HomeDemoFragment extends DemoFragmentBase {

    @Override
    public View onCreateView(final LayoutInflater inflater, final ViewGroup container,
                             final Bundle savedInstanceState) {

        // Inflate the layout for this fragment
        return inflater.inflate(R.layout.fragment_demo_home, container, false);
    }

    @Override
    public void onViewCreated(final View view, final Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        final DemoListAdapter adapter = new DemoListAdapter(getActivity());
        adapter.addAll(DemoConfiguration.getDemoFeatureList());

        ListView listView = (ListView) view.findViewById(android.R.id.list);
        listView.setAdapter(adapter);
        listView.setOnItemClickListener(new AdapterView.OnItemClickListener() {
            @Override
            public void onItemClick(final AdapterView<?> parent, final View view,
                                    final int position, final long id) {
                final DemoConfiguration.DemoFeature item = adapter.getItem(position);
                final AppCompatActivity activity = (AppCompatActivity) getActivity();
                if (activity != null) {
                    Fragment fragment = null;
                    if (item.directToFragment) {
                        fragment = Fragment.instantiate(getActivity(), item.demos.get(0).fragmentClassName);
                        Bundle args = new Bundle();
                        args.putInt("param1", item.titleResId);
                        fragment.setArguments(args);
                    } else {
                        fragment = DemoInstructionFragment.newInstance(item.name);
                    }
                    activity.getSupportFragmentManager()
                        .beginTransaction()
                        .replace(R.id.main_fragment_container, fragment, item.name)
                        .setTransition(FragmentTransaction.TRANSIT_FRAGMENT_OPEN)
                        .commit();

                    // Set the title for the fragment.
                    final ActionBar actionBar = activity.getSupportActionBar();
                    if (actionBar != null) {
                        if (item.title != null && item.title.length()>0) {
                            actionBar.setTitle(item.title);
                        } else {
                            actionBar.setTitle(item.titleResId);
                        }
                    }
                }
            }
        });
    }

    private static final class DemoListAdapter extends ArrayAdapter<DemoConfiguration.DemoFeature> {
        private LayoutInflater inflater;

        public DemoListAdapter(final Context context) {
            super(context, R.layout.list_item_icon_text_with_subtitle);
            inflater = (LayoutInflater) context.getSystemService(Context.LAYOUT_INFLATER_SERVICE);
        }

        @Override
        public View getView(final int position, final View convertView, final ViewGroup parent) {
            View view;
            ViewHolder holder;
            if (convertView == null) {
                view = inflater.inflate(R.layout.list_item_icon_text_with_subtitle, parent, false);
                holder = new ViewHolder();
                holder.iconImageView = (ImageView) view.findViewById(R.id.list_item_icon);
                holder.titleTextView = (TextView) view.findViewById(R.id.list_item_title);
                holder.subtitleTextView = (TextView) view.findViewById(R.id.list_item_subtitle);
                view.setTag(holder);
            } else {
                view = convertView;
                holder = (ViewHolder) convertView.getTag();
            }

            DemoConfiguration.DemoFeature item = getItem(position);
            holder.iconImageView.setImageResource(item.iconResId);
            if (item.title != null && item.title.length()>0) {
                holder.titleTextView.setText(item.title);
            } else {
                holder.titleTextView.setText(item.titleResId);
            }
            holder.subtitleTextView.setText(item.subtitleResId);

            return view;
        }
    }

    private static final class ViewHolder {
        ImageView iconImageView;
        TextView titleTextView;
        TextView subtitleTextView;
    }
}
