export function agave2ds() {
    angular.module('designsafe').filter('agave2ds', () => {
        return agaveUrl => {
            let baseUrl = '/data/browser/agave/designsafe.storage.working/',
                parts = agaveUrl.split('designsafe.storage.working');
            return baseUrl + parts[1] + '/';
        };
    });
}
