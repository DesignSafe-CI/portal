

class FileMetadataComponentCtrl {

    constructor() {

    }

    $onInit() {
        this.show = false;
        this.file.getAssociatedMetadata().then( (resp)=>{
            this.metadata = resp[0];
        }, (err)=>{
            this.errorMessage = err.message;
        });
    }

    toggle() {
        this.show = !this.show;
    }

}


export default FileMetadataComponentCtrl;
