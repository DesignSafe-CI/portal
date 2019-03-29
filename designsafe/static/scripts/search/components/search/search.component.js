import searchTemplate from './search.component.html';

class SearchCtrl {

    constructor($location, $window, $state, searchService) {
        'ngInject';
        this.searchService = searchService
        this.$window = $window
        this.$state = $state
        //this.user = Django.user;
        this.data = {};
        this.Math = window.Math;
        this.counter = Array;
        this.page_num = 0;
        this.results_per_page = 10;
        this.offset = 0;
        this.data.search_text = null;
        this.data.search_results = null;
        this.data.type_filter = 'all';
        this.searching = false;
        this.inital_q = $location.search().q;
        
        this.prettyFilterName = {
            'cms': 'Web Content', 
            'all': 'Designsafe-CI' ,
            'published': 'Published Projects', 
            'public_files': 'Public Files'
        }
    }

    $onInit() {
          this.data.search_text = this.$state.params.query_string;
          this.data.type_filter = this.$state.params.type_filter
          if (this.data.search_text) {
            this.search()
          }
    }

    help() {
      this.searchService.help()
    }

    search_browse() {
      this.$state.go('search', {'query_string': this.data.search_text, 'type_filter': this.data.type_filter, 'redirect': false});
    };

    search(reset){
      arguments.length ? reset = true : reset = false;
      if (reset) {
        this.page_num = 0;
      }
      if (this.data.search_text) {
        this.searching = true;
        this.offset = this.page_num * this.results_per_page;

        this.searchService.search(this.data.search_text, this.results_per_page, this.offset, this.data.type_filter).then( resp => {
            this.data.search_results = resp.data;
            this.max_pages = this.Math.ceil(this.data.search_results.total_hits / this.results_per_page);
            this.searching = false;
            this.$window.scrollTo(0, 0);
        }, err => {
          this.searching = false;
        });
      }
    };

    filter(ftype) {
      this.data.type_filter = ftype;
      this.page_num = 0;
      this.search_browse();
    };

    next() {
      this.page_num = this.page_num + 1;
      this.search();
    };

    prev() {
      this.page_num--;
      if (this.page_num < 0) this.page_num = 0;
      this.search();
    };

    select_page(page_num) {
      this.page_num = page_num;
      this.offset = page_num * this.results_per_page;
      this.search();
    };

    max_pages() {
        return this.Math.ceil(this.data.search_results.total_hits / this.results_per_page)
    }

}

export const SearchComponent = {
    template: searchTemplate,
    controller: SearchCtrl,
    controllerAs: '$ctrl'
}
