angular.module('designsafe').controller('DashboardCtrl', ['$scope', 'UserService', 'NotificationService', 'AgaveService', 'TicketsService',
function ($scope, UserService, NotificationService, AgaveService, TicketsService) {
  $scope.display_job_details = false;
  $scope.loading_tickets = true;
  $scope.loading_jobs = true;
  $scope.today = new Date();
  $scope.first_jobs_date = new Date($scope.today.getTime() - (14 * 24 * 60 * 60 * 1000 ));
  $scope.first_jobs_date = new Date($scope.first_jobs_date.setHours(0,0,0,0));
  $scope.chart = new DS_TSBarChart('#ds_jobs_chart')
          .height(250)
          .xSelector(function (d) { return d.key;})
          .ySelector(function (d) { return d.values.length;})
          .start_date($scope.first_jobs_date);

  $scope.chart.on('bar_click', function (ev, toggled) {
    (toggled) ? $scope.display_job_details = true : $scope.display_job_details = false;
    $scope.jobs_details = ev.values;
    $scope.$apply();
  });

  NotificationService.list({limit:5}).then(function (resp) {
    $scope.notifications = resp.notifs;
    $scope.notification_count = resp.total;
  });

  UserService.usage().then(function (resp) {
    $scope.usage = resp;
  });

  AgaveService.jobsListing({'created.gt':moment($scope.first_jobs_date).format('Y-M-D')}).then(function (resp) {
    $scope.jobs = resp;
    $scope.chart_data = AgaveService.jobsByDate(resp);

    // console.log($scope.jobs);
    $scope.chart.data($scope.chart_data);
    var tmp = _.groupBy($scope.jobs, function (d) {return d.appId;});
    // console.log(tmp)
    $scope.recent_apps = Object.keys(tmp);
    $scope.loading_jobs = false;
  });

  AgaveService.appsListing({limit:99999}).then(function (resp) {
    var tmp = _.groupBy(resp, function (d) {return d.label;});
    $scope.apps = Object.keys(tmp);
  });

  TicketsService.get().then(function (resp) {
    // console.log(resp)
    $scope.my_tickets = resp;
    $scope.loading_tickets = false;
  }, function (err) {
    $scope.loading_tickets = false;
  });



}]);
