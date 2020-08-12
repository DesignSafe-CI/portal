import ImagePreviewTemplate from './image-preview.template.html';

class ImagePreviewCtrl {
    constructor(DataBrowserService, FileOperationService) {
        'ngInject';
        this.DataBrowserService = DataBrowserService;
        this.FileOperationService = FileOperationService;
    }

    $onInit() {
        this.loading = true;
        this.active = 0;
        this.slides = [];
        this.images = this.resolve.images;
        this.images.forEach((child, i, arr) => {
            return this.FileOperationService.getPreviewHref({
                api: this.resolve.api,
                scheme: this.resolve.scheme,
                file: child,
            }).then((res) => {
                const { name, path, lastModified } = child;
                const meta = { name, path, lastModified };
                if (child.size) {
                    meta.size = child.size;
                } else if (child.length) {
                    meta.length = child.length;
                }
                this.slides.push({
                    meta,
                    image: res.data.href,
                    text: child.name,
                    id: this.slides.length,
                });
                if (i === arr.length - 1) {
                    this.loading = false;
                }
            });
        });
    }

    download(file) {
        this.DataBrowserService.download(file);
    }

    copy(file) {
        //this.DataBrowserService.copy(file);
    }

    move(file) {
        this.DataBrowserService.move(file, this.DataBrowserService.state().listing);
    }

    rename(file) {
        this.DataBrowserService.rename(file);
    }

    rm(file) {
        this.DataBrowserService.rm(file);
    }

    close() {
        return this.dismiss();
    }
}

export const ImagePreviewComponent = {
    template: ImagePreviewTemplate,
    controller: ImagePreviewCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },
};