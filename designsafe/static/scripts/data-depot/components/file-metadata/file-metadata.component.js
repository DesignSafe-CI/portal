import FileMetadataComponentCtrl from './file-metadata.controller';
import template from './file-metadata.template.html';

export const FileMetadataComponent = {
    controller: FileMetadataComponentCtrl,
    template: template,
    bindings: {
        file: '<'
    }
};
