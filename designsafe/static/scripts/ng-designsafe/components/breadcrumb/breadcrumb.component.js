import BreadcrumbTemplate from './breadcrumb.template.html';

class BreadcrumbCtrl {
    constructor($state, DataBrowserService) {
        'ngInject';
        this.$state = $state;
        this.DataBrowserService = DataBrowserService;
    }

    $onInit() {
        this.updateTrails();
    }
    
    $onChanges() {

        this.updateTrails();

        
    }

    updateTrails() {
        const path = this.path;
        let pathLabels = path.split('/').filter((path) => path); //remove blank entries from split path
        let paths = [];
        pathLabels.reduce((curr, next) => {
            const newValue = `${curr}/${next}`.replace(/^\/+/, '');
            paths.push(newValue);
            return newValue;
        }, '');
        this.trails = [];
        paths.forEach((path, i) => {
            this.trails.push({ path: path, label: pathLabels[i] });
        });

        if (this.skipRoot) {
            this.trails = this.trails.slice(1);
        }
        this.trails = [this.customRoot, ...this.trails];
    }

    breadcrumbHref(item) {
        return this.$state.href(this.$state.current.name, {
            systemId: this.browser.listing.system,
            filePath: item.path,
        });
    }

    browse($event, path) {
        $event.preventDefault();
        const file = { type: 'dir', system: this.system, path };
        this.onBrowse({ file });
    }

    browsePreRoot($event) {
        if (this.preRoot.onBrowse) {
            $event.preventDefault();
            this.preRoot.onBrowse();
        }
    }
}

export const BreadcrumbComponent = {
    controller: BreadcrumbCtrl,
    controllerAs: '$ctrl',
    template: BreadcrumbTemplate,
    bindings: {
        onBrowse: '&',
        path: '<',
        system: '<',
        customRoot: '<',
        skipRoot: '<',
        preRoot: '<', //Link to go before the system root, e.g. projects or publications, {href, onBrowse, label}
    },
};
