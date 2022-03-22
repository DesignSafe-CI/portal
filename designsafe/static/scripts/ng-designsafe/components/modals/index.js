import angular from 'angular';

import { DataBrowserServiceMoveComponent } from './data-browser-service-move/data-browser-service-move.component';
import { DataBrowserCopyModal } from './data-browser-service-copy/data-browser-service-copy.component';
import { DataBrowserServiceUpload } from './data-browser-service-upload/data-browser-service-upload.component';
import { DataBrowserServiceMkdir } from './data-browser-service-mkdir/data-browser-service-mkdir.component';
import { DataBrowserServiceRename } from './data-browser-service-rename/data-browser-service-rename.component';
import { DataBrowserServicePreviewComponent } from './data-browser-service-preview/data-browser-service-preview.component';
import { ImagePreviewComponent } from './data-browser-service-image-preview/image-preview.component';
import {DataBrowserServiceSurveyComponent} from './data-browser-service-survey/data-browser-service-survey.component';
import { DownloadLargeModal } from './data-browser-service-download-large/download-large.component';

let ddComponentsModals = angular.module('designsafe.components.modals', ['ui.bootstrap']);

ddComponentsModals.component('moveModal', DataBrowserServiceMoveComponent);
ddComponentsModals.component('copyModal', DataBrowserCopyModal);
ddComponentsModals.component('uploadModal', DataBrowserServiceUpload);
ddComponentsModals.component('mkdirModal', DataBrowserServiceMkdir);
ddComponentsModals.component('renameModal', DataBrowserServiceRename)
ddComponentsModals.component('preview', DataBrowserServicePreviewComponent);
ddComponentsModals.component('ddimagepreview', ImagePreviewComponent);
ddComponentsModals.component('ddsurvey', DataBrowserServiceSurveyComponent)
ddComponentsModals.component('downloadLarge', DownloadLargeModal);

export default ddComponentsModals;
