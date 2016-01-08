(function(angular) {
    "use strict";
    var app = angular.module('FileManagerApp');

    app.directive('angularFilemanager', ['$parse', 'fileManagerConfig', function($parse, fileManagerConfig) {
        return {
            restrict: 'EA',
            templateUrl: fileManagerConfig.tplPath + '/main.html'
        };
    }]);

    app.directive('ngFile', ['$parse', function($parse) {
        return {
            restrict: 'A',
            link: function(scope, element, attrs) {
                var model = $parse(attrs.ngFile);
                var modelSetter = model.assign;

                element.bind('change', function() {
                    scope.$apply(function() {
                        modelSetter(scope, element[0].files);
                    });
                });
            }
        };
    }]);

    app.directive('ngRightClick', ['$parse', function($parse) {
        return function(scope, element, attrs) {
            var fn = $parse(attrs.ngRightClick);
            element.bind('contextmenu', function(event) {
                scope.$apply(function() {
                    event.preventDefault();
                    fn(scope, {$event: event});
                });
            });
        };
    }]);
    
})(angular);

//Custom drag and drop directive

(function(angular){
    'use strict';
    function dragStart(e){
        var ele = this;
        ele.style.opacity = '0.4';
        e.dataTransfer.effectAllowed = 'copyLink';
        e.dataTransfer.setData('Text', ele.getAttribute('data-agave-href'));
        this.classList.add('drag');
    }

    function dragOver(e){
        e.preventDefault();
        var ele = this;
        ele.style.opacity = '1';
    }

    function onDrop(e){
        e.stopPropagation();
        var ele = this;
        ele.style.opacity = '1';
    }

    function fmDraggable(scope, element){
        var el = element[0];
        el.draggable = true;
        el.addEventListener('dragstart', dragStart);
        el.addEventListener('dragover', dragOver);
        el.addEventListener('dragend', dragOver);
        el.addEventListener('drop', onDrop);
    }

    angular.module('FileManagerApp').directive('fmDraggable', function(){return fmDraggable;});
})(angular);

(function(angular){
    'use strict';
    function fileSelect(e){
        e.stopPropagation();
        e.preventDeafult();
        
        var files = e.dataTransfer.files;
        
    }
})(angular);
