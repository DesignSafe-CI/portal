

class FileMetadataComponentCtrl {

    constructor() {

    }

    $onInit() {
        this.show = false;
        this.loading = true;
        this.file.getAssociatedMetadata().then( (resp)=>{
            //
            try {
                this.metadata = resp[1];
            } catch(err) {
                this.metadata = null;
            }
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
