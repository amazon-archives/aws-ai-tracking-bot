/*
# Copyright 2017-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0.
*/


package com.mysampleapp.demo;

import android.content.Context;
import android.graphics.Color;
import android.graphics.drawable.Drawable;
import android.net.ConnectivityManager;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.support.constraint.ConstraintLayout;
import android.support.constraint.ConstraintSet;
import android.support.v4.app.Fragment;
import android.support.v7.app.ActionBar;
import android.support.v7.app.AppCompatActivity;
import android.util.TypedValue;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;

import com.amazonaws.AmazonClientException;
import com.amazonaws.mobile.AWSConfiguration;
import com.amazonaws.services.cognitoidentity.model.NotAuthorizedException;
import com.amazonaws.services.dynamodbv2.model.AttributeValue;
import com.mysampleapp.R;
import com.mysampleapp.demo.dynamodbontroller.DynamoDbController;
import com.mysampleapp.demo.dynamodbontroller.NoSQLTrackingBotResult;
import com.mysampleapp.util.JSONResourceReader;

import org.json.JSONArray;
import org.json.JSONObject;
import org.json.JSONException;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import az.plainpie.PieView;


/**
 * A simple {@link Fragment} subclass.
 * Activities that contain this fragment must implement the
 * {@link YourHistory.OnFragmentInteractionListener} interface
 * to handle interaction events.
 * Use the {@link YourHistory#newInstance} factory method to
 * create an instance of this fragment.
 *
 * YourHistory processes items obtained from DynamoDB and updates a simple pie based
 * user interface. The primary input is a List<NoSQLTrackingBotResult> items. This list is aggregated
 * into totals for the current day, the last seven days (last week), and the last 30 days (last month).
 *
 * The aggregated totals are displayed based on the users selection of day, week, or month.
 *
 * The class uses the target values for each metric and computes as necessary a target value for the
 * day, week, and month based on the supplied targets.
 *
 * Simple array structures are used in this example rather than more complicated class based
 * structures.
 */
public class YourHistory extends DemoFragmentBase implements View.OnClickListener {
    private JSONObject model = null;
    private static final String ARG_PARAM1 = "param1";
    private int argTitleResId;

    private JSONObject jsonObj;
    JSONObject bot;
    String botName;
    JSONArray categories = null;
    ArrayList<TextView> currentTextViews = new ArrayList<TextView>();
    ArrayList<PieView> currentPieViews = new ArrayList<PieView>();
    Map<String,PieView> pieViewMap = new HashMap<String,PieView>();
    Map<String,TextView> textViewMap = new HashMap<String,TextView>();

    private DynamoDbController dbController;
    private OnFragmentInteractionListener mListener;
    private static List<NoSQLTrackingBotResult> lastItems;
    private static HashMap<String, Double[]> lastProcessedResults;

    private enum DisplayState { DISPLAY_DAILY, DISPLAY_WEEKLY, DISPLAY_MONTHLY};
    private DisplayState currentDisplay = DisplayState.DISPLAY_DAILY;

    private Button dailyButton;
    private Button weeklyButton;
    private Button monthlyButton;

    // When the class is created, the values to use for a button's selected background
    // are pulled from the runtime. This lets the designer define the background for
    // the buttons rather than defining this in code.

    Drawable activeButtonBackground;
    Drawable inactiveButtonBackground;

    private boolean refreshData = true;
    private Date lastViewDate = null;

    public YourHistory() {
    }

    public static YourHistory newInstance(int resId) {
        YourHistory fragment = new YourHistory();
        Bundle args = new Bundle();
        args.putInt(ARG_PARAM1, resId);
        fragment.setArguments(args);
        return fragment;
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if (getArguments() != null) {
            argTitleResId = getArguments().getInt(ARG_PARAM1);
        }
        currentDisplay = DisplayState.DISPLAY_DAILY;
        refreshData = true;
        JSONResourceReader reader = new JSONResourceReader(this.getResources(), R.raw.trackingbotmodel);
        jsonObj = reader.constructUsingJson();


    }

    @Override
    public void onClick(View v) {
        if (v.getId() == dailyButton.getId()) {
            currentDisplay = DisplayState.DISPLAY_DAILY;
            dailyButton.setBackground(activeButtonBackground);
            weeklyButton.setBackground(inactiveButtonBackground);
            monthlyButton.setBackground(inactiveButtonBackground);
        } else if (v.getId() == weeklyButton.getId()) {
            currentDisplay = DisplayState.DISPLAY_WEEKLY;
            dailyButton.setBackground(inactiveButtonBackground);
            weeklyButton.setBackground(activeButtonBackground);
            monthlyButton.setBackground(inactiveButtonBackground);
        } else if (v.getId() == monthlyButton.getId()) {
            currentDisplay = DisplayState.DISPLAY_MONTHLY;
            dailyButton.setBackground(inactiveButtonBackground);
            weeklyButton.setBackground(inactiveButtonBackground);
            monthlyButton.setBackground(activeButtonBackground);
        }
        //process the click and update the display
        updateView();
    }

    private void initializeButtons() {
        dailyButton.setOnClickListener(this);
        weeklyButton.setOnClickListener(this);
        monthlyButton.setOnClickListener(this);
        activeButtonBackground = dailyButton.getBackground();
        inactiveButtonBackground = monthlyButton.getBackground();
    }

    private void setPieViewWithValue(PieView v, double value, boolean reverseIndication) {
        if (reverseIndication == false) {
            if (value <= 0.0) {
                v.setPercentage((float) 0.5);
                v.setInnerText("0%");
                v.setPercentageBackgroundColor(Color.RED);
            } else {
                v.setPercentage((float) value);
                if (value < 30.0) {
                    v.setPercentageBackgroundColor(Color.RED);
                } else if (value < 80.0) {
                    v.setPercentageBackgroundColor(Color.YELLOW);
                } else {
                    v.setPercentageBackgroundColor(Color.GREEN);
                }
            }
        } else {
            if (value <= 0.0) {
                v.setPercentage((float) 0.5);
                v.setInnerText("0%");
                v.setPercentageBackgroundColor(Color.GREEN);
            } else {
                v.setPercentage((float) value);
                if (value < 30.0) {
                    v.setPercentageBackgroundColor(Color.GREEN);
                } else if (value < 100.0) {
                    v.setPercentageBackgroundColor(Color.YELLOW);
                } else {
                    v.setPercentageBackgroundColor(Color.RED);
                }
            }
        }
    }

    /**
     * Aggregate the items
     * The target weekly and target monthly value will be adjusted to an average daily target value multipled
     * by the size of the target, 7 for week and 30 for month. Target values for week or month will
     * override the use of daily target values.
     * @param items
     * @return HashMap<String,Double[]>
     */
    private HashMap<String,Double[]> processValues(List<NoSQLTrackingBotResult> items) {

        HashMap<String,Double[]> valueStore = new HashMap<String,Double[]>();
        SimpleDateFormat dateFormatter = new SimpleDateFormat("yyyy-MM-dd");
        String todayStr = dateFormatter.format(new Date());
        long oneWeekAgoMilli = (new Date()).getTime() - (7L*24L*60L*60L*1000L);
        Date oneWeekAgo = new Date();
        oneWeekAgo.setTime(oneWeekAgoMilli);

        int countOfTargetValuesForWeek=0;
        int countOfTargetValuesForMonth=0;

        for (NoSQLTrackingBotResult item: items) {
            Date itemDate;
            Map<String, AttributeValue> data = item.getResult();
            data.get("reported_time()");
            AttributeValue av = data.get("reported_time");
            try {
                itemDate = dateFormatter.parse(av.getS());
            } catch (ParseException e) {
                System.out.println("Could not determine an item's date");
                continue;
            }
            for (int i = 0; i < categories.length(); i++) {
                String categoryName = null;
                try {
                    categoryName = categories.getJSONObject(i).getString("name");
                    Double valueArray[] = valueStore.get(categoryName);
                    if (valueArray == null) {
                        valueArray = new Double[6];
                        valueArray[0] = valueArray[1] = valueArray[2] = valueArray[3] = valueArray[4] = valueArray[5] = new Double(0);
                        valueStore.put(categoryName,valueArray);
                    }
                    AttributeValue avForCategory = data.get(categoryName);
                    AttributeValue avForTarget = data.get("target_" + categoryName);
                    Map<String, AttributeValue> targets = avForTarget.getM();
                    AttributeValue targetDaily = targets.get("dailyTarget");
                    AttributeValue targetWeekly = targets.get("weeklyTarget");
                    AttributeValue targetMonthly = targets.get("monthlyTarget");
                    double categoryValue = Double.parseDouble(avForCategory.getN());
                    double categoryTargetDaily = Double.parseDouble(targetDaily.getN());
                    double categoryTargetWeekly = Double.parseDouble(targetWeekly.getN());
                    double categoryTargetMonthly = Double.parseDouble(targetMonthly.getN());
                    if (todayStr.indexOf(dateFormatter.format(itemDate)) >= 0) {
                        valueArray[0] = categoryValue;
                        valueArray[3] = categoryTargetDaily;
                        valueArray[4] = categoryTargetWeekly;
                        valueArray[5] = categoryTargetMonthly;
                    }

                    if (itemDate.after(oneWeekAgo)) {
                        valueArray[1] += categoryValue;
                        valueArray[3] = categoryTargetDaily;
                        valueArray[4] = categoryTargetWeekly;
                        valueArray[5] = categoryTargetMonthly;
                        countOfTargetValuesForWeek++;
                    }

                    valueArray[2] += categoryValue;
                    valueArray[3] = categoryTargetDaily;
                    valueArray[4] = categoryTargetWeekly;
                    valueArray[5] = categoryTargetMonthly;
                    countOfTargetValuesForMonth++;

                } catch (Exception ex) {
                    ex.printStackTrace();
                    System.out.println("Exception during value extraction: " + ex);
                }
            }
        }

        countOfTargetValuesForMonth = countOfTargetValuesForMonth / categories.length();
        countOfTargetValuesForWeek = countOfTargetValuesForWeek / categories.length();

        // compute a weekly and monthly target for each category if the number of values used for the week is less than 7
        // and for the month less than 30 and a target for weekly or monthly does not exist.
        for (int i = 0; i < categories.length(); i++) {
            String categoryName = null;
            try {
                categoryName = categories.getJSONObject(i).getString("name");
                Double valueArray[] = valueStore.get(categoryName);
                if (countOfTargetValuesForWeek<7 && valueArray[4] == 0) {
                    valueArray[4] = valueArray[3] * 7;
                }
                if (countOfTargetValuesForMonth<30 && valueArray[5] == 0) {
                    if (valueArray[3] > 0) {
                        valueArray[5] = valueArray[3] * 30;
                    } else {
                        valueArray[5] = valueArray[4] * 4;
                    }
                }
                valueStore.put(categoryName, valueArray);
            } catch (Exception ex) {
                ex.printStackTrace();
                System.out.println("Exception during value extraction: " + ex);
            }
        }

        // the static lastProcessedResults is used if network is not available or the results do not need to be refreshed
        lastProcessedResults = valueStore;

        return valueStore;
    }

    private void setValuesForMetric(String name, double value, double targetValue,
                                    PieView pieView, TextView textView) {
        boolean reverseIndication = false; // future support can be added for a metric where lower target values are better
                                           // for now larger values relative to target are assumed to be better.
        double myPercent=0.0;
        if (value<=0) {
            textView.setText(name + " (" + value + ")");
            value = 0;
            if (reverseIndication) {
                if (targetValue <= 0 && value > 0) {
                    myPercent = 100.0;
                } else {
                    myPercent = value / targetValue * 100;
                }
            }
        } else {
            myPercent = (value / targetValue * 100);
            textView.setText(name + " (" + value + ")");
        }
        setPieViewWithValue(pieView, myPercent, reverseIndication);
    }

    private void updateViewGivenValues(HashMap<String,Double[]> values) {

        if (this.getView()==null) {
            Toast.makeText(getContext(), "View is not ready for presentation. Try again shortly.", Toast.LENGTH_LONG).show();
            return;
        }

        Set<String> categories = values.keySet();
        for (String s : categories) {
            PieView pieViewComponent = pieViewMap.get(s);
            TextView textViewComponent = textViewMap.get(s);
            Double[] categoryValues = values.get(s);
            Double value = new Double(0);
            Double target = new Double(0);
            switch (currentDisplay) {
                case DISPLAY_DAILY:
                    value = categoryValues[0];
                    target = categoryValues[3];
                    if (target <= 0) {
                        if (categoryValues[4]>0) {
                            target = categoryValues[4] / 4;
                        } else {
                            target = categoryValues[5] / 30;
                        }
                    }
                    break;
                case DISPLAY_WEEKLY:
                    value = categoryValues[1];
                    target = categoryValues[4];
                    if (target <= 0) {
                        if (categoryValues[3]>0) {
                            target = categoryValues[3] * 7;
                        } else {
                            target = categoryValues[5] / 4;
                        }
                    }
                    break;
                case DISPLAY_MONTHLY:
                    value = categoryValues[2];
                    target = categoryValues[5];
                    if (target <= 0) {
                        if (categoryValues[3]>0) {
                            target = categoryValues[3] * 30;
                        } else {
                            target = categoryValues[4] * 4;
                        }
                    }
            }
            if (target <= 0) {
                System.out.println("warning target is 0");
            }
            setValuesForMetric(s, value, target, pieViewComponent, textViewComponent);
        }
    }

    public void showItems(List<NoSQLTrackingBotResult> items) {
        if (items.size()<1) {
            Toast.makeText(getContext(), "No information recorded in the last 30 days. Please record some information.", Toast.LENGTH_LONG).show();
            return;
        }
        lastItems = items;
        HashMap<String,Double[]> values = processValues(items);
        updateViewGivenValues(values);
    }

    private boolean isNetworkAvailable() {
        final ConnectivityManager connectivityManager = ((ConnectivityManager) getContext().getSystemService(Context.CONNECTIVITY_SERVICE));
        return connectivityManager.getActiveNetworkInfo() != null && connectivityManager.getActiveNetworkInfo().isConnected();
    }


    private void handleSessionError(String category, String key, String msg, Exception ex) {
        Looper.prepare();
        Toast.makeText(getContext(), "Warning. Your session has expired", Toast.LENGTH_LONG).show();
    }

    private boolean currentDataExpired() {
        if (lastViewDate==null) {
            lastViewDate = new Date();
            return true;
        }

        Calendar cal = Calendar.getInstance();
        cal.setTime(lastViewDate);
        int lastViewedDay = cal.get(Calendar.DAY_OF_WEEK);
        int lastViewedMonth = cal.get(Calendar.MONTH);
        int lastViewedYear = cal.get(Calendar.YEAR);
        cal.setTime(new Date());
        int currDay = cal.get(Calendar.DAY_OF_WEEK);
        int currMonth = cal.get(Calendar.MONTH);
        int currYear = cal.get(Calendar.YEAR);

        if (currYear!=lastViewedYear || currMonth!=lastViewedMonth || currDay!=lastViewedDay) {
            return true;
        } else {
            return false;
        }
    }
    private void updateView() {
        boolean networkAvailable = isNetworkAvailable();
        if (networkAvailable && (refreshData || currentDataExpired()) ) { // if the network is available, attempt to pull data from dynamodb for this user
            new Thread(new Runnable() {
                @Override
                public void run() {
                    try {
                        final List<NoSQLTrackingBotResult> items = dbController.userLastThirtyDayMetrics(botName);
                        Handler uiHandler = new Handler(Looper.getMainLooper());
                        Runnable runnable = new Runnable() {
                            @Override
                            public void run() {
                                showItems(items);
                                refreshData = false;
                                lastViewDate = new Date();
                            }
                        };
                        uiHandler.post(runnable);
                    } catch (final NotAuthorizedException ex) {
                            handleSessionError("YourHistoryView", "Session", "Session Refresh", ex);
                    } catch (final AmazonClientException ex) {
                            handleSessionError("YourHistoryView", "Session", "Session Refresh", ex);
                    } catch (final Exception ex) {
                            handleSessionError("YourHistoryView", "Session", "Session Refresh", ex);
                    }
                }
            }).start();
        } else {
            // no network, use last items
            if (!networkAvailable) {
                Toast.makeText(getContext(), "Warning. Network is not available.", Toast.LENGTH_LONG).show();
            }
            if (lastItems!=null && lastItems.size()>0) {
                try {
                    Handler uiHandler = new Handler(Looper.getMainLooper());
                    Runnable runnable = new Runnable() {
                        @Override
                        public void run() {
                            updateViewGivenValues(lastProcessedResults);
                        }
                    };
                    uiHandler.post(runnable);
                } catch (Exception ex) {

                }
            }
        }
    }

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {

        if (dbController==null) {
            dbController = new DynamoDbController(getContext());
        }

        View view = inflater.inflate(R.layout.fragment_your_history_v3, container, false);

        ConstraintLayout rl = (ConstraintLayout) view.findViewById(R.id.constraintlayout);

        //And now you can add the buttons you need, because it's a fragment, use getActivity() as context
        dailyButton = new Button(getActivity());
        dailyButton.setId(View.generateViewId());
        dailyButton.setBackgroundResource(R.color.percentageFillColor);
        dailyButton.setText("Daily");
        dailyButton.setId(View.generateViewId());
        //You can add LayoutParams to put the button where you want it and the just add it
        rl.addView(dailyButton);

        weeklyButton = new Button(getActivity());
        weeklyButton.setId(View.generateViewId());
        weeklyButton.setBackgroundResource(R.color.black_overlay);
        weeklyButton.setText("Weekly");
        weeklyButton.setId(View.generateViewId());
        //You can add LayoutParams to put the button where you want it and the just add it
        rl.addView(weeklyButton);

        monthlyButton = new Button(getActivity());
        monthlyButton.setId(View.generateViewId());
        monthlyButton.setBackgroundResource(R.color.black_overlay);
        monthlyButton.setText("Monthly");
        monthlyButton.setId(View.generateViewId());
        //You can add LayoutParams to put the button where you want it and the just add it
        rl.addView(monthlyButton);

        currentTextViews = new ArrayList<TextView>();
        currentPieViews = new ArrayList<PieView>();
        pieViewMap = new HashMap<String,PieView>();
        textViewMap = new HashMap<String,TextView>();

        try {
            bot = jsonObj.getJSONObject("bot");
            AWSConfiguration awsConfiguration = AWSConfiguration.getInstance(getContext().getResources());
            botName = awsConfiguration.getAWS_CONFIGURED_BOTNAME();
            categories = bot.getJSONArray("categories");
        } catch (JSONException e) {
            e.printStackTrace();
        }

        TextView priorTv = null;
        PieView priorPv = null;
        final float scale = getContext().getResources().getDisplayMetrics().density;
        for (int i=0; i<categories.length(); i++) {
            TextView tv = new TextView(getContext());
            String categoryName = null;
            try {
                categoryName = categories.getJSONObject(i).getString("name");
                tv.setText(categoryName);
                tv.setTextSize(TypedValue.COMPLEX_UNIT_SP, 24);
                tv.setId(View.generateViewId());
                rl.addView(tv);
                currentTextViews.add(tv);
                textViewMap.put(categoryName,tv);
            } catch (JSONException e) {
                e.printStackTrace();
            }
            PieView pv = new PieView(getContext());
            try {
                pv.setId(View.generateViewId());
                pv.setInnerBackgroundColor(Color.WHITE);
                pv.setMainBackgroundColor(Color.BLACK);
                pv.setPercentageBackgroundColor(Color.RED);

                float f = (float) 0;
                pv.setPercentage(f);
                pv.setMaxPercentage((float)100);
                pv.setPercentageTextSize((float)20);
                pv.setPieInnerPadding(30);
                pv.setInnerTextVisibility(1);
                pv.setTextColor(Color.BLACK);
                ViewGroup.LayoutParams lp = pv.getLayoutParams();
                int pixels = (int) (100 * scale + 0.5f);
                lp.width = pixels;
                lp.height = pixels;
                pv.setLayoutParams(lp);
                rl.addView(pv);
                currentPieViews.add(pv);
                pieViewMap.put(categoryName,pv);
            } catch (Exception e) {
                e.printStackTrace();
            }
        }

        ConstraintSet constraintSet = new ConstraintSet();
        constraintSet.clone(rl);
        for (int i=0; i<currentTextViews.size(); i++) {
            TextView tv = currentTextViews.get(i);
            PieView pv = currentPieViews.get(i);
            if (i==0) {
                constraintSet.connect(tv.getId(), ConstraintSet.TOP, rl.getId(), ConstraintSet.TOP);
                constraintSet.connect(tv.getId(), ConstraintSet.BOTTOM, pv.getId(), ConstraintSet.TOP);
                constraintSet.connect(pv.getId(), ConstraintSet.TOP, tv.getId(), ConstraintSet.BOTTOM);
                constraintSet.connect(tv.getId(), ConstraintSet.RIGHT, rl.getId(), ConstraintSet.RIGHT);
                constraintSet.connect(pv.getId(), ConstraintSet.RIGHT, rl.getId(), ConstraintSet.RIGHT);
                constraintSet.connect(tv.getId(), ConstraintSet.LEFT, rl.getId(), ConstraintSet.LEFT);
                constraintSet.connect(pv.getId(), ConstraintSet.LEFT, rl.getId(), ConstraintSet.LEFT);
            } else if ((i % 2) == 0){
                constraintSet.connect(tv.getId(), ConstraintSet.TOP, priorPv.getId(), ConstraintSet.BOTTOM);
                constraintSet.connect(pv.getId(), ConstraintSet.TOP, tv.getId(), ConstraintSet.BOTTOM);
                constraintSet.connect(tv.getId(), ConstraintSet.LEFT, rl.getId(), ConstraintSet.LEFT);
                constraintSet.connect(pv.getId(), ConstraintSet.LEFT, rl.getId(), ConstraintSet.LEFT);
                constraintSet.connect(tv.getId(), ConstraintSet.RIGHT, rl.getId(), ConstraintSet.RIGHT);
                constraintSet.connect(pv.getId(), ConstraintSet.RIGHT, rl.getId(), ConstraintSet.RIGHT);
            } else {
                constraintSet.connect(tv.getId(), ConstraintSet.TOP, priorTv.getId(), ConstraintSet.TOP);
                constraintSet.connect(pv.getId(), ConstraintSet.TOP, priorPv.getId(), ConstraintSet.TOP);
                constraintSet.connect(tv.getId(), ConstraintSet.RIGHT, rl.getId(), ConstraintSet.RIGHT);
                constraintSet.connect(pv.getId(), ConstraintSet.RIGHT, rl.getId(), ConstraintSet.RIGHT);
                constraintSet.connect(tv.getId(), ConstraintSet.LEFT, priorTv.getId(), ConstraintSet.RIGHT);
                constraintSet.connect(pv.getId(), ConstraintSet.LEFT, priorPv.getId(), ConstraintSet.RIGHT);

                constraintSet.connect(priorTv.getId(), ConstraintSet.LEFT, rl.getId(), ConstraintSet.LEFT);
                constraintSet.connect(priorPv.getId(), ConstraintSet.LEFT, rl.getId(), ConstraintSet.LEFT);
                constraintSet.connect(priorTv.getId(), ConstraintSet.RIGHT, tv.getId(), ConstraintSet.LEFT);
                constraintSet.connect(priorPv.getId(), ConstraintSet.RIGHT, pv.getId(), ConstraintSet.LEFT);
            }
            priorTv = tv;
            priorPv = pv;
        }

        constraintSet.connect(dailyButton.getId(), ConstraintSet.LEFT, rl.getId(), ConstraintSet.LEFT, 36);
        constraintSet.connect(dailyButton.getId(), ConstraintSet.TOP, priorPv.getId(), ConstraintSet.BOTTOM, 36);
        constraintSet.connect(dailyButton.getId(), ConstraintSet.BOTTOM, rl.getId(), ConstraintSet.BOTTOM, 36);

        constraintSet.connect(monthlyButton.getId(), ConstraintSet.RIGHT, rl.getId(), ConstraintSet.RIGHT, 36);
        constraintSet.connect(monthlyButton.getId(), ConstraintSet.TOP, priorPv.getId(), ConstraintSet.BOTTOM, 36);
        constraintSet.connect(monthlyButton.getId(), ConstraintSet.BOTTOM, rl.getId(), ConstraintSet.BOTTOM, 36);

        constraintSet.connect(weeklyButton.getId(), ConstraintSet.LEFT, rl.getId(), ConstraintSet.LEFT, 36);
        constraintSet.connect(weeklyButton.getId(), ConstraintSet.RIGHT, rl.getId(), ConstraintSet.RIGHT, 36);
        constraintSet.connect(weeklyButton.getId(), ConstraintSet.TOP, priorPv.getId(), ConstraintSet.BOTTOM, 36);
        constraintSet.connect(weeklyButton.getId(), ConstraintSet.BOTTOM, rl.getId(), ConstraintSet.BOTTOM, 36);

        constraintSet.applyTo(rl);

        return view;
    }

    private void showErrorOnMainThread(final String msg) {
        Handler uiHandler = new Handler(Looper.getMainLooper());
        Runnable runnable = new Runnable() {
            @Override
            public void run() {
                Toast.makeText(getContext(), msg, Toast.LENGTH_LONG).show();
            }
        };
        uiHandler.post(runnable);
    }

    @Override
    public void onAttach(Context context) {
        super.onAttach(context);
        if (context instanceof OnFragmentInteractionListener) {
            mListener = (OnFragmentInteractionListener) context;
        } else {
            throw new RuntimeException(context.toString()
                    + " must implement OnFragmentInteractionListener");
        }
    }

    @Override
    public void onDetach() {
        super.onDetach();
        mListener = null;
    }

    /**
     * When this fragment is brought back to life or being displayed the first time, initialize the buttons
     * which are now live which will set the daily metric view to be displayed first. Then update the view
     * with either new data or if offline the last known data.
     */
    @Override
    public void onResume() {
       super.onResume();
        initializeButtons();
        updateView();
    }

    @Override
    public void onViewCreated(final View view, final Bundle savedInstanceState) {
        // Set the title for the instruction fragment.
        final ActionBar actionBar = ((AppCompatActivity)getActivity()).getSupportActionBar();
        if (actionBar != null) {
            actionBar.setTitle(argTitleResId);
        }
    }

    /**
     * This interface must be implemented by activities that contain this
     * fragment to allow an interaction in this fragment to be communicated
     * to the activity and potentially other fragments contained in that
     * activity.
     * <p>
     * See the Android Training lesson <a href=
     * "http://developer.android.com/training/basics/fragments/communicating.html"
     * >Communicating with Other Fragments</a> for more information.
     */
    public interface OnFragmentInteractionListener {
        // TODO: Update argument type and name
        void onFragmentInteraction(Uri uri);
    }

}
