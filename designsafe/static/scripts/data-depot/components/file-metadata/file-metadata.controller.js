

class FileMetadataComponentCtrl {

    constructor() {

    }

    $onInit() {
        this.show = false;
        this.loading = true;
        this.file.getAssociatedMetadata().then((resp) => {
            try {
                this.metadata = resp[1];
                Object.keys(this.metadata).filter((key) => {
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
        }).finally(() => {
            this.loading = false;
        });
    }

    toggle() {
        this.show = !this.show;
    }

    testQuery() {
        this.file.getMongoMetadata().then((resp) => {
            console.log(resp);
        });
    }
    testAdd() {
        let meta = {
            'name' : this.file.name,
            'path' : this.file.path,
            'system' : this.file.system,
            'type' : this.file.type,
            'size' : this.file.length,
            'description' : 'THIS IS A TEST OF METADATA THAT HAS BEEN UPDATED',
        };
        this.file.addMongoMetadata(meta).then((resp) => {
            console.log(resp);
        });
    }
    testDelete() {
        this.file.deleteMongoMetadata().then((resp) => {
            console.log(resp);
        });
    }

}


export default FileMetadataComponentCtrl;
