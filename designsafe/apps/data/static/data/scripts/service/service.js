(function(){
    'use strict';
    function filesystem($http){
        // this should not exists.
        var token = '97cafc5b35d72cde721f34cb502c3646';
        // Alright, alright, alright from now on.
        var service = {
            getList: getList,
        };
        return service;

        function getList(path){
            return $http({
                method: 'GET',
                url: '/data/list-path/?token=' + token + '&path=' + path,
            });
        }
    }
    angular.module('ds.api.data')
    .factory('dataAPIService', 
        ['$http', 'WSBusService', filesystem]);

})();
