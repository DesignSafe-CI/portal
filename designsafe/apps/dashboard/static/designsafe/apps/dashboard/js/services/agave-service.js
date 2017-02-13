angular.module('designsafe').service('AgaveService', ['$http', '$q',
  function ($http, $q) {

    var filesBaseUrl = 'https://agave.designsafe-ci.org/files/v2/';
    var jobsBaseUrl = 'https://agave.designsafe-ci.org/jobs/v2/';
    var appsBaseUrl = 'https://agave.designsafe-ci.org/apps/v2/';
    //https://public.tenants.agaveapi.co/files/v2/listings/data.agaveapi.co/nryan
    this.filesListing = function (path, q) {
      return $http.get(filesBaseUrl + 'listings/' +  path, {params: q}).then(function (resp) {
        return resp.data.result;
      }, function (err) {
        return $q.reject(err);
      })
    }

    this.jobsListing = function (q) {
      return $http.get(jobsBaseUrl, {params: q}).then(function (resp) {
        return resp.data.result;
      }, function (err) {
        return $q.reject(err);
      })
    }

    this.appsListing = function (q) {
      return $http.get(appsBaseUrl, {params: q}).then(function (resp) {
        return resp.data.result;
      }, function (err) {
        return $q.reject(err);
      })
    }

  }]
)
