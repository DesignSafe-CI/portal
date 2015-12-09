(function(){
    'use strict';
    function filesystem($http){
        // this should not exists.
        var token = '4e2440c811d6f8b24911b30b77e1241';
        // Alright, alright, alright from now on.
        var service = {
            getList: getList,
        };
        return service;

        function getList(path){
            return $http({
                method: 'GET',
                url: '/api/v1/data/list-path?token=' + token + '&path=' + path,
            });
        }
    }
    angular.module('ds.api.data')
    .factory('dataAPIService', 
        ['$http', 'WSBusService', filesystem]);

})();
