export default function customOnChange() {
    return {
        restrict: 'A',
        scope: {
            handler: '&'
        },
        link: function (scope, element, attrs) {
            element.on('change', function (ev) {
                scope.$apply(function(){
                    scope.handler({ ev:ev });
                });
            });
        }
    };
}
