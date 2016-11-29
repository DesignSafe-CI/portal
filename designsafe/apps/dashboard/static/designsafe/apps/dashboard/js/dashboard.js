$(document).ready(function () {
  var data = [
    {date: new Date('2016-01-01T0:00:00'), count:4},
    {date: new Date('2016-02-01T0:00:00'), count:4},
    {date: new Date('2016-03-01T0:00:00'), count:3},
    {date: new Date('2016-04-01T0:00:00'), count:5},
    {date: new Date('2016-05-01T0:00:00'), count:2},
    {date: new Date('2016-06-01T0:00:00'), count:1},
  ];
  // $.getJSON()
  var chart = DS_TSBarChart()
              .ySelector(function (d) { return d.count;})
              .xSelector(function (d) { return d.date;})
              .data(data);

});