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

    this.jobsByDate = function (jobs, start_date) {
      start_date = start_date || new Date(new Date(new Date() - (7 * 24 * 60 * 60 * 1000)).setHours(0, 0, 0));
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
      var dates = [];
      if (nested.length) {
        dates[0] = start_date;
        var ct = dates[0];
        while (ct < nested[nested.length - 1].key) {
          ct = new Date(ct.getTime() + (24 * 60 * 60* 1000))
          dates.push(ct)
        }
      }

      var out = [];
      for (var i=0; i<dates.length; i++){
        var obj = {
          date: dates[i],
          count: 0
        }
        console.log(dates[i])
        var test = _.find(nested, function (d) {return d.key.getTime() === dates[i].getTime()});
        if (test) {
          obj.count = test.values.length;
        }
        out.push(obj)
      }
      console.log(nested)
      return out;
    };

  }]
)
