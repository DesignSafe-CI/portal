(function(window, angular) {
  var mod = angular.module('ng.designsafe');

  mod.filter('bytes', function() {
    return function(bytes, precision) {
      if (isNaN(parseFloat(bytes)) || !isFinite(bytes)) return '-';
      if (typeof precision === 'undefined') precision = 1;
      var units = ['bytes', 'kB', 'MB', 'GB', 'TB', 'PB'];
      var number = bytes === 0 ? 0 : Math.floor(Math.log(bytes) / Math.log(1024));
      return (bytes / Math.pow(1024, Math.floor(number))).toFixed(precision) +  ' ' + units[number];
    };
  });

  mod.filter('keys', function() {
    return function(obj) {
      if (typeof obj === 'object') {
        return Object.keys(obj);
      }
      return [];
    };
  });

  mod.filter('length', function() {
    return function(obj) {
      if (typeof obj === 'object') {
        if (obj instanceof Array) {
          return obj.length;
        } else {
          return Object.keys(obj).length;
        }
      } else if (typeof obj === "string") {
        return obj.length;
      } else if (typeof obj === "number") {
        return String(obj).length;
      }
      return 0;
    };
  });
})(window, angular);
