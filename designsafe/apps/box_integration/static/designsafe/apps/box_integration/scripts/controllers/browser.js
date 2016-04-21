/**
 * Created by mrhanlon on 4/20/16.
 */
(function(window, angular, $, _) {
  "use strict";
  var app = angular.module('BoxFilesApp');
  app.controller('BrowserCtrl', ['$scope', '$rootScope', '$location', '$q', '$uibModal', 'logger', 'BoxFiles', 'Django',
    function($scope, $rootScope, $location, $q, $uibModal, logger, BoxFiles, Django) {

      $scope.data = {
        folder: Django.context.folder,
        item_collection: Django.context.folder.item_collection
      };
      /* initialize state */
      $location.state($scope.data);
      $location.replace();

      $scope.icon = BoxFiles.icon;

      $scope.url_path = BoxFiles.url_path;

      $scope.$on('$locationChangeSuccess', function ($event, newUrl, oldUrl, newState) {
        if (newUrl !== oldUrl) {
          $scope.data = newState;
        }
      });


      $scope.itemClick = function($event, item) {
        if (item.type === 'folder') {
          $event.preventDefault();
          BoxFiles.list({ item_id: item.id })
            .then(
              function(response) {
                $scope.data.folder = response.data;
                $scope.data.item_collection = response.data.item_collection;

                /* update state and path */
                $location.state(angular.copy($scope.data));
                $location.path(BoxFiles.url_path($scope.data.folder))
              },
              function(error) {
                logger.error(error);
              });
        } else {
          $scope.previewItem($event, item);
        }
      };

      function openPreviewModal(data) {
        $uibModal.open({
          templateUrl: 'designsafe/apps/box_integration/html/preview-modal.html',
          controller: 'BoxFileModal',
          size: 'lg',
          resolve: { data: data }
        });
      }

      $scope.previewItem = function($event, item) {
        $event.preventDefault();
        var promises = [
          BoxFiles.list({item_type: item.type, item_id: item.id}),
          BoxFiles.downloadUrl(item),
          BoxFiles.previewUrl(item)
        ];
        $q.all(promises)
        .then(function(values) {
          var previewData = {
            item: values[0].data
          };
          _.extend(previewData, values[1].data, values[2].data);
          openPreviewModal(previewData);
        }, function(error) {
          logger.error(error);
        });
      };

    }]);

  app.controller('BoxFileModal', function($scope, $sce, $uibModalInstance, logger, BoxFiles, data) {
    $scope.data = data;
    if (data.expiring_embed_link.url) {
      $scope.data.expiring_embed_link.url = $sce.trustAsResourceUrl(data.expiring_embed_link.url);
    }
    
    $scope.copyToMyData = function($event, item) {
      $event.preventDefault();
      
      BoxFiles.copyToMyData(item)
      .then(function(response) {
        logger.debug(response);
      }, function(error) {
        logger.error(error);
      });
    };

    $scope.cancel = function () {
      $uibModalInstance.dismiss('cancel');
    };
  });

  app.filter('itemurlpath', ['BoxFiles', function(BoxFiles) {
    return function(item, baseHref) {
      var path = BoxFiles.url_path(item);
      if (baseHref) {
        path = $('base').attr('href').slice(0, -1) + path;
      }
      return path;
    }
  }]);

  app.filter('icon', ['BoxFiles', function(BoxFiles) {
    return function(item) {
      return BoxFiles.icon(item);
    }
  }]);

})(window, angular, jQuery, _);
