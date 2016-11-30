(function(window, angular, $, _) {
  "use strict";

  angular.module('designsafe').directive('agaveFilePicker', function() {
    return {
      restrict: 'EA',
      require: 'ngModel',
      replace: true,
      templateUrl: '/static/designsafe/apps/workspace/html/directives/agave-file-picker.html',
      link: function($scope, $element, attrs, $ngModel) {
        var formKey = $scope.form.key.join('.');

        $scope.requesting = false;

        $scope.data = {
          input: null
        };

        $scope.wantFile = function wantFile($event) {
          $event.preventDefault();
          $element.parent().addClass('wants');
          $scope.$emit('wants-file', {
            requestKey: formKey,
            title: $scope.form.title || formKey,
            description: $scope.form.description || ''
          });
          $scope.requesting = true;
        };

        function stopWant() {
          $element.parent().removeClass('wants');
          $scope.$emit('cancel-wants-file', {requestKey: formKey});
          $scope.requesting = false;
        }

        $scope.stopWant = function($event) {
          $event.preventDefault();
          stopWant();
        };

        $scope.$on('provides-file', function($event, args) {
          var requestKey = args.requestKey || '';
          var file = args.file || {};
          if (formKey === requestKey) {
            $scope.data.input = file.agavePath;
            $ngModel.$setViewValue(file.agavePath);
            stopWant();
          }
        });

        $element.find('input').on('change', function() {
          $ngModel.$setViewValue($scope.data.input);
        });
      }
    };
  });

})(window, angular, jQuery, _);
