

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
                Object.keys(this.metadata).filter((key)=>{
                    if (key.startsWith('_') || this.metadata[key] === '') {
                        delete this.metadata[key];
                    }
                });
                // Convert the object to an Array for the template
                this.metadata = Object.keys(this.metadata).map( (key)=> {return [key, this.metadata[key]];});
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
