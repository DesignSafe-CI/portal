var L = require('leaflet');
import $ from 'jquery';

describe('RapidMainCtrl', function() {
    var RapidDataService, $location,
        $controller, $q, ctrl, $rootScope, mapSpy;
    var mockMap = {
        setView: jasmine.createSpy(),
        zoomControl: {
            setPosition: jasmine.createSpy()
        },
        addLayer: jasmine.createSpy(),
        on: jasmine.createSpy(), // Mock the on method
        hasLayer: jasmine.createSpy(), // Add hasLayer mock
        //getZoom: jasmine.createSpy(), // Add getZoom mock
    };
    var events = [
        { title: 'test1', location:{ lat:0, lon:0 } },
        { title: 'test2', location:{ lat:0, lon:0 } }
    ];
    var openTopoData = [
        { properties: { name: 'test1', host: 'OpenTopo', doiUrl: 'url1' }, geometry: { coordinates: [0, 0] } },
        { properties: { name: 'test2', host: 'OpenTopo', doiUrl: 'url2' }, geometry: { coordinates: [0, 0] } }
    ];

    beforeEach(angular.mock.module('ds.rapid'));
    beforeEach(() => {
        angular.module('django.context', []).constant('Django', { user: 'test_user' });
        angular.mock.inject(function(_RapidDataService_, _$location_, _$controller_, _$q_, _$rootScope_) {
            $controller = _$controller_;
            $q = _$q_;
            RapidDataService = _RapidDataService_;
            $location = _$location_;
            $rootScope = _$rootScope_;
        });
    });

    beforeEach(() => {
        spyOn(RapidDataService, 'get_events').and.returnValue($q.when(events));
        spyOn(RapidDataService, 'get_event_types').and.returnValue($q.when([]));
        spyOn(RapidDataService, 'get_opentopo_data').and.returnValue($q.when({ features: openTopoData }));
        ctrl = $controller('RapidMainCtrl', {
            RapidDataService: RapidDataService,
            $location: $location,
            $scope: $rootScope.$new()
        });
        mapSpy = spyOn(L, 'map').and.returnValue(mockMap);
        $(document.body).append("<div id='map'></div>");
    });

    it('should have created a map', () => {
        spyOn(ctrl, 'gotoEvent');
        spyOn(L, 'tileLayer');
        ctrl.$onInit();
        $rootScope.$digest();
        expect(mapSpy).toHaveBeenCalled();
        expect(mockMap.setView).toHaveBeenCalled();
        expect(mockMap.zoomControl.setPosition).toHaveBeenCalled();
        expect(RapidDataService.get_events).toHaveBeenCalled();
        expect(ctrl.gotoEvent).toHaveBeenCalled();
        expect(L.tileLayer).toHaveBeenCalled();
    });

    it('should call the search service', () => {
        spyOn(RapidDataService, 'search');
        ctrl.search();
        expect(RapidDataService.search).toHaveBeenCalled();
    });

    it('should call the search service when clearing filters', () => {
        spyOn(ctrl, 'search');
        ctrl.clear_filters();
        expect(ctrl.search).toHaveBeenCalled();
        expect(ctrl.filter_options).toEqual({});
    });

    it('should handle query parameter for events', () => {
        $location.search({ event: 'test1' });
        ctrl.$onInit();
        $rootScope.$apply();
        expect(ctrl.active_rapid_event).toEqual(events[0]);
    });
});
