(function(window, angular) {

  var module = angular.module('designsafe');

  module.directive('ddAltmetrics', ['$sce','$filter',function ($sce,$filter,$scope) {
    return {
      restrict: 'EA',
      scope: { project: '='},
      link: function (scope, element) {
        scope.$watch(function stateWatch(){return scope.project;}, function(newState) {
          if (typeof newState === 'undefined'){
            return;
          }
          var publication = newState;
          var ld = {
            "@context": "http://schema.org",
            "@type": "Dataset",
            "@id": "https://doi.org/" + publication.doi, //dataset doi url 
            "additionalType": "Project/Experimental", //dataset type
            "name": publication.value.title, //dataset name
            "alternateName": publication.value.projectId, //alternative name of the dataset
            "author": [
              {
                "@type": "Person",
                "name": '',//publication.user.first_name + ' ' + publication.user.last_name,
                "givenName": '',//publication.user.first_name,
                "familyName": '',//publication.user.last_name
              }],
            "description": publication.value.description,
            "license": "http://opendatacommons.org/licenses/by/1-0",
            "keywords": publication.value.keywords,
            "inLanguage": "English",
            "datePublished": $filter('date')(publication.created, 'MMM/d/yyyy'),
            "schemaVersion": "http://datacite.org/schema/kernel-4",
            "publisher": {
              "@type": "Organization",
              "name": "Designsafe-CI"
            },
            "provider": {
              "@type": "Organization",
              "name": "TACC"
            }
          };
          element[0].outerHTML = '<script type="application/ld+json">' + JSON.stringify(ld) + '</script>';
        });
      }
    };
  }]);
})(window, angular);