import _ from 'underscore';

export class ApplicationSystemsRoleCtrl {
    constructor($translate, $state, Apps, Django) {
        'ngInject';
        this.$translate = $translate;
        this.$state = $state;
        this.Apps = Apps;
        this.Django = Django;
    }

    $onInit() {
        this.getSystemRoles();
    }

    getSystemRoles() {
        let self = this;
        self.requesting = true;

        if (this.Django.user === 'ds_admin') {
            this.$state.go('applications-add-admin');
        } else {
            const execSystem = this.$translate.instant('execution_default');

            this.Apps.getSystemRoles(execSystem)
                .then(
                    function(response) {
                        _.each(response.data, function(role) {
                            if (role.username === self.Django.user) {
                                if (role.role === 'ADMIN' || role.role === 'PUBLISHER' || role.role === 'OWNER') {
                                    self.$state.go('applications-add');
                                }
                            }
                        });
                        self.requesting = false;
                    },
                    function(response) {
                        if (response.data) {
                            if (response.data.message) {
                                self.error = self.$translate.instant('error_app_system_roles') + response.data.message;
                            } else {
                                self.error = self.$translate.instant('error_app_system_roles') + response.data;
                            }
                        } else {
                            self.error = self.$translate.instant('error_app_system_roles');
                        }
                        self.requesting = false;
                    }
                );
        }
    }
}
