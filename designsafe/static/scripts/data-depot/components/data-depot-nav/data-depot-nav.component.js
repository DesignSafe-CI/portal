import DataDepotNavTemplate from './data-depot-nav.component.html'

class DataDepotNavCtrl {
    constructor($scope, $rootScope, $state, Django) {
        'ngInject';

        this.$scope = $scope
        this.$rootScope = $rootScope
        this.$state = $state
        this.Django = Django
    }

    $onInit() {
  
      this.routerItems = [];
  
      this.myDataFileId = 'designsafe.storage.default/' + this.Django.user + '/';
      this.sharedFileId = 'designsafe.storage.default/$SHARE/';
  
      this.routerItems.push(
          {
            name: 'Published',
            collapsible: false,
            state: 'publicData',
            description: "Curated data/projects with DOI's"
          },
          {
            name: 'Community Data',
            collapsible: false,
            state: 'communityData',
            description: 'Non-curated user-contributed data'
          }/*,
          {
            name: 'Training Materials',
            collapsible: false,
            state: 'trainingMaterials'
          }*/
      );
  
      if (this.Django.context.authenticated) {
        this.routerItems.splice(0, 0,
            {
              name: 'My Data',
              collapsible: false,
              state: 'myData',
              description: 'Private directory for your data'
            },
            {
              name: 'My Projects',
              collapsible: false,
              state: 'projects.list',
              description: 'Group access to shared directories'
            },/*
            {
              name: 'My Publications',
              collapsible: false,
              state: 'myPublications'
            },*/
            {
              name: 'Shared with Me',
              collapsible: false,
              state: 'sharedData',
              description: 'Data other users shared with me'
          },
            {
              name: 'Box.com',
              collapsible: false,
              state: 'boxData',
              description: 'Access to my Box files for copying',
            },
            {
              name: 'Dropbox.com',
              collapsible: false,
              state: 'dropboxData',
              description: 'Access to my Dropbox for copying'
            },
            {
              name: 'Google Drive',
              collapsible: false,
              state: 'googledriveData',
              description: 'Access to my Google Drive for copying'
            }
        );
  
        // $scope.routerItems.push({
        //     name: 'Workspace',
        //     collapsible: true,
        //     collapse: true,
        //     children: [
        //       {
        //         name: 'Application Catalog',
        //         collapsible: false,
        //         state: 'applicationCatalog'
        //       },
        //       {
        //         name: 'Run Application',
        //         collapsible: false,
        //         state: 'runApplication'
        //       },
        //       {
        //         name: 'Job History',
        //         collapsible: false,
        //         state: 'jobHistory'
        //       }
        //     ]
        //   }
        // );
      }
    }
  
    itemClicked(routerItem) {
        if (routerItem.collapsible) {
          routerItem.collapse = !routerItem.collapse;
        }
      };
  
      // allows state to be refreshed
      // by clicking current nav button
    stateReload(childItem) {
        this.$state.go(childItem, {query_string: null}, {reload: true, inherit: false, location: true});
      };
  
    
  }
 
  
  export const DataDepotNavComponent = {
    controller: DataDepotNavCtrl,
    controllerAs: '$ctrl',
    template: DataDepotNavTemplate
}