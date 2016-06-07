module.exports = function(config){
  config.set({

    basePath : './',

    files : [
      '/var/www/designsafe-ci.org/static/js/vendor.js',
      '/var/www/designsafe-ci.org/static/djng/js/django-angular.js',
      '/var/www/designsafe-ci.org/static/scripts/**/*.js',
      '/var/www/designsafe-ci.org/static/designsafe/apps/workspace/scripts/**/*.js',
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
