(function(window, angular) {
    "use strict";
    angular.module('FileManagerApp').service('fileUploader', ['$http', '$q', 'fileManagerConfig', 'logger', function ($http, $q, fileManagerConfig, logger) {

        function deferredHandler(data, deferred, errorMessage) {
            if (!data || typeof data !== 'object') {
                return deferred.reject('There was an error handling your request. Please try again.');
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
        //this.filesUploaded = [];
        this.filesError = [];
        this.dropFiles = {};
        this.b_size = 5;
        this.filesLength = function(){
            var self = this;
            var size = 0, key;
            for (key in self.dropFiles) {
                if (self.dropFiles.hasOwnProperty(key)) size++;
            }
            return size;
        };

        var batch_upload = function(deferred, promises, size){
            var self = this;
            if (!promises || !promises.length){
                deferred.resolve(promises);
                console.log('Finished');
                return;
            }
            var proms = [];
            for (var i = 0; (i < size) && (i < promises.length); i++){
                try{
                    var prom = promises[i];
                    proms.push(prom);
                }catch(e){
                    console.log('Failed ', e);
                    deferred.reject('Failed' + e);
                }
            }
            console.log('Promises: ', proms);
            $q.all(proms).then(function(result){
                    promises.splice(0, size);
                    batch_upload(deferred, promises, size);
            }, function(e){
                console.log('Failed ', e);
                deferred.reject('Failed ' + e);
            });
            return deferred.promise;
        };

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
                        logger.log('Error uploading: ', data);
                        if(data.file) logger.log('Error name: ', data.file);
                        self.requesting = false;
                        //self.filesError.push(name);
                        self.dropFiles[data.file].uploading = false;
                        self.dropFiles[data.file].success = false;
                        self.dropFiles[data.file].fail = true;
                        deferredHandler(data, deferred, 'Error uploading files. Please try again.');
                    };
            var succFunc = function(data){
                logger.log('Success uploading: ', data);
                logger.log('success name: ', data.files[0].name);
                //self.filesUploaded.push(data.files[0].name);
                self.dropFiles[data.files[0].name].uploading = false;
                self.dropFiles[data.files[0].name].success = true;
                self.dropFiles[data.files[0].name].fail = false;
            };
            self.requesting = true;
            var url = fileManagerConfig.baseUrl + filesystem + '/' + fileManagerConfig.uploadUrl + path;
            //TODO: This needs to be a better factory.
            var key;
            for (key in fileList) {
                var fileObj = fileList[key];
                var formData = new window.FormData();
                formData.append(fileObj.name, fileObj);
                self.dropFiles[fileObj.name].uploading = true;
                self.dropFiles[fileObj.name].success = false;
                self.dropFiles[fileObj.name].fail = false;
                promises.push($http({
                        method: 'POST',
                        url: url,
                        data: formData,
                        headers : {'Content-Type': undefined}
                    }).success(succFunc)
                    .error(errFunc)
                    );
            }
            batch_upload(deferred, promises, self.b_size).then(function(data){
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
