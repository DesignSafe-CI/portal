/* ds.data controller */
(function(){
    'use strict';
    function DataController($rootScope, $scope, dataAPIService){
        var dataVM = this;
        dataVM.path = 'jcoronel';
        dataVM.getList = getList;
        dataVM.rootFolder = true;
        dataVM.parentPath = '';
        dataVM.list = [];
        dataVM.loading = true;
        getList(dataVM.path + '/');

        init();

        function getList(path){
            if(path == dataVM.path){
                return;
            }
            console.log('Opening: ', path);
            dataVM.loading = true;
            dataVM.path = path;
            dataAPIService.getList(path).then(function(d){
                dataVM.list = d.data;
                var pathArr = dataVM.list[0].href;
                pathArr = pathArr.substring(0, path.length);
                pathArr = pathArr.split('/');
                if(pathArr.length > 2){
                    dataVM.rootFolder = false;
                    dataVM.parentPath = '';
                    pathArr.forEach(function(element, index, array){
                        if(index === 0 || index > (array.length - 2)){
                            return;
                        }
                        dataVM.parentPath += '/' + element;
                    });
                } else {
                    dataVM.rootFolder = true;
                    dataVM.parentPath = '';
                }
                dataVM.loading = false;
            });
        }

        function init(){
            $rootScope.$on('ds.wsBus:default', processMessage);

        }

        function processMessage(event, msg){
            console.log('Event msg: ', msg);
            if(msg.eventType !== 'data'){
                return;
            }
            dataVM[msg.data.callback](msg.data.path);
            //getList(action);
        }

    }

    angular.module('ds.data')
    .controller('DataController', 
        ['$rootScope', '$scope', 'dataAPIService', DataController]);
})();
