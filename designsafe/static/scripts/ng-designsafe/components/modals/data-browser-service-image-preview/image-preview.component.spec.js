import { ImagePreviewComponent } from './image-preview.component';

describe ('Image Preview Component', () => {
    let ctrl;

    beforeEach(() => {
        const ImagePreviewCtrl = ImagePreviewComponent.controller;
        ctrl = new ImagePreviewCtrl();
    });

    it('should define a controller', () => {
        expect(ctrl).toBeDefined();
    });

    it('should define a template', () => {
        expect(ImagePreviewComponent.template).toBeDefined();
    });
});
