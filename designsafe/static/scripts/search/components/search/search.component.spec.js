import { SearchComponent } from './search.component';

describe('searchComponent', () => {
    var searchService, $window, $location, $state,
      $controller, $rootScope, scope, ctrl, $q;
    
    beforeEach( () => {
        angular.mock.module('ds-search')
    });
    
    beforeEach( ()=> {
        angular.module('django.context', []).constant('Django', {user: 'test_user'});
        angular.mock.inject(function(_$rootScope_, _$controller_,
          _searchService_, _$location_, _$state_, _$q_) {
          $location = _$location_;
          $state = _$state_;
          $controller = _$controller_;
          $rootScope = _$rootScope_;
          searchService = _searchService_;
          $q = _$q_;
        });
      });
    
    beforeEach( () => {
        const SearchCtrl = SearchComponent.controller;
        ctrl = new SearchCtrl(
            $location,
            $window,
            $state,
            searchService
        );
    })
    
    it("Should init with proper data", ()=> {
        ctrl.$state.params.query_string = 'test';
        ctrl.$onInit();
        expect(ctrl.data.search_text).toEqual('test');
      });

    it("Should view next page of results", ()=> {
        spyOn(searchService, 'search').and.returnValue($q.when({}));
        ctrl.$state.params.query_string = 'test';
        ctrl.$onInit();
        ctrl.next();
        expect(ctrl.page_num).toEqual(1);
        expect(searchService.search).toHaveBeenCalled();
    });

    it("should change filter type", ()=>{
        spyOn(ctrl, 'search_browse').and.returnValue($q.when({}));
        ctrl.filter('test_filter');
        expect(ctrl.data.type_filter).toEqual('test_filter');
        expect(ctrl.page_num).toEqual(0);
        expect(ctrl.search_browse).toHaveBeenCalled();
    });
      

})