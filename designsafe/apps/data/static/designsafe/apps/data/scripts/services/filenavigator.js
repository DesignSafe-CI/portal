(function(angular) {
    "use strict";
    angular.module('FileManagerApp').service('fileNavigator', [
        '$http', '$q', '$rootScope','fileManagerConfig', 'item', function ($http, $q, $rootScope, fileManagerConfig, Item) {

        $http.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

        var FileNavigator = function(filesystem, path) {
            this.requesting = false;
            this.searchResults = false;
            this.fileList = [];

             if (path === '/'){
              this.currentPath = [];
            } else {
              var temp = path.split('/');
              temp.splice(0,1);
              this.currentPath = temp;
            }

            this.history = [];
            this.error = '';
            this.filesystem = filesystem;
        };

        var transformFiles = function(data){
          data = JSON.parse(data);
            if (data.length){
              data.result = data.map(function(file){
                switch(file.permissions){
                  case "READ": file.rights = "r--------";
                  break;
                  case "WRITE": file.rights = "-w-------";
                  break;
                  case "EXECUTE": file.rights = "--x------";
                  break;
                  case "READ_WRITE": file.rights = "rw-------";
                  break;
                  case "READ_EXECUTE": file.rights = "r-x------";
                  break;
                  case "WRITE_EXECUTE": file.rights = "-wx------";
                  break;
                  case "EXECUTE": file.rights = "rwx------";
                  break;
                }
                file.date = file.lastModified;
                file.size = file.length;
                file.agavePath = file.agavePath;
                if (typeof file.fileType != 'undefined' && file.fileType !== null){
                    file.type = file.fileType === 'folder' ? 'dir' : 'file';
                }
                else{
                    file.type = file.type === 'dir' ? 'dir' : 'file';
                }
                return file;
              });
            }
            return data;
        };

        FileNavigator.prototype.deferredHandler = function(data, deferred, defaultMsg) {
            if (!data || typeof data !== 'object') {
                this.error = 'Bridge response error, please check the docs';
            }
            if (!this.error && data.result && data.result.error) {
                this.error = data.result.error;
            }
            if (!this.error && data.error) {
                this.error = data.error.message;
            }
            if (!this.error && defaultMsg) {
                this.error = defaultMsg;
            }
            if (this.error) {
                return deferred.reject(data);
            }
            return deferred.resolve(data);
        };

        FileNavigator.prototype.list = function() {
            //TODO: Paginate results
            var self = this;
            var deferred = $q.defer();
            var path = self.currentPath.join('/');

            var data = {params: {
                mode: "list",
                onlyFolders: false,
                path: '/' + path
            }};


            self.requesting = true;
            self.fileList = [];
            self.error = '';
            self.searchResults = false;

            var url = fileManagerConfig.baseUrl + self.filesystem + '/' + fileManagerConfig.listUrl + data.params.path;

            $http(
              {
                method: 'GET',
                url: url,
                transformResponse: transformFiles
            }).success(function(data) {
                self.deferredHandler(data, deferred);
            }).error(function(data) {
                self.deferredHandler(data, deferred, 'Unknown error listing, check the response');
            })['finally'](function(data) {
                self.requesting = false;
            });
            return deferred.promise;
        };

        FileNavigator.prototype.refresh = function() {
            var self = this;
            var path = self.currentPath.join('/');

            return self.list(self.filesystem).then(function(data) {
                $rootScope.$broadcast('angular-filemanager', self.filesystem, decodeURIComponent(path));
                self.fileList = (data.result || []).map(function(file) {
                    return new Item(file, self.currentPath, self.filesystem);
                });
                self.fileList = self.fileList.filter(function(o){
                    if(o.model.projectTitle){
                        if(o.model.projectTitle.indexOf('EMPTY PROJECT') > -1 || o.model.projectTitle.indexOf('READY FOR REUSE') > -1){
                            return false;
                        }
                        else{
                            return true;
                        }
                    }else{
                        return true;
                    }
                });
                if (!self.fakePath){
                    self.fakePath = self.fileList[0].model.fakePath().slice(0, -1).splice(1);
                }
                self.buildTree(path);
            });
        };

        FileNavigator.prototype.buildTree = function(path) {
            var self = this;
            function recursive(parent, item, path) {
                var absName = path ? (path + '/' + item.model.name) : item.model.name;
                if (parent.name.trim() && path.trim().indexOf(parent.name) !== 0) {
                    parent.nodes = [];
                }
                if (parent.name !== path) {
                    for (var i in parent.nodes) {
                        recursive(parent.nodes[i], item, path);
                    }
                } else {
                    for (var e in parent.nodes) {
                        if (parent.nodes[e].name === absName) {
                            return;
                        }
                    }
                    parent.nodes.push({item: item, name: absName, nodes: []});
                }
                parent.nodes = parent.nodes.sort(function(a, b) {
                    return a.name < b.name ? -1 : a.name === b.name ? 0 : 1;
                });
            }

            !self.history.length && self.history.push({name: path, nodes: []});
            for (var o in self.fileList) {
                var item = self.fileList[o];
                item.isFolder() && recursive(self.history[0], item, path);
            }
        };

        FileNavigator.prototype.folderClick = function(item) {
            var self = this;
            self.currentPath = [];
            if (item && item.isFolder()) {
                self.currentPath = item.model.fullPath().split('/').splice(1);
                self.fakePath = item.model.fakePath().splice(1);
            }
            self.refresh();
        };

        FileNavigator.prototype.upDir = function() {
            var self = this;
            if (self.currentPath[0] && self.currentPath[0] != 'Search Results') {
                self.currentPath = self.currentPath.slice(0, -1);
                self.fakePath = self.fakePath.slice(0, -1);
                self.refresh();
            }
            else{
                self.currentPath = [""];
                self.refresh();
            }
        };

        FileNavigator.prototype.goTo = function(index) {
            var self = this;
            self.currentPath = self.currentPath.slice(0, index + 1);
            self.fakePath = self.fakePath.slice(0, index + 1);
            self.refresh();
        };

        FileNavigator.prototype.fileNameExists = function(fileName) {
            var self = this;
            for (var item in self.fileList) {
                item = self.fileList[item];
                if (fileName.trim && item.model.name.trim() === fileName.trim()) {
                    return true;
                }
            }
        };

        FileNavigator.prototype.listHasFolders = function() {
            var self = this;
            for (var item in self.fileList) {
                if (self.fileList[item].model.type === 'dir') {
                    return true;
                }
            }
        };

        FileNavigator.prototype.search = function(searchTerm){
            var self = this;
            var path = '/';
            self.searchResults = true;
            self.currentPath = ["Search Results"]; 
            self.fakePath = ["Search Results"]; 
            return self.searchByTerm(searchTerm).then(function(matches){
                self.fileList = (matches || []).map(function(file){
                    var path = file.path.split('/');
                    path = self.filesystem == 'default'? path.splice(1): path;
                    path = path.filter(function(p){
                        return p.length;
                    });
                    return new Item(file, path, self.filesystem);
                });
                self.fileList = self.fileList.filter(function(o){
                    if(o.model.projectTitle){
                        if(o.model.projectTitle.indexOf('EMPTY PROJECT') > -1 || o.model.projectTitle.indexOf('READY FOR REUSE') > -1){
                            return false;
                        }
                        else{
                            return true;
                        }
                    }else{
                        return true;
                    }
                });
                self.buildTree(path);
            });
        };

        FileNavigator.prototype.searchByTerm = function(searchTerm) {
            var self = this;
            var deferred = $q.defer();
            self.currentPath = ["Search Results"]; 
            self.fakePath = ["Search Results"]; 
            var url = fileManagerConfig.baseUrl + self.filesystem + '/' + fileManagerConfig.metadataUrl + '?q=' + searchTerm;

            self.requesting = true;
            $http(
              {
                method: 'GET',
                url: url,
                transformResponse: transformFiles
              }
            ).success(function(matches) {
                self.deferredHandler(matches, deferred);
            }).error(function(data) {
                self.deferredHandler(data, deferred, 'Search Error.');
            })['finally'](function() {
                self.inprocess = false;
                self.requesting = false;
            });
            return deferred.promise;
        };

        return FileNavigator;
    }]);
})(angular);
