(function(angular){
  "use strict";

  var mod = angular.module('ng.designsafe');

  mod.directive('dsDataDraggable', function() {
    function dragStart(e) {
      var ele = this;
      ele.style.opacity = '0.4';
      e.dataTransfer.effectAllowed = 'copyLink';
      e.dataTransfer.setData('text/plain', ele.getAttribute('data-ds-data'));
      this.classList.add('drag');
    }

    function dragOver(e) {
      e.preventDefault();
      var ele = this;
      ele.style.opacity = '1';
    }

    function onDrop(e) {
      e.stopPropagation();
      var ele = this;
      ele.style.opacity = '1';
    }

    function dataDraggable($scope, $element) {
      var el = $element[0];
      el.draggable = true;
      el.addEventListener('dragstart', dragStart);
      el.addEventListener('dragover', dragOver);
      el.addEventListener('dragend', dragOver);
      el.addEventListener('drop', onDrop);
    }
    return dataDraggable;
  });

  mod.directive('dsDraggable', function() {
    return {
      restrict: 'A',
      scope: {
        dragStart: '&',
        dragOver: '&',
        dragEnd: '&',
        drop: '&'
      },
      link: function(scope, element) {
        element[0].draggable = true;
        element[0].addEventListener('dragstart', scope.dragStart);
        element[0].addEventListener('dragover', scope.dragOver);
        element[0].addEventListener('dragend', scope.dragEnd);
        element[0].addEventListener('drop', scope.drop);
      }
    };
  });



})(angular);
