import prj_template_header from './templates/prj-metadata-template.html';
import prj_pub_preview_header from './templates/prj-pub-preview-metadata-template.html';

export function prjMetadata() {
    'ngInject';
  return {
    restrict: 'EA',
    scope: false,
    template: prj_template_header,
  }
}

export function prjPubPreviewMetadata(){
  'ngInject';
    return {
      restrict: 'EA',
      scope: false,
      template: prj_pub_preview_header,
    }
}