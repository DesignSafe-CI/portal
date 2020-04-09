(function(angular) {
    var django = angular.module('django.context', []);
    django.constant('Django', {
        user: 'AnonymousUser',
        context: {}
    });
})(angular);
