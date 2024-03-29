
export class SearchService {
    constructor($http, $uibModal) {
    'ngInject';
    this.$http = $http
    this.$uibModal = $uibModal
    };

    search(text, limit, offset, type_filter) {
        limit = limit || 10;
        offset = offset || 0;
        return this.$http.get('/api/search',
            {params: {'query_string': text, 'limit': limit, 'offset': offset, 'type_filter': type_filter}}
        );
    };

    help() {
        var modal = this.$uibModal.open({
          component: 'searchHelpModal',
          size: 'md'
        })
      }
}