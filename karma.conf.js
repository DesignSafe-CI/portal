module.exports = function(config){
  config.set({

    basePath : './',

    files : [
      /* VENDOR SCRIPTS */
      '/var/www/designsafe-ci.org/static/js/vendor.js',

      '/var/www/designsafe-ci.org/static/vendor/angular/angular.min.js',
      '/var/www/designsafe-ci.org/static/vendor/angular-sanitize/angular-sanitize.min.js',
      '/var/www/designsafe-ci.org/static/vendor/angular-toastr/dist/angular-toastr.tpls.min.js',
      '/var/www/designsafe-ci.org/static/vendor/angular-translate/angular-translate.js',
      '/var/www/designsafe-ci.org/static/vendor/angular-cookies/angular-cookies.js',
      '/var/www/designsafe-ci.org/static/vendor/angular-bootstrap/ui-bootstrap-tpls.js',
      '/var/www/designsafe-ci.org/static/vendor/angular-sanitize/angular-sanitize.js',
      '/var/www/designsafe-ci.org/static/vendor/ngstorage/ngStorage.js',

      '/var/www/designsafe-ci.org/static/vendor/tv4/tv4.js',
      '/var/www/designsafe-ci.org/static/vendor/objectpath/lib/ObjectPath.js',
      '/var/www/designsafe-ci.org/static/vendor/angular-schema-form/dist/schema-form.js',
      '/var/www/designsafe-ci.org/static/vendor/angular-schema-form/dist/bootstrap-decorator.js',
      '/var/www/designsafe-ci.org/static/vendor/underscore/underscore.js',
      '/var/www/designsafe-ci.org/static/vendor/filesaver/FileSaver.js',
      '/var/www/designsafe-ci.org/static/vendor/angular-drag-and-drop-lists/angular-drag-and-drop-lists.js',
      '/var/www/designsafe-ci.org/static/vendor/angular-xeditable/dist/js/xeditable.js',

      '/var/www/designsafe-ci.org/static/djng/js/django-angular.js',

      /* APPLICATION SCRIPTS */
      '/var/www/designsafe-ci.org/static/scripts/utils.js',
      '/var/www/designsafe-ci.org/static/scripts/navbar.js',
      '/var/www/designsafe-ci.org/static/scripts/dateinput.js',
      '/var/www/designsafe-ci.org/static/scripts/ng-logging/**/*.js',
      '/var/www/designsafe-ci.org/static/scripts/ng-modernizr/**/*.js',
      '/var/www/designsafe-ci.org/static/scripts/ng-designsafe/**/*.js',

      '/var/www/designsafe-ci.org/static/scripts/logging/logger.js',
      '/var/www/designsafe-ci.org/static/designsafe/apps/signals/scripts/module.js',
      '/var/www/designsafe-ci.org/static/designsafe/apps/signals/scripts/provider.js',

      '/var/www/designsafe-ci.org/static/designsafe/apps/notifications/scripts/module.js',
      '/var/www/designsafe-ci.org/static/designsafe/apps/notifications/scripts/provider.js',

      '/var/www/designsafe-ci.org/static/designsafe/apps/workspace/scripts/**/*.js',

      /* TEST SCRIPTS */
      './designsafe/static/vendor/angular-mocks/angular-mocks.js',
      './designsafe/apps/workspace/tests/**/*.js'
    ],

    autoWatch : true,

    frameworks: ['jasmine'],

    browsers : ['Chrome'],

    plugins : [
            'karma-chrome-launcher',
            'karma-firefox-launcher',
            'karma-jasmine',
            'karma-jasmine-html-reporter'
            ],

    reporters: ['progress', 'html']

  });
};
