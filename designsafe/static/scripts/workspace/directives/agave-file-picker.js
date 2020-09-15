export function agaveFilePicker(window, angular, $, _) {
    'ngInject';
    'use strict';

    angular.module('workspace').directive('agaveFilePicker', function() {
        return {
            restrict: 'EA',
            require: 'ngModel',
            replace: true,
            template: require('../html/directives/agave-file-picker.html'),
            link: function($scope, $element, attrs, $ngModel) {
                let formKey = $scope.form.key.join('.');

                $scope.requesting = false;

                $scope.data = {
                    input: null,
                };

                $scope.wantFile = function wantFile($event) {
                    $event.preventDefault();
                    $element.parent().addClass('wants');
                    $scope.$emit('wants-file', {
                        requestKey: formKey,
                        title: $scope.form.title || formKey,
                        description: $scope.form.description || '',
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
                    let requestKey = args.requestKey || '';
                    let path = args.path || '';
                    if (formKey === requestKey) {
                        $scope.data.input = path;
                        $ngModel.$setViewValue(path);
                        stopWant();
                    }
                });

                $element.find('input').on('change', function() {
                    $ngModel.$setViewValue($scope.data.input);
                });
            },
        };
    });
}
