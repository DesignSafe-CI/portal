(function(window, angular) {
    "use strict";
    angular.module('FileManagerApp').service('fileUploader', ['$http', '$q', 'fileManagerConfig', function ($http, $q, fileManagerConfig) {

        function deferredHandler(data, deferred, errorMessage) {
            if (!data || typeof data !== 'object') {
                return deferred.reject('Bridge response error, please check the docs');
            }
            if (data.result && data.result.error) {
                return deferred.reject(data);
            }
            if (data.error) {
                return deferred.reject(data);
            }
            if (errorMessage) {
                return deferred.reject(errorMessage);
            }
            deferred.resolve(data);
        }

        this.requesting = false;
        this.upload = function(fileList, path) {

            if (! window.FormData) {
                throw new Error('Unsupported browser version');
            }
            var self = this;
            var formData = new window.FormData();
            var deferred = $q.defer();
            var path = '/' + path.join('/');
            var system = encodeURIComponent('data.iplantcollaborative.org');

            for (var i = 0; i < fileList.length; i++) {
                var fileObj = fileList.item(i);
                formData.append('fileToUpload', fileObj);
            }

            self.requesting = true;
            var url = fileManagerConfig.tenantUrl + fileManagerConfig.uploadUrl + fileManagerConfig.systemUrl + '//' + fileManagerConfig.user + path;
            $http(
              {
                method: 'POST',
                url: url,
                data: formData,
                headers: {
                  'Authorization': 'Bearer ' +  fileManagerConfig.token,
                  'accept': 'application/json',
                  "Content-Type": undefined
                }
              }
            ).success(function(data) {
                deferredHandler(data, deferred);
            }).error(function(data) {
                deferredHandler(data, deferred, 'Unknown error uploading files');
            })['finally'](function(data) {
                self.requesting = false;
            });

            return deferred.promise;
        };
    }]);
})(window, angular);
