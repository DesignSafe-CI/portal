import ProjectViewTemplate from './project-view.component.html';

class ProjectViewCtrl {

  constructor(ProjectEntitiesService, ProjectService, DataBrowserService, FileListing, $state, $q) {
    'ngInject';

    this.ProjectEntitiesService = ProjectEntitiesService;
    this.ProjectService = ProjectService;
    this.DataBrowserService = DataBrowserService;
    this.FileListing = FileListing;
    this.browser = this.DataBrowserService.state();
    this.$state = $state;
    this.$q = $q;
  }

  $onInit() {
    this.projectId = this.ProjectService.resolveParams.projectId;
    this.filePath = this.ProjectService.resolveParams.filePath;
    this.data = this.ProjectService.resolveParams.data;
    this.loading = true;

    this.checkState = () => {
      this.workingDir = false;
      var broken = this.$state.current.name.split('.');
      var last = broken.pop();
      if (last == 'data') {
        this.workingDir = true;
      }
    };

    if (!this.data || this.data.listing.path != this.filePath) {
      this.$q.all([
        this.ProjectService.get({ uuid: this.projectId }),
        this.DataBrowserService.browse(
          { system: 'project-' + this.projectId, path: this.filePath },
          { query_string: this.$state.params.query_string }
        ),
        this.ProjectEntitiesService.listEntities({ uuid: this.projectId, name: 'all' })
      ]).then(([project, listing, entities]) => {
        this.browser.project = project;
        this.browser.project.appendEntitiesRel(entities);
        this.browser.listing = listing;
        this.browser.listing.href = this.$state.href('projects.view.data', {
          projectId: this.projectId,
          filePath: this.browser.listing.path,
          projectTitle: this.browser.project.value.projectTitle,
        });
        this.browser.listing.children.forEach((child) => {
          child.href = this.$state.href('projects.view.data', {
            projectId: this.projectId,
            filePath: child.path,
            projectTitle: this.browser.project.value.projectTitle,
          });
          child.setEntities(this.projectId, entities);
        });
        var allFilePaths = [];
        this.browser.listings = {};
        var apiParams = {
          fileMgr: 'agave',
          baseUrl: '/api/agave/files',
          searchState: 'projects.view.data',
        };
        entities.forEach((entity) => {
          this.browser.listings[entity.uuid] = {
            name: this.browser.listing.name,
            path: this.browser.listing.path,
            system: this.browser.listing.system,
            trail: this.browser.listing.trail,
            children: [],
          };
          allFilePaths = allFilePaths.concat(entity._filePaths);
        });

        this.setFilesDetails = (paths) => {
          let filePaths = [...new Set(paths)];
          var p = this.$q((resolve, reject) => {
            var results = [];
            var index = 0;
            var size = 5;
            var fileCalls = filePaths.map(filePath => {
              return this.FileListing.get(
                { system: 'project-' + this.browser.project.uuid, path: filePath }, apiParams
              ).then((resp) => {
                if (!resp) {
                  return;
                }
                var allEntities = this.browser.project.getAllRelatedObjects();
                var entities = allEntities.filter((entity) => {
                  return entity._filePaths.includes(resp.path);
                });
                entities.forEach((entity) => {
                  resp._entities.push(entity);
                  this.browser.listings[entity.uuid].children.push(resp);
                });
                return resp;
              });
            });

            var step = () => {
              var calls = fileCalls.slice(index, (index += size));
              if (calls.length) {
                this.$q.all(calls)
                  .then((res) => {
                    results.concat(res);
                    step();
                    return res;
                  })
                  .catch(reject);
              } else {
                resolve(results);
              }
            };
            step();
          });
          return p.then(
            (results) => {
              this.loading = false;
              return results;
            },
            (err) => {
              this.loading = false;
              this.browser.ui.error = err;
            });
        };
        this.setFilesDetails(allFilePaths);
      });
    } else {
      this.browser = this.data;
      this.loading = false;
    }
  }

  isSingle(val) {
    // we will have older projects with a single award number as a string
    if (val.length) {
        if (typeof val[0] === 'string') {
            return true;
        }
    }
    return false;
}

  editProject($event) {
    if ($event) {
      $event.preventDefault();
    }
    this.ProjectService.editProject(this.browser.project);
  }

  manageProjectType($event) {
    if ($event) {
      $event.preventDefault();
    }
    this.ProjectService.manageProjectType({ 'project': this.browser.project, 'warning': false });
  }

  workingDirectory() {
    this.$state.go('projects.view.data', { projectId: this.projectId }).then(() => {
    });
  }

  curationDirectory() {
    if (this.browser.project.value.projectType === 'None') {
      this.manageProjectType();
    } else {
      this.$state.go('projects.curation', { projectId: this.projectId, data: this.browser }, { reload: true });
    }
  }

  publicationPreview() {
    if (this.browser.project.value.projectType === 'experimental') {
      this.$state.go('projects.preview', { projectId: this.browser.project.uuid, data: this.browser }).then(() => {
        this.checkState();
      });
    } else if (this.browser.project.value.projectType === 'simulation') {
      this.$state.go('projects.previewSim', { projectId: this.browser.project.uuid, data: this.browser }).then(() => {
        this.checkState();
      });
    } else if (this.browser.project.value.projectType === 'hybrid_simulation') {
      this.$state.go('projects.previewHybSim', { projectId: this.browser.project.uuid, data: this.browser }).then(() => {
        this.checkState();
      });
    } else if (this.browser.project.value.projectType === 'other') {
      this.$state.go('projects.previewOther', { projectId: this.browser.project.uuid, data: this.browser }).then(() => {
        this.checkState();
      });
    } else if (this.browser.project.value.projectType === 'field_recon') {
      this.$state.go('projects.previewFieldRecon', { projectId: this.browser.project.uuid, data: this.browser }).then(() => {
        this.checkState();
      });
    }
  }
}

export const ProjectViewComponent = {
  controller: ProjectViewCtrl,
  controllerAs: '$ctrl',
  template: ProjectViewTemplate,
  bindings: {
    resolve: '<',
    projectId: '<'
  }
};
