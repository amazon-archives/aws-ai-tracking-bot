/*
# Copyright 2017-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0.
*/

<template>
  <div>
    <div class="chartlabel"> {{ title }} - Details</div>
    <div id="stackedbar">
    </div>
  </div>
</template>

<script>

import * as d3 from 'd3';

/* eslint-disable prefer-template, prefer-arrow-callback */

function toolTipText(id, v) {
  return '<strong>' + id + ': ' + v + ' </strong> <br>';
}

function createStackedBarChart(fromDate, toDate, contentData) {
  const elementName = '#stackedbar';
  const n = Object.keys(contentData.seriesdata).length; // The number of series.
  const m = 30; // The number of values per series.

// The xz array has m elements, representing the x-values shared by all series.
// The yz array has n elements, representing the y-values of each of the n series.
// Each yz[i] is an array of m non-negative numbers representing a y-value for xz[i].
// The y01z array has the same structure as yz, but with stacked [y₀, y₁] instead of y.

  const keys = Object.keys(contentData.seriesdata);
  const xz = d3.range(m);
  const yz = d3.range(n).map(function getSeriesForKey(key) {
    return contentData.seriesdata[keys[key]].series;
  });
  const y01z = d3.stack().keys(d3.range(n))(d3.transpose(yz));
  const y1Max = d3.max(y01z, function maxOfY(y) {
    return d3.max(y, function maxOfD(d) {
      return d[1];
    });
  });

  d3.select(elementName).select('svg').remove();
  const p = d3.select(elementName).classed('svg-container', true);
  const margin = { top: 20, right: 10, bottom: 40, left: 60 };
  const width = p.node().clientWidth - margin.left - margin.right;
  const fullHeight = width * 0.75;
  const height = fullHeight - margin.top - margin.bottom;
  const svg = d3.select(elementName).classed('svg-container', true)
    .append('svg')
    .attr('preserveAspectRatio', 'xMinYMin meet')
    .classed('svg-content-responsive', true)
    .attr('viewBox', '0 0 ' + p.node().clientWidth + ' ' + fullHeight);
  const g = svg.append('g').attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
  const x = d3.scaleBand()
    .domain(xz)
    .rangeRound([0, width])
    .padding(0.08);

  // define the x scale (horizontal)
  const mindate = fromDate;
  const maxdate = toDate;
  const padding = 0;

  const xScale = d3.scaleTime()
    .domain([mindate, maxdate])
    .range([padding, width - (padding * 2)]);

  // define the x axis
  const xAxis = d3.axisBottom(xScale)
    .tickSize(0);

  const y = d3.scaleLinear()
    .domain([0, y1Max])
    .range([height, 0]);

  const yAxis = d3.axisLeft(y);

  const color = d3.scaleOrdinal()
    .domain(d3.range(n))
    .range(d3.schemeCategory20c);

  const series = g.selectAll('.series')
    .data(y01z)
    .enter()
    .append('g')
    .attr('fill', function getColor(d, i) {
      return color(i);
    })
    .attr('seriesid', function getSeriesId(d, i) {
      return (keys[i]);
    });

  d3.select(elementName).select('#charttooltip').remove();
  const toolTip = p.append('div')
    .attr('id', 'charttooltip')
    .classed('charttooltip', true)
    .style('opacity', 0);
  const rect = series.selectAll('rect')
    .data(function getD(d) {
      return d;
    })
    .enter().append('rect')
    .attr('x', function xOfI(d, i) {
      return x(i);
    })
    .attr('y', height)
    .attr('width', 10)
    .attr('height', 0)
    .on('mouseover', function handleMouseOver(d) {
      const text = toolTipText(d3.select(this.parentNode).attr('seriesid'), d[1] - d[0]);
      toolTip.transition()
        .style('opacity', 0.9);
      toolTip.html(text)
        .style('left', (d3.event.pageX + 15) + 'px')
        .style('top', (d3.event.pageY - 28) + 'px');
      d3.select(this)
        .style('stroke', 'gray')
        .style('stroke-width', 3);
    })
    .on('mouseout', function handleMouseOut() {
      toolTip.transition()
        .style('opacity', 0);
      d3.select(this)
        .style('stroke', 'none');
    });

  rect.transition()
    .delay(function computeDelay(d, i) {
      return i * 10;
    })
    .attr('y', function computeY(d) {
      return y(d[1]);
    })
    .attr('height', function computeHeight(d) {
      return y(d[0]) - y(d[1]);
    });
  // draw x axis with labels and move to the bottom of the chart area
  g.append('g')
    .attr('class', 'xaxis')   // give it a class so it can be used to select only xaxis labels  below
    .attr('transform', 'translate(0,' + (height - padding) + ')')
    .call(xAxis);

  // now rotate text on x axis
  // solution based on idea here: https://groups.google.com/forum/?fromgroups#!topic/d3-js/heOBPQF3sAY
  // first move the text left so no longer centered on the tick
  // then rotate up to get 45 degrees.
  g.selectAll('.xaxis text')  // select all the text elements for the xaxis
    .attr('transform', function handleTransform() {
      return 'translate(' + (-2 * this.getBBox().height) + ',' + this.getBBox().height + ')rotate(-45)';
    });

  g.append('g')
    .attr('class', 'axis')
    .attr('transform', 'translate(' + -20 + ',0)')
    .call(yAxis);
}

/* eslint-disable no-new, no-alert */
export default {
  name: 'StackedBar',
  data() {
    return {
    };
  },
  mounted() {
  },
  methods: {
    showStackedBar(fromDate, toDate, contentData) {
      createStackedBarChart(fromDate, toDate, contentData);
    },
  },
  props: ['title'],
};
</script>

<style>

.chartlabel {
  margin-top: 25px;
  margin-bottom: 10px;
  font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
  font-size: medium;
  font-weight: bold;
}

.svg-container {
  display: inline-block;
  position: relative;
  width: 95%;
  padding-bottom: 75%;  /* aspect ratio */
  vertical-align: top;
  overflow: hidden;
}

.svg-content-responsive {
  display: inline-block;
  position: absolute;
  top: 10px;
  left: 0;
  background-color: papayawhip;
  border-radius: 10px;
}

.charttooltip {
  margin-top: 5px;
  font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
  font-size: large;
  font-weight: bold;
}

</style>
