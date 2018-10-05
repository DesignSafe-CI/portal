module.exports = function(config){
  config.set({

    basePath : './',

    files : [
        './node_modules/underscore/**/*.js',
        './designsafe/static/vendor/modernizr/modernizr.js',
        './node_modules/jquery/dist/jquery.min.js',
        './designsafe/static/vendor/bootstrap-ds/js/bootstrap.js',
        './node_modules/bootstrap-datepicker/dist/js/bootstrap-datepicker.min.js',
        './node_modules/slick-carousel/slick/**/*.js',
        './node_modules/tv4/tv4.js',
        './node_modules/objectpath/lib/**/*.js',
        //'./node_modules/filesaver/src/FileSaver.js',
        './designsafe/static/nbviewer/**/*.js',
        './node_modules/prismjs/prism.js',
        './node_modules/marked/lib/marked.js',
       
        './node_modules/angular/angular.min.js',
        './node_modules/ngstorage/ngStorage.js',
        './node_modules/angular-translate/dist/angular-translate.js',
        './node_modules/angular-aria/angular-aria.js',
        './node_modules/angular-animate/angular-animate.js',
        './node_modules/angular-material/angular-material.js',
        './node_modules/angular-toastr/dist/angular-toastr.tpls.min.js',
        './node_modules/angular-cookies/angular-cookies.js',
        './node_modules/angular-ui-bootstrap/dist/ui-bootstrap.js',
        './node_modules/angular-ui-bootstrap/dist/ui-bootstrap-tpls.js',
        './node_modules/angular-drag-and-drop-lists/angular-drag-and-drop-lists.js',
        './node_modules/angular-xeditable/dist/js/xeditable.js',
        './node_modules/angular-slick-carousel/dist/angular-slick.min.js',
        './designsafe/static/vendor/httpi/build/httpi.min.js',
        './node_modules/angular-ui-router/release/angular-ui-router.js',
        './designsafe/static/vendor/js-custom-select/js/customSelect.js',
        './node_modules/angular-sanitize/angular-sanitize.min.js',
        './node_modules/angular-schema-form/dist/schema-form.js',
        './node_modules/angular-schema-form/dist/bootstrap-decorator.js',

        './static/djng/**/*.js',

      /* APPLICATION SCRIPTS */
      './designsafe/static/scripts/ng-designsafe/ng-designsafe.js',
      './designsafe/static/scripts/ng-designsafe/modules/notifications-module.js',
      './designsafe/static/scripts/ng-designsafe/modules/ws-module.js',
      './designsafe/static/scripts/ng-designsafe/providers/**/*.js',
      './designsafe/static/scripts/ng-designsafe/directives/**/*.js',
      './designsafe/static/scripts/ng-designsafe/filters/**/*.js',
      './designsafe/static/scripts/ng-designsafe/services/**/*.js',
      './designsafe/static/scripts/utils.js',
      './designsafe/static/scripts/navbar.js',
      './designsafe/static/scripts/dateinput.js',
      './designsafe/static/scripts/data-depot/app.js',
      './designsafe/static/scripts/data-depot/controllers/**/*.js',
      './designsafe/static/scripts/ng-modernizr/**/*.js',

      './designsafe/static/scripts/logging/logger.js',
      './designsafe/apps/signals/static/designsafe/apps/signals/scripts/module.js',
      './designsafe/apps/signals/static/designsafe/apps/signals/scripts/provider.js',

      './designsafe/apps/workspace/static/designsafe/apps/workspace/scripts/app.js',
      './designsafe/apps/workspace/static/designsafe/apps/workspace/scripts/controllers/**/*.js',
      './designsafe/apps/workspace/static/designsafe/apps/workspace/scripts/directives/**/*.js',
      './designsafe/apps/workspace/static/designsafe/apps/workspace/scripts/providers/**/*.js',
      './designsafe/apps/workspace/static/designsafe/apps/workspace/scripts/services/**/*.js',

      './designsafe/static/scripts/**/*.js',

      /* TEST SCRIPTS */
      './node_modules/angular-mocks/angular-mocks.js',
      './designsafe/static/scripts/designsafe/tests/setup.js',
      './designsafe/apps/workspace/tests/**/*.js'
    ],
    exclude: [
        './static/admin/**/*.js',
        './static/cascade/**/*.js',
        './static/cms/**/*.js',
        './static/djangocms_text_ckeditor/**/*.js',
    ],

    autoWatch : true,

    frameworks: ['jasmine'],

    browsers : ['ChromeHeadless', 'ChromeHeadlessNoSandbox'],
    plugins : [
            'karma-chrome-launcher',
            'karma-jasmine',
            'karma-jasmine-html-reporter'
            ],

    reporters: ['progress', 'coverage'],
    coverageReporter: {
        reporters: [
            {type:'lcov', subdir: '.', dir: '.'},
        ]
    },
    customLaunchers: {
        ChromeHeadlessNoSandbox: {
            base: 'ChromeHeadless',
            flags: ['--no-sandbox'],
        }
    }
  });
};
