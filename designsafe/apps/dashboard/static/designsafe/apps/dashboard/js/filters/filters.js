angular.module('designsafe').filter('agave2ds', function () {
  return function (agave_url) {
    var base_url = '/data/browser/agave/designsafe.storage.default/'
    var parts = agave_url.split('designsafe.storage.default')
    return base_url + parts[1] + '/';
  }
})
