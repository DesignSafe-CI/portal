import * as d3 from 'd3';
import $ from 'jquery';

export default function DSTSBarChart(elementId) {
    let margin = { right: 20, left: 20, top: 20, bottom: 25 },
        width = $(elementId).width() - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom,
        xSelector = function(d) {
            return d.datetime_utc;
        },
        ySelector = function(d) {
            return d.value;
        },
        startDate = new Date(new Date(new Date().getTime() - 14 * 24 * 60 * 60 * 1000).setHours(0, 0, 0, 0)),
        endDate = new Date(new Date().setHours(0, 0, 0, 0)),
        data,
        x, y, xAxis, yAxis,
        focus,
        svg,
        dispatch = d3.dispatch('barClick'),
        numDays = (endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000);

    d3.select(window).on('resize', function() {
        width = $(elementId).width() - margin.left - margin.right;
        exports();
        draw();
    });

    function exports() {
        d3.select(elementId).html('');
        x = d3.scaleTime().range([0, width - margin.left - margin.right]).domain([startDate, endDate]);
        y = d3.scaleLinear().range([height, 0]);

        svg = d3.select(elementId).append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom);

        xAxis = d3.axisBottom(x)
            .tickPadding(0)
            // .tickSize(-height, 1, 0)
            // .ticks(14)
            .tickFormat(d3.timeFormat('%m/%d'));

        yAxis = d3.axisLeft(y)
            // .ticks(3)
            .tickSize(-width, 0, 0)
            .tickFormat(function(e) {
                if (Math.floor(e) != e) {
                    return null;
                }
                return e;
            });

        focus = svg.append('g')
            .attr('class', 'focus')
            .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
    }

    exports.on = function(...args) {
        const value = dispatch.on.apply(dispatch, args); // eslint-disable-line prefer-spread
        return value === dispatch ? exports : value;
    };

    function barClick(datum, d) {
        const isSelected = d3.select(this).classed('selected');
        if (isSelected) {
            focus.selectAll('.bar').style('fill', '#3598dc');
            d3.selectAll('.selected').classed('selected', false);
        } else {
            focus.selectAll('.bar').style('fill', '#3598dc');
            d3.select(this).style('fill', '#dd911e');
            d3.selectAll('.selected').classed('selected', false);
            d3.select(this).classed('selected', true);
        }
        dispatch.call('barClick', this, datum, !isSelected);
    }

    function draw() {
        // x.domain(data.map(xSelector));
        y.domain([0, d3.max(data, ySelector)]);
        xAxis.ticks(9);
        focus.append('g')
            .attr('transform', 'translate(0,' + height + ')')
            .attr('class', 'x axis')
            .call(xAxis);
        focus.append('g')
            .attr('class', 'y axis')
            // .attr('fill', '#e3e3e3')
            .call(yAxis);
        focus.selectAll('.bar').remove();

        focus.selectAll('.bar')
            .data(data)
            .enter().append('rect')
            .attr('class', 'bar')
            // .attr('x', function (d) { return x(xSelector(d)) - ( (width - margin.right - margin.right) / x.ticks().length / 2) + 2.5 ;})
            .attr('x', function(d) {
                return x(xSelector(d)) - (width - margin.left - margin.right) / numDays / 2 + 2.5;
            })
            .attr('width', (width - margin.left - margin.right) / numDays - 5)
            .attr('y', function(d) {
                return y(ySelector(d));
            })
            .attr('height', function(d) {
                return height - y(ySelector(d));
            })
            .on('click', barClick);
    }

    exports.data = function(_data) {
        if (!(_data)) return data;
        data = _data;
        draw();
        console.log(data);
        return this;
    };

    exports.xSelector = function(f) {
        if (!f) return xSelector;
        xSelector = f;
        return exports;
    };

    exports.ySelector = function(f) {
        if (!f) return ySelector;
        ySelector = f;
        return exports;
    };

    exports.elementId = function(d) {
        if (!d) return elementId;
        elementId = d;
        return exports;
    };

    exports.width = function(d) {
        if (!d) return width;
        width = d - margin.left - margin.right;
        exports();
        return exports;
    };

    exports.height = function(d) {
        if (!d) return height;
        height = d;
        exports();
        return exports;
    };

    exports.margin = function(d) {
        if (!args.length) {
            return margin;
        }
        d.forEach(function(a) {
            margin[a] = d[a];
        });
        // for (const a in d) {
        //     margin[a] = d[a];
        // }
        exports();
        return exports;
    };

    exports.startDate = function(d) {
        if (!d) return startDate;
        // this just gives a little padding for the first bar, so that
        // it doesn't go outside the chart
        startDate = new Date(new Date(d.getTime() - (24 * 60 * 60 * 1000)).setHours(0, 0, 0, 0));
        x.domain([startDate, endDate]);
        numDays = (endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000);
        return exports;
    };

    exports.endDate = function(d) {
        if (!d) return endDate;
        endDate = new Date(new Date(d.getTime() - (24 * 60 * 60 * 1000)).setHours(0, 0, 0, 0));
        x.domain([startDate, endDate]);
        numDays = (endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000);
        return exports;
    };

    exports();
    return exports;
}
