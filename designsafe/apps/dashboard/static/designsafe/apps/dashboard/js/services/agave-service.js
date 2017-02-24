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
      });
    };

    this.jobsListing = function (q) {
      return $http.get(jobsBaseUrl, {params: q}).then(function (resp) {
        resp.data.result.forEach(function (d) {
          d.created = new Date(d.created);
        })
        return resp.data.result;
      }, function (err) {
        return $q.reject(err);
      });
    };

    this.appsListing = function (q) {
      return $http.get(appsBaseUrl, {params: q}).then(function (resp) {
        return resp.data.result;
      }, function (err) {
        return $q.reject(err);
      });
    };

    this.jobsByDate = function (jobs) {
      var nested = d3.nest()
        .key(function (d) {
          var ct = d.created;
          ct.setHours(0, 0, 0);
          return ct;
        })
        .entries(jobs);
      nested.forEach(function (d) {
        d.key = new Date(d.key);
      })

      nested = nested.sort(function (a, b) { return a.key - b.key});

      // make a continous array for the chart?
      var out = [];
      if (nested.length) {
        out[0] = nested[0].key;
        var ct = nested[0].key;
        while (ct < nested[nested.length - 1].key) {
          ct = new Date(ct.getTime() + (24 * 60 * 60* 1000))
          out.push(ct)
        }
      }
      console.log(out)
      return nested;
    };

  }]
)
