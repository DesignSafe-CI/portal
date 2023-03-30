/* eslint-disable camelcase */
import prj_template_header from './templates/prj-metadata-template.html';
import prj_pub_preview_header from './templates/prj-pub-preview-metadata-template.html';
import related_work from './templates/related-work-template.html';
import referenced_data from './templates/referenced-data-template.html';
import prj_pub_collections from './templates/prj-pub-collections-template.html';

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

export function relatedWork() {
  'ngInject';
  return {
    restrict: 'EA',
    scope: false,
    template: related_work,
  }
}

export function referencedData(){
'ngInject';
  return {
    restrict: 'EA',
    scope: false,
    template: referenced_data,
  }
}
export function prjPubCollections(){
  'ngInject';
    return {
      restrict: 'EA',
      scope: false,
      template: prj_pub_collections,
    }
}
