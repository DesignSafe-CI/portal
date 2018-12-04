describe('RapidDataService', function() {
    var RapidDataService, $httpBackend;
    var events = [
        { title: 'test1', location:{ lat:0, lon:0 }, event_date: "2018-01-01", event_type: 'Earthquake' },
        { title: 'test2 earthquake', location:{ lat:0, lon:0 }, event_date: "2018-02-01", event_type: 'Tsunami' }
    ];
    var eventTypes = [{ type: 'Earthquake' }, { type: 'Tsunami' } ];

    beforeEach(angular.mock.module('ds.rapid'));
    beforeEach( ()=> {
        angular.module('django.context', []).constant('Django', { user: 'test_user' });
        angular.mock.inject(function(_RapidDataService_, _$httpBackend_) {
            RapidDataService = _RapidDataService_;
            $httpBackend = _$httpBackend_;
        });
    });
    beforeEach( ()=> {
        $httpBackend.whenGET('/recon-portal/events').respond(200, events);
        $httpBackend.whenGET('/recon-portal/event-types').respond(200, eventTypes);
    });

    it('should have returned an events listing', ()=>{
        let evs;
        RapidDataService.get_events().then( (resp)=> {
            evs = resp;
        });
        $httpBackend.flush();
        expect(evs.length).toEqual(2);
        expect(evs[0].event_date).toEqual(jasmine.any(Date));
    });

    it('should have returned an events listing', ()=>{
        let types;
        RapidDataService.get_event_types().then( (resp)=> {
            types = resp;
        });
        $httpBackend.flush();
        expect(types).toEqual(eventTypes);
    });

    it('should search/filter events', ()=>{
        let tmp = RapidDataService.search(events, { event_type: { name: 'Earthquake' } });
        expect(tmp.length).toEqual(1);
        expect(tmp).toEqual(jasmine.any(Array));
        expect(tmp[0].title).toEqual('test1');

        tmp = RapidDataService.search(events, {  search_text: 'Earthquake' });
        expect(tmp[0].title).toEqual('test2 earthquake');

        tmp = RapidDataService.search(events, {  search_text: 'nonsense' });
        expect(tmp.length).toEqual(0);
    });




});
