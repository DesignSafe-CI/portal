module.exports = function(config){
  config.set({

    basePath : './',

    files : [
      /* VENDOR SCRIPTS */
      '/var/www/designsafe-ci.org/static/vendor/underscore/underscore.js',
      '/var/www/designsafe-ci.org/static/vendor/modernizr/modernizr.js',
      '/var/www/designsafe-ci.org/static/vendor/jquery/dist/jquery.min.js',
      '/var/www/designsafe-ci.org/static/vendor/bootstrap-ds/js/bootstrap.js',
      '/var/www/designsafe-ci.org/static/vendor/bootstrap-datepicker/dist/js/bootstrap-datepicker.min.js',
      '/var/www/designsafe-ci.org/static/vendor/slick-carousel/slick/slick.min.js',
      '/var/www/designsafe-ci.org/static/vendor/tv4/tv4.js',
      '/var/www/designsafe-ci.org/static/vendor/objectpath/lib/ObjectPath.js',
      '/var/www/designsafe-ci.org/static/vendor/filesaver/FileSaver.js',
      '/var/www/designsafe-ci.org/static/vendor/nbviewer/lib/nbv.js',
      '/var/www/designsafe-ci.org/static/vendor/prismjs/prism.js',
      '/var/www/designsafe-ci.org/static/vendor/makred/lib/marked.js',

      '/var/www/designsafe-ci.org/static/vendor/angular/angular.min.js',
      '/var/www/designsafe-ci.org/static/vendor/angular-sanitize/angular-sanitize.min.js',
      '/var/www/designsafe-ci.org/static/vendor/angular-toastr/dist/angular-toastr.tpls.min.js',
      '/var/www/designsafe-ci.org/static/vendor/angular-translate/angular-translate.js',
      '/var/www/designsafe-ci.org/static/vendor/angular-cookies/angular-cookies.js',
      '/var/www/designsafe-ci.org/static/vendor/angular-bootstrap/ui-bootstrap-tpls.js',
      '/var/www/designsafe-ci.org/static/vendor/ngstorage/ngStorage.js',
      '/var/www/designsafe-ci.org/static/vendor/angular-drag-and-drop-lists/angular-drag-and-drop-lists.js',
      '/var/www/designsafe-ci.org/static/vendor/angular-xeditable/dist/js/xeditable.js',
      '/var/www/designsafe-ci.org/static/vendor/angular-slick-carousel/dist/angular-slick.min.js',
      '/var/www/designsafe-ci.org/static/vendor/angular-schema-form/dist/schema-form.js',
      '/var/www/designsafe-ci.org/static/vendor/angular-schema-form/dist/bootstrap-decorator.js',
      '/var/www/designsafe-ci.org/static/vendor/angular-httpi/build/httpi.min.js ',
      '/var/www/designsafe-ci.org/static/vendor/angular-ui-router/release/angular-ui-router.js',
      '/var/www/designsafe-ci.org/static/vendor/js-custom-select/js/customSelect.js',

      '/var/www/designsafe-ci.org/static/djng/js/django-angular.js',

      /* APPLICATION SCRIPTS */
      '/var/www/designsafe-ci.org/static/scripts/ng-designsafe/ng-designsafe.js',
      '/var/www/designsafe-ci.org/static/scripts/ng-designsafe/modules/notifications-module.js',
      '/var/www/designsafe-ci.org/static/scripts/ng-designsafe/modules/ws-module.js',
      '/var/www/designsafe-ci.org/static/scripts/ng-designsafe/providers/**/*.js',
      '/var/www/designsafe-ci.org/static/scripts/ng-designsafe/directives/**/*.js',
      '/var/www/designsafe-ci.org/static/scripts/ng-designsafe/filters/**/*.js',
      '/var/www/designsafe-ci.org/static/scripts/ng-designsafe/services/**/*.js',
      '/var/www/designsafe-ci.org/static/scripts/utils.js',
      '/var/www/designsafe-ci.org/static/scripts/navbar.js',
      '/var/www/designsafe-ci.org/static/scripts/dateinput.js',
      '/var/www/designsafe-ci.org/static/scripts/data-depot/app.js',
      '/var/www/designsafe-ci.org/static/scripts/data-depot/controllers/**/*.js',
      '/var/www/designsafe-ci.org/static/scripts/data-depot/templates/**/*.js',
      '/var/www/designsafe-ci.org/static/scripts/ng-logging/**/*.js',
      '/var/www/designsafe-ci.org/static/scripts/ng-modernizr/**/*.js',

      '/var/www/designsafe-ci.org/static/scripts/logging/logger.js',
      '/var/www/designsafe-ci.org/static/designsafe/apps/signals/scripts/module.js',
      '/var/www/designsafe-ci.org/static/designsafe/apps/signals/scripts/provider.js',

      '/var/www/designsafe-ci.org/static/designsafe/apps/notifications/scripts/module.js',
      '/var/www/designsafe-ci.org/static/designsafe/apps/notifications/scripts/provider.js',

      '/var/www/designsafe-ci.org/static/designsafe/apps/workspace/scripts/app.js',
      '/var/www/designsafe-ci.org/static/designsafe/apps/workspace/scripts/controllers/**/*.js',
      '/var/www/designsafe-ci.org/static/designsafe/apps/workspace/scripts/directives/**/*.js',
      '/var/www/designsafe-ci.org/static/designsafe/apps/workspace/scripts/providers/**/*.js',
      '/var/www/designsafe-ci.org/static/designsafe/apps/workspace/scripts/services/**/*.js',

      /* TEST SCRIPTS */
      './designsafe/static/vendor/angular-mocks/angular-mocks.js',
      './designsafe/static/scripts/designsafe/tests/setup.js',
      './designsafe/apps/workspace/tests/**/*.js'
    ],

    autoWatch : true,

    frameworks: ['jasmine'],

    browsers : ['Chrome', 'ChromeHeadless', 'ChromeHeadlessNoSandbox'],
    plugins : [
            'karma-chrome-launcher',
            'karma-jasmine',
            'karma-jasmine-html-reporter'
            ],

    reporters: ['progress', 'html'],
    customLaunchers: {
        ChromeHeadlessNoSandbox: {
            base: 'ChromeHeadless',
            flags: ['--no-sandbox'],
        }
    }
  });
};
