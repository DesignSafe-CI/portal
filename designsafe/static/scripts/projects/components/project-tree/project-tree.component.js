import * as d3 from 'd3';
import * as d3plus from 'd3plus';
import _ from 'underscore';
import ProjectTreeTemplate from './project-tree.template.html';

class ProjectTreeCtrl {
    constructor(ProjectService, ProjectEntitiesService, $scope, $q){
        'ngInject';
        this.ProjectService = ProjectService;
        this.ProjectEntitiesService = ProjectEntitiesService;
        this.$scope = $scope;
        this.$q = $q;
        this.trees = [];
        this._ui = { loading: false };
    }

    $onInit() {
        this.project = this.resolve.project;
        this.rootCategoryUuid = this.resolve.rootCategoryUuid;
        this.readOnly = this.resolve.readOnly || false;
        if (this.project.mission_set) {
            this.initiateEntityOrder(this.project.mission_set.concat(this.project.report_set));
        }
    }

    /*
     * @method
     * @param {Object} entity.
     * @param {Object} leaf.
     * 
     * Add every uuid of every leaf parent all the way to the top of the hierarchy.
     * This is useful when creating relations since we have to add ever parent in
     * the association Ids array.
     */
    addAssociationIds(leaf, entity){
        let node = leaf.parent;
        while (node.parent) {
            entity.associationIds.push(node.data.uuid);
            node = node.parent;
        }
        entity.associationIds.push(node.data.uuid);
        return this.ProjectEntitiesService.update(
            {
                data: {
                    uuid: entity.uuid,
                    entity: entity,
                },
            }
        ).then( (ret) => {
            let retEntity = this.project.getRelatedByUuid(ret.uuid);
            retEntity.update(ret);
            return retEntity;
        });
    }

    /*
     * @method
     * @param {Object} node.
     * @param {Object} entity.
     * 
     * Removes every association Ids from the node's parents.
     */
    removeAssociationIds(node, entity){
        let nodeParent = node.parent;
        while (nodeParent.parent) {
            entity.associationIds = _.without(
                entity.associationIds,
                nodeParent.data.uuid
            );
            nodeParent = nodeParent.parent;
        }
        if (nodeParent.data.uuid !== this.project.uuid) {
            entity.associationIds = _.without(
                entity.associationIds,
                nodeParent.data.uuid
            );
        }
        return this.ProjectEntitiesService.update(
            {
                data: {
                    uuid: entity.uuid,
                    entity: entity,
                },
            }
        ).then( (ret) => {
            let retEntity = this.project.getRelatedByUuid(ret.uuid);
            retEntity.update(ret);
            return retEntity;
        });
    }

    /*
     * @method
     * @param {Object} node. Hierarchical node so we can walk parents.
     * @param {Object} entity.
     *
     * Remove uuids to the correct attributes.
     * This is specific to Simulation project.
     */
    unrelateEntityToFieldReconProject(node, entity){
        let nodeParent = node.parent;
        if (entity.name === 'designsafe.project.field_recon.report' &&
            !entity.value.missions.length) {
            return this.$q.deferred();
        }
        entity.value.missions = _.without(
            entity.value.missions,
            nodeParent.data.uuid
        );
        return this.removeAssociationIds(node, entity);
    }

    /*
     * @method
     * @param {Object} node. Hierarchical node so we can walk parents.
     * @param {Object} entity.
     *
     * Remove uuids to the correct attributes.
     * This is specific to Hybrid Simulation project.
     */
    unrelateEntityToHybridSimProject(node, entity){
        let nodeParent = node.parent;
        if (entity.name === 'designsafe.project.hybrid_simulation.coordinator_output') {
            entity.value.coordinators = _.without(
                entity.value.coordinators,
                nodeParent.data.uuid
            );
            nodeParent = nodeParent.parent;
        } else if (entity.name === 'designsafe.project.hybrid_simulation.sim_output') {
            entity.value.simSubstructures = _.without(
                entity.value.simSubstructures,
                nodeParent.data.uuid
            );
            nodeParent = nodeParent.parent;
        } else if (entity.name === 'designsafe.project.hybrid_simulation.exp_output') {
            entity.value.expSubstructures = _.without(
                entity.value.expSubstructures,
                nodeParent.data.uuid
            );
            nodeParent = nodeParent.parent;
        }
        if (entity.name === 'designsafe.project.hybrid_simulation.exp_substructure') {
            entity.value.coordinators = _.without(
                entity.value.coordinators,
                nodeParent.data.uuid
            );
            nodeParent = nodeParent.parent;
        }
        if (entity.name === 'designsafe.project.hybrid_simulation.coordinator_output' ||
            entity.name === 'designsafe.project.hybrid_simulation.sim_output' ||
            entity.name === 'designsafe.project.hybrid_simulation.exp_output' ||
            entity.name === 'designsafe.project.hybrid_simulation.coordinator' ||
            entity.name === 'designsafe.project.hybrid_simulation.sim_substructure' ||
            entity.name === 'designsafe.project.hybrid_simulation.exp_substructure') {
            entity.value.globalModels = _.without(
                entity.value.globalModels,
                nodeParent.data.uuid
            );
            nodeParent = nodeParent.parent;
        }
        entity.value.hybridSimulations = _.without(
            entity.value.hybridSimulations,
            nodeParent.data.uuid
        );
        return this.removeAssociationIds(node, entity);
    }

    /*
     * @method
     * @param {Object} node. Hierarchical node so we can walk parents.
     * @param {Object} entity.
     *
     * Remove uuids to the correct attributes.
     * This is specific to Simulation project.
     */
    unrelateEntityToSimProject(node, entity){
        let nodeParent = node.parent;
        if (entity.name === 'designsafe.project.simulation.output') {
            entity.value.simInputs = _.without(
                entity.value.simInputs,
                nodeParent.data.uuid
            );
            nodeParent = nodeParent.parent;
        }
        if (entity.name === 'designsafe.project.simulation.output' ||
            entity.name === 'designsafe.project.simulation.input') {
            entity.value.modelConfigs = _.without(
                entity.value.modelConfigs,
                nodeParent.data.uuid
            );
            nodeParent = nodeParent.parent;
        }
        entity.value.simulations = _.without(
            entity.value.simulations,
            nodeParent.data.uuid
        );
        return this.removeAssociationIds(node, entity);
    }

    /*
     * @method
     * @param {Object} node. Hierarchical node so we can walk parents.
     * @param {Object} entity.
     *
     * Remove uuids to the correct attributes.
     * This is specific to Experimental project.
     */
    unrelateEntityToExperimental(node, entity){
        let nodeParent = node.parent;
        if (entity.name === 'designsafe.project.event') {
            entity.value.sensorLists = _.without(
                entity.value.sensorLists,
                nodeParent.data.uuid
            );
            nodeParent = nodeParent.parent;
        }
        if (entity.name === 'designsafe.project.event' ||
            entity.name === 'designsafe.project.sensor_list') {
            entity.value.modelConfigs = _.without(
                entity.value.modelConfigs,
                nodeParent.data.uuid
            );
            nodeParent = nodeParent.parent;
        }
        entity.value.experiments = _.without(
            entity.value.experiments,
            nodeParent.data.uuid
        );
        return this.removeAssociationIds(node, entity);
    }

    /*
     * @method
     * @param {Object} leaf.
     * @param {Object} entity.
     *
     * Add uuids to the correct attributes.
     * This is specific to Field Recon projects. We probably need to generalize this
     * but it's easier to read if we implement this method for every project type.
     * For Field Recon we need to relate:
     * - Missions.
     * - Collections.
     *
     * We only need to relate every parent to the entity.
     * For instance, a Collection  needs to have all of the above related but a Mission
     * only needs to have the project as a parent.
     */
    relateEntityToFieldReconProject(leaf, entity){
        let leafParent = leaf.parent;
        let highestOrder = -1;
        leafParent.children.forEach((child) => {
            if (child.data.order !== null && 
                child.data.type === entity.name &&
                child.data.order > highestOrder){
                highestOrder = child.data.order;
            }
        });
        highestOrder += 1;
        entity.setOrderFor(leafParent.data.uuid, highestOrder);
        entity.value.missions.push(leafParent.data.uuid);
        return this.addAssociationIds(leaf, entity);
    }

    /*
     * @method
     * @param {Object} leaf.
     * @param {Object} entity.
     *
     * Add uuids to the correct attributes.
     * This is specific to Hybrid Simulation projects. We probably need to generalize this
     * but it's easier to read if we implement this method for every project type.
     * For Hybrid Simulation we need to relate:
     * - Hybrid Simulations.
     * - Global Models
     * - Coordinators.
     * - Numerical Substructures.
     * - Experimental Substructures.
     * We only need to relate every parent to the entity.
     * For instance, an Output needs to have all of the above related but a Coordinators
     * only needs to have Global Models and Hybrid Simulations related.
     */
    relateEntityToHybridSimProject(leaf, entity){
        let leafParent = leaf.parent;
        let highestOrder = -1;
        _.each(leafParent.children, (child) => {
            if (child.data.order !== null && 
                child.data.type === entity.name &&
                child.data.order > highestOrder){
                highestOrder = child.data.order;
            }
        });
        highestOrder += 1;
        entity.setOrderFor(leafParent.data.uuid, highestOrder);
        if (leaf.data.entityType == 'coordinatorOutput') {
            entity.value.coordinators.push(leafParent.data.uuid);
            leafParent = leafParent.parent;
        } else if (leaf.data.entityType == 'simOutput') {
            entity.value.simSubstructures.push(leafParent.data.uuid);
            leafParent = leafParent.parent;
        } else if (leaf.data.entityType == 'expOutput') {
            entity.value.expSubstructures.push(leafParent.data.uuid);
            leafParent = leafParent.parent;
        }
        if(leaf.data.entityType == 'simSubstructure' ||
            leaf.data.entityType == 'expSubstructure'){
            entity.value.coordinators.push(leafParent.data.uuid);
            leafParent = leafParent.parent;
        }
        if (leaf.data.entityType == 'coordinatorOutput' ||
            leaf.data.entityType == 'simOutput' ||
            leaf.data.entityType == 'expOutput' ||
            leaf.data.entityType == 'coordinator' ||
            leaf.data.entityType == 'simSubstructure' ||
            leaf.data.entityType == 'expSubstructure') {
            entity.value.globalModels.push(leafParent.data.uuid);
            leafParent = leafParent.parent;
        }
        entity.value.hybridSimulations.push(leafParent.data.uuid);
        return this.addAssociationIds(leaf, entity);
    }

    /*
     * @method
     * @param {Object} leaf.
     * @param {Object} entity.
     *
     * Add uuids to the correct attributes.
     * This is specific to Simulation projects. We probably need to generalize this
     * but it's easier to read if we implement this method for every project type.
     * For Simulation we need to relate:
     * - Simulations.
     * - Simulation Model.
     * - Simulation Input.
     * We only need to relate every parent to the entity.
     * For instance, an Output needs to have all of the above related but a Simulation Input
     * only needs to have Simulation Model and Simulations related.
     */
    relateEntityToSimProject(leaf, entity){
        let leafParent = leaf.parent;
        let highestOrder = -1;
        _.each(leafParent.children, (child) => {
            if (child.data.order !== null && 
                child.data.type === entity.name &&
                child.data.order > highestOrder){
                highestOrder = child.data.order;
            }
        });
        highestOrder += 1;
        entity.setOrderFor(leafParent.data.uuid, highestOrder);
        if (leaf.data.entityType == 'output') {
            entity.value.simInputs.push(leafParent.data.uuid);
            leafParent = leafParent.parent;
        }
        if (leaf.data.entityType == 'output' ||
            leaf.data.entityType == 'input') {
            entity.value.modelConfigs.push(leafParent.data.uuid); //check model configs
            leafParent = leafParent.parent;
        }
        entity.value.simulations.push(leafParent.data.uuid);
        return this.addAssociationIds(leaf, entity);
    }

    /*
     * @method
     * @param {Object} leaf.
     * @param {Object} entity.
     *
     * Add uuids to the correct attributes.
     * This is specific to Experimental project. We probably need to generalize this
     * but it's easier to read if we implement this method for every project type.
     * For experimental we need to relate:
     * - Experiments.
     * - Model configurations.
     * - Sensor Infos.
     * We only need to relate every parent to the entity.
     * For instance, an event needs to have all of the above related but a sensor info
     * only needs to have Model Configurations and Experiments related.
     */
    relateEntityToExperimental(leaf, entity){
        let leafParent = leaf.parent;
        let highestOrder = -1;
        _.each(leafParent.children, (child) => {
            if (child.data.order !== null && 
                child.data.type === entity.name &&
                child.data.order > highestOrder){
                highestOrder = child.data.order;
            }
        });
        highestOrder += 1;
        entity.setOrderFor(leafParent.data.uuid, highestOrder);
        if (leaf.data.entityType == 'event') {
            entity.value.sensorLists.push(leafParent.data.uuid);
            leafParent = leafParent.parent;
        }
        if (leaf.data.entityType == 'event' ||
            leaf.data.entityType == 'sensorList') {
            entity.value.modelConfigs.push(leafParent.data.uuid);
            leafParent = leafParent.parent;
        }
        entity.value.experiments.push(leafParent.data.uuid);
        return this.addAssociationIds(leaf, entity);
    }

    /*
     * @method
     * @param {Object} primary entities.
     *
     * Primary entities will have to have their order
     * established when the trees modal is opened. Normally
     * We create an order when an entity is added to the tree.
     * Primary entities related directly to the project cannot
     * be added/removed as other entities (as this would mean
     * adding/removing their relationship to the project). 
     * We will run initiateEntityOrder for primary entities 
     * and reports associated to the project.
     */
    initiateEntityOrder(entities){
        this._ui.loading = true;
        let promises = [];

        let getOrder = (ent) => {
            return ent._ui.orders.find(order => order.parent === this.project.uuid);
        };

        let ordered = entities.filter(entity => getOrder(entity));
        let unordered = entities.filter(entity => !getOrder(entity));

        ordered.sort((a, b) => (getOrder(a).value > getOrder(b).value) ? 1 : -1);

        ordered.forEach((ent, index) => {
            if (getOrder(ent).value != index) {
                ent.setOrderFor(this.project.uuid, index);
            }
        });

        unordered.forEach((ent, index) => {
            let order = ordered.length + index;
            ent.setOrderFor(this.project.uuid, order);
        });

        let sorted = ordered.concat(unordered);
        sorted.forEach((ent) => {
            promises.push(
                this.ProjectEntitiesService.update({
                    data: {
                        uuid: ent.uuid,
                        entity: ent,
                    },
                })
            );
        });

        this.$q.all(promises).then( (resps) => {
            _.each(resps, (resp) => {
                let ent = this.project.getRelatedByUuid(resp.uuid);
                ent.update(resp);
            });
        }).then( () => {
            this.drawProjectTrees();
        }).finally( () => {
            this._ui.loading = false;
        });
    }

    /*
     * @method
     *
     * Build tress for every Mission in this class' `this.project`.
     * The hierarchy is build like so:
     *
     * + Mission 1
     * |
     * -- + Collection 1
     * |
     * -- + Collection 2
     * 
     * + Mission 2
     * [...]
     */
    buildFieldReconTree() {
        let missions = [];
        this.project.allCollections = this.project.socialscience_set.concat(
            this.project.geoscience_set,
            this.project.planning_set
        );
        if (this.rootCategoryUuid) {
            missions = _.filter(
                this.project.mission_set,
                (mission) => {
                    return mission.uuid === this.rootCategoryUuid;
                }
            );
        } else {
            missions = _.sortBy(
                this.project.mission_set,
                (mission) => {
                    return mission.value.title;
                }
            );
        }
        let collections = this.project.allCollections.sort((col) => {
            return col.value.title;
        });
        let reports = _.sortBy(
            this.project.report_set,
            (rep) => { return rep.value.title; }
        );
        let roots = [];
        let projectNode = {
            name: this.project.value.projectId + ' | ' + this.project.value.title,
            uuid: this.project.uuid,
            parent: null,
            children: [],
            rectStyle: 'stroke: none;',
        };
        _.each(reports, (report) => {
            let repNode = {
                name: report.value.title,
                uuid: report.uuid,
                type: report.name,
                parent: projectNode.name,
                rectStyle: 'stroke: #3E3E3E; fill: #C4C4C4;',
                display: 'Report',
                primary: true,
                order: this.orderOf(report, projectNode.uuid).value,
            };
            projectNode.children.push(repNode);
        });
        _.each(missions, (mission) => {
            let node = {
                name: mission.value.title,
                uuid: mission.uuid,
                type: mission.name,
                parent: projectNode.name,
                rectStyle: 'stroke: #000000; fill: #ffffff;',
                display: 'Mission',
                primary: true,
                order: this.orderOf(mission, projectNode.uuid).value,
                children: [],
            };
            collections.forEach((col) => {
                if (!_.contains(col.associationIds, node.uuid)){
                    return;
                }
                let collectionName = 'Collection';
                let collectionStyle = 'stroke: #B59300; fill: #ECE4BF;';
                if (col.name === 'designsafe.project.field_recon.planning') {
                    collectionName = 'Research Planning Collection';
                    collectionStyle = 'stroke: #43A59D; fill: #CAE9E6;';
                } else if (col.name === 'designsafe.project.field_recon.geoscience') {
                    collectionName = 'Engineering/Geosciences Collection';
                } else if (col.name === 'designsafe.project.field_recon.social_science') {
                    collectionName = 'Social Sciences Collection';
                }
                let colNode = {
                    name: col.value.title,
                    type: col.name,
                    uuid: col.uuid,
                    parent: node.name,
                    children: [],
                    rectStyle: collectionStyle,
                    display: collectionName,
                    order: this.orderOf(col, node.uuid).value,
                };
                node.children.push(colNode);
            });
            node.children = _.sortBy(node.children, (child) => {
                if (child.order !== null) {
                    return child.order;
                }
                return child.name;
            });
            if (!this.readOnly) {
                node.children.push(
                    {
                        name: '-- Choose a Collection --',
                        attr: 'allCollections',
                        entityType: 'collection',
                    }
                );
            }
            projectNode.children.push(node);
        });
        projectNode.children = _.sortBy(projectNode.children, (child) => {
            if (child.order !== null) {
                return child.order;
            }
            return child.name;
        });
        roots.push(projectNode);
        this.trees = roots;
    }

    /*
     * @method
     *
     * Build tress for every Hybrid Simulation in this class' `this.project`.
     * The hierarchy is build like so:
     * + Simulation 1
     * |
     * -- + Report
     * |
     * -- + Global Model
     * | |
     * | -- + Master Simulator Coordinator
     * |    |
     * |    -- + Coordinator Output
     * |    |
     * |    -- + Numerical Substructure
     * |    |  |
     * |    |  -- + Simulation Output
     * |    |
     * |    -- + Experimental Substructure
     * |       |
     * |       -- + Experimental Output
     * |
     * -- + Analysis
     *
     * + Simulation 2
     * [...]
     */
    buildHybridSimulationTree() {
        let simulations = [];
        if (this.rootCategoryUuid) {
            simulations = _.filter(
                this.project.hybridsimulation_set,
                (sim) => { return sim.uuid === this.rootCategoryUuid; }
            );
        } else {
            simulations = _.sortBy(
                this.project.hybridsimulation_set,
                (sim) => { return sim.value.title; }
            );
        }
        let models = _.sortBy(this.project.globalmodel_set, (mod) => { return mod.value.title; });
        let coordinators = _.sortBy(this.project.coordinator_set, (coor) => { return coor.value.title; });
        let coordOutputs = _.sortBy(this.project.coordinatoroutput_set, (cout) => { return cout.value.title; });
        let numericals = _.sortBy(this.project.simsubstructure_set, (num) => { return num.value.title; });
        let simOutputs = _.sortBy(this.project.simoutput_set, (sout) => { return sout.value.title; });
        let experimentals = _.sortBy(this.project.expsubstructure_set, (exp) => { return exp.value.title; });
        let expOutputs = _.sortBy(this.project.expoutput_set, (eout) => { return eout.value.title; });
        let reports = _.sortBy(this.project.report_set, (rep) => { return rep.value.title; });
        let analysis = _.sortBy(this.project.analysis_set, (ana) => { return ana.value.title; });
        let roots = [];
        _.each(simulations, (sim) => {
            let node = {
                name: sim.value.title,
                type: sim.name,
                uuid: sim.uuid,
                parent: null,
                children: [],
                rectStyle: 'stroke: none;',
            };
            let childReports = [];
            _.each(reports, (rep) => {
                if (!_.contains(rep.associationIds, node.uuid)){
                    return;
                }
                let repNode = {
                    name: rep.value.title,
                    type: rep.name,
                    uuid: rep.uuid,
                    parent: node.name,
                    rectStyle: 'stroke: #3E3E3E; fill: #C4C4C4;',
                    display: 'Report',
                    order: this.orderOf(rep, node.uuid).value,
                };
                childReports.push(repNode);
            });
            childReports = _.sortBy(childReports, (child) => {
                if (child.order !== null) {
                    return child.order;
                }
                return child.name;
            });
            node.children = node.children.concat(childReports);
            if (!this.readOnly) {
                node.children.push(
                    {
                        name: '-- Choose a Report --',
                        attr: 'report_set',
                        entityType: 'report',
                    }
                );
            }
            let childModels = [];
            _.each(models, (mod) => {
                if (!_.contains(mod.associationIds, node.uuid)){
                    return;
                }
                let modNode = {
                    name: mod.value.title,
                    type: mod.name,
                    uuid: mod.uuid,
                    parent: node.name,
                    children: [],
                    rectStyle: 'stroke: #1568C9; fill: #C4D9F2;',
                    display: 'Global Model',
                    order: this.orderOf(mod, node.uuid).value,
                };
                let childCoords = [];
                _.each(coordinators, (coord) => {
                    if (_.difference([mod.uuid, node.uuid], coord.associationIds).length){
                        return;
                    }
                    let coordNode = {
                        name: coord.value.title,
                        type: coord.name,
                        uuid: coord.uuid,
                        parent: modNode.name,
                        children: [],
                        rectStyle: 'stroke: #43A59D; fill: #CAE9E6;',
                        display: 'Master Simulator Coordinator',
                        order: this.orderOf(coord, modNode.uuid).value,
                    };
                    let childCoordOuts = [];
                    _.each(coordOutputs, (output) => {
                        if (_.difference([coord.uuid, mod.uuid, sim.uuid], output.associationIds).length){
                            return;
                        }
                        let outNode = {
                            name: output.value.title,
                            type: output.name,
                            uuid: output.uuid,
                            parent: coordNode.name,
                            children: [],
                            rectStyle: 'stroke: #B59300; fill: #ECE4BF;',
                            display: 'Coordinator Output',
                            order: this.orderOf(output, coordNode.uuid).value,
                        };
                        childCoordOuts.push(outNode);
                    });
                    childCoordOuts = _.sortBy(childCoordOuts, (child) => {
                        if (child.order !== null) {
                            return child.order;
                        }
                        return child.name;
                    });
                    coordNode.children = coordNode.children.concat(childCoordOuts);
                    if (!this.readOnly) {
                        coordNode.children.push(
                            {
                                name: '-- Choose an Output --',
                                attr: 'coordinatoroutput_set',
                                entityType: 'coordinatorOutput',
                            }
                        );
                    }
                    let childNumericals = [];
                    _.each(numericals, (num) => {
                        if (_.difference([coord.uuid, mod.uuid, sim.uuid], num.associationIds).length){
                            return;
                        }
                        let numNode = {
                            name: num.value.title,
                            type: num.name,
                            uuid: num.uuid,
                            parent: coordNode.name,
                            children: [],
                            rectStyle: 'stroke: #BD5717; fill: #EBCCB9;',
                            display: 'Numerical Substructure',
                            order: this.orderOf(num, coordNode.uuid).value,
                        };
                        let childSimOuts = [];
                        _.each(simOutputs, (out) => {
                            if (_.difference([num.uuid, mod.uuid, sim.uuid], out.associationIds).length){
                                return;
                            }
                            let outNode = {
                                name: out.value.title,
                                type: out.name,
                                uuid: out.uuid,
                                parent: num.name,
                                children: [],
                                rectStyle: 'stroke: #B59300; fill: #ECE4BF;',
                                display: 'Simulation Output',
                                order: this.orderOf(out, num.uuid).value,
                            };
                            childSimOuts.push(outNode);
                        });
                        childSimOuts = _.sortBy(childSimOuts, (child) => {
                            if (child.order !== null) {
                                return child.order;
                            }
                            return child.name;
                        });
                        numNode.children = numNode.children.concat(childSimOuts);
                        if (!this.readOnly) {
                            numNode.children.push(
                                {
                                    name: '-- Choose a Simulation Output --',
                                    attr: 'simoutput_set',
                                    entityType: 'simOutput',
                                }
                            );
                        }
                        childNumericals.push(numNode);
                    });
                    childNumericals = _.sortBy(childNumericals, (child) => {
                        if (child.order !== null) {
                            return child.order;
                        }
                        return child.name;
                    });
                    coordNode.children = coordNode.children.concat(childNumericals);
                    if (!this.readOnly) {
                        coordNode.children.push(
                            {
                                name: '-- Choose a Numerical Substructure --',
                                attr: 'simsubstructure_set',
                                entityType: 'simSubstructure',
                            }
                        );
                    }
                    let childExperimentals = [];
                    _.each(experimentals, (exp) => {
                        if (_.difference([coord.uuid, mod.uuid, sim.uuid], exp.associationIds).length){
                            return;
                        }
                        let expNode = {
                            name: exp.value.title,
                            type: exp.name,
                            uuid: exp.uuid,
                            parent: coordNode.name,
                            children: [],
                            rectStyle: 'stroke: #4B3181; fill: #C8C0D9;',
                            display: 'Experimental Substructure',
                            order: this.orderOf(exp, coordNode.uuid).value,
                        };
                        let childExpOuts = [];
                        _.each(expOutputs, (out) => {
                            if (_.difference([exp.uuid, mod.uuid, sim.uuid], out.associationIds).length){
                                return;
                            }
                            let outNode = {
                                name: out.value.title,
                                type: out.name,
                                uuid: out.uuid,
                                parent: exp.name,
                                children: [],
                                rectStyle: 'stroke: #B59300; fill: #ECE4BF;',
                                display: 'Experiental Output',
                                order: this.orderOf(out, exp.uuid).value,
                            };
                            childExpOuts.push(outNode);
                        });
                        childExpOuts = _.sortBy(childExpOuts, (child) => {
                            if (child.order !== null) {
                                return child.order;
                            }
                            return child.name;
                        });
                        expNode.children = expNode.children.concat(childExpOuts);
                        if (!this.readOnly) {
                            expNode.children.push(
                                {
                                    name: '-- Choose a Experimental Output --',
                                    attr: 'expoutput_set',
                                    entityType: 'expOutput',
                                }
                            );
                        }
                        childExperimentals.push(expNode);
                    });
                    childExperimentals = _.sortBy(childExperimentals, (child) => {
                        if (child.order !== null) {
                            return child.order;
                        }
                        return child.name;
                    });
                    coordNode.children = coordNode.children.concat(childExperimentals);
                    if (!this.readOnly) {
                        coordNode.children.push(
                            {
                                name: '-- Choose a Experimental Substructure --',
                                attr: 'expsubstructure_set',
                                entityType: 'expSubstructure',
                            }
                        );
                    }
                    childCoords.push(coordNode);
                });
                childCoords = _.sortBy(childCoords, (child) => {
                    if (child.order !== null) {
                        return child.order;
                    }
                    return child.name;
                });
                modNode.children = modNode.children.concat(childCoords);
                if (!this.readOnly) {
                    modNode.children.push(
                        {
                            name: '-- Choose an Master Coordinator --',
                            attr: 'coordinator_set',
                            entityType: 'coordinator',
                        }
                    );
                }
                childModels.push(modNode);
            });
            childModels = _.sortBy(childModels, (child) => {
                if (child.order !== null) {
                    return child.order;
                }
                return child.name;
            });
            node.children = node.children.concat(childModels);
            if (!this.readOnly) {
                node.children.push(
                    {
                        name: '-- Choose a Simulation Model --',
                        attr: 'globalmodel_set',
                        entityType: 'model',
                    }
                );
            }
            let childAnalysis = [];
            _.each(analysis, (ana) => {
                if (!_.contains(ana.associationIds, node.uuid)){
                    return;
                }
                let anaNode = {
                    name: ana.value.title,
                    type: ana.name,
                    uuid: ana.uuid,
                    parent: node.name,
                    rectStyle: 'stroke: #56C0E0; fill: #CCECF6;',
                    display: 'Analysis',
                    order: this.orderOf(ana, node.uuid).value,
                };
                childAnalysis.push(anaNode);
            });
            childAnalysis = _.sortBy(childAnalysis, (child) => {
                if (child.order !== null) {
                    return child.order;
                }
                return child.name;
            });
            node.children = node.children.concat(childAnalysis);
            if (!this.readOnly) {
                node.children.push(
                    {
                        name: '-- Choose an Analysis --',
                        attr: 'analysis_set',
                        entityType: 'analysis',
                    }
                );
            }
            roots.push(node);
        });
        this.trees = roots;
    }

    /*
     * @method
     *
     * Build tress for every experiment in this class' `this.project`.
     * The hierarchy is build like so:
     * + Simulation 1
     * |
     * -- + Report
     * |
     * -- + Simulation Model
     * | |
     * | -- + Simulation Input
     * |    |
     * |    -- + Simulation Output
     * |
     * -- + Analysis
     *
     * + Simulation 2
     * [...]
     */
    buildSimulationTree() {
        let simulations = [];
        if ( this.rootCategoryUuid ) {
            simulations = _.filter(
                this.project.simulation_set,
                (sim) => { return sim.uuid === this.rootCategoryUuid; }
            );
        } else {
            simulations = _.sortBy(this.project.simulation_set, (sim) => { return sim.value.title; });
        }
        let models = _.sortBy(this.project.model_set, (mod) => { return mod.value.title; });
        let inputs = _.sortBy(this.project.input_set, (inp) => { return inp.value.title; });
        let outputs = _.sortBy(this.project.output_set, (out) => { return out.value.title; });
        let reports = _.sortBy(this.project.report_set, (rep) => { return rep.value.title; });
        let analysis = _.sortBy(this.project.analysis_set, (ana) => { return ana.value.title; });
        let roots = [];
        _.each(simulations, (sim) => {
            let node = {
                name: sim.value.title,
                type: sim.name,
                uuid: sim.uuid,
                parent: null,
                children: [],
                rectStyle: 'stroke: none;',
            };
            let childReports = [];
            _.each(reports, (rep) => {
                if (!_.contains(rep.associationIds, node.uuid)){
                    return;
                }
                let repNode = {
                    name: rep.value.title,
                    type: rep.name,
                    uuid: rep.uuid,
                    parent: node.name,
                    rectStyle: 'stroke: #3E3E3E; fill: #C4C4C4;',
                    display: 'Report',
                    order: this.orderOf(rep, node.uuid).value,
                };
                childReports.push(repNode);
            });
            childReports = _.sortBy(childReports, (child) => {
                if (child.order !== null) {
                    return child.order;
                }
                return child.name;
            });
            node.children = node.children.concat(childReports);
            if (!this.readOnly) {
                node.children.push(
                    {
                        name: '-- Choose a Report --',
                        attr: 'report_set',
                        entityType: 'report',
                    }
                );
            }
            let childModel = [];
            _.each(models, (mod) => {
                if (!_.contains(mod.associationIds, node.uuid)){
                    return;
                }
                let modNode = {
                    name: mod.value.title,
                    type: mod.name,
                    uuid: mod.uuid,
                    parent: node.name,
                    children: [],
                    rectStyle: 'stroke: #1568C9; fill: #C4D9F2;',
                    display: 'Simulation Model',
                    order: this.orderOf(mod, node.uuid).value,
                };
                let childInputs = [];
                _.each(inputs, (input) => {
                    if (_.difference([modNode.uuid, node.uuid], input.associationIds).length){
                        return;
                    }
                    let inpNode = {
                        name: input.value.title,
                        type: input.name,
                        uuid: input.uuid,
                        parent: modNode.name,
                        children: [],
                        rectStyle: 'stroke: #43A59D; fill: #CAE9E6;',
                        display: 'Simulation Input',
                        order: this.orderOf(input, modNode.uuid).value,
                    };
                    let childOutputs = [];
                    _.each(outputs, (output) => {
                        if (_.difference([input.uuid, modNode.uuid, node.uuid], output.associationIds).length){
                            return;
                        }
                        let outputNode = {
                            name: output.value.title,
                            type: output.name,
                            uuid: output.uuid,
                            parent: inpNode.name,
                            children: [],
                            rectStyle: 'stroke: #B59300; fill: #ECE4BF;',
                            display: 'Simulation Output',
                            order: this.orderOf(output, inpNode.uuid).value,
                        };
                        childOutputs.push(outputNode);
                    });
                    childOutputs = _.sortBy(childOutputs, (child) => {
                        if (child.order !== null) {
                            return child.order;
                        }
                        return child.name;
                    });
                    inpNode.children = inpNode.children.concat(childOutputs);
                    if (!this.readOnly) {
                        inpNode.children.push(
                            {
                                name: '-- Choose an Output --',
                                attr: 'output_set',
                                entityType: 'output',
                            }
                        );
                    }
                    childInputs.push(inpNode);
                });
                childInputs = _.sortBy(childInputs, (child) => {
                    if (child.order !== null) {
                        return child.order;
                    }
                    return child.name;
                });
                modNode.children = modNode.children.concat(childInputs);
                if (!this.readOnly) {
                    modNode.children.push(
                        {
                            name: '-- Choose an Input --',
                            attr: 'input_set',
                            entityType: 'input',
                        }
                    );
                }
                childModel.push(modNode);
            });
            childModel = _.sortBy(childModel, (child) => {
                if (child.order !== null) {
                    return child.order;
                }
                return child.name;
            });
            node.children = node.children.concat(childModel);
            if (!this.readOnly) {
                node.children.push(
                    {
                        name: '-- Choose a Simulation Model --',
                        attr: 'model_set',
                        entityType: 'model',
                    }
                );
            }
            let childAnalysis = [];
            _.each(analysis, (ana) => {
                if (!_.contains(ana.associationIds, node.uuid)){
                    return;
                }
                let anaNode = {
                    name: ana.value.title,
                    type: ana.name,
                    uuid: ana.uuid,
                    parent: node.name,
                    rectStyle: 'stroke: #56C0E0; fill: #CCECF6;',
                    display: 'Analysis',
                    order: this.orderOf(ana, node.uuid).value
                };
                childAnalysis.push(anaNode);
            });
            childAnalysis = _.sortBy(childAnalysis, (child) => {
                if (child.order !== null) {
                    return child.order;
                }
                return child.name;
            });
            node.children = node.children.concat(childAnalysis);
            if (!this.readOnly) {
                node.children.push(
                    {
                        name: '-- Choose an Analysis --',
                        attr: 'analysis_set',
                        entityType: 'analysis',
                    }
                );
            }
            roots.push(node);
        });
        this.trees = roots;
    }

    /*
     * @method
     *
     * Build tress for every experiment in this class' `this.project`.
     * The hierarchy is build like so:
     * + Experiment 1
     * |
     * -- + Report
     * |
     * -- + Model Config
     * | |
     * | -- + Sensor Info
     * |    |
     * |    -- + Events
     * |
     * -- + Analysis
     *
     * + Experiment 2
     * [...]
     */
    buildExperimentalTree() {
        let experiments = [];
        if (this.rootCategoryUuid) {
            experiments = _.filter(
                this.project.experiment_set,
                (exp) => { return exp.uuid === this.rootCategoryUuid; }
            );
        } else {
            experiments = _.sortBy(this.project.experiment_set, (exp) => { return exp.value.title; });
        }
        let modelConfigs = _.sortBy(this.project.modelconfig_set, (mod) => { return mod.value.title; });
        let sensors = _.sortBy(this.project.sensorlist_set, (sen) => { return sen.value.title; });
        let events = _.sortBy(this.project.event_set, (evt) => { return evt.value.title; });
        let reports = _.sortBy(this.project.report_set, (rep) => { return rep.value.title; });
        let analysis = _.sortBy(this.project.analysis_set, (ana) => { return ana.value.title; });
        let roots = [];
        _.each(experiments, (exp) => {
            let node = {
                name: exp.value.title,
                type: exp.name,
                uuid: exp.uuid,
                parent: null,
                children: [],
                rectStyle: 'stroke: none;',
            };
            let childReports = [];
            _.each(reports, (rep) => {
                if (!_.contains(rep.associationIds, node.uuid)){
                    return;
                }
                let repNode = {
                    name: rep.value.title,
                    type: rep.name,
                    uuid: rep.uuid,
                    parent: node.name,
                    rectStyle: 'stroke: #3E3E3E; fill: #C4C4C4;',
                    display: 'Report',
                    order: this.orderOf(rep, node.uuid).value,
                };
                childReports.push(repNode);
            });
            childReports = _.sortBy(childReports, (child) => {
                if (child.order !== null) {
                    return child.order;
                }
                return child.name;
            });
            node.children = node.children.concat(childReports);
            if (!this.readOnly) {
                node.children.push(
                    {
                        name: '-- Choose a Report --',
                        attr: 'report_set',
                        entityType: 'report',
                    }
                );
            }
            let childModels = [];
            _.each(modelConfigs, (mcfg) => {
                if (!_.contains(mcfg.associationIds, node.uuid)){
                    return;
                }
                let mcfgNode = {
                    name: mcfg.value.title,
                    type: mcfg.name,
                    uuid: mcfg.uuid,
                    parent: node.name,
                    children: [],
                    rectStyle: 'stroke: #1568C9; fill: #C4D9F2;',
                    display: 'Model Config',
                    order: this.orderOf(mcfg, node.uuid).value,
                };
                let childSensors = [];
                _.each(sensors, (sensor) => {
                    if (_.difference([mcfgNode.uuid, node.uuid], sensor.associationIds).length){
                        return;
                    }
                    let sensorNode = {
                        name: sensor.value.title,
                        type: sensor.name,
                        uuid: sensor.uuid,
                        parent: mcfgNode.name,
                        children: [],
                        rectStyle: 'stroke: #43A59D; fill: #CAE9E6;',
                        display: 'Sensor',
                        order: this.orderOf(sensor, mcfgNode.uuid).value,
                    };
                    let childEvents = [];
                    _.each(events, (evt) => {
                        if (_.difference([sensor.uuid, mcfgNode.uuid, node.uuid], evt.associationIds).length){
                            return;
                        }
                        let eventNode = {
                            name: evt.value.title,
                            type: evt.name,
                            uuid: evt.uuid,
                            parent: sensorNode.name,
                            children: [],
                            rectStyle: 'stroke: #B59300; fill: #ECE4BF;',
                            display: 'Event',
                            order: this.orderOf(evt, sensorNode.uuid).value,
                        };
                        childEvents.push(eventNode);
                    });
                    childEvents = _.sortBy(childEvents, (child) => {
                        if (child.order !== null) {
                            return child.order;
                        }
                        return child.name;
                    });
                    sensorNode.children = sensorNode.children.concat(childEvents);
                    if (!this.readOnly) {
                        sensorNode.children.push(
                            {
                                name: '-- Choose an Event --',
                                attr: 'event_set',
                                entityType: 'event',
                            }
                        );
                    }
                    childSensors.push(sensorNode);
                });
                childSensors = _.sortBy(childSensors, (child) => {
                    if (child.order !== null) {
                        return child.order;
                    }
                    return child.name;
                });
                mcfgNode.children = mcfgNode.children.concat(childSensors);
                if (!this.readOnly) {
                    mcfgNode.children.push(
                        {
                            name: '-- Choose a Sensor Info --',
                            attr: 'sensorlist_set',
                            entityType: 'sensorList',
                        }
                    );
                }
                childModels.push(mcfgNode);
            });
            childModels = _.sortBy(childModels, (child) => {
                if (child.order !== null) {
                    return child.order;
                }
                return child.name;
            });
            node.children = node.children.concat(childModels);
            if (!this.readOnly) {
                node.children.push(
                    {
                        name: '-- Choose a Model Config --',
                        attr: 'modelconfig_set',
                        entityType: 'modelConfig',
                    }
                );
            }
            let childAnalysis = [];
            _.each(analysis, (ana) => {
                if (!_.contains(ana.associationIds, node.uuid)){
                    return;
                }
                let anaNode = {
                    name: ana.value.title,
                    type: ana.name,
                    uuid: ana.uuid,
                    parent: node.name,
                    rectStyle: 'stroke: #56C0E0; fill: #CCECF6;',
                    display: 'Analysis',
                    order: this.orderOf(ana, node.uuid).value
                };
                childAnalysis.push(anaNode);
            });
            childAnalysis = _.sortBy(childAnalysis, (child) => {
                if (child.order !== null) {
                    return child.order;
                }
                return child.name;
            });
            node.children = node.children.concat(childAnalysis);
            if (!this.readOnly) {
                node.children.push(
                    {
                        name: '-- Choose an Analysis --',
                        attr: 'analysis_set',
                        entityType: 'analysis',
                    }
                );
            }
            roots.push(node);
        });
        this.trees = roots;
    }

    /*
     * @method
     * @param {Object} Node as created by D3.js
     *
     * Move node up or down in the tree. Basically manipulates custom order weight.
     * Moving a node up or down in the tree means subtracting one (for up)
     * or adding one (for down) to the order weight,
     * and adding one (for up) and subtracting one (for down) to the sibling's node order weight.
     * Essentially swapping two sibling nodes.
     */
    moveNode(node, direction) {
        this._ui.loading = true;
        let entity = this.project.getRelatedByUuid(node.data.uuid);
        let parentNode = node.parent;
        let promises = [];
        let siblingNodes;

        if (node.data.primary) {
            siblingNodes = parentNode.children.filter((child) => {
                if (direction === 'up') {
                    return child.data.primary && node.data.primary && child.data.order === node.data.order - 1;
                }
                return child.data.primary && node.data.primary && child.data.order === node.data.order + 1;
            });
        } else {
            siblingNodes = parentNode.children.filter((child) => {
                if (direction === 'up') {
                    return child.data.type === node.data.type && child.data.order === node.data.order - 1;
                }
                return child.data.type === node.data.type && child.data.order === node.data.order + 1;
            });
        }
        if (!siblingNodes.length) {
            this._ui.loading = false;
            return;
        }
        let siblingEntity = this.project.getRelatedByUuid(siblingNodes[0].data.uuid);
        siblingEntity.setOrderFor(parentNode.data.uuid, node.data.order);
        promises.push(
            this.ProjectEntitiesService.update({
                data: {
                    uuid: siblingEntity.uuid,
                    entity: siblingEntity,
                },
            })
        );
        if (direction === 'up') {
            entity.setOrderFor(parentNode.data.uuid, node.data.order - 1);
        } else {
            entity.setOrderFor(parentNode.data.uuid, node.data.order + 1);
        }
        promises.push(
            this.ProjectEntitiesService.update({
                data: {
                    uuid: entity.uuid,
                    entity: entity,
                },
            })
        );
        this.$q.all(promises).then( (resps) => {
            _.each(resps, (resp) => {
                let ent = this.project.getRelatedByUuid(resp.uuid);
                ent.update(resp);
            });
        }).then( () => {
            this.drawProjectTrees();
        }).finally( () => {
            this._ui.loading = false;
        });
    }

    moveNodeUp(node) {
        this.moveNode(node, 'up');
    }

    moveNodeDown(node) {
        this.moveNode(node, 'down');
    }

    $postLink() {
        // Hack to wait for Modal to render so we can
        // measure text width in SVG. Ugh!
        this._ui.loading = true;
        setTimeout( () => {
            this.drawProjectTrees();
            this._ui.loading = false;
            this.$scope.$apply();
        }, 500);
    }

    drawTree(root, treeIndex, XOffset, YOffset) {
        let canvas = d3.select('.project-tree #relation-tree');
        let treeNodes = d3.hierarchy(root);
        let bboxes = {};
        let maxX = 0;
        let maxY = 0;
        let index = -1;
        treeNodes.eachBefore( (n) => {
            n.y = ++index * 50;
            n.x = n.depth * 50;
            maxX = n.x;
            maxY = n.y;
            if (!n.height && !n.data.uuid) {
                n.data.style = {
                    position: 'absolute',
                    left: n.x + 25 + XOffset,
                    top: n.y + 10 + YOffset,
                };
                if (!this.readOnly) {
                    this.dropdownsData.push(n);
                }
            }
        });
        this.trees[treeIndex].maxY = maxY;
        this.trees[treeIndex].maxX = maxX;
        let svg = canvas.append('svg')
            .attr('width', 868)
            .attr('height', maxY + 50)
            .attr('class', 'tree-svg');
        let group = svg.append('g')
            .attr('transform', 'translate(' + 25 + ', ' + 25 + ')');
        group.selectAll('.link')
            .data(treeNodes.descendants().slice(1))
            .enter()
            .append('path')
            .attr('class', 'link')
            .attr('d', (d) => {
                let m = '' + d.parent.x + ',' + d.parent.y;
                let v = d.y;
                let h = d.x;
                return 'M ' + m + ' ' +
                       'V ' + v + ' ' +
                       'H ' + h;
            })
            .attr('fill', 'none')
            .attr('stroke', 'black');
        let nodes = group.selectAll('.node')
            .data(treeNodes.descendants())
            .enter()
            .append('g')
            .attr('class', (d) => {
                return d.data.name;
            })
            .attr('data-uuid', (d) => {
                return d.uuid;
            })
            .attr('transform', (d) => {
                return 'translate(' + d.x + ',' + d.y + ')';
            });
        nodes.append('rect')
            .attr('id', 'entityTag')
            .attr('width', 100)
            .attr('height', 25)
            .attr('rx', 5)
            .attr('ry', 5)
            .attr('fill', 'none')
            .attr('y', -12)
            .attr('style', (d) => {
                return d.data.rectStyle;
            });
        nodes.append('text')
            .text( (d) => {
                return d.data.display;
            })
            .attr('class', 'entity-label')
            .attr('style', (d) => {
                if (!d.data.uuid) {
                    return 'display: none';
                }
                return '';
            })
            .attr('y', 5)
            .attr('x', 5);

        svg.selectAll('text.entity-label')
            .each((d, i, nds) => {
                if (d.data.uuid) {
                    let t = nds[i].getBBox();
                    bboxes[d.data.uuid] = t;
                    d.data.btnStyle = {
                        position: 'absolute',
                        left: d.x + 25 + XOffset + t.width,
                        top: d.y + 10 + YOffset,
                    };
                    if (!this.readOnly) {
                        this.buttonsData.push(d);
                    }
                }
            });
        
        nodes.append('rect')
            .attr('width', (d) => {
                if (d.data.uuid && d.depth) {
                    let left = bboxes[d.data.uuid].width;
                    return 668 - left - (50 * d.depth);
                }
            })
            .attr('height', 45)
            .attr('fill', 'none')
            .attr('y', (d) => { if (d.depth) { return -7; } return 0; })
            .attr('x', (d) => {
                if (d.data.uuid && d.depth) {
                    let left = bboxes[d.data.uuid].width;
                    return left + 15;
                }
                return 0;
            });

        nodes.append('text')
            .text( (d) => {
                return d.data.name;
            })
            .attr('class', 'entity-name')
            .attr('style', (d) => {
                if (!d.data.uuid) {
                    return 'display: none;';
                }
                return '';
            })
            .attr('y', (d) => { if (d.depth) { return -7; } return 0; })
            .attr('x', (d) => {
                if (d.data.uuid && d.depth === 0) {
                    return 10;
                }
                if (d.data.uuid && d.depth) {
                    let left = bboxes[d.data.uuid].width;
                    return left + 15;
                }
                return 0;
            })
            .attr('id', (d) => {
                if (!d.data.uuid) {
                    return 'none';
                }
                return 'entity-name' + d.data.uuid;
            });

        svg.selectAll('text.entity-name')
            .each( (d, i, nds) => {
                let bbox = nds[i].getBBox();
                let btns = _.filter(
                    this.buttonsData,
                    (b) => { 
                        return b.data.uuid == d.data.uuid && !b.data.visited;
                    }
                );
                if (btns.length) {
                    _.each(btns, (btn) => {
                        btn.data.btnStyle.left += bbox.width + 10;
                        if (btn.data.btnStyle.left > 700) {
                            btn.data.btnStyle.left = 700;
                        }
                        btn.data.visited = true;
                    });
                }
                if (d.data.uuid && d.depth) {
                    d3plus.textwrap().container("#entity-name" + d.data.uuid).draw();
                }
            });

        svg.selectAll('#entityTag')
            .attr('width', (d) => {
                if (d.data.uuid){
                    let width = bboxes[d.data.uuid].width;
                    return width + 10;
                }
                return 0;
            });
    }

    drawProjectTrees(){
        try {
            d3.select('.project-tree #relation-tree')
                .selectAll('svg')
                .remove();
            this.dropdownsData = [];
            this.buttonsData = [];
            let type = this.project.value.projectType;
            if (type === 'experimental' ){
                this.buildExperimentalTree();
            } else if (type === 'simulation') {
                this.buildSimulationTree();
            } else if (type === 'hybrid_simulation') {
                this.buildHybridSimulationTree();
            } else if (type === 'field_recon') {
                this.buildFieldReconTree();
            }
            _.each(this.trees, (tree, index) => {
                let XOffset = 0;
                let YOffset = 0;
                if (index) {
                    _.each(this.trees, (subTree, treeIndex) => {
                        if (treeIndex < index){
                            YOffset += subTree.maxY;
                        }
                    });
                    YOffset += index * 50 + 5 * index;
                }
                this.drawTree(tree, index, XOffset, YOffset);
            });
        } catch(err) {
            this._ui.error = err.message;
        }
    }

    entitiesList(attr){
        return this.project[attr];
    }

    addRelation(leaf, uuid){
        this._ui.loading = true;
        let entity = this.project.getRelatedByUuid(uuid);
        let type = this.project.value.projectType;
        let promise;
        if (type === 'experimental' ){
            promise = this.relateEntityToExperimental(leaf, entity);
        } else if (type === 'simulation') {
            promise = this.relateEntityToSimProject(leaf, entity);
        } else if (type === 'hybrid_simulation') {
            promise = this.relateEntityToHybridSimProject(leaf, entity);
        } else if (type === 'field_recon') {
            promise = this.relateEntityToFieldReconProject(leaf, entity);
        }
        promise
            .then( () => {
                this.treeRelation = {};
                this.drawProjectTrees();
            })
            .finally( () => {
                this._ui.loading = false;
            });
    }

    removeRelation(node){
        this._ui.loading = true;
        let entity = this.project.getRelatedByUuid(node.data.uuid);
        let type = this.project.value.projectType;
        let promise;
        if (type == 'experimental'){
            promise = this.unrelateEntityToExperimental(node, entity);
        } else if (type == 'simulation') {
            promise = this.unrelateEntityToSimProject(node, entity);
        } else if (type == 'hybrid_simulation') {
            promise = this.unrelateEntityToHybridSimProject(node, entity);
        } else if (type == 'field_recon') {
            promise = this.unrelateEntityToFieldReconProject(node, entity);
        }
        promise
            .then( () => {
                this.drawProjectTrees();
            })
            .finally( () => {
                this._ui.loading = false;
            });
    }

    orderOf(obj, parentUuid) {
        let order = _.findWhere(
            obj._ui.orders,
            { parent: parentUuid }
        );
        if (!order) {
            order = { value: 0 , parent: parentUuid};
        }
        return order;
    }
}

export const ProjectTreeComponent = {
    template: ProjectTreeTemplate,
    controller: ProjectTreeCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&',
    },
};
