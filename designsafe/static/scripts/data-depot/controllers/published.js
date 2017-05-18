(function(window, angular) {
  var app = angular.module('designsafe');
  app.requires.push('django.context');

  app.controller('PublishedDataCtrl', ['$scope', '$state', 'Django',
                                     'DataBrowserService', 'FileListing',
                                     '$uibModal','$http',
                 function ($scope, $state, Django, DataBrowserService,
                           FileListing, $uibModal, $http) {

  $scope.browser = DataBrowserService.state();
  $scope.state = {
        loadingMore : false,
        reachedEnd : false,
        page : 0
      };
  var projId = '';
  if ($scope.browser.listing.projectId){
      projId = $scope.browser.listing.projectId;
      $scope.project = $scope.browser.listing.project;
  } else {
      projId = $scope.browser.listing.path.split('/')[1];
      if (projId){
        $http.get('/api/projects/publication/' + projId)
          .then(function(resp){
              $scope.browser.publication = resp.data;
              $scope.project = resp.data.project;
        });
      }
  }
      FileListing.get({'system': 'designsafe.storage.published',
                       'name': 'projectimage.jpg',
                       'path': '/' + projId + '/projectimage.jpg'}).then(function(list){
                        list.preview().then(function(data){
                            $scope.imageHref = data.postit;
                        });
                      });

  if ($scope.browser.listing.projectId){
    _.each($scope.browser.listing.eventsList, function(evt){
        evt.files = _.map(evt.fileObjs, function(f){
            f.system = 'designsafe.storage.published';
            f.path = $scope.browser.listing.projectId + f.path;
            return FileListing.init(f);
        });
    });
    _.each($scope.browser.listing.modelConfigs, function(mcf){
        mcf.files = _.map(mcf.fileObjs, function(f){
            f.system = 'designsafe.storage.published';
            f.path = $scope.browser.listing.projectId + f.path;
            return FileListing.init(f);
        });
    });
    _.each($scope.browser.listing.sensorLists, function(slt){
        slt.files = _.map(slt.fileObjs, function(f){
            f.system = 'designsafe.storage.published';
            f.path = $scope.browser.listing.projectId + f.path;
            return FileListing.init(f);
        });
    });
    _.each($scope.browser.listing.analysisList, function(anl){
        anl.files = _.map(anl.fileObjs, function(f){
            f.system = 'designsafe.storage.published';
            f.path = $scope.browser.listing.projectId + f.path;
            return FileListing.init(f);
        });
    });
    _.each($scope.browser.listing.reportsList, function(rep){
        rep.files = _.map(rep.fileObjs, function(f){
            f.system = 'designsafe.storage.published';
            f.path = $scope.browser.listing.projectId + f.path;
            return FileListing.init(f);
        });
    });
  }
  if (! $scope.browser.error){
    $scope.browser.listing.href = $state.href('publishedData', {
      system: $scope.browser.listing.system,
      filePath: $scope.browser.listing.path
    });
    _.each($scope.browser.listing.children, function (child) {
      child.href = $state.href('publishedData', {system: child.system, filePath: child.path});
    });
  }

  $scope.data = {
    customRoot: {
      name: 'Published',
      href: $state.href('publicData', {systemId: 'nees.public',
                                          filePath: 'public/'})
    }
  };

    $scope.resolveBreadcrumbHref = function(trailItem) {
      return $state.href('publicData', {systemId: $scope.browser.listing.system, filePath: trailItem.path});
    };

    $scope.scrollToTop = function(){
      return;
    };
    $scope.scrollToBottom = function(){
      DataBrowserService.scrollToBottom();
    };

    $scope.onBrowse = function($event, file) {
      $event.preventDefault();
      $event.stopPropagation();

      var systemId = file.system || file.systemId;
      var filePath;
      if (file.path == '/'){
        filePath = file.path + file.name;
      } else {
        filePath = file.path;
      }
      if (file.type === 'file'){
        DataBrowserService.preview(file, $scope.browser.listing);
      } else {
        $state.go('publishedData', {systemId: file.system, filePath: file.path});
      }
    };

    $scope.onSelect = function($event, file) {
      $event.preventDefault();
      $event.stopPropagation();

      if ($event.ctrlKey || $event.metaKey) {
        var selectedIndex = $scope.browser.selected.indexOf(file);
        if (selectedIndex > -1) {
          DataBrowserService.deselect([file]);
        } else {
          DataBrowserService.select([file]);
        }
      } else if ($event.shiftKey && $scope.browser.selected.length > 0) {
        var lastFile = $scope.browser.selected[$scope.browser.selected.length - 1];
        var lastIndex = $scope.browser.listing.children.indexOf(lastFile);
        var fileIndex = $scope.browser.listing.children.indexOf(file);
        var min = Math.min(lastIndex, fileIndex);
        var max = Math.max(lastIndex, fileIndex);
        DataBrowserService.select($scope.browser.listing.children.slice(min, max + 1));
      } else if (typeof file._ui !== 'undefined' &&
                 file._ui.selected){
        DataBrowserService.deselect([file]);
      } else {
        DataBrowserService.select([file], true);
      }
    };

    $scope.showFullPath = function(item){
      if ($scope.browser.listing.path != '$PUBLIC' &&
          item.parentPath() != $scope.browser.listing.path &&
          item.parentPath() != '/'){
        return true;
      } else {
        return false;
      }
    };

    $scope.onDetail = function($event, file) {
      $event.stopPropagation();
      DataBrowserService.preview(file, $scope.browser.listing);
    };

    $scope.renderName = function(file){
      if (typeof file.metadata === 'undefined' ||
          file.metadata === null ||
          _.isEmpty(file.metadata)){
        return file.name;
      }
      var pathComps = file.path.split('/');
      var experiment_re = /^experiment/;
      if (file.path[0] === '/' && pathComps.length === 2) {
        return file.metadata.project.title;
      }
      else if (file.path[0] !== '/' &&
               pathComps.length === 2 &&
               experiment_re.test(file.name.toLowerCase())){
        return file.metadata.experiments[0].title;
      }
      return file.name;
    };

    $scope.getRelated = function(attrib, uuids){
      if (_.isString(uuids)){
          uuids = [uuids];
      }
      var ents = [];
      if ($scope.browser.listing.projectId){
          ents = $scope.browser.listing[attrib];
      } else {
          ents = $scope.browser.publication[attrib];
      }
      var res = _.filter(ents, function(ent){
          if (_.intersection(uuids, ent.associationIds).length === uuids.length){
              return ent;
          }
      });
      return res;
    };

    $scope.getUserDets = function(username){
      var users;
      if ($scope.browser.listing.projectId){
        users = $scope.browser.listing.users;
      } else {
        useres = $scope.browser.publication.users;
      }
      var user = _.find(users, function(usr){
        return usr.username === username;
      });
      if (user){
        return user.last_name + ', ' + user.first_name + ' <' + user.email + '>';
      }
    };

    $scope.viewCollabs = function(){
      $uibModal.open({
        templateUrl: '/static/scripts/data-depot/templates/view-collabs.html',
        controller: ['$uibModalInstance', 'browser', function($uibModalInstance, browser){
            var $ctrl = this;
            $ctrl.data = {};
            if (browser.listing.project){
                $ctrl.data.project = browser.listing.project;
            } else {
                $ctrl.data.project = browser.publication.project;
            }
            $ctrl.close = function(){
                $uibModalInstance.dismiss('close');
            };
        }],
        controllerAs: '$ctrl',
        resolve: {
            browser: $scope.browser
        }, 
        scope: $scope
      });
    };

    $scope.viewProject = function(){
      $uibModal.open({
        templateUrl: '/static/scripts/data-depot/templates/view-project.html',
        controller: ['$uibModalInstance', 'browser', function($uibModalInstance, browser){
            var $ctrl = this;
            $ctrl.data = {};
            if (browser.listing.project){
                $ctrl.data.publication = browser.listing;
            } else {
                $ctrl.data.publication = browser.publication;
            }
            $ctrl.close = function(){
                $uibModalInstance.dismiss('close');
            };
        }],
        controllerAs: '$ctrl',
        resolve: {
            browser: $scope.browser
        },
        size: 'lg'
      });
    };
    
    $scope.viewExperiments = function(){
      $uibModal.open({
        templateUrl: '/static/scripts/data-depot/templates/view-experiments.html',
        controller: ['$uibModalInstance', 'browser', function($uibModalInstance, browser){
            var $ctrl = this;
            $ctrl.data = {};
            if (browser.listing.project){
                $ctrl.data.publication = browser.listing;
            } else {
                $ctrl.data.publication = browser.publication;
            }
            $ctrl.close = function(){
                $uibModalInstance.dismiss('close');
            };
        }],
        controllerAs: '$ctrl',
        resolve: {
            browser: $scope.browser
        },
        scope: $scope,
        size: 'lg'
      });
    };

    $scope.viewRelations = function(uuid){
      $uibModal.open({
        templateUrl: '/static/scripts/data-depot/templates/view-relations.html',
        controller: ['$uibModalInstance', 'browser', function($uibModalInstance, browser){
            var $ctrl = this;
            $ctrl.data = {};
            if (browser.listing.project){
                $ctrl.data.publication = browser.listing;
            } else {
                $ctrl.data.publication = browser.publication;
            }
            $ctrl.data.selectedUuid = uuid;
            $ctrl.isSelected = function(uuid){
                if (uuid ===$ctrl.data.selectedUuid){
                    return true;
                } else {
                    return false;
                }
            };
            $ctrl.close = function(){
                $uibModalInstance.dismiss('close');
            };
        }],
        controllerAs: '$ctrl',
        resolve: {
            browser: $scope.browser
        },
        scope: $scope,
        size: 'lg'
      });
    };

    $scope.showText = function(text){
        $uibModal.open({
            template: '<div class="modal-header">' +
                        '<h3>Description</h3>' +
                      '</div>' +
                      '<div class="modal-body">' +
                        '<div style="border: 1px solid black;"' +
                                   '"padding:5px;">' +
                          '{{text}}' +
                        '</div>' +
                      '</div>' +
                      '<div class="modal-footer">' +
                        '<button class="btn btn-default" ng-click="close()">' +
                          'Close' +
                        '</button>' +
                      '</div>',
            controller: ['$scope', '$uibModalInstance', function($scope, $uibModalInstance){
                $scope.text = text;
                $scope.close = function(){
                    $uibModalInstance.dismiss('Close');
                };
            }]
        });
    };
  }]);
})(window, angular);
