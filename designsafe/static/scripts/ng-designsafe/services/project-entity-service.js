import _ from 'underscore';

export function ProjectEntitiesService(httpi, $interpolate, $q, $uibModal, Logging, ProjectEntityModel) {
    'ngInject';

    var logger = Logging.getLogger('DataDepot.ProjectService');

    var service = {};

    var entitiesResource = httpi.resource('/api/projects/:uuid/meta/:name/').setKeepTrailingSlash(true);
    var entityResource = httpi.resource('/api/projects/meta/:uuid/').setKeepTrailingSlash(true);


    /**
     * 
     * Get list of entities related to a project
     * @param {Object} options.
     * @param {string} options.uuid Uuid of related project.
     * @param {string} options.name Model name of entity type, e.g. 'designsafe.project.experiment'
     *
     */
    service.listEntities = function(options){
        return entitiesResource.get({ params: options }).then(function(resp){
            return _.map(resp.data, function(entity){
                return new ProjectEntityModel(entity);
            });
        });
    };

    /**
     * 
     * Get single entity by uuid
     *
     */
    service.get = function(options){
        return entityResource.get({ params: options }).then(function(resp){
            return new ProjectEntityModel(resp.data);
        });
    };

    /**
     *
     * Create single entity
     * @param {Object} options.
     * @param {Object} options.data Object to hold data sent.
     * @param {string} options.data.uuid Project uuid the entity will be related to.
     * @param {string} options.data.name Entity model name. e.g. 'designsafe.project.experiment'
     * @param {Object} options.data.entity Object holding entity data.
     * @returns {Promise}
     *
     */
    service.create = function(options){
        return entitiesResource.post(options).then(function(resp){
            return new ProjectEntityModel(resp.data);
        });
    };

    /**
     *
     * Update single entity
     *
     */
    service.update = function(options){
        return entityResource.put(options).then(function(resp){
            return new ProjectEntityModel(resp.data);
        });
    };

    /**
     *
     * Delete single entity
     *
     */
    service.delete = function(options){
        return entityResource.delete(options).then(function(resp){
            return new ProjectEntityModel(resp.data);
        });
    };

    return service;
}
