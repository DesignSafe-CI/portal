(function(window, angular, $, _) {
  "use strict";

  var module = angular.module('ng.designsafe');
  
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
        onPathChanged: '&onPathChanged',
        onResourceChanged: '&onResourceChanged'
      },
      controller: ['$scope', '$element', '$uibModal', 'DataService', function($scope, $element, $uibModal, DataService) {
        
        $scope.state = {
          loading: false,
          selecting: false,
          selected: []
        };

        var self = this;

        self.hasPermission = function (permission) {
          var user_pems = _.findWhere($scope.data.listing._pems, {username: $scope.user});
          return user_pems && user_pems.permission[permission];
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

        self.createFolder = function() {
          var instance = $uibModal.open({
            templateUrl: '/static/scripts/ng-designsafe/html/directives/data-browser-create-folder.html',
            controller: ['$scope', '$uibModalInstance', 'DataService', function($scope, $uibModalInstance) {
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
              // TODO notify user mkdir errored
              logger.error(err);
              $scope.state.loading = false;
            })
          });
        };

        self.uploadFiles = function(directoryUpload) {
          $uibModal.open({
            templateUrl: '/static/scripts/ng-designsafe/html/directives/data-browser-upload.html',
            controller: function ($scope, $q, $uibModalInstance, Modernizr, DataService, uploadDestination, directoryUpload) {

              $scope.data = {
                destination: uploadDestination,
                selectedFiles: []
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
            resolve: {uploadDestination: $scope.data.listing, directoryUpload: directoryUpload}
          });
        };

        self.displayPreview = function(file) {
          $uibModal.open({
            templateUrl: '/static/scripts/ng-designsafe/html/directives/data-browser-preview.html',
            controller: function($scope, $sce, $uibModalInstance, DataService, file) {
              $scope.data = {
                file: file
              };

              $scope.data.previewUrl = {loading: true};
              DataService.preview({resource: file.source, file_id: file.id}).then(
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
              DataService.download({resource: file.source, file_id: file.id}).then(
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
            },
            size: 'lg',
            resolve: {file: file}
          });
        };

        self.moveFile = function(options) {
          var sourceEl = $('tr[data-file-id="' + options.src_file_id + '"]', $element);
          sourceEl.addClass('ds-data-browser-processing');
          return DataService.move(options).then(
            function (resp) {
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
              // TODO
              // window.alert('ERROR: Unable to move ' + source + ' to ' + dest + '.');
              sourceEl.addClass('ds-data-browser-processing-danger');

              setTimeout(function() {
                sourceEl.removeClass('ds-data-browser-processing ds-data-browser-processing-danger');
              }, 3000);
            }
          );
        };

        self.copyFile = function(options) {
          var sourceEl = $('tr[data-file-id="' + options.src_file_id + '"]', $element);
          sourceEl.addClass('ds-data-browser-processing');
          DataService.copy(options).then(
            function (resp) {
              sourceEl.addClass('ds-data-browser-processing-success');

              setTimeout(function() {
                sourceEl.removeClass('ds-data-browser-processing ds-data-browser-processing-success');
              }, 3000);
            },
            function (err) {
              logger.error(err);
              // TODO
              // window.alert('ERROR: Unable to copy ' + source + ' to ' + dest + '.');
              sourceEl.addClass('ds-data-browser-processing-danger');

              setTimeout(function() {
                sourceEl.removeClass('ds-data-browser-processing ds-data-browser-processing-danger');
              }, 3000);
            }
          );
        };

        self.renameFile = function(options) {
          window.alert('TODO!!!');
        };

        /**
         * Preview File-like object.
         * @param file {object} the file-like object to preview
         */
        self.previewFile = function(file) {
          $scope.state.loading = true;
          DataService.listPath({resource: file.source, file_id: file.id}).then(
            function(resp) {
              self.displayPreview(resp.data);
              $scope.state.loading = false;
            },
            function(err) {
              // TODO notify user preview failed
              logger.error(err);
              $scope.state.loading = false;
            }
          );
        };


        /**
         *
         */
        self.reindexCurrentListing = function() {
          $scope.state.loading = true;
          var opts = {
            resource: $scope.data.listing.source,
            file_id: $scope.data.listing.id,
            reindex: true
          };
          return DataService.listPath(opts).then(
            function(resp) {
              $scope.state.loading = false;
              $scope.data.listing = resp.data;
            },
            function(err) {
              logger.error(err);
              // TODO notify
            }
          );
        };

        /**
         * Browse to a file_id and list its contents.
         * @param options {object}
         * @oaram options.resource {string} the resource to browse
         * @oaram options.file_id {string} the file_id to browse
         * @returns {HttpPromise}
         */
        self.browseFile = function(options) {
          self.clearSelection();
          $scope.state.loading = true;
          options = options || {};
          return DataService.listPath(options).then(
            function(response) {
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
              // TODO notify user
            }
          );
        };

        if (! $scope.data.listing) {
          self.browseFile({});
        }
      }]
    };
  }]);

  module.directive('dsDataBrowserNew', ['Logging', function(Logging) {

    var logger = Logging.getLogger('ngDesignSafe.daDataBrowserNew');

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
          return dbCtrl.hasPermission('write');
        };

        scope.createFolder = function() { dbCtrl.createFolder(); };
        scope.uploadFiles = function() { dbCtrl.uploadFiles(false); };
        scope.uploadFolders = function() { dbCtrl.uploadFiles(true); };
      }
    };
  }]);

  module.directive('dsDataBrowserSourceSelect', ['Logging', function(Logging) {

    var logger = Logging.getLogger('ngDesignSafe.dsDataBrowserSourceSelect');

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

  module.directive('dsDataBrowserToolbar', ['$uibModal', 'Logging', 'DataService', function($uibModal, Logging, DataService) {

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
          var file;
          if (scope.state.selected.length === 1) {
            file = _.findWhere(scope.data.listing.children, {id: scope.state.selected[0]});
            return file && file.type === 'file';
          }
          return false;
        };

        scope.moveToTrashEnabled = function() {
          return dbCtrl.hasPermission('write') && scope.data.listing.name !== '.Trash';
        };

        scope.emptyTrashEnabled = function() {
          return dbCtrl.hasPermission('write') && scope.data.listing.name === '.Trash';
        };

        scope.reindexingEnabled = function() {
          return dbCtrl.hasPermission('write') && scope.data.currentSource._indexed;
        };

        scope.requestReindex = function() {
          dbCtrl.reindexCurrentListing();
        };

        /**
         * Permanently deletes the selected files.
         */
        scope.emptyTrash = function() {
          if (! window.confirm('Are you sure you want to permenantly delete the selected files? This cannot be undone.')) {
            return;
          }

          _.each(scope.state.selected, function(fileId) {
            var file = _.findWhere(scope.data.listing.children, {id: fileId});
            var fileEl = $('tr[data-file-id="' + file.id + '"]');
            fileEl.addClass('ds-data-browser-processing');

            DataService.delete({file_id: file.id, resource: file.source}).then(
              function() {
                dbCtrl.toggleSelectFile({id: fileId});
                scope.data.listing.children = _.reject(scope.data.listing.children, function(file) {
                  return file.id === fileId;
                });
              },
              function(err) {
                // TODO notify user
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
         * Moves the selected files to the user's trash folder
         */
        scope.trashSelected = function() {
          _.each(scope.state.selected, function(fileId) {
            var file = _.findWhere(scope.data.listing.children, {id: fileId});
            var fileEl = $('tr[data-file-id="' + file.id + '"]');
            fileEl.addClass('ds-data-browser-processing');
            DataService.trash({file_id: file.id, resource: file.source}).then(
              function() {
                dbCtrl.toggleSelectFile({id: fileId});
                scope.data.listing.children = _.reject(scope.data.listing.children, function(file) {
                  return file.id === fileId;
                });
              },
              function(err) {
                // TODO notify user
                logger.error(err);
                fileEl.addClass('ds-data-browser-processing-danger');
                setTimeout(function() {
                  fileEl.removeClass('ds-data-browser-processing ds-data-browser-processing-danger');
                }, 3000);
              }
            );

          });
        };

        scope.copySelected = function() {
          var dialog = $uibModal.open({
            templateUrl: '/static/scripts/ng-designsafe/html/directives/data-browser-select-destination.html',
            controller: 'SelectDestinationModalCtrl',
            resolve: {
              data: {
                title: 'Select the destination to copy selected files.',
                sources: scope.data.sources,
                currentSource: scope.data.currentSource,
                listing: scope.data.listing
              }
            }
          });
          dialog.result.then(function(destination) {
            var files = _.filter(scope.data.listing.children, function(child) {
              return _.contains(scope.state.selected, child.id);
            });
            var defaultOpts = {
              dest_file_id: destination.id,
              dest_resource: destination.source
            };
            _.each(files, function(f) {
              var opts = _.extend({src_file_id: f.id, src_resource: f.source}, defaultOpts);
              // opts.dest_file_id = opts.dest_file_id + '/' + f.name;
              logger.log('COPY', opts);
              dbCtrl.copyFile(opts);
            });
          });
        };

        scope.moveSelected = function() {
          var dialog = $uibModal.open({
            templateUrl: '/static/scripts/ng-designsafe/html/directives/data-browser-select-destination.html',
            controller: 'SelectDestinationModalCtrl',
            resolve: {
              data: {
                title: 'Select the destination to move selected files.',
                sources: scope.data.sources
              }
            }
          });
          dialog.result.then(function(destination) {
            var files = _.filter(scope.data.listing.children, function(child) {
              return _.contains(scope.state.selected, child.id);
            });
            var defaultOpts = {
              dest_file_id: destination.id,
              dest_resource: destination.source
            };
            _.each(files, function(f) {
              var opts = _.extend({src_file_id: f.id, src_resource: f.source}, defaultOpts);
              opts.dest_file_id = opts.dest_file_id + '/' + f.name;
              dbCtrl.moveFile(opts)
                    .then(function() { dbCtrl.toggleSelectFile({id: f.id}); });
            });
          });
        };

        scope.shareSelected = function() {
          window.alert('TODO!!');
          logger.log('SHARE', scope.state.selected);
        };

        scope.downloadSelected = function() {
          window.alert('TODO!!');
          logger.log('DOWNLOAD', scope.state.selected);
        };

        scope.previewSelected = function() {
          var file;
          if (scope.state.selected.length === 1) {
            file = _.findWhere(scope.data.listing.children, {id: scope.state.selected[0]});
            dbCtrl.previewFile(file);
          }
        };

        scope.renameSelected = function() {
          window.alert('TODO!!');
          logger.log('RENAME', scope.state.selected);
        };
      }
    };
  }]);

  module.directive('dsDataListDisplay', ['Logging', 'DataService', function(Logging, DataService) {
    
    var logger = Logging.getLogger('ngDesignSafe.dsDataListDisplay');

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
        enablePreview: '=?preview',
        enableSelection: '=?selection',
        enableColumns: '=?columns',
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
        scope.previewFile = dbCtrl.previewFile;

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
            $(e.target, element).closest('tr').addClass('ds-droppable');
          }
        };
        
        scope.dragLeave = function(e, file) {
          $(e.target, element).closest('tr').removeClass('ds-droppable');
        };

        scope.dragOver = function(e, file) {
          if (file.type === 'folder') {
            $(e.target, element).closest('tr').addClass('ds-droppable');
            e.preventDefault();
          }
        };

        scope.dragEnd = function() {
          updateDragEl();
        };

        scope.dragDrop = function(e, file) {
          var data = JSON.parse(e.dataTransfer.getData('text/json'));
          var source =  data.id;
          var dest = file.id;
          var dragAction = e.dataTransfer.effectAllowed;
          var opts = {
            src_resource: data.source,
            src_file_id: data.id,
            dest_resource: file.source,
            dest_file_id: file.id + '/' + data.name
          };
          if (source !== dest) {
            if (dragAction === 'move') {
              dbCtrl.moveFile(opts);
            } else if (dragAction === 'copy') {
              dbCtrl.copyFile(opts);
            }
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

    $scope.validDestination = function (file) {
      return file.type === 'folder';
    };

    $scope.selectDestination = function (file) {
      $uibModalInstance.close(file);
    };

    $scope.cancel = function () {
      $uibModalInstance.dismiss('cancel');
    };
  }]);
})(window, angular, jQuery, _);
