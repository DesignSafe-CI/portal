module.exports = function(config){
  config.set({

    basePath : './',

    files : [
      '/var/www/designsafe-ci.org/static/vendor/jquery/dist/jquery.js',
      '/var/www/designsafe-ci.org/static/vendor/angular/angular.js',
      '/var/www/designsafe-ci.org/static/vendor/angular-bootstrap/ui-bootstrap-tpls.js',
      '/var/www/designsafe-ci.org/static/vendor/angular-cookies/angular-cookies.js',
      '/var/www/designsafe-ci.org/static/vendor/angular-mocks/angular-mocks.js',
      '/var/www/designsafe-ci.org/static/vendor/angular-schema-form/dist/schema-form.js',
      '/var/www/designsafe-ci.org/static/vendor/angular-schema-form/dist/bootstrap-decorator.js',
      '/var/www/designsafe-ci.org/static/vendor/underscore/underscore.js',
      '/var/www/designsafe-ci.org/static/vendor/tv4/tv4.js',
      '/var/www/designsafe-ci.org/static/vendor/objectpath/lib/ObjectPath.js',
      '/var/www/designsafe-ci.org/static/djangular/js/django-angular.js',
      '/portal/designsafe/apps/workspace/static/designsafe/apps/workspace/scripts/**/*.js',
      '/portal/designsafe/apps/workspace/tests/**/*.js'
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
