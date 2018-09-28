export function SystemsService($rootScope, $http, $q, $uibModal, $state, Django, FileListing, Logging){
    var logger = Logging.getLogger('ngDesignsafe.SystemsService');
    var _baseUrl = '/api/agave/systems/';

    var service = {
      currentState: currentState,
      state: state,
      list: list
    };


    /**
     * @type {{busy: boolean, listing: FileListing, selected: Array}}
     */
    var currentState = {
      busy: false,
      error: null,
      listing: null,
      selected: []
    };

    /**
     * Gets the state of the DataBrowserService.
     *
     * @return {{busy: boolean, listing: FileListing, selected: Array}}
     */
    function state() {
      return currentState;
    }

    function list(options){
      return $http.get(_baseUrl, {params: options})
        .then(function(resp){
            return resp.data;
        });
    }

    return service;
  }


