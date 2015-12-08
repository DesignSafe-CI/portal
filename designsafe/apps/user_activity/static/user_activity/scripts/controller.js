(function(){
    'use strict';
    function UserActivityController($rootScope, $scope){
        var activityVM = this;
        activityVM.actions = [];
        
        $rootScope.$on('ds.data:openFolder', pushAction);

        function pushAction(event, action){
            activityVM.actions.push(action);
        }
    }

    angular.module('ds.userActivity')
    .controller('UserActivityController',
        ['$rootScope', '$scope', UserActivityController]);
})();
