import * as d3 from 'd3';
import _ from 'underscore';
import ProjectTreeTemplate from './project-tree.template.html';

class ProjectTreeCtrl {
    constructor(ProjectService, ProjectEntitiesService, $scope){
        'ngInject';
        this.ProjectService = ProjectService;
        this.ProjectEntitiesService = ProjectEntitiesService;
        this.$scope = $scope;
        this.trees = [];
        this._ui = { loading: false };
    }

    $onInit() {
        this.project = this.resolve.project;
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
        entity.associationIds = _.without(
            entity.associationIds,
            nodeParent.data.uuid
        );
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
     * This is specific to Experimental project.
     */
    unrelateEntityToExperimental(node, entity){
        let nodeParent = node.parent;
        if (entity.name == 'designsafe.project.event') {
            entity.value.sensorLists = _.without(
                entity.value.sensorLists,
                nodeParent.data.uuid
            );
            nodeParent = nodeParent.parent;
        }
        if (entity.name == 'designsafe.project.event' ||
            entity.name == 'designsafe.project.sensor_list') {
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
     * @param {Object} entity.
     * @param {Object} leaf.
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
     *
     * Build tress for every experiment in this class' `this.project`.
     * The hierarchy is build like so:
     * + Experiment 1
     * |
     * -- + Model Config
     *   |
     *   -- + Sensor Info
     *      |
     *      -- + Events
     * 
     * + Experiment 2
     * [...]
     */
    buildExperimentalTree() {
        let experiments = this.project.experiment_set;
        let modelConfigs = this.project.modelconfig_set;
        let sensors = this.project.sensorlist_set;
        let events = this.project.event_set;
        let roots = [];
        experiments = _.sortBy(experiments, (exp) => { return exp.value.title; } );
        _.each(experiments, (exp) => {
            let node = {
                name: exp.value.title,
                uuid: exp.uuid,
                parent: null,
                children: [],
                rectStyle: 'stroke: none;',
            };
            _.each(modelConfigs, (mcfg) => {
                if (!_.contains(mcfg.associationIds, node.uuid)){
                    return;
                }
                let mcfgNode = {
                    name: mcfg.value.title,
                    uuid: mcfg.uuid,
                    parent: node.name,
                    children: [],
                    rectStyle: 'stroke: #1568C9; fill: #C4D9F2;',
                };
                _.each(sensors, (sensor) => {
                    if (_.difference([mcfgNode.uuid, node.uuid], sensor.associationIds).length){
                        return;
                    }
                    let sensorNode = {
                        name: sensor.value.title,
                        uuid: sensor.uuid,
                        parent: mcfgNode.name,
                        children: [],
                        rectStyle: 'stroke: #43A59D; fill: #CAE9E6;',
                    };
                    _.each(events, (evt) => {
                        if (_.difference([sensor.uuid, mcfgNode.uuid, node.uuid], evt.associationIds).length){
                            return;
                        }
                        let eventNode = {
                            name: evt.value.title,
                            uuid: evt.uuid,
                            parent: sensorNode.name,
                            children: [],
                            rectStyle: 'stroke: #B59300; fill: #B59300;',
                        };
                        sensorNode.children.push(eventNode);
                    });
                    sensorNode.children.push(
                        {
                            name: '-- Choose an Event --',
                            attr: 'event_set',
                            entityType: 'event',
                        }
                    );
                    mcfgNode.children.push(sensorNode);
                });
                mcfgNode.children.push(
                    {
                        name: '-- Choose a Sensor Info --',
                        attr: 'sensorlist_set',
                        entityType: 'sensorList',
                    }
                );
                node.children.push(mcfgNode);
            });
            node.children.push(
                {
                    name: '-- Choose a Model Config --',
                    attr: 'modelconfig_set',
                    entityType: 'modelConfig',
                }
            );
            roots.push(node);
        });
        this.trees = roots;
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
                this.dropdownsData.push(n);
            }
        });
        this.trees[treeIndex].maxY = maxY;
        this.trees[treeIndex].maxX = maxX;
        let svg = canvas.append('svg')
            .attr('width', '100%')
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
                return d.data.name;
            })
            .attr('style', (d) => {
                if (!d.data.uuid) {
                    return 'display: none';
                }
                return '';
            })
            .attr('y', 5)
            .attr('x', 5);
        svg.selectAll('text')
            .each((d, i, nds) => {
                if (d.data.uuid) {
                    let t = nds[i].getBBox();
                    bboxes[d.data.uuid] = t;
                    d.data.btnStyle = {
                        position: 'absolute',
                        left: d.x + 25 + XOffset + t.width,
                        top: d.y + 10 + YOffset,
                    };
                    this.buttonsData.push(d);
                }
            });
        svg.selectAll('rect')
            .attr('width', (d) => {
                if (d.data.uuid){
                    let width = bboxes[d.data.uuid].width;
                    return width + 10;
                }
                return 0;
            });
    }

    drawProjectTrees(){
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
    }

    entitiesList(attr){
        return this.project[attr];
    }

    addRelation(leaf, uuid){
        this._ui.loading = true;
        let entity = this.project.getRelatedByUuid(uuid);
        this.relateEntityToExperimental(leaf, entity)
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
        this.unrelateEntityToExperimental(node, entity)
            .then( () => {
                this.drawProjectTrees();
            })
            .finally( () => {
                this._ui.loading = false;
            });
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
