
function DS_TSBarChart (element_id) {

  var margin = {right:20, left:20, top:20, bottom:25},
      width = $(element_id).width() - margin.left - margin.right,
      height = 500 - margin.top - margin.bottom,
      xSelector = function (d) {return d.datetime_utc;},
      ySelector = function (d) {return d.value;},
      start_date = new Date(new Date(new Date().getTime() - 14 * 24 * 60 * 60 * 1000).setHours(0,0,0,0)),
      end_date = new Date(new Date().setHours(0,0,0,0)),
      data,
      x, y, xAxis, yAxis,
      axis_label, focus,
      svg,
      dispatch = d3.dispatch('bar_click');

  var num_days = (end_date.getTime() - start_date.getTime()) / (24 * 60 * 60 *1000);
  console.log(num_days)
  d3.select(window).on('resize', function () {
    width = $(element_id).width() - margin.left - margin.right;
    exports();
    draw();
  });

  function exports () {
    d3.select(element_id).html('');
    x = d3.scaleTime().range([0, width - margin.left-margin.right]).domain([start_date, end_date]);
    y = d3.scaleLinear().range([height, 0]);

    svg = d3.select(element_id).append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);

    xAxis = d3.axisBottom(x)
              .tickPadding(0)
              // .tickSize(-height, 1, 0)
              // .ticks(14)
              .tickFormat(d3.timeFormat("%m/%d"));

    yAxis = d3.axisLeft(y)
              // .ticks(3)
              .tickSize(-width, 0, 0)
              .tickFormat(function(e){
                if(Math.floor(e) != e) {
                    return;
                } else {
                  return e;
                }
              });

    focus = svg.append("g")
        .attr("class", "focus")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
  }

  exports.on = function() {
    var value = dispatch.on.apply(dispatch, arguments);
    return value === dispatch ? exports : value;
  };

  function bar_click (datum, d) {
    var is_selected = d3.select(this).classed('selected');
    if (is_selected) {
      focus.selectAll('.bar').style('fill', '#3598dc');
      d3.selectAll('.selected').classed('selected', false);

    } else {
      focus.selectAll('.bar').style('fill', '#3598dc');
      d3.select(this).style("fill", "#dd911e");
      d3.selectAll('.selected').classed('selected', false)
      d3.select(this).classed('selected', true);
    }
    dispatch.call("bar_click", this, datum, !is_selected);

  }

  function draw () {
    // x.domain(data.map(xSelector));
    y.domain([0, d3.max(data, ySelector)]);
    xAxis.ticks(9)
    focus.append("g")
      .attr("transform", "translate(0," + height + ")")
      .attr("class", "x axis")
      .call(xAxis);
    focus.append("g")
      .attr("class", "y axis")
      // .attr("fill", "#e3e3e3")
      .call(yAxis);
    focus.selectAll('.bar').remove();


    focus.selectAll(".bar")
      .data(data)
    .enter().append("rect")
      .attr("class", "bar")
      // .attr("x", function (d) { return x(xSelector(d)) - ( (width - margin.right - margin.right) / x.ticks().length / 2) + 2.5 ;})
      .attr("x", function (d) { return x(xSelector(d)) - (width - margin.left - margin.right) / num_days/2 + 2.5 })
      .attr("width", (width - margin.left - margin.right) / num_days - 5)
      .attr("y", function (d) {return y(ySelector(d));})
      .attr("height", function(d) { return height - y(ySelector(d)); })
      .on('click', bar_click);
  }

  exports.data = function (_data) {
    if (!(arguments.length)) return data;
    data = _data;
    draw();
    return this;
  };

  exports.xSelector = function (f) {
    if (!arguments.length) return xSelector;
    xSelector = f;
    return exports;
  };

  exports.ySelector = function (f) {
    if (!arguments.length) return ySelector;
    ySelector = f;
    return exports;
  };

  exports.element_id = function (d) {
    if (!arguments.length) return element_id;
    element_id = d;
    return exports;
  };

  exports.width = function (d) {
    if (!arguments.length) return width;
    width = d - margin.left - margin.right;
    exports();
    return exports;
  };

  exports.height = function (d) {
    if (!arguments.length) return height;
    height = d;
    exports();
    return exports;
  };

  exports.margin = function (d) {
    if (!arguments.length) return margin;
    for (var a in d) { margin[a] = d[a]; }
    exports();
    return exports;
  };

  exports.start_date = function (d) {
    if (!arguments.length) return start_date;
    //this just gives a little padding for the first bar, so that
    //it doesn't go outside the chart
    start_date = new Date(new Date(d.getTime() - (24 * 60 * 60 *1000)).setHours(0,0,0,0));
    x.domain([start_date, end_date])
    num_days = (end_date.getTime() - start_date.getTime()) / (24 * 60 * 60 *1000);
    return exports;
  }

  exports.end_date = function (d) {
    if (!arguments.length) return end_date;
    end_date = new Date(new Date(d.getTime() - (24 * 60 * 60 *1000)).setHours(0,0,0,0));
    x.domain([start_date, end_date]);
    num_days = (end_date.getTime() - start_date.getTime()) / (24 * 60 * 60 *1000);
    return exports;
  }

  exports();
  return exports;

}
