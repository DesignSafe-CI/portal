(function(window, angular) {
  "use strict";

  window.__DEBUG__ = window.__DEBUG__ || false;

  /**
   * Use this service instead of `console.log`. You can call it just like `console.log`:
   *
   * ```
   * logger.log('Tell %s about %s', 'him', 'things');
   * ```
   *
   * This only logs to the browser console when `window.DEBUG` evaluates to `true`. It will
   * always pass log messages on to the backend logger service.
   *
   * @constructor
   */
  function LoggingServiceProvider() {
    this.$get = function($http, djangoUrl) {

      function fallbackLogger() {}

      function httpLogger(level, original_args) {
        var message = original_args[0];
        var args = Array.prototype.slice.call(original_args, 1);
        $http.post(djangoUrl.reverse('designsafe_api:logger'), {level: level, message: message, args: args});
      }

      return {
        log: function() {
          if (window.__DEBUG__ && window.console && window.console.log) {
            window.console.log.apply(window.console, arguments);
          } else {
            fallbackLogger.apply(this, arguments);
          }
          httpLogger('DEBUG', arguments);
        },
        info: function() {
          if (window.__DEBUG__ && window.console && window.console.info) {
            window.console.info.apply(window.console, arguments);
          } else {
            fallbackLogger.apply(this, arguments);
          }
          httpLogger('INFO', arguments);
        },
        warn: function() {
          if (window.__DEBUG__ && window.console && window.console.warn) {
            window.console.warn.apply(window.console, arguments);
          } else {
            fallbackLogger.apply(this, arguments);
          }
          httpLogger('WARN', arguments);
        },
        error: function() {
          if (window.__DEBUG__ && window.console && window.console.error) {
            window.console.error.apply(window.console, arguments);
          } else {
            fallbackLogger.apply(this, arguments);
          }
          httpLogger('ERROR', arguments);
        },
        trace: function() {
          if (window.__DEBUG__ && window.console && window.console.trace) {
            window.console.trace.apply(window.console, arguments);
          } else {
            fallbackLogger.apply(this, arguments);
          }
        },
        dir: function() {
          if (window.__DEBUG__ && window.console && window.console.dir) {
            window.console.dir.apply(window.console, arguments);
          } else {
            fallbackLogger.apply(this, arguments);
          }
        }
      }
    }
  }

  angular.module('ng.designsafe').provider('logger', LoggingServiceProvider);

})(window, angular);
