/*
Copyright 2017-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.

Licensed under the Amazon Software License (the "License"). You may not use this file
except in compliance with the License. A copy of the License is located at

http://aws.amazon.com/asl/

or in the "license" file accompanying this file. This file is distributed on an "AS IS"
BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, express or implied. See the
License for the specific language governing permissions and limitations under the License.
 */

<template>
  <div class="report">
    <div class="charts" v-for="cat in model.bot.categories">
      <dropdown :closeAfterClick="true" align="left">
        <div class="pulldown" slot="toggle">{{ cat.name }}<div class="arrow-down"></div></div>
        <div v-on:click="showData(`${cat.name}`)"><label class="pulldown-label">30 day chart</label></div>
        <div v-on:click="showDetailData(`${cat.name}`)"><label class="pulldown-label">Detail history</label></div>
      </dropdown>
      <div v-bind:ref="`radial-chart-${cat.name}`" class="radial-chart" v-bind:id="`radial-chart-${cat.name}`">
      </div>
    </div>
    <div v-show="showInstructions" class="instructions">
      This sample dashboard displays results for the current day, the last seven days, and the last 30 days of tracking.
      The inner light blue arc shows percent of target for the current day. The middle light green arc shows percent
      of target for the last 7 days. The outer red arc shows percent of target the the last 30 days. The text seen
      in the middle of the chart shows the percent of target for the current day.
    </div>
    <detail-chart v-show="showGraph" v-bind:title="category" ref="detailChartChild"> </detail-chart>
    <div v-show="showTable" class="chartlabel"> {{ category }} - History</div>
    <v-client-table v-show="showTable" :data="items" :columns="tableColumns" :options="tableOptions"></v-client-table>
  </div>
</template>

<script>

import Vue from 'vue';
import RadialProgressChart from 'radial-progress-chart';
import Dropdown from 'vueleton/lib/dropdown';
import 'vueleton/lib/dropdown.css';
import { ClientTable } from 'vue-tables-2';
import moment from 'moment';
import DynamoDb from 'aws-sdk/clients/dynamodb';
import { VTooltip } from 'v-tooltip';
import * as d3 from 'd3';
import model from '../assets/TrackingBotModel.json';
import StackedBar from './StackedBar';

/* Stores RadialProgressChart instances to use on updates */
const charts = {};

/* eslint-disable no-new, no-alert, no-console */

VTooltip.options.defaultClass = 'my-tooltip';
Vue.component('detail-chart', StackedBar);
Vue.component('dropdown', Dropdown);
// Vue.component('v-client-table', ClientTable);
Vue.use(ClientTable, {
},
);

/* eslint-disable no-var, no-plusplus */

/* Computes text value to use for center of radial chart
   This value will be updated as data for the radial chart is also
   updated. The center of the chart shows a text value that corresponds to the
   current day, or week, and/or monthly percentage. If a daily target is
   specified, then the center text represents the percent complete for each
   day. if a weekly target is specified, the center text is a percent completed
   for the week. if a monthly target is specified, the center text is a percent
   complete for the month.

   As updates are made, the centerText callback will contain the current
   value for the arc specified by the index. There are three arcs:
   0 - current day
   1 - last seven days
   2 - last thirty days

   When an update is made via the centerText function call by the RadialProgressChart,
   the value which should be displayed corresponds to the current day, week, or month.
   This index is identified by the textIndexToUse.
*/
function handleCenterText(data, textIndexToUse) {
  /* eslint-disable no-var */
  var retValue = data.toFixed(0);
  var iValue = textIndexToUse;
  function centerText(value, index) {
    if (index === iValue) {
      retValue = value;
    }
    return `${retValue}%`;
  }
  return centerText;
}

/* Builds or updates a RadialProgressChart for the named category.
   name - String - corresponds to a category defined in the model.
   data - Array of values corresponding to percent of target for day, week, month
*/
function createChart(name, useDaily, useWeekly, useMonthly, data, tooltip) {
  const elementName = `#radial-chart-${name}`;
  const e = charts[elementName];
  var textValue = data[0];
  var textIndexToUse = 0;
  if (useWeekly) {
    data[0] = 0;
    textValue = data[1];
    textIndexToUse = 1;
  } else if (useMonthly) {
    data[0] = 0;
    data[1] = 0;
    textValue = data[2];
    textIndexToUse = 2;
  }

  if (e === undefined) {
    /* eslint-disable no-new */
    charts[elementName] = new RadialProgressChart(elementName, { diameter: 100,
      min: 0,
      max: 100,
      series: data,
      center: handleCenterText(textValue, textIndexToUse),
    });
  } else {
    e.update(data);
  }
  const opt = {};
  opt.value = tooltip;
  opt.modifiers = ['top-right'];

  const ele = d3.select(elementName).node();
  VTooltip.bind(ele, opt);

  /* The next block of code digs into the SVG and sets the opacity of either
     the daily arc and/or the weekly arc to 0 (hides) if the model specifies either
     a monthly or weekly target. IF weekly target is set, only the arc for weekly and
     monthly is displayed. If a monthly target is set, only the arc for the monthly
     is visible.
   */
  if (!useDaily) {
    const svg = d3.select(elementName).select('svg');
    const pg = svg.select('g');
    pg.selectAll('g').each(function u(p, i) {
      const uw = useWeekly;
      if (i === 0) {
        d3.select(this).style('opacity', 0.0);
      }
      if (i === 1 && !uw) {
        d3.select(this).style('opacity', 0.0);
      }
    });
  }
}


/* eslint-disable no-new, no-alert, no-console */
export default {
  name: 'report',
  data() {
    return {
      awsCredentials: undefined,
      category: undefined,
      fromDate: undefined,
      toDate: undefined,
      contentData: undefined,
      items: [],
      botName: undefined,
      region: undefined,
      showInstructions: true,
      showGraph: false,
      showTable: false,
      tableColumns: ['dayPrefix', 'rawValue', 'rawObject', 'rawUnits'],
      tableOptions: {
        perPage: 10,
        headings: { dayPrefix: 'Date', rawValue: 'Amount', rawObject: 'Target', rawUnits: 'Units' },
      },
      model,
    };
  },
  mounted() {
  },
  methods: {
    /**
     * Obtains data for the past 30 days to display in a stacked bar chart
     * @param category - category from the model to display information about
     */
    showData(category) {
      this.category = category;
      this.showInstructions = false;
      this.showGraph = true;
      this.showTable = false;
      return this.getReportedDetailData(this.awsCredentials, this.botName, this.region,
        this.fromDate, this.toDate)
        .then(data => this.parseDetailData(this.fromDate, this.toDate, data))
        .then((contentData) => {
          this.contentData = contentData;
          const child = this.$refs.detailChartChild;
          child.showStackedBar(this.fromDate, this.toDate, this.contentData);
        });
    },
    /**
     * Obtains data up to five years ago and displays in a table
     * @param category - category from the model to display information about
     */
    showDetailData(category) {
      this.category = category;
      this.showInstructions = false;
      this.showGraph = false;
      return this.getReportedDetailData(this.awsCredentials, this.botName, this.region,
        moment(this.toDate).subtract(1825, 'days'), this.toDate)
        .then((contentData) => {
          this.items = contentData.Items;
          this.showTable = true;
        });
    },
    getTooltip(values) {
      /* eslint-disable prefer-template */
      var res = values.name + '</br>' +
      '<table><tr><td>Result</td><td>Current</td><td>Target</td></tr>';
      if (values.dayValueTarget) {
        res += '<tr><td>Day</td><td>' + values.dayValue + '</td><td>' + values.dayValueTarget + '</td></tr>';
      }
      if (values.weeklyValueTarget) {
        res += '<tr><td>Weekly</td><td>' + values.weeklyValue + '</td><td>' + values.weeklyValueTarget + '</td></tr>';
      }
      if (values.monthlyValueTarget) {
        res += '<tr><td>Monthly</td><td>' + values.monthlyValue + '</td><td>' + values.monthlyValueTarget + '</td></tr>';
      }
      res += '</table>';
      return res;
    },
    performUpdate(awscredentials, botName, region) {
      this.updateCharts(awscredentials, botName, region);
      if (this.showGraph) {
        this.showData(this.category);
      } else if (this.showTable) {
        this.showDetailData(this.category);
      }
    },
    updateCharts(awscredentials, botName, region, fromDate = moment(), toDate = fromDate) {
      const fromDateMoment = moment(fromDate).subtract(30, 'days');
      const toDateMoment = moment(toDate);

      if (!fromDateMoment.isValid() || !toDateMoment.isValid()) {
        return Promise.reject(`updateChart invalid date: ${fromDate} ${toDate}`);
      }
      this.awsCredentials = awscredentials;
      this.fromDate = fromDateMoment;
      this.toDate = toDateMoment;
      this.botName = botName;
      this.region = region;
      return this.getReportedData(awscredentials, botName, region, fromDateMoment, toDateMoment)
      .then(data => this.parseData(data))
      .then(() => {
        /* no op for now */
      });
    },
    /*
      getReportedData queries DynamoDB directly for this user's information over the
      past thirty days for the configured model. It uses the "-Aggregate" table to
      obtain this information. The role for the nonauthenticated cognito user for the
      configured identity pool must allow access to this table.
    */
    getReportedData(awscredentials, botName, awsregion, fromDateMoment, toDateMoment) {
      if (!fromDateMoment.isValid() || !toDateMoment.isValid()) {
        return Promise.reject(`invalid date: ${fromDateMoment} ${toDateMoment}`);
      }
      const awsCreds = awscredentials;
      const docClient = new DynamoDb.DocumentClient({
        region: awsregion,
        credentials: awsCreds,
      });
      const userId = localStorage.getItem('cognitoid');
      const query = {
        TableName: `${botName}-Aggregate`,
        KeyConditions: {
          userId: {
            ComparisonOperator: 'EQ',
            AttributeValueList: [userId],
          },
          reported_time: {
            ComparisonOperator: 'BETWEEN',
            AttributeValueList: [
              fromDateMoment.format('YYYY-MM-DD'),
              toDateMoment.format('YYYY-MM-DD'),
            ],
          },
        },
      };
      return new Promise((resolve, reject) => {
        docClient.query(
          query,
          (error, data) => {
            if (error) {
              /* eslint-disable no-console */
              console.error('dynamodb error:', error.message);
              reject(`dynamodb error: ${error.message}`);
            }
            resolve(data);
          },
        );
      });
    },
    getReportedDetailData(awscredentials, botName, awsregion, fromDateMoment, toDateMoment) {
      const toDateMomentCalc = moment().utc().add(1, 'days');
      if (!fromDateMoment.isValid() || !toDateMoment.isValid()) {
        return Promise.reject(`invalid date: ${fromDateMoment} ${toDateMoment}`);
      }
      const awsCreds = awscredentials;
      const docClient = new DynamoDb.DocumentClient({
        region: awsregion,
        credentials: awsCreds,
      });
      const userId = localStorage.getItem('cognitoid');
      const params = {
        TableName: `${botName}-Raw`,
        KeyConditions: {
          userId: {
            ComparisonOperator: 'EQ',
            AttributeValueList: [userId],
          },
          reported_time: {
            ComparisonOperator: 'BETWEEN',
            AttributeValueList: [
              fromDateMoment.format('YYYY-MM-DD'),
              toDateMoment.format('YYYY-MM-DD'),
            ],
          },
        },
        FilterExpression: '#day between :start_day and :end_day and (contains(#name, :category))',
        ExpressionAttributeNames: {
          '#day': 'dayPrefix',
          '#name': 'intentName',
        },
        ExpressionAttributeValues: {
          ':category': this.category,
          ':start_day': fromDateMoment.format('YYYY-MM-DD'),
          ':end_day': toDateMomentCalc.format('YYYY-MM-DD'),
        },
      };

      return new Promise((resolve, reject) => {
        docClient.scan(
          params,
          (error, data) => {
            if (error) {
              /* eslint-disable no-console */
              console.error('dynamodb error:', error.message);
              reject(`dynamodb error: ${error.message}`);
            }
            resolve(data);
          },
        );
      });
    },
    /*
      parseData is the heavy lifter in this component. It consumes the output
      of the query and computes values and target values for the current day,
      for the last seven days, and for the last 30 days. Ultimately it calls
      createChart for each category defined in the model and passes in the
      results for the current day, last seven days, and last 30 days.
    */
    parseData(data) {
      /* eslint-disable vars-on-top, no-var, no-plusplus, no-loop-func */
      this.reportedData = data.Items;
      if (this.reportedData.length === 0) {
        return this.noDataReportPresentation();
      }
      this.reportedDataMonthlySum = {};
      this.reportedDataWeeklySum = {};
      const sevenDaysAgo = moment().subtract(7, 'days');
      const today = moment();

      /* strip the time portion out of a moment object */
      function stripTime(date) {
        date.hours(0);
        date.minutes(0);
        date.seconds(0);
        date.milliseconds(0);
        return date;
      }
      var idx1;
      var idx2;

      for (idx2 = 0; idx2 < model.bot.categories.length; ++idx2) {
        var key = model.bot.categories[idx2].name;
        for (idx1 = 0; idx1 < this.reportedData.length; ++idx1) {
          const item = this.reportedData[idx1];
          const targetValueName = `target_${key}`;
          let value = 0;
          let targetValueDaily = 0;
          let targetValueWeekly = 0;
          let targetValueMonthly = 0;

          if (item[key]) {
            value = Number(item[key]);
            if (item[targetValueName]) {
              targetValueDaily = Number(item[targetValueName].dailyTarget);
              targetValueWeekly = Number(item[targetValueName].weeklyTarget);
              targetValueMonthly = Number(item[targetValueName].monthlyTarget);
            } else {
              targetValueDaily = Number(model.bot.categories[idx2].dailyTarget);
              targetValueWeekly = Number(model.bot.categories[idx2].weeklyTarget);
              targetValueMonthly = Number(model.bot.categories[idx2].monthlyTarget);
            }
          } else {
            value = 0;
            targetValueDaily = Number(model.bot.categories[idx2].dailyTarget);
            targetValueWeekly = Number(model.bot.categories[idx2].weeklyTarget);
            targetValueMonthly = Number(model.bot.categories[idx2].monthlyTarget);
          }

          var useDT = false;
          var useWT = false;
          var useMT = false;
          if (targetValueDaily > 0) {
            useDT = true;
          } else if (targetValueWeekly > 0) {
            useWT = true;
          } else {
            useMT = true;
          }

          const reportedTime = moment(item.reported_time);

          if (this.reportedDataMonthlySum[key] === undefined) {
            this.reportedDataMonthlySum[key] = 0;
          }

          if (this.reportedDataMonthlySum[targetValueName] === undefined) {
            this.reportedDataMonthlySum[targetValueName] = 0;
          }

          this.reportedDataMonthlySum[key] += value;
          if (useDT) {
            this.reportedDataMonthlySum[targetValueName] = targetValueDaily * 30;
            this.reportedDataWeeklySum[targetValueName] = targetValueDaily * 7;
          } else if (useWT) {
            this.reportedDataMonthlySum[targetValueName] = targetValueWeekly * 4;
            this.reportedDataWeeklySum[targetValueName] = targetValueWeekly;
          } else if (useMT) {
            this.reportedDataMonthlySum[targetValueName] = targetValueMonthly;
            this.reportedDataWeeklySum[targetValueName] = 0;
          }

          if (reportedTime > sevenDaysAgo) {
            if (this.reportedDataWeeklySum[key] === undefined) {
              this.reportedDataWeeklySum[key] = 0;
            }
            if (this.reportedDataWeeklySum[targetValueName] === undefined) {
              this.reportedDataWeeklySum[targetValueName] = 0;
            }
            this.reportedDataWeeklySum[key] += value;
          }
        }
      }

      /* eslint no-param-reassign: ["error", { "props": false }] */
      for (idx2 = 0; idx2 < model.bot.categories.length; ++idx2) {
        const categoryTypeName = model.bot.categories[idx2].name;
        const categoryName = model.bot.categories[idx2].name;
        var targetName = `target_${categoryTypeName}`;
        var useDailyTarget = false;
        var useWeeklyTarget = false;
        var useMonthlyTarget = false;

        if (model.bot.categories[idx2].dailyTarget > 0) {
          useDailyTarget = true;
        } else if (model.bot.categories[idx2].weeklyTarget > 0) {
          useWeeklyTarget = true;
        } else if (model.bot.categories[idx2].monthlyTarget > 0) {
          useMonthlyTarget = true;
        } else {
          useDailyTarget = true;
        }

        const lastItem = this.reportedData[this.reportedData.length - 1];
        const lastReportedDay = stripTime(moment(lastItem.reported_time));
        const todayDay = stripTime(today);

        var dayValue = 0;
        if (todayDay.diff(lastReportedDay) === 0) {
          dayValue = this.reportedData[this.reportedData.length - 1][categoryTypeName];
        }

        let dayValueTarget = 0;
        let weeklyValueTarget = 0;
        let monthlyValueTarget = 0;

        if (this.reportedData[this.reportedData.length - 1][targetName]) {
          dayValueTarget = this.reportedData[this.reportedData.length - 1][targetName].dailyTarget;
        } else {
          dayValueTarget = Number(model.bot.categories[idx2].dailyTarget);
        }

        if (this.reportedDataWeeklySum[targetName]) {
          weeklyValueTarget = this.reportedDataWeeklySum[targetName];
        } else {
          weeklyValueTarget = Number(model.bot.categories[idx2].weeklyTarget);
          if (useDailyTarget) {
            weeklyValueTarget = dayValueTarget * 7;
          }
        }

        if (this.reportedDataMonthlySum[targetName]) {
          monthlyValueTarget = this.reportedDataMonthlySum[targetName];
        } else {
          monthlyValueTarget = Number(model.bot.categories[idx2].monthlyTarget);
          if (useDailyTarget) {
            monthlyValueTarget = dayValueTarget * 30;
          } else if (useWeeklyTarget) {
            monthlyValueTarget = weeklyValueTarget * 4;
          }
        }

        var dayResults = (dayValue / dayValueTarget) * 100;
        if (isNaN(dayResults)) {
          dayResults = 0;
        }

        const weeklyValue = this.reportedDataWeeklySum[categoryTypeName];
        var weeklyResults = (weeklyValue / weeklyValueTarget) * 100;
        if (isNaN(weeklyResults)) {
          weeklyResults = 0;
        }

        const monthlyValue = this.reportedDataMonthlySum[categoryTypeName];
        var monthlyResults = (monthlyValue / monthlyValueTarget) * 100;
        if (isNaN(monthlyResults)) {
          monthlyResults = 0;
        }

        const tooltipvalues = {};
        tooltipvalues.name = categoryName;
        if (useDailyTarget) {
          tooltipvalues.dayValue = dayValue;
          tooltipvalues.dayValueTarget = dayValueTarget;
          tooltipvalues.weeklyValue = weeklyValue;
          tooltipvalues.weeklyValueTarget = weeklyValueTarget;
          tooltipvalues.monthlyValue = monthlyValue;
          tooltipvalues.monthlyValueTarget = monthlyValueTarget;
        } else if (useWeeklyTarget) {
          tooltipvalues.weeklyValue = weeklyValue;
          tooltipvalues.weeklyValueTarget = weeklyValueTarget;
          tooltipvalues.monthlyValue = monthlyValue;
          tooltipvalues.monthlyValueTarget = monthlyValueTarget;
        } else if (useMonthlyTarget) {
          tooltipvalues.monthlyValue = monthlyValue;
          tooltipvalues.monthlyValueTarget = monthlyValueTarget;
        }

        createChart(model.bot.categories[idx2].name,
        useDailyTarget, useWeeklyTarget, useMonthlyTarget,
        [dayResults, weeklyResults, monthlyResults],
        this.getTooltip(tooltipvalues));
      }
      return Promise.resolve();
    },
    noDataReportPresentation() {
      var idx1;
      for (idx1 = 0; idx1 < model.bot.categories.length; ++idx1) {
        const categoryName = model.bot.categories[idx1].name;
        var useDailyTarget = false;
        var useWeeklyTarget = false;
        var useMonthlyTarget = false;

        if (model.bot.categories[idx1].dailyTarget > 0) {
          useDailyTarget = true;
        } else if (model.bot.categories[idx1].weeklyTarget > 0) {
          useWeeklyTarget = true;
        } else if (model.bot.categories[idx1].monthlyTarget > 0) {
          useMonthlyTarget = true;
        } else {
          useDailyTarget = true;
        }
        const tooltipvalues = {};
        tooltipvalues.name = categoryName;
        if (useDailyTarget) {
          tooltipvalues.dayValue = 0;
          tooltipvalues.dayValueTarget = 0;
          tooltipvalues.weeklyValue = 0;
          tooltipvalues.weeklyValueTarget = 0;
          tooltipvalues.monthlyValue = 0;
          tooltipvalues.monthlyValueTarget = 0;
        } else if (useWeeklyTarget) {
          tooltipvalues.weeklyValue = 0;
          tooltipvalues.weeklyValueTarget = 0;
          tooltipvalues.monthlyValue = 0;
          tooltipvalues.monthlyValueTarget = 0;
        } else if (useMonthlyTarget) {
          tooltipvalues.monthlyValue = 0;
          tooltipvalues.monthlyValueTarget = 0;
        }
        createChart(model.bot.categories[idx1].name, useDailyTarget,
          useWeeklyTarget, useMonthlyTarget, [0, 0, 0], this.getTooltip(tooltipvalues));
      }
      return Promise.resolve();
    },
    parseDetailData(fromDate, toDate, data) {
      const results = {};
      results.datestringvalues = new Array(30);
      results.seriesdata = {};
      const now = moment();
      for (let i = 0; i < data.Count; i++) {
        results.seriesdata[data.Items[i].rawObject] = {};
        results.seriesdata[data.Items[i].rawObject].series = new Array(30);
        for (let x = 0; x < 30; x++) {
          results.seriesdata[data.Items[i].rawObject].series[x] = 0;
        }
      }
      let st = now.subtract(29, 'days');
      for (let x = 0; x < 30; x++) {
        results.datestringvalues[x] = st.format('YYYY-MM-DD');
        st = st.add(1, 'days');
      }
      const start = moment(toDate);
      for (let i = 0; i < data.Count; i++) {
        const reported = moment(data.Items[i].dayPrefix);
        const duration = moment.duration(start.diff(reported));
        const days = Math.floor(duration.asDays());
        const idx = 29 - days;
        if (days >= 0) {
          results.seriesdata[data.Items[i].rawObject].series[idx] += +data.Items[i].rawValue;
        }
      }
      return Promise.resolve(results);
    },
    noDataDetailReportPresentation() {
      var idx1;
      for (idx1 = 0; idx1 < model.bot.categories.length; ++idx1) {
        const categoryName = model.bot.categories[idx1].name;
        var useDailyTarget = false;
        var useWeeklyTarget = false;
        var useMonthlyTarget = false;
        if (model.bot.categories[idx1].dailyTarget > 0) {
          useDailyTarget = true;
        } else if (model.bot.categories[idx1].weeklyTarget > 0) {
          useWeeklyTarget = true;
        } else if (model.bot.categories[idx1].monthlyTarget > 0) {
          useMonthlyTarget = true;
        } else {
          useDailyTarget = true;
        }
        const tooltipvalues = {};
        tooltipvalues.name = categoryName;
        if (useDailyTarget) {
          tooltipvalues.dayValue = 0;
          tooltipvalues.dayValueTarget = 0;
          tooltipvalues.weeklyValue = 0;
          tooltipvalues.weeklyValueTarget = 0;
          tooltipvalues.monthlyValue = 0;
          tooltipvalues.monthlyValueTarget = 0;
        } else if (useWeeklyTarget) {
          tooltipvalues.weeklyValue = 0;
          tooltipvalues.weeklyValueTarget = 0;
          tooltipvalues.monthlyValue = 0;
          tooltipvalues.monthlyValueTarget = 0;
        } else if (useMonthlyTarget) {
          tooltipvalues.monthlyValue = 0;
          tooltipvalues.monthlyValueTarget = 0;
        }
        createChart(model.bot.categories[idx1].name, useDailyTarget,
          useWeeklyTarget, useMonthlyTarget, [0, 0, 0], this.getTooltip(tooltipvalues));
      }
      return Promise.resolve();
    },
  },
};

</script>

<style>
h1, h2 {
  font-weight: normal;
}

ul {
  list-style-type: none;
  padding: 0;
}

li {
  display: inline-block;
  margin: 0 10px;
}

a {
  color: #42b983;
}

table {
    border-collapse: collapse;
}

table, th, td {
    border: 0px solid black;
    spacing: 5px;
    text-align: left;
    padding: 5px;
}

.rbc-center-text {
 font-family: 'Roboto', 'Myriad Set Pro', 'Lucida Grande', 'Helvetica Neue', Helvetica, Arial;
 fill: black;
}

.rbc-label-start {
   font-family: fontawesome;
   font-weight: bold;
   font-size: 30px;
}

.rbc-center-text {
 font-family: 'Roboto', 'Myriad Set Pro', 'Lucida Grande', 'Helvetica Neue', Helvetica, Arial;
 fill: black;
 font-size: 30;
}

.rbc-center-text-line0 {
 font-size: 30px;
}

.rbc-center-text-line1 {
 font-size: 30px;
}

.rbc-center-text-line2 {
 font-size: 30px;
}

.charts {
  display: inline-block;
}

.instructions {
  margin: 20px;
  text-align: left;
  font-family: 'Roboto', 'Myriad Set Pro', 'Lucida Grande', 'Helvetica Neue', Helvetica, Arial;
  fill: black;
  font-size: 12pt;
}

.radial-chart {
  width: 125px;
  margin-right: 6px;
}

.tooltip {
  display: none;
  opacity: 0;
  transition: opacity .15s;
  pointer-events: none;
  padding: 4px;
  z-index: 10000;
}

.tooltip .tooltip-content {
  background: gray;
  color: white;
  border-radius: 16px;
  padding: 5px 10px 4px;
}

.tooltip.tooltip-open-transitionend {
  display: block;
}

.tooltip.tooltip-after-open {
  opacity: .95;
}

.vl-dropdown-down .vl-dropdown-menu {
  top: 100%;
  margin-top: 0px;
  margin-left: 20px;
  width: 95px;
  text-align: left;
  background-color: lightyellow;
}

.pulldown {
  padding-left: 5px;
  padding-right: 5px;
}
.pulldown:hover {
  background-color: skyblue;
  padding-left: 5px;
  padding-right: 5px;
}

.pulldown-label {

}

.pulldown-label:hover {
  background-color: lightblue;
}

.arrow-down {
  margin-left: 5px;
  width: 0;
  height: 0;
  display: inline-block;
  border-left: 7px solid transparent;
  border-right: 7px solid transparent;
  border-top: 10px solid dimgray;
}

.VueTables {
  margin-top: 25px;
  margin-left: 25px;
  width: 100%;
}

.table-responsive {
  margin-top: 15px;
}

.table-responsive table {
  width: 100%;
}

.table-responsive table th {
  border-collapse: collapse;
  border: 1px solid gray;
  spacing: 5px;
  text-align: left;
  padding: 5px;
  background-color: papayawhip;
  font-family: 'Roboto', 'Myriad Set Pro', 'Lucida Grande', 'Helvetica Neue', Helvetica, Arial;
  font-size: 11pt;
}

.table-responsive table tr td {
  border-collapse: collapse;
  border: 1px solid gray;
  spacing: 5px;
  text-align: left;
  padding: 5px;
  background-color: papayawhip;
  font-family: 'Roboto', 'Myriad Set Pro', 'Lucida Grande', 'Helvetica Neue', Helvetica, Arial;
  font-size: 10pt;
}

.VueTables thead tr:nth-child(2) th {
  font-weight: normal;
}

.VueTables__sortable {
  cursor: pointer;
}

.VuePagination a {
  font-family: 'Roboto', 'Myriad Set Pro', 'Lucida Grande', 'Helvetica Neue', Helvetica, Arial;
  font-size: 10pt;
  color: #000000;
  cursor: pointer;
}

.VueTables .row {
  display: inline-flex;
}

.VueTables label {
  margin-left: 10px;
}
</style>
