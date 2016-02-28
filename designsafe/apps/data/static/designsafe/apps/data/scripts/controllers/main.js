(function(window, angular, $) {
    "use strict";
    angular.module('FileManagerApp').controller('FileManagerCtrl', [
    '$scope', '$translate', '$cookies', 'fileManagerConfig', 'item', 'fileNavigator', 'fileUploader', '$rootScope', '$attrs',   function($scope, $translate, $cookies, fileManagerConfig, Item, FileNavigator, FileUploader, $rootScope) {
        $scope.config = fileManagerConfig;
        $scope.appName = fileManagerConfig.appName;

        $scope.reverse = false;
        $scope.predicate = ['model.type', 'model.name'];
        $scope.order = function(predicate) {
            $scope.reverse = ($scope.predicate[1] === predicate) ? !$scope.reverse : false;
            $scope.predicate[1] = predicate;
        };

        $scope.query = '';
        $scope.temp = new Item($scope.filesystem);
        $scope.fileNavigator = new FileNavigator($scope.filesystem);
        $scope.fileUploader = FileUploader;
        $scope.uploadFileList = [];
        $scope.viewTemplate = $cookies.viewTemplate || 'main-table.html';
        $scope.advSearch = {};
        $scope.dropFiles = [];
        $scope.Math = window.Math;

        $scope.onPrivateData = function(){
            if($scope.filesystem !== 'default'){
                return false;
            }
            var currentPath = $scope.fileNavigator.currentPath;
            if(currentPath[0] === 'Shared with me'){
                return false;
            }
            return true;
        };

        $scope.setTemplate = function(name) {
            $scope.viewTemplate = $cookies.viewTemplate = name;
        };

        $scope.changeLanguage = function (locale) {
            if (locale) {
                return $translate.use($cookies.language = locale);
            }
            $translate.use($cookies.language || fileManagerConfig.defaultLang);
        };

        $scope.toggleAdvSearch = function(){
            if (!$scope.advSearch.show){
                $scope.advSearch.show = true;
                return;
            }else{
                $scope.advSearch.show = $scope.advSearch.show ? false : true;
            }
        };

        $scope.search = function($event){
            var self = this;
            if ($event.keyCode != 13){
                return;
            }
            $scope.fileNavigator.search('{"all": "' + $event.currentTarget.value + '"}');
        };

        $scope.searchAdvanced = function(advSearch){
            $scope.fileNavigator.search(JSON.stringify(advSearch.form));
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

        $scope.smartClick = function(item, $event) {
            $event && $event.preventDefault();
            item.model.filesystem = $scope.filesystem;
            $rootScope.$broadcast('fileManager:select', {item: item});
            if (item.isFolder()) {
                return $scope.fileNavigator.folderClick(item);
            }else if(item.isPreviewable()){
                $scope.modal('preview');
                $scope.temp = item;
                return item.preview().catch(
                    function(data){
                        item.error = $translate.instant('error_invalid_filename');
                    }
                );
            }else{
                return item.download();
            }
            // if (item.isEditable()) {
            //     item.getContent();
            //     $scope.touch(item);
            //     return $scope.modal('edit');
            // }
        };

        $scope.modal = function(id, hide) {
            $('#' + id).modal(hide ? 'hide' : 'show');
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
                console.log('getMetadata: ', data);
            })
            .catch(function(data){
                console.log('getMetadata: ', data);
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

        $scope.updateKeywords = function(item){
            item.tempModel.metaForm.keywords = item.tempModel.metaForm.keywords.split(',');
            item.updateMetadata().then(function(){
                $scope.modal('metadata', true);
            }).catch(function(err){
                $scope.modal('metadata', true);
                console.log('Error saving metadata: ', err);
            });
        };

        $scope.delKw = function(item, kw){
            console.log('item ', item);
            var index = -1;
            for (var i = 0; i < item.tempModel.meta.keywords.length; i++){
                if(kw === item.tempModel.meta.keywords[i]){
                    index = i;
                    break;
                }
            }
            if(index > -1){
                item.tempModel.meta.keywords.splice(index, 1);
            }
            console.log('updated meta: ', item.tempModel.meta);
            if (typeof item.tempModel.metaForm === 'undefined') item.tempModel.metaForm = {};
            item.tempModel.metaForm.keywords = item.tempModel.meta.keywords;
            item.tempModel.meta.keywords = [];
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
                $scope.fileNavigator.refresh($scope.filesystem);
                $scope.modal('copy', true);
            });
        };

        $scope.compress = function(item) {
            item.compress().then(function() {
                $scope.fileNavigator.refresh($scope.filesystem);
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
                $scope.fileNavigator.refresh($scope.filesystem);
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
                $scope.fileNavigator.refresh($scope.filesystem);
                $scope.modal('delete', true);
            });
        };

        $scope.rename = function(item) {
            var tempPath = item.tempModel.path.join('/');
            var path = item.model.path.join('/');
            var samePath = tempPath === path;
            if (samePath && $scope.fileNavigator.fileNameExists(item.tempModel.name)) {
                item.error = $translate.instant('error_invalid_filename');
                return false;
            }
            if( tempPath === path){
                item.rename().then(function() {
                    $scope.fileNavigator.refresh($scope.filesystem);
                    $scope.modal('rename', true);
                });
            } else {
                item.move().then(function() {
                    $scope.fileNavigator.refresh($scope.filesystem);
                    $scope.modal('rename', true);
                });
            }
        };

        $scope.share = function(item){
            item.share(item.tempModel.userToShare).then(function(){
                $scope.fileNavigator.refresh($scope.filesystem);
                $scope.modal('share', true);
            });
        };

        $scope.createFolder = function(item) {
            var name = item.tempModel.name && item.tempModel.name.trim();
            item.tempModel.type = 'dir';
            item.tempModel.path = $scope.fileNavigator.currentPath;
            if (name && !$scope.fileNavigator.fileNameExists(name)) {
                item.createFolder().then(function() {
                    $scope.fileNavigator.refresh($scope.filesystem);
                    $scope.modal('newfolder', true);
                });
            } else {
                $scope.temp.error = $translate.instant('error_invalid_filename');
                return false;
            }
        };

        $scope.uploadFiles = function() {
            var filesToSend = [];
            if(!$scope.uploadFileList.length){
                filesToSend = $scope.dropFiles;
            } else {
                filesToSend = $scope.uploadFileList;
            }
            $scope.fileUploader.upload(filesToSend, $scope.fileNavigator.currentPath, $scope.filesystem)
            .then(function() {
                $scope.fileNavigator.refresh($scope.filesystem);
                $scope.modal('uploadfile', true);
                $scope.dropFiles = [];
                $scope.uploadFileList = [];
                $scope.$applu();
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
        $scope.fileNavigator.refresh($scope.filesystem);
    }]);
})(window, angular, jQuery);
