(function(window, angular, $, _) {
  "use strict";

  angular.module('WorkspaceApp').directive('agaveFilePicker', function() {
    return {
      restrict: 'EA',
      require: 'ngModel',
      replace: true,
      templateUrl: '/static/designsafe/apps/workspace/html/directives/agave-file-picker.html',
      link: function($scope, $element, attrs, $ngModel) {
        var formKey = $scope.form.key.join('.');

        $scope.wantFile = function($event) {
          $event.preventDefault();
          $scope.$emit('wants-file', {'form': $scope.form, 'formKey': formKey});
        };

        $scope.$on('selects-file', function(key, file) {
          if (key === formKey) {
            $ngModel.$setViewValue('agave://' + file.system + '/' + file.path);
          }
        });

        $element.find('input').on('change', function() {
          $ngModel.$setViewValue(this.value);
        });
      }
    };
  });

})(window, angular, jQuery, _);
