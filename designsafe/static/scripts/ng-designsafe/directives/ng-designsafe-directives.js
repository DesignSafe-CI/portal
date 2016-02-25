(function(angular){
    'use strict';
    function dragStart(e){
        var ele = this;
        ele.style.opacity = '0.4';
        e.dataTransfer.effectAllowed = 'copyLink';
        e.dataTransfer.setData('Text', ele.getAttribute('data-ds-data-href'));
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

    function dataDraggable(scope, element){
        var el = element[0];
        el.draggable = true;
        el.addEventListener('dragstart', dragStart);
        el.addEventListener('dragover', dragOver);
        el.addEventListener('dragend', dragOver);
        el.addEventListener('drop', onDrop);
    }

    angular.module('ng.designsafe').directive('dsDataDraggable', function(){
      return dataDraggable;
    });
})(angular);
