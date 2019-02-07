import * as d3 from 'd3';
import _ from 'underscore';
import ProjectTreeTemplate from './project-tree.template.html';

class ProjectTreeCtrl {
    constructor(ProjectService, ProjectEntitiesService){
        'ngInject';
        this.ProjectService = ProjectService;
        this.ProjectEntitiesService = ProjectEntitiesService;
        this.trees = [];
        this.d3 = d3;
    }

    $onInit() {
        this.project = this.resolve.project;
        let type = this.project.value.projectType;
        if (type === 'experimental' ){
            this.buildExperimentalTree();
        } else if (type === 'simulation') {
            this.buildSimulationTree();
        } else if (type === 'hybrid_simulation') {
            this.buildHybridSimulationTree();
        }
    }

    buildExperimentalTree() {
        let experiments = this.project.experiment_set;
        let modelConfigs = this.project.modelconfig_set;
        let sensors = this.project.sensorlist_set;
        let events = this.project.event_set;
        let roots = [];
        _.each(experiments, (exp) => {
            let node = {
                name: exp.value.title,
                uuid: exp.uuid,
                parent: null,
                children: [],
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
                        };
                        sensorNode.children.push(eventNode);
                    });
                    sensorNode.children.push({ name: 'Event' });
                    mcfgNode.children.push(sensorNode);
                });
                mcfgNode.children.push({ name: 'sensorInfo' });
                node.children.push(mcfgNode);
            });
            node.children.push({ name: 'modelConfig' });
            roots.push(node);
        });
        this.trees = roots;
    }

    $postLink() {
        this.drawTree(this.trees[2]);
    }

    drawTree(root) {
        let canvas = d3.select('.project-tree #relation-tree');
        canvas.select('svg').remove();
        let treeNodes = d3.hierarchy(root);
        let index = -1;
        treeNodes.eachBefore( (n) => {
            n.y = ++index * 50;
            n.x = n.depth * 50;
        });
        let svg = canvas.append('svg')
            .attr('width', 550)
            .attr('height', 550);
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
            .attr('stroke', 'blue');
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
            .attr('height', 10)
            .attr('stroke', (d) => {
                if (!d.data.uuid){
                    return 'black';
                }
                return 'red';
            })
            .attr('fill', 'none')
            .attr('y', -10);
        nodes.append('text')
            .text( (d) => {
                return d.data.name;
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
