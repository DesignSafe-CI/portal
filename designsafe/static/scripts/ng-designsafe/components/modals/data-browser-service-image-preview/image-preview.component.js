import ImagePreviewTemplate from './image-preview.template.html';

class ImagePreviewCtrl {
    constructor() { }

    $onInit() {
        this.loading = true;
        this.slides = [];
        this.images = [];
        this.images = this.resolve.images;
        this.images.forEach((child, i, arr) => {
            return child.download()
                .then((res) => {
                    const {
                        name, path, lastModified
                    } = child;
                    const meta = { name, path, lastModified };
                    if (child.size) {
                        meta.size = child.size;
                    } else if (child.length) {
                        meta.length = child.length;
                    }
                    this.slides.push({
                        meta,
                        image: res.href,
                        text: child.name,
                        id: this.slides.length
                    });
                    if (i === arr.length - 1) {
                        this.loading = false;
                    }
                });
        });
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