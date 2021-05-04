import DataBrowserServicePreviewTemplate from './data-browser-service-preview.component.html';
import 'leaflet/dist/leaflet.css';
import 'leaflet/dist/images/marker-shadow.png';
import * as L from 'leaflet';
import { valid as validateGeoJson }from 'geojson-validation';

class DataBrowserServicePreviewCtrl {
    constructor($sce, $http, $scope, $state, FileListingService, FileOperationService, ProjectService, Django) {
        'ngInject';
        this.$sce = $sce;
        this.FileListingService = FileListingService;
        this.FileOperationService = FileOperationService;
        this.ProjectService = ProjectService;
        this.Django = Django;
        this.$state = $state;
        this.$http = $http;
        this.$scope = $scope;
    }

    $onInit() {
        //TODO DES-1689: working metadata table and operation buttons
        this.textContent = '';
        this.videoHref = '';
        this.hazmapperHref = '';
        this.loading = true;
        this.error = false;

        this.tests = this.FileOperationService.getTests([this.resolve.file]);

        this.FileOperationService.getPreviewHref({
            file: this.resolve.file,
            api: this.resolve.api,
            scheme: this.resolve.scheme,
        }).then(
            (resp) => {
                this.fileType = resp.data.fileType;
                this.href = this.$sce.trustAs('resourceUrl', resp.data.href);
                if (this.fileType === 'other') {
                    // Unsupported file, hide spinner and display warning.
                    this.loading = false;
                }
                if (this.fileType === 'text') {
                    const oReq = new XMLHttpRequest();
                    oReq.open('GET', this.href);
                    oReq.responseType = 'blob';
                    oReq.onload = (e) =>
                        e.target.response.text().then((text) => {
                            this.textContent = text;
                            const extension = this.resolve.file.name.split('.').pop();
                            if (extension.includes('json')) {
                                const body = JSON.parse(text);
                                // Pretty Print JSON
                                this.textContent = JSON.stringify(body, null, 4);
                                const isGeoJson = validateGeoJson(body);
                                if (isGeoJson) this.renderGeoJson(body);
                            }

                            if (extension.includes('hazmapper')) {
                                const body = JSON.parse(text);
                                let uuid = body['uuid'];
                                this.hazmapperHref = `https://hazmapper.tacc.utexas.edu/staging/project/${uuid}`
                                this.href = this.$sce.trustAs('resourceUrl', this.hazmapperHref);
                            }

                            this.loading = false;
                            this.$scope.$apply();
                        });
                    oReq.send();
                }
                if (this.fileType === 'video') {
                    const oReq = new XMLHttpRequest();
                    oReq.open('GET', this.href);
                    oReq.responseType = 'blob';
                    oReq.onload = (e) => {
                        this.videoHref = URL.createObjectURL(e.target.response);
                        this.loading = false;
                        this.$scope.$apply();
                    };
                    oReq.send();
                }
            },
            // eslint-disable-next-line
            (err) => {
                this.error = true;
                this.loading = false;
            }
        );
    }

    onLoad() {
        this.loading = false;
        this.$scope.$apply();
    }

    download() {
        const { api, scheme } = this.FileListingService.listings.main.params;
        const files = [this.resolve.file];
        this.FileOperationService.download({ api, scheme, files });
    }

    copy() {
        const { api, scheme, system, path } = this.FileListingService.listings.main.params;
        const files = [this.resolve.file];
        this.FileOperationService.openCopyModal({ api, scheme, system, path, files });
    }
    move() {
        const { api, scheme, system, path } = this.FileListingService.listings.main.params;
        const files = [this.resolve.file];
        this.FileOperationService.openMoveModal({ api, scheme, system, path, files });
        this.close();
    }
    rename() {
        const { api, scheme, system, path } = this.FileListingService.listings.main.params;
        const file = this.resolve.file;
        this.FileOperationService.openRenameModal({ api, scheme, system, path, file });
        this.close();
    }

    close() {
        this.dismiss();
    }

    isJupyter() {
        if (this.resolve.api !== 'agave') {
            return false;
        }
        const fileExtension = this.resolve.file.name.split('.').pop();
        return fileExtension === 'ipynb';

    }

    openInJupyter() {
        const params = {
            system: this.FileListingService.listings.main.params,
            loc: this.$state.current.name,
            path: this.resolve.file.path,
            projectId: this.ProjectService.current ? this.ProjectService.current.value.projectId : null
        };
        const jupyterPath = this.FileOperationService.openInJupyter(params);
        window.open(jupyterPath);
    }

    isHazmapper() {
        const fileExtension = this.resolve.file.name.split('.').pop();
        return fileExtension === 'hazmapper';
    }

    openInHazMapper() {
        window.open(this.hazmapperHref);
    }

    renderGeoJson(data) {
        const mapWrapper = document.getElementById('preview_map_wrapper');
        mapWrapper.style.display = 'block';

        this.mapElement = document.createElement('div');
        this.mapElement.setAttribute('id', 'preview_map');
        this.mapElement.style.height = '500px';
        mapWrapper.appendChild(this.mapElement);

        this.map = L.map(this.mapElement);
        this.mapError = { show: false, message: '' };

        // Fix marker icon 404
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
            iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
            iconUrl: require('leaflet/dist/images/marker-icon.png'),
            shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
        });

        try {
            L.tileLayer(
                'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                {
                    attribution:
                        '&copy; \
                        <a href="http://osm.org/copyright">OpenStreetMap</a> \
                        contributors',
                }
            ).addTo(this.map);
            const geoJson = L.geoJson(data).addTo(this.map);
            this.map.fitBounds(geoJson.getBounds());
        } catch(e) {
            this.map.off();
            this.map.remove();
            this.mapError = { show: true, message: e.message };
            const el = document.querySelector('#preview_map');
            const { parentElement } = el;
            parentElement.removeChild(el);
        }
    }

}

export const DataBrowserServicePreviewComponent = {
    template: DataBrowserServicePreviewTemplate,
    controller: DataBrowserServicePreviewCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&',
    },
};
