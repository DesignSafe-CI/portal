(function(angular, $){
  "use strict";

  var mod = angular.module('ng.designsafe');

  mod.directive('selectOnFocus', function() {
    return {
      restrict: 'A',
      link: function(scope, element, attrs) {
        element.on('focus', function() {
          this.select();
        });
      }
    }
  });

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
        transferData: '=transfer',
        dragStart: '&',
        dragEnter: '&',
        dragOver: '&',
        dragLeave: '&',
        dragEnd: '&',
        dragDrop: '&'
      },
      link: function(scope, element) {
        element[0].draggable = true;

        element[0].addEventListener('dragstart', function (e) {
          var handler = scope.dragStart();
          if (handler) {
            handler(e, scope.transferData);
          }
        });

        element[0].addEventListener('dragenter', function (e) {
          var handler = scope.dragEnter();
          if (handler) {
            handler(e, scope.transferData);
          }
        });

        element[0].addEventListener('dragover', function (e) {
          var handler = scope.dragOver();
          if (handler) {
            handler(e, scope.transferData);
          }
        });

        var dragLeaveHandler = function(e) {
          var handler = scope.dragLeave();
          if (handler) {
            handler(e, scope.transferData);
          }
        };
        element[0].addEventListener('dragleave', dragLeaveHandler);
        element[0].addEventListener('dragexit', dragLeaveHandler);

        element[0].addEventListener('dragend', function (e) {
          var handler = scope.dragEnd();
          if (handler) {
            handler(e, scope.transferData);
          }
        });

        element[0].addEventListener('drop', function (e) {
          e.preventDefault();
          element.removeClass('ds-droppable');
          var handler = scope.dragDrop();
          if (handler) {
            handler(e, scope.transferData);
          }
        });
      }
    };
  });


})(angular, jQuery);
