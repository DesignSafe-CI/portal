import angular from 'angular';
import HazmapperMapsTemplate from './hazmapper-maps.component.html';

class HazmapperMapsCtrl {
    constructor($state) {this.$state = $state;}

    $onInit() {
        this.readOnly = this.$state.current.name.indexOf('publishedData') === 0;
    }

    filteredHazmapperMaps(readOnly) {
        const maps = this.maps ? this.maps : [];

        if (!readOnly){
            maps.forEach((map) => {
              switch (map.deployment) {
                  case 'production':
                      map.href = `https://hazmapper.tacc.utexas.edu/hazmapper/project/${map.uuid}`;
                      break;
                  case 'staging':
                      map.href = `https://hazmapper.tacc.utexas.edu/staging/project/${map.uuid}`;
                      break;
                  default:
                      map.href = `http://hazmapper.local:4200/project/${map.uuid}`;
              }
              });
  
              if (window.location.origin.includes('designsafe-ci.org')) {
                  return maps.filter((map) => map.deployment === 'production');
              }  
          } else {
              maps.forEach((map) => {
                  switch (map.deployment) {
                      case 'production':
                          map.href = `https://hazmapper.tacc.utexas.edu/hazmapper/project-public/${map.uuid}`;
                          break;
                      case 'staging':
                          map.href = `https://hazmapper.tacc.utexas.edu/staging/project-public/${map.uuid}`;
                          break;
                      default:
                          map.href = `http://hazmapper.local:4200/project-public/${map.uuid}`;
                  }
                  });
  
                  if (window.location.origin.includes('designsafe-ci.org')) {
                      return maps.filter((map) => map.deployment === 'production');
                  } 
          }
    
        return maps;
    }

    browse($event, path) {
        $event.preventDefault();
        $event.stopPropagation();
        const file = {
            path,
            type: 'dir',
        };
        this.onBrowse({ file });
    }
}

export const HazmapperMapsComponent = {
    template: HazmapperMapsTemplate,
    controller: HazmapperMapsCtrl,
    controllerAs: '$ctrl',
    bindings: {
        maps: '<',
        onBrowse: '&?',
    },
};
