var L = require('leaflet');
import EMPTY_MAP from '../fixtures/empty_map';
import SINGLE_MARKER_MAP from '../fixtures/single_marker';

describe('GeoDataService', ()=> {
    var GeoDataService, $q, $httpBackend, $rootScope, $timeout, scope;
    beforeEach(angular.mock.module('ds.geo'));
    beforeEach( ()=> {
        angular.module('django.context', []).constant('Django', { user: 'test_user' });
        angular.mock.inject(function(_$q_, _$httpBackend_, _GeoDataService_, _$rootScope_, _$timeout_) {
            $q = _$q_;
            $httpBackend = _$httpBackend_;
            GeoDataService = _GeoDataService_;
            $rootScope = _$rootScope_;
            $timeout = _$timeout_;
            scope = $rootScope.$new();
        });
        scope.$digest();
    });

    it('Should be defined', ()=> {
        expect(GeoDataService).toBeDefined();
    });

    it('Should return a promise from a local JSON file', (done)=>{
        let blob = new Blob([JSON.stringify(EMPTY_MAP)], { type:'application/json' });
        blob.name = 'test.geojson';
        GeoDataService.load_from_local_file(blob).then( (data)=>{
            expect(data.name).toEqual('New Map');
            expect(data.layer_groups.length).toEqual(1);
            done();
        });
        setTimeout( ()=>{
            scope.$digest();

        }, 50);

    });

    it('Should load a map with single marker', (done)=>{
        let blob = new Blob([JSON.stringify(SINGLE_MARKER_MAP)], { type:'application/json' });
        blob.name = 'test.geojson';
        GeoDataService.load_from_local_file(blob).then( (data)=>{
            expect(data.name).toEqual('New Map');
            expect(data.layer_groups.length).toEqual(1);
            expect(data.layer_groups[0].feature_group.getLayers().length).toEqual(1);
            done();
        });
        setTimeout( ()=>{
            scope.$digest();
        }, 50);

    });
});
