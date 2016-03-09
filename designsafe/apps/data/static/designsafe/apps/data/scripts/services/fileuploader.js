(function(window, angular) {
    "use strict";
    angular.module('FileManagerApp').service('fileUploader', ['$http', '$q', 'fileManagerConfig', function ($http, $q, fileManagerConfig) {

        function deferredHandler(data, deferred, errorMessage) {
            if (!data || typeof data !== 'object') {
                return deferred.reject('There was an error handling your rquest. Please try again.');
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
        this.filesUploaded = [];
        this.filesError = [];
        this.upload = function(fileList, path, filesystem) {

            var self = this;
            if (! window.FormData) {
                self.error = 'Unsupported browser version';
                throw new Error('Unsupported browser version');
            }
            //var formData = new window.FormData();
            var promises = [];
            var deferred = $q.defer();
            //var fileObj = {};
            path = path.join('/');
            var errFunc = function(data){
                        console.log('Error uploading: ', data);
                        self.requesting = false;
                        //self.filesError.push(name);
                        deferredHandler(data, deferred, 'Error uploadin files. Please try again.');
                    };
            var succFunc = function(data){
                console.log('Success uploading: ', data);
                self.filesUploaded.push(data.files[0].name);
            };
            self.requesting = true;
            var url = fileManagerConfig.baseUrl + filesystem + '/' + fileManagerConfig.uploadUrl + path;
            //TODO: This needs to be a better factory.
            for (var i = 0; i < fileList.length; i++) {
                var fileObj = fileList.item && fileList.item(i) || fileList[i];
                var formData = new window.FormData();
                formData.append(fileObj.name, fileObj);
                promises.push($http({
                        method: 'POST',
                        url: url,
                        data: formData,
                        headers : {'Content-Type': undefined}
                    }).success(succFunc)
                    .error(errFunc)
                    );
            }
            $q.all(promises).then(function(data){
                deferredHandler(data, deferred);
                self.requesting = false;
            });

            //$http(
            //  {
            //    method: 'POST',
            //    url: url,
            //    data: formData,
            //    headers: {'Content-Type': undefined}
            //  }
            //).success(function(data) {
            //    deferredHandler(data, deferred);
            //}).error(function(data) {
            //    deferredHandler(data, deferred, 'Unknown error uploading files');
            //})['finally'](function(data) {
            //    self.requesting = false;

            //});

            return deferred.promise;
        };
    }]);
})(window, angular);
