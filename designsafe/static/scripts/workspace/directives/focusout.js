function focusout($parse) {
    'ngInject';
    return {
        compile: function($element, attr) {
            let fn = $parse(attr.focusout);
            return function handler(scope, element) {
                element.on('focusout', function(event) {
                    scope.$apply(function() {
                        fn(scope, {$event: event});
                    });
                });
            };
        },
    };
}
export default focusout;
