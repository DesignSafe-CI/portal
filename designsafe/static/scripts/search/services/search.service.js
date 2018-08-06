
export class SearchService {
    constructor($http, djangoUrl) {
        this.$http = $http
    };

    search(text, limit, offset, type_filter) {
        limit = limit || 10;
        offset = offset || 0;
        // return $http.get(djangoUrl.reverse('ds_search_api.search', []), {params: {'q': text}});
        return this.$http.get('/api/search',
            {params: {'q': text, 'limit': limit, 'offset': offset, 'type_filter': type_filter}}
        );
    };
}


SearchService.$inject = ['$http', 'djangoUrl']