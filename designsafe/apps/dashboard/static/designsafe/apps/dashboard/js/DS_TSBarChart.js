
function DS_TSBarChart (element_id) {
  
  var margin = {right:20, left:20, top:20, bottom:20}, 
      width = $(element_id).width() - margin.left - margin.right,
      height = 500 - margin.top - margin.bottom,
      xSelector = function (d) {return d.datetime_utc;},
      ySelector = function (d) {return d.value;},
      data,
      x, y, xAxis, yAxis,
      axis_label, focus, 
      svg;

  function exports () {
    d3.select(element_id).html('');
    x = d3.time.scale().range([0, width]);
    y = d3.scale.linear().range([height, 0]);
    
    xAxis = d3.svg.axis()
              .scale(x)
              .orient("bottom")
              .ticks(5)
              .tickPadding(6)
              .tickSize(-height, 1, 0);
              // .tickFormat(d3.format(".1s"));

    yAxis = d3.svg.axis()
              .scale(y)
              .orient("left")
              .tickSize(-width, 0, 0)
              .tickFormat(d3.format(",.2s"));

    focus = svg.append("g")
        .attr("class", "focus")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
  }

  function draw () {
    x.domain(d3.extent(data.map(xSelector)));
    y.domain(d3.extent(data.map(ySelector)));
    focus.select(".x.axis").call(xAxis);
    focus.select(".y.axis").call(yAxis); 
    // generate line paths
    focus.selectAll('.bar').remove();
    
    var lines = focus.selectAll(".line")
                  .data(data)
                  .enter().append("path")
                    .attr("d",line)
                    .attr("class", "line");
  }

  exports.data = function (_data) {
    if (!(arguments.length)) return data;
    data = _data;
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
    return exports;
  };

  exports.margin = function (d) {
    if (!arguments.length) return margin;
    for (var a in d) { margin[a] = d[a]; }
    exports();
    return exports;
  };

  exports();
  return exports;

}