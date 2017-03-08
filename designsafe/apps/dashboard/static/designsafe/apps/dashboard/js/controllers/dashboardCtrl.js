angular.module('designsafe').controller('DashboardCtrl', ['$scope', 'UserService', 'NotificationService', 'AgaveService', 'TicketsService',
function ($scope, UserService, NotificationService, AgaveService, TicketsService) {
  $scope.jobs_count = 12;
  $scope.storage_count = 151231231231232;
  $scope.apps_count = 45;
  $scope.activities_count = 42;
  $scope.display_job_details = false;
  $scope.loading_tickets = true;
  $scope.loading_jobs = true;
  $scope.today = new Date();
  $scope.first_jobs_date = new Date($scope.today.getTime() - (14 * 24 * 60 * 60 * 1000 ))

  NotificationService.list({limit:5}).then(function (resp) {
    // console.log(resp)
    $scope.notifications = resp;
  })

  UserService.usage().then(function (resp) {
    $scope.usage = resp;
  });

  AgaveService.jobsListing({'created.gt':'2017-01-01'}).then(function (resp) {
    $scope.jobs = resp;
    $scope.chart_data = AgaveService.jobsByDate(resp);
    // console.log($scope.jobs);
    $scope.chart.data($scope.chart_data);
    var tmp = _.groupBy($scope.jobs, function (d) {return d.appId});
    // console.log(tmp)
    $scope.recent_apps = Object.keys(tmp);
    $scope.loading_jobs = false;
  })

  AgaveService.appsListing({limit:99999}).then(function (resp) {
    var tmp = _.groupBy(resp, function (d) {return d.label});
    $scope.apps = Object.keys(tmp);
  })

  TicketsService.get().then(function (resp) {
    // console.log(resp)
    $scope.my_tickets = resp;
    $scope.loading_tickets = false;
  }, function (err) {
    $scope.loading_tickets = false;
  })

  $scope.chart = new DS_TSBarChart('#ds_jobs_chart')
          .height(250)
          .xSelector(function (d) { return d.key;})
          .ySelector(function (d) { return d.values.length;});

  $scope.chart.on('bar_click', function (ev, toggled) {
    (toggled) ? $scope.display_job_details = true : $scope.display_job_details = false;
    $scope.jobs_details = ev.values;
    $scope.$apply();
  });

}])
