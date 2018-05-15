(function(window, angular) {

  var module = angular.module('designsafe');

  module.directive('ddAltmetrics', ['$sce','$filter',function ($sce,$filter,$scope) {
    return {
      restrict: 'EA',
      scope: { publication: '='},
      link: function (scope, element) {
        scope.$watch(function stateWatch(){return scope.publication;}, function(newState) {
          console.log(scope);
          if (typeof newState === 'undefined'){
            return;
          }
          var publication = newState;
          var ld = {
            "@context": "http://schema.org",
            "@type": "Dataset",
            "@id": "https://doi.org/" + publication.project.doi, //dataset doi url 
            "additionalType": "Project/Experimental", //dataset type
            "name": publication.project.value.title, //dataset name
            "alternateName": publication.project.value.projectId, //alternative name of the dataset
            "author": [
              {
                "@type": "Person",
                "name": publication.users[0].first_name + ' ' + publication.users[0].last_name,
                "givenName":'',//user.first_name,
                "familyName": '',//publication.user.last_name
              }],
            "description": publication.project.value.description,
            "license": "http://opendatacommons.org/licenses/by/1-0",
            "keywords": publication.project.value.keywords,
            "inLanguage": "English",
            "datePublished": $filter('date')(publication.project.created, 'MMM/d/yyyy'),
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