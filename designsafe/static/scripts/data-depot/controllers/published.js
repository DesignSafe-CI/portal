(function(window, angular) {
  var app = angular.module('designsafe');
  app.requires.push('django.context');

  app.controller('PublishedDataCtrl', ['$scope', '$state', 'Django', '$window',
                                     'DataBrowserService', 'FileListing',
                                     '$uibModal','$http', '$stateParams',
                 function ($scope, $state, Django, $window, DataBrowserService,
                           FileListing, $uibModal, $http, $stateParams) {
  $scope.filePathComps = _.compact($stateParams.filePath.split('/'));
  $scope.browser = DataBrowserService.state();
  $scope.state = {
        loadingMore : false,
        reachedEnd : false,
        page : 0
      };
  $scope.ui = {loadingProjectMeta: false};
  var projId = $scope.browser.listing.path.split('/')[1];
  if (projId){
    $scope.ui.loadingProjectMeta = true;
    $http.get('/api/projects/publication/' + projId)
      .then(function(resp){
          $scope.browser.publication = resp.data;
          $scope.project = resp.data.project;
          var pi = _.find($scope.browser.publication.users, function(usr){
            return usr.username === $scope.project.value.pi;
          });
          $scope.project.piLabel = pi.last_name + ', ' + pi.first_name;
          var _apiParams = {
            fileMgr: 'published',
            baseUrl: '/api/public/files'
          };
          function getFileObjs(evt){
              evt.files = _.map(evt.fileObjs, function(f){
                  f.system = 'designsafe.storage.published';
                  f.path = $scope.browser.publication.projectId + f.path;
                  f.permissions = 'READ';
                  return FileListing.init(f, _apiParams);
              });
          }
          if ($scope.browser.publication.project.value.projectType === 'experimental'){
              _.each($scope.browser.publication.eventsList, getFileObjs);
              _.each($scope.browser.publication.modelConfigs, getFileObjs);
              _.each($scope.browser.publication.sensorLists, getFileObjs);
              _.each($scope.browser.publication.analysisList, getFileObjs);
              _.each($scope.browser.publication.reportsList, getFileObjs);
          } else if ($scope.browser.publication.project.value.projectType === 'simulation'){
              _.each($scope.browser.publication.analysiss, getFileObjs);
              _.each($scope.browser.publication.inputs, getFileObjs);
              _.each($scope.browser.publication.models, getFileObjs);
              _.each($scope.browser.publication.outputs, getFileObjs);
              _.each($scope.browser.publication.reports, getFileObjs);
          }

        $scope.ui.loadingProjectMeta = false;
        
    });
  }
                   

  FileListing.get({'system': 'designsafe.storage.published',
                   'name': 'projectimage.jpg',
                   'path': '/' + projId + '/projectimage.jpg'}).then(function(list){
                    list.preview().then(function(data){
                        $scope.imageHref = data.postit;
                    });
                  });
  //$scope.browser.listing.permissions = 'READ';

  
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
                                          filePath: '/'}),
      system: 'nees.public',
      filePath: '/'
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
      if ($event){
          $event.preventDefault();
          $event.stopPropagation();
      }

      var systemId = file.system || file.systemId;
      var filePath;
      if (file.path == '/'){
        filePath = file.path + file.name;
      } else {
        filePath = file.path;
      }
      if (typeof(file.type) !== 'undefined' && file.type !== 'dir' && file.type !== 'folder'){
        DataBrowserService.preview(file, $scope.browser.listing);
      } else {
        if (file.system === 'nees.public'){
          $state.go('publicData', {systemId: file.system, filePath: file.path}, {reload: true});
        } else {
          $state.go('publishedData', {systemId: file.system, filePath: file.path, listing:true}, {reload: true});
        }
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

    $scope.getRelated = function(attrib, entity, uuids){
      if (_.isString(uuids)){
          uuids = [uuids];
      }
      var ents = [];
      ents = $scope.browser.publication[attrib];
      var res = _.filter(ents, function(ent){
          var inter = _.intersection(uuids, ent.associationIds);
          if (inter && inter.length === uuids.length){
              return ent;
          }
      });
      if (entity !== false && typeof entity !== 'undefined'){
          var _ents = entity.value[attrib];
          var _res = _.filter(res, function(ent){
              if (_.contains(_ents, ent.uuid)){
                  return ent;
              }
          });
          return _res;
      }
      return res;
    };

    $scope.getUserDets = function(username, noEmail){
      var users;
      users = $scope.browser.publication.users;
      var user = _.find(users, function(usr){
        return usr.username === username;
      });
      if (user){
        if (!noEmail){
          return user.last_name + ', ' + user.first_name + ' <' + user.email + '>';
        } else {
          return user.last_name + ', ' + user.first_name;
        }
      }
    };
    
    $scope.filterUsers = function(usernames, users){
        return _.filter(users, function(usr){
            return _.contains(usernames, usr.username);
        });
      };

    $scope.sortUsers = function(entity){
        return function(user){
            if (typeof user._ui[entity.uuid] !== 'undefined'){
                return user._ui[entity.uuid];
            } else {
                return user._ui.order;
            }
        };
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
            $ctrl.data.piDets = $scope.getUserDets($ctrl.data.publication.project.value.pi);
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

    $scope.viewSimulationRelations = function(uuid){
      $uibModal.open({
        templateUrl: '/static/scripts/data-depot/templates/view-simulation-relations.html',
        controller: ['$uibModalInstance', 'browser', function($uibModalInstance, browser){
            var $ctrl = this;
            $ctrl.data = {};
            if (browser.listing.project){
                $ctrl.data.publication = browser.listing;
            } else {
                $ctrl.data.publication = browser.publication;
            }
            $ctrl.data.selectedUuid = uuid;
            $ctrl.isSelected = function(entityUuid){
                if (entityUuid ===$ctrl.data.selectedUuid){
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
            $ctrl.isSelected = function(entityUuid){
                if (entityUuid ===$ctrl.data.selectedUuid){
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

    $scope.showCitation = function(ent){
      $uibModal.open({
        templateUrl: '/static/scripts/data-depot/templates/view-citations.html',
        controller: ['$sce', '$uibModalInstance', 'browser', function($sce, $uibModalInstance, browser){
          var $ctrl = this;
          $ctrl.data = {};
          $ctrl.ui = {};
          $ctrl.data.ent = ent;
          $ctrl.ui.style = 'BibTeX';
          $ctrl.ui.styles = ['BibTeX', 'Endnote'];
          var authors = '';
          var ieeeAuthors = '';
          if (browser.listing.project){
              $ctrl.data.publication = browser.listing;
          } else {
              $ctrl.data.publication = browser.publication;
          }
          var publishers = _.filter($ctrl.data.publication.users, function(usr){
              if (ent.name === 'designsafe.project' || ent.name === 'designsafe.project.analysis'){
                return _.contains($ctrl.data.publication.project.value.coPis, usr.username) ||
                                  usr.username === $ctrl.data.publication.project.value.pi;
              } else {
                return _.contains(ent.value.authors, usr.username);
              }
          });
          if (typeof ent.value.projectType !== 'undefined' && ent.value.projectType === 'other'){
            publishers = $ctrl.data.publication.users;
          }
          publishers = _.sortBy(publishers, function(p){
                         if (typeof p._ui[ent.uuid] !== 'undefined'){
                             return p._ui[ent.uuid];
                         }else {
                             return p._ui.order;
                         }
                       });
          _.each(publishers, function(usr, index, list){
            var str = usr.last_name + ', ' + usr.first_name;
            if (index < list.length - 1){
              authors +=  str + ' and ';
              ieeeAuthors += str + '; ';
            } else {
              authors +=  str;
              ieeeAuthors += str;
            }
          });
          $ctrl.getCitation = function(){
            if ($ctrl.ui.style === 'BibTeX'){
              $ctrl.data.citation = 
                '@misc{dataset, \n' +
                ' author = {' + authors + '} \n' +
                ' title = {' + ent.value.title + '} \n' +
                ' publisher = {DesignSafe-CI} \n' +
                ' year = {2017} \n' +
                ' note = {' + ent.value.description + '} \n' +
                '}';
        } else if ($ctrl.ui.style === 'Endnote'){
              $ctrl.data.citation =
				'%0 Generic \n' +
				'%A ' + authors + '\n' +
				'%T ' + ent.value.title + '\n' +
				'%I DesignSafe-CI\n' +
				'%D 2017\n'; 
        }
      };
		$ctrl.close = function(){
            $uibModalInstance.dismiss('Close');
        };
        $ctrl.downloadCitation = function(){
          // var blob = new Blob([$ctrl.data.citation]);
          // var downloadLink = $('<a></a>');
          // downloadLink.attr('href', window.URL.createObjectURL(blob));
          // downloadLink.attr('download', 'citation.' + $ctrl.ui.style);
          // downloadLink[0].click();

          var doi = $ctrl.data.ent.doi;
          doi = doi.slice(4);
          doiurl = "https://data.datacite.org/application/vnd.datacite.datacite+xml/" + doi;
          $window.open(doiurl);
        };
      $ctrl.ui.ieeeCitation = $sce.trustAsHtml(ieeeAuthors + ', (2017), "' + ent.value.title + '" , DesignSafe-CI [publisher], Dataset, ' + ent.doi);
      $ctrl.getCitation();
    }],
    size: 'md',
    controllerAs: '$ctrl',
    resolve: {
        browser: $scope.browser
    }, 
    scope: $scope
    });
}; 

}]);
})(window, angular);
