

class FileMetadataComponentCtrl {
    constructor(FileOperationService, FileMetaService, $http) {
        'ngInject';
        this.FileOperationService = FileOperationService;
        this.FileMetaService = FileMetaService;
        this.$http = $http;
    }

    $onInit() {
        this._ui = {
            show: false,
            edit: false,
            loading: true
        }
        this.metaInput = {};
        this.FileMetaService.get({
            system: this.file.system,
            filePath: this.file.path.replace('#', '%23')
        }).then((resp) => {
            if (resp.data.error) {
                this.data = undefined;
            } else {
                this.data = resp.data;
                this.metaInput = JSON.stringify(resp.data.file_meta, null, 3);
            }
            this._ui.loading = false;
        });
    }

    toggle() {
        this._ui.show = !this._ui.show;
    }

    editMeta() {
        this._ui.edit = !this._ui.edit;
    }

    deleteMeta() {
        // update UI when this happens...
        this._ui.loading = true;
        this.FileMetaService.delete({docId: this.data._id.$oid}).then((resp) => {
            this.metaInput = {};
            this.data = undefined;
            this._ui.loading = false;
        });
    }

    saveMeta() {
        this._ui.loading = true;
        try {
            let input = JSON.parse(this.metaInput);
            if (this.data) {
                this.data.file_meta = input;
            } else {
                this.data = {
                    'name' : this.file.name,
                    'path' : this.file.path,
                    'system' : this.file.system,
                    'type' : this.file.type,
                    'size' : this.file.length.toString(),
                    'file_meta' : input,
                };
            }
            this.FileMetaService.save({
                system: this.file.system,
                filePath: this.file.path.replace('#', '%23'),
                body: this.data
            }).then((resp) => {
                this.editMeta();
                this._ui.loading = false;
            });
        } catch {
            // needs error msg...
            this.editMeta();
            this._ui.loading = false;
        }
    }

}


export default FileMetadataComponentCtrl;
