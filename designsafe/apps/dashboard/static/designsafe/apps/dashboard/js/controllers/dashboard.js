angular.module('designsafe').controller('DashboardCtrl', ['$scope', 'UserService', 'notificationFactory',
function ($scope, UserService, notificationFactory) {

  $scope.jobs_count = 12;
  $scope.storage_count = 15123123123;
  $scope.apps_count = 45;
  $scope.activities_count = 42;
  $scope.display_job_details = false;

  notificationFactory.list().then(function (resp) {
    console.log(resp)
  })

  $scope.jobs_data = [
    {date: new Date('2016-01-01T00:00:00'), count:4},
    {date: new Date('2016-01-02T00:00:00'), count:4},
    {date: new Date('2016-01-03T00:00:00'), count:3},
    {date: new Date('2016-01-04T00:00:00'), count:5},
    {date: new Date('2016-01-05T00:00:00'), count:2},
    {date: new Date('2016-01-06T00:00:00'), count:1},
    {date: new Date('2016-01-07T00:00:00'), count:1},
    {date: new Date('2016-01-08T00:00:00'), count:1},
    {date: new Date('2016-01-09T00:00:00'), count:2},
    {date: new Date('2016-01-10T00:00:00'), count:4},
    {date: new Date('2016-01-11T00:00:00'), count:5},
    {date: new Date('2016-01-12T00:00:00'), count:6},
    {date: new Date('2016-01-13T00:00:00'), count:2},
    {date: new Date('2016-01-14T00:00:00'), count:1},
  ];

  chart = new DS_TSBarChart('#ds_jobs_chart')
          .height(250)
          .ySelector(function (d) { return d.count;})
          .xSelector(function (d) { return d.date;})
          .data($scope.jobs_data);
  chart.on('bar_click', function (ev, toggled) {
    console.log('in view', ev, toggled);
    (toggled) ? $scope.display_job_details = true : $scope.display_job_details = false;
    $scope.jobs_details = [
      {date: new Date('2016-01-01T00:00:00'), description:"OpenSEES", status:'failed'},
      {date: new Date('2016-01-01T00:00:00'), description:"OpenSEESMPI", status:'success'},
      {date: new Date('2016-01-01T00:00:00'), description:"Compress", status:'success'},
      {date: new Date('2016-01-01T00:00:00'), description:"OpenSEES", status:'success'},
    ]
    $scope.$apply();
  });

}])
