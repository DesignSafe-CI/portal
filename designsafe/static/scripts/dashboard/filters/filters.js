export function agave2ds() {
    angular.module('designsafe').filter('agave2ds', () => {
        return (agaveUrl) => {
            let baseUrl = '/data/browser/agave/designsafe.storage.default/',
                parts = agaveUrl.split('designsafe.storage.default');
            return baseUrl + parts[1] + '/';
        };
    });
}
