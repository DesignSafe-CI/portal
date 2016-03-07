(function(window, angular, $) {
    "use strict";
    angular.module('FileManagerApp').factory('item', ['$http', '$q', '$translate', 'fileManagerConfig', 'chmod', function($http, $q, $translate, fileManagerConfig, Chmod) {

        var Item = function(model, path, filesystem) {
            var rawModel = {
                name: model && model.name || '',
                path: path || [],
                agavePath: model && model.agavePath || '',
                fileType: model && model.fileType || 'file',
                type: model && model.type || 'file',
                size: model && parseInt(model.size || 0),
                // date: parseMySQLDate(model && model.date),
                date: model && model.date,
                // perms: new Chmod(model && model.rights),
                perms: {},
                projectTitle: model && model.projecTitle || undefined,
                projectName: model && model.projectName || undefined,
                experimentTitle: model && model.experimentTitle || undefined,
                parentProjectTitle: model && model.parentProjecTitle || undefined,
                parentExperimentTitle: model && model.parentExperimentTitle || undefined,
                content: model && model.content || '',
                filesystem: filesystem || 'default',
                permissions: model && model.permissions || {},
                recursive: false,
                sizeKb: function() {
                    // return Math.round(this.size / 1024, 1);
                    if (isNaN(this.size)){
                        return '- ';
                    }else{
                      return (this.size / 1024).toFixed(1);
                    }
                },
                fullPath: function() {
                    if (this.path.length == 1 && this.path[0] === '/'){
                        return ('/' + this.name).replace(/\/\//g, '/');
                    }
                        return ('/' + this.path.join('/') + '/' + this.name).replace(/\/\//g, '/');
                },
                fakePath: function(){
                    //There's the possiblitiy that this does extra replaces.
                    //TODO: Use regular expressions or return this path from the server.
                    var fullPath = this.fullPath().split('/');
                    if(filesystem != 'default'){
                        if (this.projectTitle){
                            fullPath[1] = this.projectTitle;
                        }else if(this.experimentTitle){
                            fullPath[1] = this.parentProjectTitle;
                            fullPath[2] = this.experimentTitle;
                        }else{
                            fullPath[1] = this.parentProjectTitle ? this.parentProjectTitle : fullPath[1];
                            fullPath[2] = this.parentExperimentTitle ? this.parentExperimentTitle : fullPath[2];
                        }
                    }
                    return fullPath;
                }
            };

            this.error = '';
            this.inprocess = false;

            this.model = angular.copy(rawModel);
            this.tempModel = angular.copy(rawModel);

            function parseMySQLDate(mysqlDate) {
                var d = (mysqlDate || '').toString().split(/[- :]/);
                return new Date(d[0], d[1] - 1, d[2], d[3], d[4], d[5]);
            }
        };

        Item.prototype.update = function() {
            angular.extend(this.model, angular.copy(this.tempModel));
        };

        Item.prototype.revert = function() {
            angular.extend(this.tempModel, angular.copy(this.model));
            this.error = '';
        };

        Item.prototype.deferredHandler = function(data, deferred, defaultMsg) {
            if (!data || typeof data !== 'object') {
                this.error = 'There has been an error in your request. Please try again or <a href="/help">submit a ticket</a>.';
            }
            if (data.result && data.result.error) {
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
            this.update();
            return deferred.resolve(data);
        };

        Item.prototype.createFolder = function() {
            var self = this;
            var deferred = $q.defer();
            var fullPath = self.tempModel.fullPath();
            var data = {
                action: "mkdir",
                path: fullPath
            };

            self.inprocess = true;
            self.error = '';
            var parentPath = self.tempModel.fullPath().split('/');
            console.log('path: ', parentPath);
            parentPath.pop();
            parentPath = parentPath.join('/');
            var url = fileManagerConfig.baseUrl + self.model.filesystem + '/' + fileManagerConfig.createFolderUrl + parentPath;
            $http.put(url, data).success(function(data) {
                self.deferredHandler(data, deferred);
            }).error(function(data) {
                self.deferredHandler(data, deferred, data.message);
            })['finally'](function(data) {
                self.inprocess = false;
            });

            return deferred.promise;
        };

        Item.prototype.rename = function() {
            var self = this;
            var deferred = $q.defer();
            var data = {
                "action": "rename",
                "path": self.tempModel.fullPath()
            };
            self.inprocess = true;
            self.error = '';
            var url = fileManagerConfig.baseUrl + self.model.filesystem + '/' + fileManagerConfig.renameUrl + self.model.fullPath();
            $http.put(url, data).success(function(data) {
                self.deferredHandler(data, deferred);
            }).error(function(data) {
                self.deferredHandler(data, deferred, data.message);
            })['finally'](function() {
                self.inprocess = false;
            });
            return deferred.promise;
        };

        Item.prototype.move = function() {
            var self = this;
            var deferred = $q.defer();
            var data = {
                "action": "move",
                "path": self.tempModel.fullPath()
            };
            self.inprocess = true;
            self.error = '';
            var url = fileManagerConfig.baseUrl + self.model.filesystem + '/' + fileManagerConfig.moveUrl + self.model.fullPath();
            $http.put(url, data).success(function(data) {
                self.deferredHandler(data, deferred);
            }).error(function(data) {
                self.deferredHandler(data, deferred, data.message);
            })['finally'](function() {
                self.inprocess = false;
            });
            return deferred.promise;
        };

        Item.prototype.copy = function() {
            var self = this;
            var deferred = $q.defer();
            var data = {
                "action": "copy",
                "path": self.tempModel.fullPath(),
            };

            self.inprocess = true;
            self.error = '';
            var url = fileManagerConfig.baseUrl + self.model.filesystem + '/' + fileManagerConfig.copyUrl + self.model.fullPath();
            $http.put(url, data).success(function(data) {
                self.deferredHandler(data, deferred);
            }).error(function(data) {
                self.deferredHandler(data, deferred, data.message);
            })['finally'](function() {
                self.inprocess = false;
            });
            return deferred.promise;
        };

        Item.prototype.share = function(user){
            var self = this;
            var deferred = $q.defer();
            var data = {
                "action": "share",
                "user": user,
                "permission": "READ"
            };
            self.inprocess = true;
            self.error = '';
            var url = fileManagerConfig.baseUrl + self.model.filesystem + '/' + fileManagerConfig.shareUrl + self.model.fullPath();
            $http.post(url, data).success(function(data){
                self.deferredHandler(data, deferred);
            }).error(function(data){
                self.deferredHandler(data, deferred, data.message);
            })['finally'](function(){
                self.inprocess = false;
            });
            return deferred.promise;
        };

        Item.prototype.compress = function() {
            var self = this;
            var deferred = $q.defer();
            var data = {params: {
                mode: "compress",
                path: self.model.fullPath(),
                destination: self.tempModel.fullPath()
            }};

            self.inprocess = true;
            self.error = '';
            $http.post(fileManagerConfig.compressUrl, data).success(function(data) {
                self.deferredHandler(data, deferred);
            }).error(function(data) {
                self.deferredHandler(data, deferred, data.message);
            })['finally'](function() {
                self.inprocess = false;
            });
            return deferred.promise;
        };

        Item.prototype.extract = function() {
            var self = this;
            var deferred = $q.defer();
            var data = {params: {
                mode: "extract",
                path: self.model.fullPath(),
                sourceFile: self.model.fullPath(),
                destination: self.tempModel.fullPath()
            }};

            self.inprocess = true;
            self.error = '';
            $http.post(fileManagerConfig.extractUrl, data).success(function(data) {
                self.deferredHandler(data, deferred);
            }).error(function(data) {
                self.deferredHandler(data, deferred, data.message);
            })["finally"](function() {
                self.inprocess = false;
            });
            return deferred.promise;
        };

        Item.prototype.download = function(preview) {
            var self = this;
            var deferred = $q.defer();
            var path = self.model.fullPath();
            var url = fileManagerConfig.baseUrl + self.model.filesystem + '/' + fileManagerConfig.downloadFileUrl + path;
            self.requesting = true;
            self.inprocess = true;
            self.downloading = true;
            $http(
              {
                method: 'GET',
                url: url,
                cache: false
              }
            ).success(function(data) {
                if (preview){
                    previewFile(data, self);
                }else{
                    var link = document.createElement('a');
                    link.setAttribute('download', data.filename);
                    link.setAttribute('href', data.link + '?force=true');
                    link.style.display = 'none';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    //saveAs(new Blob([data]),self.model.name);
                }
                self.deferredHandler(data, deferred);
            }).error(function(data) {
                self.deferredHandler(data, deferred, data.message);
            })['finally'](function(data) {
                self.requesting = false;
                self.inprocess = false;
                self.downloading = false;
            });

            return deferred.promise;
        };

        var previewFile = function(data, item){
            item.tempModel.preview = {};
            item.tempModel.preview.url = data.link;
            item.tempModel.preview.isPdf = item.isPdf();
            item.tempModel.preview.isImage = item.isImage();
            item.tempModel.preview.isText = item.isText();
            if(!item.tempModel.preview.isImage){
                $http({
                    method: 'GET',
                    url: data.link,
                    responseType: 'arraybuffer',
                    cache: false
                }).success(function(filedata){
                    if (item.tempModel.preview.isPdf){
                      item.tempModel.preview.data = URL.createObjectURL(new Blob([filedata], {type: 'application/pdf'}));
                    } else {
                      item.tempModel.preview.data = URL.createObjectURL(new Blob([filedata]));
                    }
                }).error(function(err){
                    self.deferredHandler(err, deferred, data.message);
                });
            }
        };

        Item.prototype.preview = function() {
            var self = this;
            return self.download(true);
        };

        Item.prototype.getContent = function() {
            var self = this;
            var deferred = $q.defer();
            var data = {params: {
                mode: "editfile",
                path: self.tempModel.fullPath()
            }};

            self.inprocess = true;
            self.error = '';
            $http.post(fileManagerConfig.getContentUrl, data).success(function(data) {
                self.tempModel.content = self.model.content = data.result;
                self.deferredHandler(data, deferred);
            }).error(function(data) {
                self.deferredHandler(data, deferred, data.message);
            })['finally'](function() {
                self.inprocess = false;
            });
            return deferred.promise;
        };

        Item.prototype.remove = function() {
            var self = this;
            var deferred = $q.defer();
            var path = self.model.fullPath();
            var url = fileManagerConfig.baseUrl + self.model.filesystem + '/' + fileManagerConfig.removeUrl + path;
            self.inprocess = true;
            $http.delete(url).success(function(data) {
                self.deferredHandler(data, deferred);
            }).error(function(data) {
                self.deferredHandler(data, deferred, data.message);
            })['finally'](function(data) {
                self.requesting = false;
            });

            return deferred.promise;
        };

        Item.prototype.edit = function() {
            var self = this;
            var deferred = $q.defer();
            var data = {params: {
                mode: "savefile",
                content: self.tempModel.content,
                path: self.tempModel.fullPath()
            }};

            self.inprocess = true;
            self.error = '';

            $http.post(fileManagerConfig.editUrl, data).success(function(data) {
                self.deferredHandler(data, deferred);
            }).error(function(data) {
                self.deferredHandler(data, deferred, data.message);
            })['finally'](function() {
                self.inprocess = false;
            });
            return deferred.promise;
        };

        Item.prototype.getPermissions = function() {
          var self = this;
          var deferred = $q.defer();
          var path = self.model.fullPath();
          var url = fileManagerConfig.tenantUrl + fileManagerConfig.permissionsUrl  + fileManagerConfig.user + path;

          self.error = '';
          self.requesting = true;

          $http(
            {
              method: 'GET',
              url: url,
              headers: {
                'Authorization': 'Bearer ' +  fileManagerConfig.token,
              }
            }
          ).success(function(data) {
              _.each(data.result, function(user){
                self.tempModel.perms[user.username] = user.permission;
                self.requesting = false;
              });
              self.deferredHandler(data, deferred);
          }).error(function(data) {
              self.deferredHandler(data, deferred, data.message);
          });

          return deferred.promise;
        };

        Item.prototype.changePermissions = function() {

            var self = this;
            var path = self.model.fullPath();

            var deferred = $q.defer();

            self.error = '';

            self.requesting = true;

            _.each(self.model.perms, function(value, key){
              if (!_.isEqual(self.model.perms[key], self.tempModel.perms[key])){
                var url = fileManagerConfig.tenantUrl + fileManagerConfig.permissionsUrl  + fileManagerConfig.user + path;
                var permission;

                if (self.tempModel.perms[key].read === true){
                  permission = 'READ';
                }
                if (self.tempModel.perms[key].write === true){
                  permission = 'WRITE';
                }
                if (self.tempModel.perms[key].execute === true){
                  permission = 'EXECUTE';
                }
                if (self.tempModel.perms[key].read === true && self.tempModel.perms[key].write === true){
                  permission = 'READ_WRITE';
                }
                if (self.tempModel.perms[key].read === true && self.tempModel.perms[key].execute === true){
                  permission = 'READ_EXECUTE';
                }
                if (self.tempModel.perms[key].write === true && self.tempModel.perms[key].execute === true){
                  permission = 'WRITE_EXECUTE';
                }
                if (self.tempModel.perms[key].read === true && self.tempModel.perms[key].write === true && self.tempModel.perms[key].execute === true){
                  permission = 'ALL';
                }

                var body = {
                  username: key,
                  permission: permission,
                  recursive: false
                };

                $http(
                  {
                    method: 'POST',
                    url: url,
                    data: body,
                    headers: {
                      'Authorization': 'Bearer ' +  fileManagerConfig.token,
                    }
                  }
                ).success(function(data) {
                    _.each(data.result, function(user){
                      self.tempModel.perms[user.username] = user.permission;
                      self.requesting = false;
                    });
                    self.deferredHandler(data, deferred);
                    self.requesting = false;
                }).error(function(data) {
                    // reset permissions to Original
                    self.tempModel.perms[key] = self.model.perms[key];
                    self.requesting = false;
                    self.error = data.message;
                    self.deferredHandler(data, deferred, data.message);
                });

              }
            });
            return deferred.promise;
        };

        /*******************************
            Adding new things like metadata
        *******************************/
        Item.prototype.showMetadata = function(){
            var self = this;
            var deferred = $q.defer();
            var path = self.model.fullPath();
            self.inprocess = true;
            self.error = '';
            var url = fileManagerConfig.baseUrl + self.model.filesystem + '/' + fileManagerConfig.metadataUrl + path;
            $http.get(url).success(function(data) {
                var md = data;
                console.log('md: ', md);
                self.tempModel.meta = {};
                self.tempModel.meta.name = md.name;
                self.tempModel.meta.path = md.path;
                self.tempModel.meta.keywords = md.keywords;
                self.deferredHandler(data, deferred);
            }).error(function(data) {
                self.deferredHandler(data, deferred, data.message);
            })['finally'](function() {
                self.inprocess = false;
            });
            return deferred.promise;
        };

        Item.prototype.showPublicMetadata = function(){
           var self = this;
           var deferred = $q.defer();
           var path = self.model.fullPath();
           self.inprocess = true;
           self.error = '';
           var url = fileManagerConfig.baseUrl + self.model.filesystem + '/' + fileManagerConfig.metadataUrl + path;
           $http.get(url).success(function(data) {
               self.deferredHandler(data, deferred);
           }).error(function(data) {
               self.deferredHandler(data, deferred, data.message);
           })['finally'](function() {
               self.inprocess = false;
           });
           return deferred.promise;
       };

        Item.prototype.updateMetadata = function(){
            var self = this;
            var deferred = $q.defer();
            var path = self.model.fullPath();
            self.inprocess = true;
            self.error = '';
            if(self.tempModel.meta.keywords){
                self.tempModel.metaForm.keywords = self.tempModel.metaForm.keywords.concat(self.tempModel.meta.keywords);
            }
            var data = {
                "metadata": self.tempModel.metaForm
            };
            var url = fileManagerConfig.baseUrl + self.model.filesystem + '/' + fileManagerConfig.metadataUrl + path;
            $http.post(url,data)
            .success(function(data){
                self.deferredHandler(data, deferred);
            })
            .error(function(data){
                self.deferredHandler(data, deferred, data.message);
            })['finally'](function(){
                self.tempModel.metaForm.keywords = [];
                self.inprocess = false;
            });
            return deferred.promise;
        };

        Item.prototype.isFolder = function() {
            return this.model.type === 'dir';
        };

        Item.prototype.isEditable = function() {
            return !this.isFolder() && fileManagerConfig.isEditableFilePattern.test(this.model.name);
        };

        Item.prototype.isPreviewable = function() {
            return !this.isFolder() && (this.isImage() || this.isText() || this.isPdf());
        };

        Item.prototype.isImage = function() {
            return fileManagerConfig.isImageFilePattern.test(this.model.name);
        };

        Item.prototype.isCompressible = function() {
            return this.isFolder();
        };

        Item.prototype.isExtractable = function() {
            return !this.isFolder() && fileManagerConfig.isExtractableFilePattern.test(this.model.name);
        };

        Item.prototype.isPdf = function(){
            return !this.isFolder() && fileManagerConfig.isPdfFilePattern.test(this.model.name);
        };

        Item.prototype.isText = function(){
            return !this.isFolder() && fileManagerConfig.isTextFilePattern.test(this.model.name);
        };

        return Item;
    }]);
})(window, angular, jQuery);
