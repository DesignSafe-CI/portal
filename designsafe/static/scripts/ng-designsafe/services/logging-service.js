  window.__DEBUG__ = window.__DEBUG__ || true;

  /**
   * Use this service instead of `console.log`. Instantiate an instance of a logger, and
   * then You can call it just like `console.log`:
   *
   * ```
   * logger = Logger.getLogger('my-logger');
   * logger.log('Hello world!');
   * ```
   *
   * If `window.__DEBUG__` evaluates to `true` then the message will be logged to the browser
   * console. It will always pass log messages on to the backend logging API service.
   *
   * @see designsafe.apps.api.views.LoggerApi
   *
   * @constructor
   */
  export function LoggingServiceProvider() {
    this.$get = function($http, djangoUrl) {
        'ngInject';

      var _logLevels = {
        "DEBUG": 0,
        "INFO": 1,
        "WARN": 2,
        "ERROR": 3,
        "FATAL": 4
      };

      var Logger = function(name) {
        this._name = name;
      };

      Logger.prototype._log = function(level) {
        level = level || "INFO";

        var message;
        var args;
        var console_op;
        var console_args;

        args = Array.prototype.slice.call(arguments, 1);

        if (args.length > 0 && typeof args[0] === 'string') {
          message = '[%s] %s: ' + args[0];
          args = args.slice(1);
        } else {
          message = '[%s] %s';
        }

        console_args = [message, level, this._name];
        Array.prototype.push.apply(console_args, args);

        if (window.__DEBUG__ && window.console) {
          switch (_logLevels[level]) {
            case 1:
              console_op = window.console.info;
              break;
            case 2:
              console_op = window.console.warn;
              break;
            case 3:
            case 4:
              console_op = window.console.error;
              break;
            default:
              console_op = window.console.log;
          }

          console_op.apply(window.console, console_args);
        }

        /* Send log message to backend */
        $http.post(djangoUrl.reverse('designsafe_api:logger'),
          {level: level, name: this._name, message: args[0], args: args.slice(1)});
      };

      Logger.prototype.log = function() {
        var args = ['DEBUG'].concat(Array.prototype.slice.call(arguments));
        Logger.prototype._log.apply(this, args);
      };

      Logger.prototype.debug = Logger.prototype.log;

      Logger.prototype.info = function() {
        var args = ['INFO'].concat(Array.prototype.slice.call(arguments));
        Logger.prototype._log.apply(this, args);
      };

      Logger.prototype.warn = function() {
        var args = ['WARN'].concat(Array.prototype.slice.call(arguments));
        Logger.prototype._log.apply(this, args);
      };

      Logger.prototype.error = function() {
        var args = ['ERROR'].concat(Array.prototype.slice.call(arguments));
        Logger.prototype._log.apply(this, args);
      };

      return {
        getLogger: function(name) {
          return new Logger(name);
        }
      };
    };
  }


