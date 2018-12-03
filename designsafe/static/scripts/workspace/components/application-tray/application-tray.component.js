import appTrayTemplate from './application-tray.component.html';

class AppTrayCtrl {
    constructor($scope, $location, $rootScope, $q, $state, $stateParams, $translate, Apps, SimpleList, $mdToast) {
        'ngInject';
        this.$rootScope = $rootScope;
        this.$scope = $scope;
        this.$q = $q;
        this.$location = $location;
        this.$state = $state;
        this.$stateParams = $stateParams;
        window.$stateParams = $stateParams;
        this.$translate = $translate;
        this.Apps = Apps;
        this.SimpleList = SimpleList;
        this.$mdToast = $mdToast;
    }

    $onInit() {
        this.tabs = [];

        this.simpleList = new this.SimpleList();
        this.data = {
            activeApp: null,
            publicOnly: false,
            type: null,
        };

        this.$scope.$on('close-app', (e, label) => {
            if (this.data.activeApp && this.data.activeApp.label === label) {
                this.data.activeApp = null;
            }
        });

        setTimeout(_ => this.refreshApps(), 0);

        $(document).mousedown(event => {
            let element = $(event.target),
                workspaceTab = element.closest('.workspace-tab'),
                appsTray = element.closest('div .apps-tray');
            if (!(appsTray.length > 0 || workspaceTab.length > 0) && this.activeTab != null) {
                this.outsideClick = true;
            } else {
                this.outsideClick = false;

                // If user clicks on same tab, close tab.
                if (workspaceTab.length == 1 && this.activeTab != null && workspaceTab[0].innerText.includes(this.tabs[this.activeTab].title)) {
                    if (workspaceTab.hasClass('active')) {
                        this.activeTab = null;
                    }
                }
            }
        });
    }

    addDefaultTabs(query) {
        this.error = '';
        let deferred = this.$q.defer();

        this.simpleList.getDefaultLists(query)
            .then(response => {
                deferred.resolve(response);
            })
            .catch(response => {
                this.error = this.$translate.instant('error_tab_get') + response.data;
                deferred.reject(response);
            });
        return deferred.promise;
    }

    closeApp(label) {
        this.$rootScope.$broadcast('close-app', label);
        this.data.activeApp = null;
    }

    refreshApps() {
        this.error = '';
        this.requesting = true;
        this.tabs = [];

        let appId = this.$stateParams.appId,
            binned = false,
            appCategory;

        // Launch app if appId in url
        if (appId) {
            appCategory = appId.split('::')[1];
            if (appCategory && this.simpleList.tabs.includes(appCategory)) {
                binned = true;
            } else {
                this.Apps.getMeta(appId)
                    .then(
                        response => {
                            if (response.data.length > 0) {
                                if (response.data[0].value.definition.available) {
                                    this.launchApp(response.data[0]);
                                } else {
                                    this.$mdToast.show(this.$mdToast.simple()
                                        .content(this.$translate.instant('error_app_disabled'))
                                        .toastClass('warning')
                                        .parent($('#toast-container')));
                                }
                            } else {
                                this.$mdToast.show(this.$mdToast.simple()
                                    .content(this.$translate.instant('error_app_run'))
                                    .toastClass('warning')
                                    .parent($('#toast-container')));
                            }
                        },
                        response => {
                            this.$mdToast.show(this.$mdToast.simple()
                                .content(this.$translate.instant('error_app_run'))
                                .toastClass('warning')
                                .parent($('#toast-container')));
                        }
                    );
            }
        }

        this.addDefaultTabs({ $and: [{ name: `${this.$translate.instant('apps_metadata_name')}` }, { 'value.definition.available': true }] })
            .then(response => {
                if (binned) {
                    appId = appId.split('::')[0];
                    const appIndex = this.simpleList.binMap[appCategory][appId];
                    this.launchApp(this.simpleList.lists[appCategory][appIndex]);
                }

                this.simpleList.tabs.forEach(element => {
                    this.tabs.push(
                        {
                            title: element,
                            content: this.simpleList.lists[element],
                            count: this.simpleList.lists[element].length,
                        }
                    );
                }, this);
                this.activeTab = null;
                this.requesting = false;
            });
    }

    launchApp(app, tab) {
        this.$state.go(
            'tray',
            { appId: app.value.definition.id },
            { notify: false }
        );
        this.data.activeApp = app;
        this.$rootScope.$broadcast('launch-app', app);
        this.activeTab = null;
    }

    // Want all tabs to be inactive on start, and whenever user clicks outside the tab-tray.
    showApps($event, tab) {
        if (this.outsideClick) {
            this.activeTab = null;
        }
    }
}

export const AppTrayComponent = {
    controller: AppTrayCtrl,
    controllerAs: '$ctrl',
    template: appTrayTemplate,
};
