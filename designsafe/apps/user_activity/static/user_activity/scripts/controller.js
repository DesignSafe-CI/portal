(function(){
    'use strict';
    function UserActivityController($rootScope, $scope){
        var activityVM = this;
        activityVM.actions = [];
        init();
              
        function init(){                
            $rootScope.$on('ds.wsBus:default', pushAction);
        }

        function pushAction(event, msg){
            var action = JSON.stringify(msg);
            if (activityVM.actions[activityVM.actions.length - 1] !== action){
                activityVM.actions.push(msg);
            }
        }
    }

    angular.module('ds.userActivity')
    .controller('UserActivityController',
        ['$rootScope', '$scope', UserActivityController]);
})();
