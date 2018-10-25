export function ddAltmetrics($sce,$filter) {
    'ngInject';
    return {
      restrict: 'EA',
      scope: { publication: '='},
      link: function (scope, element) {
        'ngInject';
        scope.$watch(function stateWatch(){return scope.publication;}, function(newState) {

          if (typeof newState === 'undefined'){
            return;
          }

          var publication = newState;
          
          var authors = [];
          for (i = 0; i < publication.users.length; i++){
            authors.push({
            "@type": "Person",
            "name": publication.users[i].first_name + ' ' + publication.users[i].last_name,
            "givenName": publication.users[i].first_name ,
            "familyName": publication.users[i].last_name
          });
          }

          var ld = {
            "@context": "http://schema.org",
            "@type": "Dataset",
            "@id": "https://doi.org/" + publication.project.doi, //dataset doi url 
            "additionalType": "Project/Experimental", //dataset type
            "name": publication.project.value.title, //dataset name
            "alternateName": publication.project.value.projectId, //alternative name of the dataset
            "author": authors,
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
  }
