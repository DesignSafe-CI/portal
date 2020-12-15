

class FileMetadataComponentCtrl {
    constructor(FileOperationService, $http) {
        'ngInject';
        this.FileOperationService = FileOperationService;
        this.$http = $http;
    }

    $onInit() {
        this.show = false;
        this.edit = false;
        this.loading = false;
        let urlParts = ['/api/restheart/files/v3/', this.file.system];
        let filePath = this.file.path
        if (filePath) {
            urlParts.push(filePath.replace('#', '%23'));
        }
        this.metaPath = urlParts.join('');
        console.log(this.metaPath);
        
        this.testmeta = JSON.stringify({ foo: "sample", bar: "sample" }, null, 3)
        /* 
        We'll need to query the file path for existing metadata and display it.
        If nothing is found give the ability to add
        If data is found give options to update or delete
        */
        // this.$http.get(this.metaPath).then((resp) => {
        //     console.log(resp);
        // }).finally(() => {
        //     this.loading = false;
        // });
        // this.loading = false;
    }

    toggle() {
        this.show = !this.show;
    }

    editMeta() {
        this.edit = !this.edit;
    }

    testQuery() {
        this.$http.get(this.metaPath).then((resp) => {
            console.log(resp);
        });
    }
    testAdd() {
        this.metaInput;
        let meta = {
            'name' : this.file.name,
            'path' : this.file.path,
            'system' : this.file.system,
            'type' : this.file.type,
            'size' : this.file.length.toString(),
            'file_meta' : this.testmeta,
        }
        console.log('Adding metadata...');
        console.log(meta);
        this.$http.post(this.metaPath, meta).then((resp) => {
            console.log(resp);
        });
    }

    testDelete() {
        console.log('delete');
        // this.file.deleteMongoMetadata().then((resp) => {
        //     console.log(resp);
        // });
    }

}


export default FileMetadataComponentCtrl;
