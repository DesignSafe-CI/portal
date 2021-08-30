

class FileMetadataComponentCtrl {

    constructor($http, FileListingService) {
        'ngInject';
        this.$http = $http;
        this.FileListingService = FileListingService;
    }

    $onInit() {
        this.show = false;
        let api = 'agave'
        let system = this.file.system;
        let path = this.file.path;
        let url = `/api/datafiles/meta/${api}/${system}${path}`
        console.log(url);
        this.$http.get(url).then((resp) => {
            console.log(resp);
            this.meta = resp.data.meta.value;
        });
    }

    toggle() {
        this.show = !this.show;
    }

}


export default FileMetadataComponentCtrl;
