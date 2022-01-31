import angular from 'angular';

import './../ng-designsafe/providers';
import './components';

let ddModule = angular.module('ds-data', ['designsafe', 'dd.components']);
ddModule.requires.push(
    'ui.router',
    'ui.bootstrap',
    'django.context',
    'ds.notifications',
    'ds.wsBus',
    'toastr',
    'logging',
    'ui.customSelect',
    'ngSanitize'
);
angular.module('designsafe.portal').requires.push('ds-data');

/**
 * @function
 * @param {Object} $httpProvider
 * @param {Object} $locationProvider 
 * @param {Object} $stateProvider
 * @param {Object} $urlRouterProvider
 * @param {Object} Django
 * @param {Object} toastrConfig
 */
function config(
    $httpProvider,
    $locationProvider,
    $stateProvider,
    $urlRouterProvider,
    $urlMatcherFactoryProvider,
    Django,
    toastrConfig
) {
    'ngInject';

    $httpProvider.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
    $httpProvider.defaults.xsrfCookieName = 'csrftoken';
    $httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken';
    $locationProvider.html5Mode(true);
    $urlMatcherFactoryProvider.strictMode(false);

    angular.extend(toastrConfig, {
        positionClass: 'toast-bottom-left',
        timeOut: 20000,
    });

    $stateProvider
        /* Private */
        .state('myData', {
            url: '/agave/{systemId}/{filePath:any}/?query_string&offset&limit',
            component: 'dataDepotBrowser',
            params: {
                systemId: 'designsafe.storage.default',
                filePath: Django.user,
            },
            resolve: {
                apiParams: ()=> {
                    return {
                        fileMgr: 'agave',
                    };
                },
                path: ($stateParams, Django) => {
                    'ngInject';
                    if ($stateParams.filePath.replace(/^\/+/, '') === '') {
                        return Django.user;
                    }
                    return $stateParams.filePath;
                },
                auth: ($q, Django) => {
                    'ngInject';
                    if (Django.context.authenticated) {
                        return true;
                    }

                    return $q.reject({
                        type: 'authn',
                        context: Django.context,
                    });
                
                },
            },
        })
        .state('sharedData', {
            url: '/shared/{systemId}/{filePath:any}?query_string',
            component: 'dataDepotBrowser',
            params: {
                systemId: 'designsafe.storage.default',
                filePath: '',
            },
            resolve: {
                apiParams: ()=> {
                    return {
                        fileMgr: 'shared',
                    };
                },
                auth: ($q, Django) =>{
                    'ngInject';
                    if (Django.context.authenticated) {
                        return true;
                    }
                    return $q.reject({
                        type: 'authn',
                        context: Django.context,
                    });
                
                },
            },
        })
        .state('projects', {
            abstract: true,
        })
        .state('projects.list', {
            url: '/projects/?query_string',
            component: 'projectListing',
            resolve: {
                section: () => 'main',
            },
        })
        .state('projects.view', {
            url: '/projects/{projectId}/{filePath:any}?query_string',
            component: 'projectView',
            params: {
                projectTitle: '',
                filePath: '',
                projectId: ''
            },
            resolve: {
                projectId: [
                    '$stateParams',
                    'ProjectService',
                    ($stateParams, ProjectService) => {
                        'ngInject';
                        ProjectService.resolveParams.projectId = $stateParams.projectId;
                        ProjectService.resolveParams.filePath = ''
                        return $stateParams.projectId;
                    },
                ],
                params: [
                    '$stateParams',
                    'ProjectService',
                    ($stateParams, ProjectService) => {
                        ProjectService.resolveParams.projectId = $stateParams.projectId;
                        ProjectService.resolveParams.filePath = $stateParams.filePath || '/';
                        ProjectService.resolveParams.projectTitle = $stateParams.projectTitle;
                        ProjectService.resolveParams.query_string = $stateParams.query_string || '';
                    },
                ],
            },
        })
        /*
        .state('projects.view.data', {
            url: '{filePath:any}?query_string&offset&limit',
            component: 'projectData',
            params: {
                projectTitle: '',
                filePath: '/',
                data: null,
            },
            resolve: {
                params: [
                    '$stateParams',
                    'ProjectService',
                    ($stateParams, ProjectService) => {
                        ProjectService.resolveParams.projectId = $stateParams.projectId;
                        ProjectService.resolveParams.filePath = $stateParams.filePath || '/';
                        ProjectService.resolveParams.projectTitle = $stateParams.projectTitle;
                        ProjectService.resolveParams.query_string = $stateParams.query_string || '';
                        ProjectService.resolveParams.data = $stateParams.data;
                    },
                ],
            },
        })
        */
        .state('projects.curation', {
            url: '/projects/{projectId}/curation/{filePath:any}?query_string',
            component: 'curationDirectory',
            params: {
                filePath: '',
                data: null,
            },
            resolve: {
                projectId: ['$stateParams', 'ProjectService', ($stateParams, ProjectService) => {
                    ProjectService.resolveParams.projectId = $stateParams.projectId;
                    ProjectService.resolveParams.filePath = $stateParams.filePath || '';
                    ProjectService.resolveParams.data = $stateParams.data;
                }]
            }
        })
        .state('projects.preview', {
            url: '/projects/{projectId}/preview/exp/{filePath:any}?query_string',
            component: 'publicationPreview',
            params: {
                filePath: '',
                project: null,
                selectedListings: null,
                data: null,
            },
            resolve: {
                params: [
                    '$stateParams',
                    'ProjectService',
                    ($stateParams, ProjectService) => {
                        ProjectService.resolveParams.projectId = $stateParams.projectId;
                        ProjectService.resolveParams.filePath = $stateParams.filePath || '/';
                        ProjectService.resolveParams.project = $stateParams.project;
                        ProjectService.resolveParams.selectedListings = $stateParams.selectedListings;
                        ProjectService.resolveParams.data = $stateParams.data;
                    },
                ],
            },
        })
        .state('projects.previewSim', {
            url: '/projects/{projectId}/preview/sim/{filePath:any}?query_string',
            component: 'publicationPreviewSim',
            params: {
                filePath: '',
                project: null,
                selectedListings: null,
                data: null,
            },
            resolve: {
                params: [
                    '$stateParams',
                    'ProjectService',
                    ($stateParams, ProjectService) => {
                        ProjectService.resolveParams.projectId = $stateParams.projectId;
                        ProjectService.resolveParams.filePath = $stateParams.filePath || '/';
                        ProjectService.resolveParams.project = $stateParams.project;
                        ProjectService.resolveParams.selectedListings = $stateParams.selectedListings;
                        ProjectService.resolveParams.data = $stateParams.data;
                    },
                ],
            },
        })
        .state('projects.previewHybSim', {
            url: '/projects/{projectId}/preview/hybrid/{filePath:any}?query_string',
            component: 'publicationPreviewHybSim',
            params: {
                filePath: '',
                project: null,
                selectedListings: null,
            },
            resolve: {
                params: [
                    '$stateParams',
                    'ProjectService',
                    ($stateParams, ProjectService) => {
                        ProjectService.resolveParams.projectId = $stateParams.projectId;
                        ProjectService.resolveParams.filePath = $stateParams.filePath || '/';
                        ProjectService.resolveParams.project = $stateParams.project;
                        ProjectService.resolveParams.selectedListings = $stateParams.selectedListings;
                    },
                ],
            },
        })
        .state('projects.previewOther', {
            url: '/projects/{projectId}/preview/other/{filePath:any}?query_string',
            component: 'publicationPreviewOther',
            params: {
                filePath: '',
                project: null,
                selectedListings: null,
            },
            resolve: {
                params: [
                    '$stateParams',
                    'ProjectService',
                    ($stateParams, ProjectService) => {
                        ProjectService.resolveParams.projectId = $stateParams.projectId;
                        ProjectService.resolveParams.filePath = $stateParams.filePath || '/';
                        ProjectService.resolveParams.project = $stateParams.project;
                        ProjectService.resolveParams.selectedListings = $stateParams.selectedListings;
                    },
                ],
            },
        })
        .state('projects.previewFieldRecon', {
            url: '/projects/{projectId}/preview/recon/{filePath:any}?query_string',
            component: 'publicationPreviewFieldRecon',
            params: {
                filePath: '',
                project: null,
                selectedListings: null,
            },
            resolve: {
                params: [
                    '$stateParams',
                    'ProjectService',
                    ($stateParams, ProjectService) => {
                        ProjectService.resolveParams.projectId = $stateParams.projectId;
                        ProjectService.resolveParams.filePath = $stateParams.filePath || '/';
                        ProjectService.resolveParams.project = $stateParams.project;
                        ProjectService.resolveParams.selectedListings = $stateParams.selectedListings;
                    },
                ],
            },
        })
        .state('projects.pipelineStart', {
            url: '/projects/{projectId}/curation/start',
            component: 'pipelineStart',
            resolve: {
                projectId: ['$stateParams', 'ProjectService', ($stateParams, ProjectService) => {
                    ProjectService.resolveParams.projectId = $stateParams.projectId;
                }]
            }
        })
        .state('projects.amendOther', {
            url: '/projects/{projectId}/curation/amend',
            component: 'amendOther',
            params: {
                project: null,
                publication: null,
            },
            resolve: {
                projectId: ['$stateParams', 'ProjectService', ($stateParams, ProjectService) => {
                    ProjectService.resolveParams.projectId = $stateParams.projectId;
                    ProjectService.resolveParams.project = $stateParams.project;
                    ProjectService.resolveParams.publication = $stateParams.publication;
                }]
            }
        })
        .state('projects.amendExperimental', {
            url: '/projects/{projectId}/curation/amend',
            component: 'amendExperimental',
            params: {
                project: null,
                publication: null,
            },
            resolve: {
                projectId: ['$stateParams', 'ProjectService', ($stateParams, ProjectService) => {
                    ProjectService.resolveParams.projectId = $stateParams.projectId;
                    ProjectService.resolveParams.project = $stateParams.project;
                    ProjectService.resolveParams.publication = $stateParams.publication;
                }]
            }
        })
        .state('projects.versionOtherSelection', {
            url: '/projects/{projectId}/curation/version/{filePath:any}',
            component: 'versionOtherSelection',
            params: {
                filePath: '',
                publication: null,
                selectedListing: null,
            },
            resolve: {
                projectId: ['$stateParams', 'ProjectService', ($stateParams, ProjectService) => {
                    ProjectService.resolveParams.projectId = $stateParams.projectId;
                    ProjectService.resolveParams.filePath = $stateParams.filePath || '/';
                    ProjectService.resolveParams.publication = $stateParams.publication;
                    ProjectService.resolveParams.selectedListing = $stateParams.selectedListing || null;
                }]
            }
        })
        .state('projects.versionOtherCitation', {
            url: '/projects/{projectId}/curation/citation',
            component: 'versionOtherCitation',
            params: {
                publication: null,
                selectedListing: null,
            },
            resolve: {
                projectId: ['$stateParams', 'ProjectService', ($stateParams, ProjectService) => {
                    ProjectService.resolveParams.projectId = $stateParams.projectId;
                    ProjectService.resolveParams.publication = $stateParams.publication;
                    ProjectService.resolveParams.selectedListing = $stateParams.selectedListing;
                }]
            }
        })
        .state('projects.versionExperimentalSelection', {
            url: '/projects/{projectId}/curation/version/{filePath:any}',
            component: 'versionExperimentalSelection',
            params: {
                filePath: '',
                publication: null,
                selectedListing: null,
            },
            resolve: {
                projectId: ['$stateParams', 'ProjectService', ($stateParams, ProjectService) => {
                    ProjectService.resolveParams.projectId = $stateParams.projectId;
                    ProjectService.resolveParams.filePath = $stateParams.filePath || '/';
                    ProjectService.resolveParams.publication = $stateParams.publication;
                    ProjectService.resolveParams.selectedListing = $stateParams.selectedListing || null;
                }]
            }
        })
        .state('projects.versionExperimentalCitation', {
            url: '/projects/{projectId}/curation/citation',
            component: 'versionExperimentalCitation',
            params: {
                publication: null,
                selectedListing: null,
            },
            resolve: {
                projectId: ['$stateParams', 'ProjectService', ($stateParams, ProjectService) => {
                    ProjectService.resolveParams.projectId = $stateParams.projectId;
                    ProjectService.resolveParams.publication = $stateParams.publication;
                    ProjectService.resolveParams.selectedListing = $stateParams.selectedListing;
                }]
            }
        })
        .state('projects.versionChanges', {
            url: '/projects/{projectId}/curation/changes',
            component: 'versionChanges',
            params: {
                publication: null,
                selectedListing: null,
            },
            resolve: {
                projectId: ['$stateParams', 'ProjectService', ($stateParams, ProjectService) => {
                    ProjectService.resolveParams.projectId = $stateParams.projectId;
                    ProjectService.resolveParams.publication = $stateParams.publication;
                    ProjectService.resolveParams.selectedListing = $stateParams.selectedListing;
                }]
            }
        })
        .state('projects.pipelineSelectExp', {
            url: '/projects/{projectId}/curation/selection',
            component: 'pipelineSelectExp',
            resolve: {
                projectId: ['$stateParams', 'ProjectService', ($stateParams, ProjectService) => {
                    ProjectService.resolveParams.projectId = $stateParams.projectId;
                    ProjectService.resolveParams.filePath = $stateParams.filePath || '/';
                }]
            }
        })
        .state('projects.pipelineSelectSim', {
            url: '/projects/{projectId}/curation/selectionSim',
            component: 'pipelineSelectSim',
            resolve: {
                projectId: ['$stateParams', 'ProjectService', ($stateParams, ProjectService) => {
                    ProjectService.resolveParams.projectId = $stateParams.projectId;
                    ProjectService.resolveParams.filePath = $stateParams.filePath || '/';
                }]
            }
        })
        .state('projects.pipelineSelectHybSim', {
            url: '/projects/{projectId}/curation/selectionHybSim',
            component: 'pipelineSelectHybSim',
            resolve: {
                projectId: ['$stateParams', 'ProjectService', ($stateParams, ProjectService) => {
                    ProjectService.resolveParams.projectId = $stateParams.projectId;
                    ProjectService.resolveParams.filePath = $stateParams.filePath || '/';
                }]
            }
        })
        .state('projects.pipelineSelectOther', {
            url: '/projects/{projectId}/curation/selectionOther/{filePath:any}',
            component: 'pipelineSelectOther',
            params: {
                filePath: '',
            },
            resolve: {
                projectId: ['$stateParams', 'ProjectService', ($stateParams, ProjectService) => {
                    ProjectService.resolveParams.projectId = $stateParams.projectId;
                    ProjectService.resolveParams.filePath = $stateParams.filePath || '/';
                }]
            }
        })
        .state('projects.pipelineSelectField', {
            url: '/projects/{projectId}/curation/selectionFieldRecon/{filePath:any}',
            component: 'pipelineSelectField',
            params: {
                filePath: '',
            },
            resolve: {
                projectId: ($stateParams, ProjectService) => {
                    'ngInject';
                    ProjectService.resolveParams.projectId = $stateParams.projectId;
                    ProjectService.resolveParams.filePath = $stateParams.filePath || '/';
                }
            }
        })
        .state('projects.pipelineProject', {
            url: '/projects/{projectId}/curation/project',
            component: 'pipelineProject',
            params: {
                project: '',
                primaryEntities: '',
                secondaryEntities: '',
                selectedListings: '',
            },
            resolve: {
                params: [
                    '$stateParams',
                    'ProjectService',
                    ($stateParams, ProjectService) => {
                        ProjectService.resolveParams.projectId = $stateParams.projectId;
                        ProjectService.resolveParams.project = $stateParams.project;
                        ProjectService.resolveParams.primaryEntities = $stateParams.primaryEntities;
                        ProjectService.resolveParams.secondaryEntities = $stateParams.secondaryEntities;
                        ProjectService.resolveParams.selectedListings = $stateParams.selectedListings;
                    },
                ],
            },
        })
        .state('projects.pipelineExperiment', {
            url: '/projects/{projectId}/curation/experiment',
            component: 'pipelineExperiment',
            params: {
                project: '',
                primaryEntities: '',
                selectedListings: '',
            },
            resolve: {
                params: [
                    '$stateParams',
                    'ProjectService',
                    ($stateParams, ProjectService) => {
                        ProjectService.resolveParams.projectId = $stateParams.projectId;
                        ProjectService.resolveParams.project = $stateParams.project;
                        ProjectService.resolveParams.primaryEntities = $stateParams.primaryEntities;
                        ProjectService.resolveParams.selectedListings = $stateParams.selectedListings;
                    },
                ],
            },
        })
        .state('projects.pipelineSimulation', {
            url: '/projects/{projectId}/curation/simulation',
            component: 'pipelineSimulation',
            params: {
                project: '',
                primaryEntities: '',
                selectedListings: '',
            },
            resolve: {
                params: [
                    '$stateParams',
                    'ProjectService',
                    ($stateParams, ProjectService) => {
                        ProjectService.resolveParams.projectId = $stateParams.projectId;
                        ProjectService.resolveParams.project = $stateParams.project;
                        ProjectService.resolveParams.primaryEntities = $stateParams.primaryEntities;
                        ProjectService.resolveParams.selectedListings = $stateParams.selectedListings;
                    },
                ],
            },
        })
        .state('projects.pipelineHybrid', {
            url: '/projects/{projectId}/curation/hybrid',
            component: 'pipelineHybrid',
            params: {
                project: '',
                primaryEntities: '',
                selectedListings: '',
            },
            resolve: {
                params: [
                    '$stateParams',
                    'ProjectService',
                    ($stateParams, ProjectService) => {
                        ProjectService.resolveParams.projectId = $stateParams.projectId;
                        ProjectService.resolveParams.project = $stateParams.project;
                        ProjectService.resolveParams.primaryEntities = $stateParams.primaryEntities;
                        ProjectService.resolveParams.selectedListings = $stateParams.selectedListings;
                    },
                ],
            },
        })
        .state('projects.pipelineOther', {
            url: '/projects/{projectId}/curation/other',
            component: 'pipelineOther',
            params: {
                project: '',
                selectedListings: '',
            },
            resolve: {
                params: [
                    '$stateParams',
                    'ProjectService',
                    ($stateParams, ProjectService) => {
                        ProjectService.resolveParams.projectId = $stateParams.projectId;
                        ProjectService.resolveParams.project = $stateParams.project;
                        ProjectService.resolveParams.selectedListings = $stateParams.selectedListings;
                    },
                ],
            },
        })
        .state('projects.pipelineField', {
            url: '/projects/{projectId}/curation/fieldRecon',
            component: 'pipelineField',
            params: {
                project: '',
                selectedListings: '',
                primaryEntities: '',
                secondaryEntities: '',
            },
            resolve: {
                params: ($stateParams, ProjectService) => {
                    'ngInject';
                    ProjectService.resolveParams.projectId = $stateParams.projectId;
                    ProjectService.resolveParams.project = $stateParams.project;
                    ProjectService.resolveParams.selectedListings = $stateParams.selectedListings;
                    ProjectService.resolveParams.primaryEntities = $stateParams.primaryEntities;
                    ProjectService.resolveParams.secondaryEntities = $stateParams.secondaryEntities;
                }
            }
        })
        .state('projects.pipelineSubEntityExp', {
            url: '/projects/{projectId}/curation/categories',
            component: 'pipelineSubEntityExp',
            params: {
                project: '',
                primaryEntities: '',
                selectedListings: '',
            },
            resolve: {
                params: [
                    '$stateParams',
                    'ProjectService',
                    ($stateParams, ProjectService) => {
                        ProjectService.resolveParams.projectId = $stateParams.projectId;
                        ProjectService.resolveParams.project = $stateParams.project;
                        ProjectService.resolveParams.primaryEntities = $stateParams.primaryEntities;
                        ProjectService.resolveParams.selectedListings = $stateParams.selectedListings;
                    },
                ],
            },
        })
        .state('projects.pipelineSubEntitySim', {
            url: '/projects/{projectId}/curation/categoriesSim',
            component: 'pipelineSubEntitySim',
            params: {
                project: '',
                primaryEntities: '',
                selectedListings: '',
            },
            resolve: {
                params: [
                    '$stateParams',
                    'ProjectService',
                    ($stateParams, ProjectService) => {
                        ProjectService.resolveParams.projectId = $stateParams.projectId;
                        ProjectService.resolveParams.project = $stateParams.project;
                        ProjectService.resolveParams.primaryEntities = $stateParams.primaryEntities;
                        ProjectService.resolveParams.selectedListings = $stateParams.selectedListings;
                    },
                ],
            },
        })
        .state('projects.pipelineSubEntityHybSim', {
            url: '/projects/{projectId}/curation/categoriesHybSim',
            component: 'pipelineSubEntityHybSim',
            params: {
                project: '',
                primaryEntities: '',
                selectedListings: '',
            },
            resolve: {
                params: [
                    '$stateParams',
                    'ProjectService',
                    ($stateParams, ProjectService) => {
                        ProjectService.resolveParams.projectId = $stateParams.projectId;
                        ProjectService.resolveParams.project = $stateParams.project;
                        ProjectService.resolveParams.primaryEntities = $stateParams.primaryEntities;
                        ProjectService.resolveParams.selectedListings = $stateParams.selectedListings;
                    },
                ],
            },
        })
        .state('projects.pipelineSubEntityField', {
            url: '/projects/{projectId}/curation/categoriesFieldRecon',
            component: 'pipelineSubEntityField',
            params: {
                project: '',
                primaryEntities: '',
                secondaryEntities: '',
                selectedListings: '',
            },
            resolve: {
                params: [
                    '$stateParams',
                    'ProjectService',
                    ($stateParams, ProjectService) => {
                        ProjectService.resolveParams.projectId = $stateParams.projectId;
                        ProjectService.resolveParams.project = $stateParams.project;
                        ProjectService.resolveParams.primaryEntities = $stateParams.primaryEntities;
                        ProjectService.resolveParams.secondaryEntities = $stateParams.secondaryEntities;
                        ProjectService.resolveParams.selectedListings = $stateParams.selectedListings;
                    },
                ],
            },
        })
        .state('projects.pipelineAuthors', {
            url: '/projects/{projectId}/curation/authors',
            component: 'pipelineAuthors',
            params: {
                project: '',
                primaryEntities: '',
                secondaryEntities: '',
                selectedListings: '',
            },
            resolve: {
                params: [
                    '$stateParams',
                    'ProjectService',
                    ($stateParams, ProjectService) => {
                        ProjectService.resolveParams.projectId = $stateParams.projectId;
                        ProjectService.resolveParams.project = $stateParams.project;
                        ProjectService.resolveParams.primaryEntities = $stateParams.primaryEntities;
                        ProjectService.resolveParams.secondaryEntities = $stateParams.secondaryEntities;
                        ProjectService.resolveParams.selectedListings = $stateParams.selectedListings;
                    },
                ],
            },
        })
        .state('projects.pipelineTeam', {
            url: '/projects/{projectId}/curation/team',
            component: 'pipelineTeam',
            params: {
                project: '',
                primaryEntities: '',
                selectedListings: '',
            },
            resolve: {
                params: [
                    '$stateParams',
                    'ProjectService',
                    ($stateParams, ProjectService) => {
                        ProjectService.resolveParams.projectId = $stateParams.projectId;
                        ProjectService.resolveParams.project = $stateParams.project;
                        ProjectService.resolveParams.primaryEntities = $stateParams.primaryEntities;
                        ProjectService.resolveParams.selectedListings = $stateParams.selectedListings;
                    },
                ],
            },
        })
        .state('projects.pipelineLicenses', {
            url: '/projects/{projectId}/curation/licenses',
            component: 'pipelineLicenses',
            params: {
                project: '',
                primaryEntities: '',
                secondaryEntities: '',
                selectedListings: '',
            },
            resolve: {
                params: [
                    '$stateParams',
                    'ProjectService',
                    ($stateParams, ProjectService) => {
                        ProjectService.resolveParams.projectId = $stateParams.projectId;
                        ProjectService.resolveParams.project = $stateParams.project;
                        ProjectService.resolveParams.primaryEntities = $stateParams.primaryEntities;
                        ProjectService.resolveParams.secondaryEntities = $stateParams.secondaryEntities;
                        ProjectService.resolveParams.selectedListings = $stateParams.selectedListings;
                    },
                ],
            },
        })
        .state('boxData', {
            url: '/box/{filePath:any}',
            component: 'dataDepotBrowser',
            params: {
                filePath: '',
                name: 'Box',
                customRootFilePath: 'box/',
            },
            resolve: {
                apiParams: ()=>{
                    return {
                        fileMgr: 'box',
                        baseUrl: '/api/external-resources/files',
                        searchState: undefined,
                    };
                },
                path: ($stateParams)=> {
                    'ngInject';
                    return $stateParams.filePath || '/';
                },
                auth: ($q, Django) => {
                    if (Django.context.authenticated) {
                        return true;
                    }
                    return $q.reject({
                        type: 'authn',
                        context: Django.context,
                    });
                },
            },
        })
        .state('dropboxData', {
            url: '/dropbox/{filePath:any}',
            component: 'dataDepotBrowser',
            params: {
                filePath: '',
                name: 'Dropbox',
                customRootFilePath: 'dropbox/',
            },
            resolve: {
                apiParams: ()=> {
                    return {
                        fileMgr: 'dropbox',
                        baseUrl: '/api/external-resources/files',
                        searchState: undefined,
                    };
                },
                path: ($stateParams) => {
                    'ngInject';
                    return $stateParams.filePath || '/';
                },
                auth: ($q, Django) => {
                    'ngInject';
                    if (Django.context.authenticated) {
                        return true;
                    }
                    return $q.reject({
                        type: 'authn',
                        context: Django.context,
                    });
                },
            },
        })
        .state('googledriveData', {
            url: '/googledrive/{filePath:any}',
            component: 'dataDepotBrowser',
            params: {
                filePath: '',
                name: 'Google Drive',
                customRootFilePath: 'googledrive/',
            },
            resolve: {
                apiParams: ()=> {
                    return {
                        fileMgr: 'googledrive',
                        baseUrl: '/api/external-resources/files',
                        searchState: undefined,
                    };
                },
                system: () => 'googledrive',
                path: ($stateParams) => {
                    'ngInject';
                    return $stateParams.filePath || '/';
                },
                auth: ($q, Django) => {
                    'ngInject';
                    if (Django.context.authenticated) {
                        return true;
                    }
                    return $q.reject({
                        type: 'authn',
                        context: Django.context,
                    });
                },
            },
        })
        .state('communityData', {
            url: '/public/designsafe.storage.community/{filePath:any}?query_string&offset&limit',
            component: 'dataDepotBrowser',
            params: {
                systemId: 'designsafe.storage.community',
                filePath: '',
            },
            resolve: {
                apiParams: ()=> {
                    return {
                        fileMgr: 'community',
                        baseUrl: '/api/public/files',
                        searchState: 'communityData',
                    };
                },
                path: ($stateParams)=>{
                    'ngInject';
                    return $stateParams.filePath || '';
                },
                auth: () => {
                    return true;
                },
            },
        })
        .state('publicData', {
            url: '/public/?typeFilters&query_string',
            component: 'dataDepotPublicationsBrowser',
            params: {
                systemId: 'nees.public',
                filePath: '',
            },
            resolve: {
                apiParams: ()=> {
                    return {
                        fileMgr: 'public',
                        baseUrl: '/api/public/files',
                        searchState: 'publicData',
                    };
                },
                path: ($stateParams)=>{
                    'ngInject';
                    return $stateParams.filePath || '/';
                },
                auth: () => {
                    return true;
                },
            },
        })
        .state('publicDataLegacy', {
            url: '/public-legacy/?typeFilters&query_string',
            component: 'dataDepotPublicationsLegacyBrowser',
            params: {
                systemId: 'nees.public',
                filePath: '',
            },
            resolve: {
                apiParams: ()=> {
                    return {
                        fileMgr: 'public-legacy',
                        baseUrl: '/api/public/files',
                        searchState: 'publicDataLegacy',
                    };
                },
                path: ($stateParams)=>{
                    'ngInject';
                    return $stateParams.filePath || '/';
                },
                auth: () => {
                    return true;
                },
            },
        })
        .state('neesPublished', {
            url: '/public/nees.public/{filePath:any}',
            component: 'neesPublished',
            params: {
                systemId: 'nees.public',
                filePath: '',
            },
            resolve: {
                apiParams: ()=> {
                    return {
                        fileMgr: 'public',
                        baseUrl: '/api/public/files',
                        searchState: 'publicData',
                    };
                },
                path: ($stateParams)=>{
                    'ngInject';
                    return $stateParams.filePath || '/';
                },
                auth: () => {
                    return true;
                },
            },
        })
        .state('publishedData',  {
            url: '/public/designsafe.storage.published/{filePath:any}?query_string',
            component: 'publishedParent',
            resolve: {
                version: ($stateParams) => {
                    'ngInject';
                    return $stateParams.version || 1;
                },
                type: ($stateParams) => {
                    'ngInject';
                    return $stateParams.type;
                }
            },
            onExit: ($window) => {
                'ngInject';
                const projectLevelTags = [
                    'description',
                    'citation_title',
                    'citation_publication_date',
                    'citation_doi',
                    'citation_abstract_html_url',
                    'identifier',
                    'DC.identifier',
                    'DC.creator',
                    'DC.title',
                    'DC.date',
                    'authors'
                ];
                projectLevelTags.forEach(
                    (name) => {
                        let el = $window.document.getElementsByName(name);
                        if (el) {
                            el[0].content = '';
                            // citation_doi is also an entity tag
                            while(el[1]) el[1].parentNode.removeChild(el[1]);
                        }
                        
                    }
                );
                const entityTags = [
                    'citation_author',
                    'citation_author_institution',
                    'citation_description',
                    'citation_keywords',
                ];
                entityTags.forEach((name) => {
                    let els = $window.document.getElementsByName(name);
                    while (els[0]) {
                        els[0].parentNode.removeChild(els[0]);
                    }
                });
            },
        })
       
        .state('trainingMaterials', {
            url: '/training/',
            template: '<pre>local/trainingMaterials.html</pre>',
        });
        

    $urlRouterProvider.otherwise(function($injector) {
        var $state = $injector.get('$state');

        /* Default to MyData for authenticated users, PublicData for anonymous */
        if (Django.context.authenticated) {
            $state.go('myData', {
                systemId: 'designsafe.storage.default',
                filePath: Django.user,
            });
        } else {
            $state.go('publicData');
        }
    });
}

ddModule
    .config([
        '$httpProvider',
        '$locationProvider',
        '$stateProvider',
        '$urlRouterProvider',
        '$urlMatcherFactoryProvider',
        'Django',
        'toastrConfig',
        config,
    ])
    .run([
        '$rootScope',
        '$location',
        '$state',
        'Django',
        function($rootScope, $location, $state, Django) {
            $rootScope.$state = $state;
            $rootScope.$on('$stateChangeStart', function(event, toState, toParams) {
                if (toState.name === 'myData' || toState.name === 'sharedData') {
                    var ownerPath = new RegExp('^/?' + Django.user).test(toParams.filePath);
                    if (toState.name === 'myData' && !ownerPath) {
                        event.preventDefault();
                        $state.go('sharedData', toParams);
                    } else if (toState.name === 'sharedData' && ownerPath) {
                        event.preventDefault();
                        $state.go('myData', toParams);
                    }
                }
            });

            $rootScope.$on('$stateChangeError', function(event, toState, toParams, fromState, fromParams, error) {
                if (error.type === 'authn') {
                    var redirectUrl = $state.href(toState.name, toParams);
                    window.location = '/login/?next=' + redirectUrl;
                }
            });
        },
    ]);

ddModule.config([
    'WSBusServiceProvider',
    function(WSBusServiceProvider) {
        WSBusServiceProvider.setUrl(
            (window.location.protocol === 'https:' ? 'wss://' : 'ws://') +
                window.location.hostname +
                (window.location.port ? ':' + window.location.port : '') +
                '/ws/websockets?subscribe-broadcast&subscribe-user'
        );
    },
]);
export default ddModule;
