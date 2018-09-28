import angular from 'angular';

import { CommunityDataCtrl } from './community';
import { DataDepotNavCtrl } from './data-depot-nav';
import { DataDepotNewCtrl } from './data-depot-new';
import { ExternalDataCtrl } from './external-data';
import { MainCtrl } from './main';
import { MyDataCtrl } from './my-data';
import { ProjectDataCtrl, ProjectListingCtrl, ProjectRootCtrl, 
         ProjectSearchCtrl, ProjectViewCtrl } from './projects';
import { PublicationDataCtrl } from './publications';
import { PublishedDataCtrl } from './published';
import { SharedDataCtrl } from './shared-data';

let ddControllers = angular.module('dd.controllers', []);

ddControllers.controller('CommunityDataCtrl', CommunityDataCtrl);
ddControllers.controller('DataDepotNavCtrl', DataDepotNavCtrl);
ddControllers.controller('DataDepotNewCtrl', DataDepotNewCtrl);
ddControllers.controller('ExternalDataCtrl', ExternalDataCtrl);
ddControllers.controller('MainCtrl', MainCtrl);
ddControllers.controller('MyDataCtrl', MyDataCtrl);

ddControllers.controller('ProjectDataCtrl', ProjectDataCtrl);
ddControllers.controller('ProjectListingCtrl', ProjectListingCtrl);
ddControllers.controller('ProjectRootCtrl', ProjectRootCtrl);
ddControllers.controller('ProjectSearchCtrl', ProjectSearchCtrl);
ddControllers.controller('ProjectViewCtrl', ProjectViewCtrl);

ddControllers.controller('PublicationDataCtrl', PublicationDataCtrl);
ddControllers.controller('PublishedDataCtrl', PublishedDataCtrl);
ddControllers.controller('SharedDataCtrl', SharedDataCtrl);

export default ddControllers;