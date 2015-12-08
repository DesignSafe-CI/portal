/* ds.data controller */
(function(){
    'use strict';
    function DataController($scope, dataAPIService){
        var vm = this;
        vm.path = 'jcoronel';
        vm.getList = getList;
        vm.rootFolder = true;
        vm.parentPath = '';
        vm.list = [];
        vm.loading = true;
        getList(vm.path);

        function getList(path){
            vm.loading = true;
            vm.path = path;
            dataAPIService.getList(path).then(function(d){
                vm.list = d.data;
                var pathArr = vm.list[0].href;
                pathArr = pathArr.substring(0, path.length);
                pathArr = pathArr.split('/');
                if(pathArr.length > 2){
                    vm.rootFolder = false;
                    vm.parentPath = '';
                    pathArr.forEach(function(element, index, array){
                        if(index === 0 || index > (array.length - 2)){
                            return;
                        }
                        vm.parentPath += '/' + element;
                    });
                } else {
                    vm.rootFolder = true;
                    vm.parentPath = '';
                }
                vm.loading = false;
            });
        }
    }

    angular.module('ds.data')
    .controller('DataController', 
        ['$scope', 'dataAPIService', DataController]);
})();
