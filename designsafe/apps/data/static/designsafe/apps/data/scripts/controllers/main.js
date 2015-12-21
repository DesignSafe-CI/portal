(function(window, angular, $) {
    "use strict";
    angular.module('FileManagerApp').controller('FileManagerCtrl', [
    '$scope', '$translate', '$cookies', 'fileManagerConfig', 'item', 'fileNavigator', 'fileUploader',
    function($scope, $translate, $cookies, fileManagerConfig, Item, FileNavigator, FileUploader) {

        $scope.config = fileManagerConfig;
        $scope.appName = fileManagerConfig.appName;

        $scope.reverse = false;
        $scope.predicate = ['model.type', 'model.name'];
        $scope.order = function(predicate) {
            $scope.reverse = ($scope.predicate[1] === predicate) ? !$scope.reverse : false;
            $scope.predicate[1] = predicate;
        };

        $scope.query = '';
        $scope.temp = new Item();
        $scope.fileNavigator = new FileNavigator();
        $scope.fileUploader = FileUploader;
        $scope.uploadFileList = [];
        $scope.viewTemplate = $cookies.viewTemplate || 'main-table.html';

        $scope.setTemplate = function(name) {
            $scope.viewTemplate = $cookies.viewTemplate = name;
        };

        $scope.changeLanguage = function (locale) {
            if (locale) {
                return $translate.use($cookies.language = locale);
            }
            $translate.use($cookies.language || fileManagerConfig.defaultLang);
        };



        $scope.touch = function(item) {
            if (item instanceof Item){
              item = item;
            } else {
              item = new Item();
            }
            // item = item instanceof Item ? item : new Item();
            item.revert && item.revert();
            $scope.temp = item;
        };

        $scope.smartClick = function(item) {
            if (item.isFolder()) {
                return $scope.fileNavigator.folderClick(item);
            }
            if (item.isImage()) {
                return item.preview();
            }
            // if (item.isEditable()) {
            //     item.getContent();
            //     $scope.touch(item);
            //     return $scope.modal('edit');
            // }
        };

        $scope.modal = function(id, hide) {
            $('#' + id).modal(hide ? 'hide' : 'show')
        };

        $scope.isInThisPath = function(path) {
            var currentPath = $scope.fileNavigator.currentPath.join('/');
            return currentPath.indexOf(path) !== -1;
        };

        $scope.edit = function(item) {
            item.edit().then(function() {
                $scope.modal('edit', true);
            });
        };

        $scope.getPermissions = function (item){
          $scope.temp = item;

          item.getPermissions()
            .then(function(data) {
              // $scope.modal('changepermissions', true);
            })
            .catch(function(data){
              console.log(data);
            });
        };

        $scope.showMetadata = function (item) {
            $scope.temp = item;

            item.showMetadata()
            .then(function(data){
                console.log('getMetadata: ', data)
            })
            .catch(function(data){
                console.log('getMetadata: ', data)
            });
        };

        $scope.addKeyValueMeta = function (item){
            var key = item.tempModel.metaForm.key;
            var value = item.tempModel.metaForm.value;
            if (item.tempModel.metadata.length > 0){
                item.tempModel.metadata[0].value[key] = value;
            } else {
                var m = {};
                m.value = {};
                m.value[key] = value;
                item.tempModel.metadata.push(m);
            }
        };

        $scope.deleteKeyMeta = function(item, key){
            console.log('item: ', item);
            console.log('key: ', key);
            delete item.tempModel.metadata[0].value[key];
        };

        $scope.updateMetadata = function(item){
            item.updateMetadata().then(function(){
                $scope.modal('metadata', true);
            }).catch(function(err){
                $scope.modal('metadata', true);
                console.log('Error saving metadata: ', err);
            });
        };

        $scope.changePermissions = function(item) {
            item.changePermissions().then(function() {
                $scope.modal('changepermissions', true);
            });
        };

        $scope.copy = function(item) {
            var samePath = item.tempModel.path.join() === item.model.path.join();
            if (samePath && $scope.fileNavigator.fileNameExists(item.tempModel.name)) {
                item.error = $translate.instant('error_invalid_filename');
                return false;
            }
            item.copy().then(function() {
                $scope.fileNavigator.refresh();
                $scope.modal('copy', true);
            });
        };

        $scope.compress = function(item) {
            item.compress().then(function() {
                $scope.fileNavigator.refresh();
                if (! $scope.config.compressAsync) {
                    return $scope.modal('compress', true);
                }
                item.asyncSuccess = true;
            }, function() {
                item.asyncSuccess = false;
            });
        };

        $scope.extract = function(item) {
            item.extract().then(function() {
                $scope.fileNavigator.refresh();
                if (! $scope.config.extractAsync) {
                    return $scope.modal('extract', true);
                }
                item.asyncSuccess = true;
            }, function() {
                item.asyncSuccess = false;
            });
        };

        $scope.remove = function(item) {
            item.remove().then(function() {
                $scope.fileNavigator.refresh();
                $scope.modal('delete', true);
            });
        };

        $scope.rename = function(item) {
            var samePath = item.tempModel.path.join() === item.model.path.join();
            if (samePath && $scope.fileNavigator.fileNameExists(item.tempModel.name)) {
                item.error = $translate.instant('error_invalid_filename');
                return false;
            }
            item.rename().then(function() {
                $scope.fileNavigator.refresh();
                $scope.modal('rename', true);
            });
        };

        $scope.createFolder = function(item) {
            var name = item.tempModel.name && item.tempModel.name.trim();
            item.tempModel.type = 'dir';
            item.tempModel.path = $scope.fileNavigator.currentPath;
            if (name && !$scope.fileNavigator.fileNameExists(name)) {
                item.createFolder().then(function() {
                    $scope.fileNavigator.refresh();
                    $scope.modal('newfolder', true);
                });
            } else {
                $scope.temp.error = $translate.instant('error_invalid_filename');
                return false;
            }
        };

        $scope.uploadFiles = function() {
            $scope.fileUploader.upload($scope.uploadFileList, $scope.fileNavigator.currentPath)
            .then(function() {
                $scope.fileNavigator.refresh();
                $scope.modal('uploadfile', true);
            }, function(data) {
                var errorMsg = data.result && data.result.error || $translate.instant('error_uploading_files');
                $scope.temp.error = errorMsg;
            });
        };

        $scope.getQueryParam = function(param) {
            var found;
            window.location.search.substr(1).split("&").forEach(function(item) {
                if (param ===  item.split("=")[0]) {
                    found = item.split("=")[1];
                    return false;
                }
            });
            return found;
        };

        $scope.changeLanguage($scope.getQueryParam('lang'));
        $scope.isWindows = $scope.getQueryParam('server') === 'Windows';
        $scope.fileNavigator.refresh();
    }]);
})(window, angular, jQuery);
