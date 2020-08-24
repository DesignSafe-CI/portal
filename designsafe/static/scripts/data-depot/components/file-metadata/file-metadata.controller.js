

class FileMetadataComponentCtrl {

    constructor() {

    }

    $onInit() {
        console.log(this.file)
        this.show = false;
    }

    toggle() {
        this.show = !this.show;
    }

}


export default FileMetadataComponentCtrl;
