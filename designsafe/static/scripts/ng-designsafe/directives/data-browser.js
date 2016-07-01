(function(window, angular, $, _) {
  "use strict";

  var module = angular.module('ng.designsafe', ['ngSanitize', 'ng.modernizr']);
  
  module.directive('dsDataBrowser', ['Logging', function(Logging) {
    var logger = Logging.getLogger('ngDesignSafe.dsDataBrowser');

    return {
      restrict: 'E',
      transclude: true,
      replace: true,
      templateUrl: '/static/scripts/ng-designsafe/html/directives/data-browser.html',
      scope: {
        user: '=',
        data: '=data',  /* the data to initialize the data browser with; available keys are ['listing', 'resource', 'fileId'] */
        state: '=state', /* the state to initialize the data browser: ['loading: false, listingError: false, selecting: false, selected: [], search: false */
        onPathChanged: '&onPathChanged',
        onResourceChanged: '&onResourceChanged'
      },
      controller: ['$scope', '$element', '$q', '$uibModal', 'DataService', 'UserService', function($scope, $element, $q, $uibModal, DataService, UserService) {

        var self = this;

        /**
         * Checks that the user has the requested permission on all files passed.
         * @param {string} permission the permission to check for: read, write, execute
         * @param {Array} files an array of files to check
         * @return {boolean} Whether the user has the permission on all files.
         */
        self.hasPermission = function (permission, files) {
          return _.reduce(files, function(memo, file) {
            var filePem = _.findWhere(file._pems, {username: $scope.user});
            var pem = filePem && filePem.permission[permission];
            if (memo !== null) {
              pem = memo && pem;
            }
            return pem;
          }, null);
        };

        self.getIconClass = function(file, hover) {
          if ($scope.state.selecting || hover) {
            if (_.contains($scope.state.selected, file.id)) {
              return 'fa-check-circle';
            } else {
              return 'fa-circle-o';
            }
          }
          return DataService.getIcon(file.type, file.ext);
        };

        self.selectAll = function() {
          if ($scope.state.selectAll) {
            self.clearSelection();
          } else {
            $scope.state.selected = _.pluck($scope.data.listing.children, 'id');
            $scope.state.selectAll = $scope.state.selecting = true;
          }
        };

        self.toggleSelectFile = function(file) {
          if (_.contains($scope.state.selected, file.id)) {
            $scope.state.selected = _.without($scope.state.selected, file.id);
          } else {
            $scope.state.selected.push(file.id);
          }

          if ($scope.state.selected.length === 0) {
            self.clearSelection();
          } else {
            $scope.state.selecting = true;
            $scope.state.selectAll = false;
          }
        };

        self.clearSelection = function() {
          $scope.state.selected = [];
          $scope.state.selectAll = $scope.state.selecting = false;
        };

        self.selectedFiles = function() {
          return _.filter($scope.data.listing.children, function(file) {
            return _.contains($scope.state.selected, file.id);
          });
        };

        self.createFolder = function() {
          var instance = $uibModal.open({
            templateUrl: '/static/scripts/ng-designsafe/html/directives/data-browser-create-folder.html',
            controller: ['$scope', '$uibModalInstance', function($scope, $uibModalInstance) {
              $scope.form = {
                folderName: 'Untitled_folder'
              };

              $scope.doCreateFolder = function($event) {
                $event.preventDefault();
                $uibModalInstance.close($scope.form.folderName);
              };

              $scope.cancel = function () {
                $uibModalInstance.dismiss('cancel');
              };
            }]
          });

          instance.result.then(function(folderName) {
            $scope.state.loading = true;
            DataService.mkdir({
              file_id: $scope.data.listing.id,
              resource: $scope.data.listing.source,
              dir_name: folderName
            }).then(function(resp) {
              $scope.data.listing.children.push(resp.data);
              $scope.state.loading = false;
            }, function(err) {
              $scope.$emit('designsafe:notify', {
                level: 'warning',
                message: 'Unable to create directory: ' + err.data.message
              });
              logger.error(err);
              $scope.state.loading = false;
            });
          });
        };

        self.shareFilesDialog = function(file) {
          var instance = $uibModal.open({
            templateUrl: '/static/scripts/ng-designsafe/html/directives/data-browser-share-files.html',
            controller: ['$scope', '$uibModalInstance', 'file', 'user', function($scope, $uibModalInstance, file, user) {

              $scope.data = {
                title: 'Share files',
                file: file,
                current_user: user,
                permissions: [
                  {permission: 'READ', label: 'Read Only'},
                  {permission: 'READ_WRITE', label: 'Read/Write'},
                  {permission: 'ALL', label: 'All'},
                  {permission: null, label: 'None (Revoke Permission)'}
                ]
              };

              $scope.form = {
                add_user: null,
                add_permission: $scope.data.permissions[0],
                permissions: []
              };
              
              /* Initialize form with current permissions */
              _.each(file._pems, function(pem) {
                // Can't edit own or ds_admin pems
                if (pem.username === 'ds_admin' || pem.username === user.username) {
                  return;
                }
                var formPem = {username: pem.username};
                if (pem.permission.read && pem.permission.write && pem.permission.execute) {
                  formPem.permission = $scope.data.permissions[2];
                } else if (pem.permission.read && pem.permission.write) {
                  formPem.permission = $scope.data.permissions[1];
                } else if (pem.permission.read) {
                  formPem.permission = $scope.data.permissions[0];
                } else {
                  formPem.permission = $scope.data.permissions[3];
                }
                $scope.form.permissions.push(formPem);
              });

              $scope.searchUsers = function(q) {
                return UserService.search({q: q})
                  .then(function(resp) {
                    return resp.data;
                  });
              };

              $scope.formatSelection = function() {
                if ($scope.form.add_user) {
                  return $scope.form.add_user.first_name +
                    ' ' + $scope.form.add_user.last_name +
                    ' (' + $scope.form.add_user.username + ')' +
                    ' <' + $scope.form.add_user.email + '>';
                }
              };

              $scope.addNewPermission = function() {
                if ($scope.form.add_user && $scope.form.add_user.username) {
                  $scope.form.permissions.push({
                    username: $scope.form.add_user.username,
                    permission: $scope.form.add_permission
                  });
                  $scope.form.add_user = null;
                }
              };

              $scope.doShareFiles = function($event) {
                $event.preventDefault();
                if ($scope.form.add_user && $scope.form.add_user.username) {
                  // User added someone, but didn't click "+"
                  $scope.addNewPermission();
                }
                $uibModalInstance.close($scope.form.permissions);
              };

              $scope.cancel = function () {
                $uibModalInstance.dismiss('cancel');
              };
            }],
            size: 'lg',
            resolve: {
              file: file,
              user: {username: $scope.user}
            }
          });

          // /**
          //  * Modal promise callback
          //  * @param {Object[]} permissions the sharing parameters
          //  * @param {string} permissions[].username the username of the user to share with
          //  * @param {object} permissions[].permission the permission model to grant
          //  * @param {object} permissions[].permission.permission the permission to grant: READ, READ_WRITE, or ALL
          //  */
          instance.result.then(function (permissions) {
            $scope.state.loading = true;
            $scope.file = file;
            self.clearSelection();
            $scope.pems_to_update = [];

            _.each(permissions, function(pem){
              var pems = _.find($scope.file._pems, function(o){ 
                                    return o.username == pem.username; });
              if (!pems){
                $scope.pems_to_update.push({'user_to_share': pem.username,
                                    'permission': pem.permission.permission});
              } else {
                var p = pems.permission;
                var pem_to_add =  {'user_to_share':pem.username,
                      'permission': pem.permission.permission};
                if(pem.permission.permission == 'READ' &&
                  !(p.read && !p.write && !p.execute)){
                  $scope.pems_to_update.push(pem_to_add);
                }
                else if (pem.permission.permission == 'READ_WRITE' &&
                  !(p.read && p.write && !p.execute)){
                  $scope.pems_to_update.push(pem_to_add); 
                }
                else if (pem.permission.permission == 'ALL' &&
                  !(p.read && p.write && p.execute)){
                  $scope.pems_to_update.push(pem_to_add);
                }
                else if (pem.permission.permission === null &&
                  !(!p.read && p.write && p.execute)){
                  pem_to_add.permission = 'NONE';
                  $scope.pems_to_update.push(pem_to_add);
                }
              }
            });
            DataService.share({
              resource: file.source,
              file_id: file.id,
              permissions: $scope.pems_to_update
            }).then(
              function(resp) {
                $scope.state.loading = false;
                //Get the file from scope or else it might not be the same reference.
                var listingFile = _.findWhere($scope.data.listing.children, {id: $scope.file.id});
                listingFile._pems = resp.data._pems; /* update pems for current file */
                $scope.$emit('designsafe:notify', {
                  level: 'info',
                  message: 'Sharing settings for <b>' + file.name + '</b> were updated.'
                });
              },
              function(errors) {
                $scope.state.loading = false;
                logger.error(errors);
                $scope.$emit('designsafe:notify', {
                  level: 'warning',
                  message: 'There were some errors updating the sharing settings for <b>' + file.name + '</b>. Please try again.'
                });
              }
            );
          });
        };

        self.uploadFiles = function(uploadDestination, directoryUpload, initialFiles) {
          $uibModal.open({
            templateUrl: '/static/scripts/ng-designsafe/html/directives/data-browser-upload.html',
            controller: function ($scope, $q, $uibModalInstance, Modernizr, DataService, uploadDestination, directoryUpload, initialFiles) {

              $scope.data = {
                destination: uploadDestination,
                selectedFiles: initialFiles || []
              };

              $scope.state = {
                uploading: false,
                progress: {},
                directoryUpload: directoryUpload,
                directoryUploadSupported: Modernizr.fileinputdirectory
              };

              var nicePath = _.pluck(uploadDestination._trail, 'name');
              $scope.data.destinationNicePath = nicePath.join('/') + '/' + uploadDestination.name;

              $scope.$watch('data.selectedFiles', function(newValue) {
                $scope.state.progress = {};
                _.each(newValue, function(val, i) {
                  $scope.state.progress[i] = {
                    state: 'pending',
                    promise: null
                  };
                });
              });

              $scope.upload = function() {
                $scope.state.uploading = true;
                var tasks = [];
                _.each($scope.data.selectedFiles, function(file, i) {
                  $scope.state.progress[i].state = 'uploading';

                  var formData = new window.FormData();
                  formData.append('file', file);
                  if (file.webkitRelativePath) {
                    formData.append('relative_path', file.webkitRelativePath);
                  }

                  $scope.state.progress[i].promise = DataService.upload({
                    resource: $scope.data.destination.source,
                    file_id: $scope.data.destination.id,
                    data: formData
                  });

                  tasks.push(
                    $scope.state.progress[i].promise.then(
                      function (resp) {
                        $scope.state.progress[i].state = 'success';
                        return $q.resolve({status: 'success', index: i, original: resp});
                      },
                      function (err) {
                        $scope.state.progress[i].state = 'error';
                        return $q.resolve({status: 'error', index: i, original: err});
                      }
                    )
                  );
                });

                $q.all(tasks).then(
                  function(values) {
                    self.browseFile({
                      resource: $scope.data.destination.source,
                      file_id: $scope.data.destination.id
                    });
                    $scope.state.uploading = false;
                  }
                );
              };

              $scope.cancel = function() {
                $uibModalInstance.dismiss('cancel');
              };
            },
            size: 'lg',
            resolve: {
              uploadDestination: uploadDestination,
              directoryUpload: directoryUpload,
              initialFiles: initialFiles
            }
          });
        };

        self.displayPreview = function(parentFile, previewFile) {
          $uibModal.open({
            templateUrl: '/static/scripts/ng-designsafe/html/directives/data-browser-preview.html',
            controller: function($scope, $sce, $uibModalInstance, DataService, parentFile, previewFile) {
              $scope.data = {
                parent: parentFile,
                file: previewFile
              };

              $scope.data.actions = {
                share: self.hasPermission('write', [previewFile]),
                copy: self.hasPermission('read', [previewFile]),
                move: self.hasPermission('write', [parentFile, previewFile]),
                rename: self.hasPermission('write', [previewFile]),
                trash: self.hasPermission('write', [parentFile, previewFile]),
                metadata: self.hasPermission('read', [previewFile])
              };

              $scope.data.previewUrl = {loading: true};
              DataService.preview({resource: previewFile.source, file_id: previewFile.id}).then(
                function(resp) {
                  $scope.data.previewUrl.loading = false;
                  if (resp.data) {
                    $scope.data.previewUrl.href = $sce.trustAs('resourceUrl', resp.data.href);
                  } else {
                    $scope.data.previewUrl.href = false;
                  }
                },
                function() {
                  $scope.data.previewUrl.loading = false;
                  $scope.data.previewUrl.href = false;
                });

              $scope.data.downloadUrl = {loading: true};
              DataService.download({resource: previewFile.source, file_id: previewFile.id}).then(
                function(resp) {
                  $scope.data.downloadUrl.loading = false;
                  if (resp.data) {
                    $scope.data.downloadUrl.href = $sce.trustAs('resourceUrl', resp.data.href);
                  } else {
                    $scope.data.downloadUrl.href = false;
                  }
                },
                function() {
                  $scope.data.downloadUrl.loading = false;
                  $scope.data.downloadUrl.href = false;
                });

              $scope.cancel = function () {
                $uibModalInstance.dismiss('cancel');
              };

              $scope.shareFile = function() {
                $scope.cancel();
                self.shareFilesDialog(previewFile);
              };

              $scope.copyFile = function() {
                $scope.cancel();
                self.copyFilesDialog([previewFile]);
              };

              $scope.moveFile = function() {
                $scope.cancel();
                self.moveFilesDialog([previewFile]);
              };

              $scope.renameFile = function() {
                $scope.cancel();
                self.renameFile(previewFile);
              };

              $scope.trashFile = function() {
                $scope.cancel();
                self.trashFiles([previewFile]);
              };

              $scope.metadataFile = function() {
                $scope.cancel();
                self.metadataDialog(previewFile);
              };
            },
            size: 'lg',
            resolve: {parentFile: parentFile, previewFile: previewFile}
          });
        };

        self.metadataDialog = function(file) {
          var dialog = $uibModal.open({
            templateUrl: '/static/scripts/ng-designsafe/html/directives/data-browser-metadata.html',
            controller: ['$scope', '$uibModalInstance', function($scope, $uibModalInstance) {
              $scope.form = {
                keywords: '',
                tagsToDelete:[]
              };
              $scope.data =  {
                title: 'Metadata.',
                metadata: file.meta,
                file: file
              };

              $scope.saveMeta = function($event) {
                $event.preventDefault();
                $uibModalInstance.close($scope.form);
              };
              
              $scope.isMarkedDeleted = function(tag){
                return $scope.form.tagsToDelete.indexOf(tag) > -1;
              };

              $scope.toggleTag = function(tag){
                var id = $scope.form.tagsToDelete.indexOf(tag);
                if (id > -1){
                  $scope.form.tagsToDelete.splice(id, 1);
                } else {
                  $scope.form.tagsToDelete.push(tag);
                }
              };

              $scope.cancel = function () {
                $uibModalInstance.dismiss('cancel');
              };
            }]
          });

          dialog.result.then(function(form) {
            $scope.state.loading = true;
            $scope.file = file;
            var meta_obj = {
                keywords: file.meta.keywords
                };
            if (form.keywords) {
              meta_obj.keywords = meta_obj.keywords.concat(form.keywords.split(','));
            }
            if (form.tagsToDelete.length){
              meta_obj.keywords = meta_obj.keywords.filter(function(value){
                return form.tagsToDelete.indexOf(value) < 0;
              });
            }
            DataService.updateMeta({
              file_id: file.id,
              resource: file.source,
              meta_obj: meta_obj
            }).then(function(resp) {
              $scope.state.loading = false;
              self.clearSelection();
              //Get the file from scope or else it might not be the same reference.
              var listingFile = _.findWhere($scope.data.listing.children, {id: $scope.file.id});
              _.extend(listingFile, resp.data);
            }, function(err) {
              $scope.$emit('designsafe:notify', {
                level: 'warning',
                message: 'Unable to update metadata: ' + err.data.message
              });
              logger.error(err);
              $scope.state.loading = false;
            });
          });
        };

        self.moveFilesDialog = function(filesToMove) {
          var dialog = $uibModal.open({
            templateUrl: '/static/scripts/ng-designsafe/html/directives/data-browser-select-destination.html',
            controller: 'SelectDestinationModalCtrl',
            resolve: {
              data: {
                title: 'Select the destination to move selected files.',
                sources: _.filter($scope.data.sources, {}),
                currentSource: $scope.data.currentSource,
                listing: $scope.data.listing,
                user: $scope.user
              }
            }
          });
          dialog.result.then(function(destination) {
            self.clearSelection();
            var defaultOpts = {
              dest_file_id: destination.id,
              dest_resource: destination.source
            };
            _.each(filesToMove, function(f) {
              var opts = _.extend({src_file_id: f.id, src_resource: f.source}, defaultOpts);
              self.moveFile(opts);
            });
          });
        };

        self.moveFile = function(options) {
          var sourceEl = $('tr[data-file-id="' + options.src_file_id + '"]', $element);
          sourceEl.addClass('ds-data-browser-processing');
          return DataService.move(options).then(
            function (resp) {
              $scope.$emit('designsafe:notify', {
                level: 'info',
                message: 'Moved "' + resp.data.name + '" to "' + options.dest_file_id + '".'
              });
              self.clearSelection();
              sourceEl.addClass('ds-data-browser-processing-success');
              sourceEl.animate({'opacity': 0}, 250).promise().then(function () {
                $scope.data.listing.children = _.reject($scope.data.listing.children, function (child) {
                  return child.id === options.src_file_id;
                });
                $scope.$apply();
              });
              return resp;
            },
            function (err) {
              logger.error(err);

              $scope.$emit('designsafe:notify', {
                level: 'warning',
                message: 'Failed to move file: ' + err.data.message
              });

              sourceEl.addClass('ds-data-browser-processing-danger');

              setTimeout(function() {
                sourceEl.removeClass('ds-data-browser-processing ds-data-browser-processing-danger');
              }, 3000);
            }
          );
        };

        self.copyFilesDialog = function(filesToCopy) {
          var dialog = $uibModal.open({
            templateUrl: '/static/scripts/ng-designsafe/html/directives/data-browser-select-destination.html',
            controller: 'SelectDestinationModalCtrl',
            resolve: {
              data: {
                title: 'Select the destination to copy selected files.',
                sources: $scope.data.sources,
                currentSource: $scope.data.currentSource,
                listing: $scope.data.listing,
                user: $scope.user
              }
            }
          });
          dialog.result.then(function(destination) {
            self.clearSelection();
            var defaultOpts = {
              dest_file_id: destination.id,
              dest_resource: destination.source
            };
            _.each(filesToCopy, function(f) {
              var opts = _.extend({src_file_id: f.id, src_resource: f.source}, defaultOpts);
              self.copyFile(opts);
            });
          });
        };

        self.copyFile = function(options) {
          var sourceEl = $('tr[data-file-id="' + options.src_file_id + '"]', $element);
          sourceEl.addClass('ds-data-browser-processing');
          DataService.copy(options).then(
            function (resp) {
              $scope.$emit('designsafe:notify', {
                level: 'info',
                message: 'Copied "' + resp.data.name + '" to "' + options.dest_file_id + '".'
              });
              self.clearSelection();
              sourceEl.addClass('ds-data-browser-processing-success');
              setTimeout(function() {
                sourceEl.removeClass('ds-data-browser-processing ds-data-browser-processing-success');
              }, 3000);
            },
            function (err) {
              logger.error(err);

              $scope.$emit('designsafe:notify', {
                level: 'warning',
                message: 'Failed to copy file: ' + err.data.message
              });

              sourceEl.addClass('ds-data-browser-processing-danger');
              setTimeout(function() {
                sourceEl.removeClass('ds-data-browser-processing ds-data-browser-processing-danger');
              }, 3000);
            }
          );
        };

        self.renameFile = function(file) {
          var instance = $uibModal.open({
            templateUrl: '/static/scripts/ng-designsafe/html/directives/data-browser-rename.html',
            controller: ['$scope', '$uibModalInstance', 'file', function($scope, $uibModalInstance, file) {
              $scope.form = {
                targetName: file.name
              };
              $scope.file = file;

              $scope.doRenameFile = function($event) {
                $event.preventDefault();
                $uibModalInstance.close($scope.form.targetName);
              };

              $scope.cancel = function () {
                $uibModalInstance.dismiss('cancel');
              };
            }],
            resolve: {
              file: file
            }
          });

          instance.result.then(function(targetName) {
            $scope.state.loading = true;
            $scope.file = file;
            DataService.rename({
              file_id: file.id,
              resource: file.source,
              target_name: targetName
            }).then(function(resp) {
              $scope.$emit('designsafe:notify', {
                level: 'info',
                message: 'Renamed "' + file.name + '" to "' + targetName + '".'
              });
              $scope.state.loading = false;
              self.clearSelection();  
              //Get the file from scope or else it might not be the same reference.
              var listingFile = _.findWhere($scope.data.listing.children, {id: $scope.file.id});
              _.extend(listingFile, resp.data);
            }, function(err) {
                $scope.$emit('designsafe:notify', {
                level: 'warning', 
                message: 'Failed to rename file: ' + err.data.message
                });

              logger.error(err);
              $scope.state.loading = false;
            });
          });
        };

        self.trashFiles = function(filesToTrash) {
          self.clearSelection();
          _.each(filesToTrash, function(file) {
            var fileEl = $('tr[data-file-id="' + file.id + '"]');
            fileEl.addClass('ds-data-browser-processing');
            DataService.trash({file_id: file.id, resource: file.source}).then(
              function(resp) {
                var message = '"' + file.name + '" moved to trash.';
                if (resp.data.name !== file.name) {
                  message += ' (Renamed to "' + resp.data.name + '".)';
                }
                $scope.$emit('designsafe:notify', {level: 'info', message: message});
                $scope.data.listing.children = _.reject($scope.data.listing.children, function (child) {
                  return child.id === file.id;
                });
              },
              function(err) {
                $scope.$emit('designsafe:notify', {
                  level: 'warning',
                  message: 'Unable to move "' + file.name + '" to trash: ' + err.data.message
                });

                logger.error(err);
                fileEl.addClass('ds-data-browser-processing-danger');
                setTimeout(function() {
                  fileEl.removeClass('ds-data-browser-processing ds-data-browser-processing-danger');
                }, 3000);
              }
            );

          });
        };

        self.emptyTrash = function(filesToEmpty) {
          self.clearSelection();
          _.each(filesToEmpty, function(file) {
            var fileEl = $('tr[data-file-id="' + file.id + '"]');
            fileEl.addClass('ds-data-browser-processing');
            DataService.delete({file_id: file.id, resource: file.source}).then(
              function() {
                $scope.$emit('designsafe:notify', {
                  level: 'info',
                  message: 'Deleted "' + file.name + '".'
                });
                $scope.data.listing.children = _.reject($scope.data.listing.children, function (child) {
                  return child.id === file.id;
                });
              },
              function(err) {
                $scope.$emit('designsafe:notify', {
                  level: 'warning',
                  message: 'Unable to delete "' + file.name + '": ' + err.data.message
                });
                logger.error(err);
                fileEl.addClass('ds-data-browser-processing-danger');
                setTimeout(function() {
                  fileEl.removeClass('ds-data-browser-processing ds-data-browser-processing-danger');
                }, 3000);
              }
            );
          });
        };

        /**
         * Preview File-like object.
         * @param file {object} the file-like object to preview
         */
        self.previewFile = function(file) {
          $scope.state.loading = true;
          DataService.listPath({resource: file.source, file_id: file.id}).then(
            function(resp) {
              self.displayPreview($scope.data.listing, resp.data);
              $scope.state.loading = false;
            },
            function(err) {
              $scope.$emit('designsafe:notify', {
                level: 'warning',
                message: 'Unable to preview file: ' + err.data.message
              });
              logger.error(err);
              $scope.state.loading = false;
            }
          );
        };

        /**
         * Initiate a file download
         * @param file {object} the file-like object to download.
         * @param file.id {string} the file id
         * @param file.name {string} the file name
         * @param file.source {string} the resource the file is sourced from
         */
        self.downloadFile = function(file) {
          DataService.download({resource: file.source, file_id: file.id}).then(
            function(resp) {
              var link = document.createElement('a');
              link.style.display = 'none';
              link.setAttribute('href', resp.data.href);
              link.setAttribute('download', null);
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            },
            function(err) {
              logger.error(err);
              $scope.$emit('designsafe:notify', {
                level: 'warning',
                message: 'Unable to download "' + file.name + '": ' + err.data.message
              });
            });
        };

        /**
         *
         */
        self.reindexCurrentListing = function() {
          $scope.state.loading = true;
          var opts = {
            resource: $scope.data.listing.source,
            file_id: $scope.data.listing.id,
            reindex: true,
            index_pems: true
          };
          return DataService.listPath(opts).then(
            function(resp) {
              $scope.state.loading = false;
              $scope.data.listing = resp.data;
            },
            function(err) {
              logger.error(err);
              $scope.$emit('designsafe:notify', {
                level: 'warning',
                message: 'Unable to refresh file index: ' + err.data.message
              });
            }
          );
        };

        /**
         * Browse to a file_id and list its contents.
         * @param options {object}
         * @oaram options.resource {string} the resource to browse
         * @oaram options.file_id {string} the file_id to browse
         * @returns {Promise}
         */
        self.browseFile = function(options) {
          self.clearSelection();
          $scope.state.listingError = false;
          $scope.state.loading = true;
          $scope.state.page = 0;
          $scope.state.reachedEnd = false;
          options = options || {};
          return DataService.listPath(options).then(
            function(response) {
              $scope.state.loading = false;
              $scope.data.listing = response.data;
              $scope.state.search = false;

              var handler = $scope.onPathChanged();
              if (handler) {
                handler($scope.data.listing);
              }
            },
            function(error) {
              var handler = $scope.onPathChanged();
              $scope.state.loading = false;
              $scope.data.listing = error.data;
              $scope.state.search = false;
              
              if (handler) {
                handler($scope.data.listing);
              }

              if (error.status === 403) {
                // access denied
                if ($scope.data.user === 'AnonymousUser') {
                  $scope.data.listing._error.message =
                    $scope.data.listing._error.message || 'Please log in to access this resource.';
                } else {
                  $scope.data.listing._error.message =
                    $scope.data.listing._error.message || 'You do not have access to view that resource.';
                }
                $scope.$emit('designsafe:notify', {
                  level: 'warning',
                  title: 'Access Denied',
                  message: $scope.data.listing._error.message
                });
              } else {
                logger.error(error);

                var defaultMessage = 'We are unable to display the data you requested. ' +
                    'If you feel that this is in error, please ' +
                    '<a href="/help">submit a support ticket</a>.';

                $scope.data.listing._error.message =
                  $scope.data.listing._error.message || defaultMessage;

                $scope.$emit('designsafe:notify', {
                  level: 'error',
                  title: 'Unable to display data listing',
                  message: $scope.data.listing._error.message
                });
              }
            }
          );
        };

        self.search = function(q, fields){
          fields = fields || [];
          $scope.state.loading = true;
          $scope.state.search = true;
          $scope.state.page = 0;
          $scope.state.reachedEnd = false;
          $scope.state.searchFields = fields;
          $scope.state.searchQ = q;
          return DataService.search($scope.data.listing.source, q, fields).then(
            function(response){
              $scope.state.loading = false;
              $scope.data.listing = response.data;

              var handler = $scope.onPathChanged();
              if (handler) {
                handler($scope.data.listing);
              }
            },
            function(error) {
              $scope.state.loading = false;
              logger.error(error);
            }
          );
        };

        self.scrollToBottom = function(el, pos){
          if($scope.state.loadingMore || $scope.state.reachedEnd){
            return;
          }
          if($scope.state.page){
            $scope.state.page += 1;
          } else {
            $scope.state.page = 1;
          }
          $scope.state.loadingMore = true;
          if (!$scope.state.search){
            DataService.listPath({resource: $scope.data.listing.source,
                                  file_id: $scope.data.listing.id,
                                  page: $scope.state.page}).then(
              function(response){
                var children = $scope.data.listing.children;
                var moreChildren = [];
                if (response.data.children){
                  moreChildren = response.data.children;
                }
                $scope.data.listing.children = children.concat(moreChildren);

                if (moreChildren.length < 100){
                  $scope.state.reachedEnd = true;
                }    
                $scope.state.loadingMore = false;
              },
              function(error){
                logger.error(error);
                $scope.state.page -= 1;
                $scope.state.loadingMore = false;
                $scope.state.reachedEnd = true;
              }
            );
          } else {
            DataService.search($scope.data.listing.source, 
                               $scope.state.searchQ, 
                               $scope.state.searchFields,
                               $scope.state.page).then(
              function(response){
                var children = $scope.data.listing.children;
                var moreChildren = response.data.children;
                $scope.data.listing.children = children.concat(moreChildren);
                if (moreChildren.length < 100){
                  $scope.state.reachedEnd = true;
                }
                $scope.state.loadingMore = false;
              },
              function(error) {
                $scope.state.page -= 1;
                $scope.state.loadingMore = false;
                $scope.state.reachedEnd = true;
                logger.error(error);
              }
            );
          }
        };

        self.scrollToTop = function(el, pos){
          return;
        };

        if (! $scope.data.listing) {
          self.browseFile({});
        }
      }]
    };
  }]);

  module.directive('dsDataBrowserNew', [function() {

    return {
      require: '^^dsDataBrowser',
      restrict: 'E',
      replace: true,
      templateUrl: '/static/scripts/ng-designsafe/html/directives/data-browser-new.html',
      scope: {},
      link: function(scope, element, attrs, dbCtrl) {
        scope.state = scope.$parent.$parent.state;
        scope.data = scope.$parent.$parent.data;

        scope.newFileEnabled = function() {
          return dbCtrl.hasPermission('write', [scope.data.listing]);
        };

        scope.createFolder = function() { dbCtrl.createFolder(); };
        scope.uploadFiles = function() { dbCtrl.uploadFiles(scope.data.listing, false); };
        scope.uploadFolders = function() { dbCtrl.uploadFiles(scope.data.listing, true); };
      }
    };
  }]);

  module.directive('dsDataBrowserSourceSelect', [function() {

    return {
      require: '^^dsDataBrowser',
      restrict: 'E',
      replace: true,
      templateUrl: '/static/scripts/ng-designsafe/html/directives/data-browser-source-select.html',
      scope: {
        widget: '@'
      },
      link: function(scope, element, attrs, dbCtrl) {
        scope.widget = scope.widget || 'list';
        scope.state = scope.$parent.$parent.state;
        scope.data = scope.$parent.$parent.data;

        scope.getSourcePath = function (source) {
          return _.compact([source.resource, source.defaultPath]).join('/') + '/';
        };

        scope.selectSource = function($event, source) {
          $event.preventDefault();
          scope.data.currentSource = source;
          dbCtrl.browseFile({resource: source.resource, file_id: source.defaultPath});
        };
      }
    };
  }]);

  module.directive('dsDataBrowserToolbar', ['$uibModal', 'Logging', function($uibModal, Logging) {

    var logger = Logging.getLogger('ngDesignSafe.dsDataBrowserToolbar');

    return {
      require: '^^dsDataBrowser',
      restrict: 'E',
      replace: true,
      templateUrl: '/static/scripts/ng-designsafe/html/directives/data-browser-toolbar.html',
      scope: {},
      link: function(scope, element, attrs, dbCtrl) {
        scope.state = scope.$parent.$parent.state;
        scope.data = scope.$parent.$parent.data;
        scope.clearSelection = dbCtrl.clearSelection;
        
        scope.selectTrail = function($event, trailItem) {
          $event.preventDefault();
          dbCtrl.browseFile({resource: trailItem.source, file_id: trailItem.id});
        };
        
        scope.downloadEnabled = function() {
          return true;
        };

        scope.metadataEnabled = function() {
          return scope.state.selected.length === 1;
        };

        scope.previewEnabled = function() {
          return scope.state.selected.length === 1;
        };

        scope.renameEnabled = function() {
          return dbCtrl.hasPermission('write', dbCtrl.selectedFiles()) &&
            scope.state.selected.length === 1;
        };

        scope.shareEnabled = function() {
          return scope.data.currentSource.id === 'mydata' &&
            scope.state.selected.length === 1;
        };

        scope.moveEnabled = function() {
          return dbCtrl.hasPermission('write', [scope.data.listing]);
        };

        scope.copyEnabled = function() {
          return dbCtrl.hasPermission('read', dbCtrl.selectedFiles());
        };

        scope.moveToTrashEnabled = function() {
          return dbCtrl.hasPermission('write', dbCtrl.selectedFiles()) &&
            scope.data.listing.name !== '.Trash';
        };

        scope.emptyTrashEnabled = function() {
          return dbCtrl.hasPermission('write', dbCtrl.selectedFiles()) &&
            scope.data.listing.name === '.Trash';
        };

        scope.reindexingEnabled = function() {
          return scope.data.currentSource._indexed &&
            dbCtrl.hasPermission('write', [scope.data.listing]);
        };

        scope.requestReindex = function() {
          dbCtrl.reindexCurrentListing();
        };

        /**
         * Permanently deletes the selected files.
         */
        scope.emptyTrash = function() {
          if (! window.confirm('Are you sure you want to permanently delete the selected files? This cannot be undone.')) {
            return;
          }
          dbCtrl.emptyTrash(dbCtrl.selectedFiles());
        };

        /**
         * Moves the selected files to the user's trash folder
         */
        scope.trashSelected = function() {
          dbCtrl.trashFiles(dbCtrl.selectedFiles());
        };

        scope.copySelected = function() {
          dbCtrl.copyFilesDialog(dbCtrl.selectedFiles());
        };

        scope.moveSelected = function() {
          dbCtrl.moveFilesDialog(dbCtrl.selectedFiles());
        };

        scope.shareSelected = function() {
          dbCtrl.shareFilesDialog(dbCtrl.selectedFiles()[0]);
        };

        scope.downloadSelected = function() {
          _.each(dbCtrl.selectedFiles(), function(file) {
            dbCtrl.downloadFile(file);
          });
        };

        scope.previewMetadataSelected = function(){
          var file;
          if (scope.state.selected.length === 1){
            file = _.findWhere(scope.data.listing.children, {id: scope.state.selected[0]});
            dbCtrl.metadataDialog(file);
          }
        };

        scope.previewSelected = function() {
          var file;
          if (scope.state.selected.length === 1) {
            file = _.findWhere(scope.data.listing.children, {id: scope.state.selected[0]});
            dbCtrl.previewFile(file);
          }
        };

        scope.renameSelected = function() {
          var file;
          if (scope.state.selected.length === 1) {
            file = _.findWhere(scope.data.listing.children, {id: scope.state.selected[0]});
            dbCtrl.renameFile(file);
          }
        };

        scope.search = function(){
          dbCtrl.search(scope.dbSearch);
        };
      }
    };
  }]);

  module.directive('dsDataListDisplay', ['DataService', function(DataService) {

    function updateDragEl(options) {
      options = _.extend({dragging: false, action: 'move', icon: 'arrows'}, options);

      var action = options.action;
      var $el = $('.ds-drag-el');
      if ($el.length === 0) {
        $el = $('<div class="ds-drag-el">');
        $el.html('<div class="drag-action"></div><div class="drag-info"></div>');
        $el.appendTo('body');
      }

      $('.drag-action', $el).html('<i class="fa fa-' + options.icon + '"></i> ' + options.action);
      if (options.dragInfo) {
        $('.drag-info', $el).html(options.dragInfo);
      }

      if (options.dragging) {
        $el.show();
      } else {
        $el.hide();
      }
      return $el[0];
    }

    return {
      require: '^^dsDataBrowser',
      restrict: 'E',
      replace: true,
      templateUrl: '/static/scripts/ng-designsafe/html/directives/data-browser-list-display.html',
      scope: {
        enablePreview: '=preview',
        enableSelection: '=selection',
        enableColumns: '=columns',
        actionFun: '&action',
        actionCondition: '&',
        actionLabel: '@'
      },
      link: function(scope, element, attrs, dbCtrl) {

        scope.enablePreview = scope.enablePreview || true;
        scope.enableSelection = scope.enableSelection || true;
        scope.enableColumns = scope.enableColumns || ['name', 'size', 'lastModified', 'info'];

        scope.display = function(colName) {
          return _.contains(scope.enableColumns, colName);
        };

        scope.state = scope.$parent.$parent.state;
        scope.data = scope.$parent.$parent.data;
        scope.getIconClass = dbCtrl.getIconClass;
        scope.selectAll = dbCtrl.selectAll;
        scope.selectFile = dbCtrl.toggleSelectFile;
        scope.clearSelection = dbCtrl.clearSelection;
        scope.scrollToBottom = dbCtrl.scrollToBottom;
        scope.scrollToTop = dbCtrl.scrollToTop;

        scope.previewFile = function($event, file) {
          $event.stopPropagation();
          dbCtrl.previewFile(file);
        };

        scope.isFileSelected = function(file) {
          return _.contains(scope.state.selected, file.id);
        };

        scope.browseFile = function($event, file) {
          $event.preventDefault();
          $event.stopPropagation();
          if (file.type === 'folder') {
            dbCtrl.browseFile({resource: file.source, file_id: file.id});
          } else if (scope.enablePreview) {
            dbCtrl.previewFile(file);
          }
        };

        scope.dragStart = function (e, file) {
          var dragInfo = '<i class="fa ' + DataService.getIcon(file.type, file.ext) + '"></i> ' + file.name;
          var effect = e.altKey ? 'copy' : 'move';
          var dragEl = updateDragEl({
            dragging: true,
            icon: effect === 'move' ? 'arrows' : 'copy',
            action: effect,
            dragInfo: dragInfo});

          var fileURI = file.source + '://' + file.id;
          e.dataTransfer.setDragImage(dragEl, 50, 50);
          e.dataTransfer.effectAllowed = effect;
          e.dataTransfer.setData('text/json', JSON.stringify(file));
          e.dataTransfer.setData('text/uri-list', fileURI);
          e.dataTransfer.setData('text/plain', fileURI);
        };
        
        scope.dragEnter = function(e, file) {
          if (file.type === 'folder') {
            $(e.target, element).closest('tr,caption').addClass('ds-droppable');
          }
        };
        
        scope.dragLeave = function(e, file) {
          $(e.target, element).closest('tr,caption').removeClass('ds-droppable');
        };

        scope.dragOver = function(e, file) {
          if (file.type === 'folder') {
            $(e.target, element).closest('tr,caption').addClass('ds-droppable');
            e.preventDefault();
          }
        };

        scope.dragEnd = function() {
          updateDragEl();
        };

        scope.dragDrop = function(e, file) {
          if (e.dataTransfer.files.length > 0) {
            // dropping files from computer
            dbCtrl.uploadFiles(file, false, e.dataTransfer.files);
          } else {
            // in-application d-n-d
            var data = e.dataTransfer.getData('text/json');
            if (data) {
              data = JSON.parse(data);
              var source =  data.id;
              var dest = file.id;
              var dragAction = e.dataTransfer.effectAllowed;
              var opts = {
                src_resource: data.source,
                src_file_id: data.id,
                dest_resource: file.source,
                dest_file_id: file.id
              };
              if (source !== dest) {
                if (dragAction === 'move') {
                  dbCtrl.moveFile(opts);
                } else if (dragAction === 'copy') {
                  dbCtrl.copyFile(opts);
                }
              }
            }
          }
        };

        scope.browseAndPreview = function(e, file){
          if (file.type != 'folder'){
            scope.browseFile(e, file._trail[file._trail.length - 1]);
            scope.previewFile(e, file);
          } else {
            scope.browseFile(e, file);
          }
        };
      }
    };
  }]);

  module.controller('SelectDestinationModalCtrl', ['$scope', '$uibModalInstance', 'data', function($scope, $uibModalInstance, data) {

    $scope.data = data;
    $scope.dbFeat = {
      preview: false,
      selection: false,
      columns: ['name', 'action']
    };
    $scope.state = {
      loading: false,
      listingError: false,
      selecting: false,
      search: false,
      selected: false
    };

    $scope.validDestination = function (file) {
      var valid = false;
      var filePems;
      if (file.type === 'folder') {
        filePems = _.findWhere(file._pems, {username: $scope.data.user});
        valid = filePems && filePems.permission.write;
      }
      return valid;
    };

    $scope.selectDestination = function (file) {
      $uibModalInstance.close(file);
    };

    $scope.cancel = function () {
      $uibModalInstance.dismiss('cancel');
    };
  }]);
})(window, angular, jQuery, _);
