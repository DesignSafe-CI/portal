
export class SearchService {
    constructor($http, $uibModal, djangoUrl) {
    'ngInject';
    this.$http = $http
    this.$uibModal = $uibModal
    };

    search(text, limit, offset, type_filter) {
        limit = limit || 10;
        offset = offset || 0;
        // return $http.get(djangoUrl.reverse('ds_search_api.search', []), {params: {'q': text}});
        return this.$http.get('/api/search',
            {params: {'query_string': text, 'limit': limit, 'offset': offset, 'type_filter': type_filter}})
              .then((resp) => {
                return resp.data;
              },
              (error) => {
                return this.$q.reject(error);
              });
    };

    help() {
        var modal = this.$uibModal.open({
          component: 'searchHelpModal',
          size: 'md'
        })
      }
}