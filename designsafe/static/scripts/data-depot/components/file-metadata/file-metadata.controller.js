

class FileMetadataComponentCtrl {

    constructor() {

    }

    $onInit() {
        this.show = false;
        this.loading = true;
        this.file.getAssociatedMetadata().then( (resp)=>{
            this.metadata = resp[0];
        }, (err)=>{
            this.errorMessage = err.message;
        }).finally( ()=> {
            this.loading = false;
        });
    }

    toggle() {
        this.show = !this.show;
    }

}


export default FileMetadataComponentCtrl;
