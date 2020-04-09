

describe('FileMetadataComponent', ()=> {
    var FileListing,
        $rootScope,
        $compile,
        element,
        scope,
        fl,
        $q;

    beforeEach(angular.mock.module('ds-data'));
    beforeEach( ()=> {
        angular.module('django.context', []).constant('Django', { user: 'test_user' });
        angular.mock.inject(function(_$q_, _$rootScope_, _FileListing_, _$compile_) {
            $q = _$q_;
            $rootScope = _$rootScope_;
            FileListing = _FileListing_;
            $compile = _$compile_;
        });
        scope = $rootScope.$new();
        let options = {
            system: 'test-system',
            path: 'test/test.txt',
            name: 'test.txt',
            directory: '/test',
            length: 10,
            lastModified: new Date('2018-01-01T12:00:00-06:00'),
            queryString: '',
        };
        let meta = [{},{
            key1: 'val1',
            key2: 'val2',
            geolocation: [{ latitude: 0, longitude: 0 }],
            key3: '',
            _key5: 'val5'
        }];
        fl = FileListing.init(options);
        spyOn(fl, 'getAssociatedMetadata').and.returnValue($q.when(meta));
        scope.fl = fl;

    });

    it('FileMetadata component Should call FileListing.getAssociatedMetadata on init', ()=>{
        let el = angular.element("<file-metadata file='fl'></file-metadata>");
        element = $compile(el)(scope);
        expect(fl.getAssociatedMetadata).toHaveBeenCalled();
    });

    it('FileMetadata component should show default metadata', ()=>{
        let el = angular.element("<file-metadata file='fl'></file-metadata>");
        element = $compile(el)(scope);
        scope.$digest();
        expect(element.find('table').html()).toContain('1/1/18 12:00 PM');
        expect(element.find('table').html()).toContain('test/test.txt');
    });

    it('FileMetadata component should show additional metadata', ()=>{
        let el = angular.element("<file-metadata file='fl'></file-metadata>");
        element = $compile(el)(scope);
        scope.$digest();
        expect(element.find('table').html()).toContain('key1');
        expect(element.find('table').html()).toContain('val1');
        expect(element.find('table').html()).toContain('test/test.txt');
    });

    it('FileMetadata component should correctly parse the geolocation tag', ()=>{
        let el = angular.element("<file-metadata file='fl'></file-metadata>");
        element = $compile(el)(scope);
        scope.$digest();
        expect(element.find('table').html()).toContain('geolocation');
        expect(element.find('table').html()).toContain('(0, 0)');
    });

    it('FileMetadata component should not show nulls or keys that start with _', ()=>{
        let el = angular.element("<file-metadata file='fl'></file-metadata>");
        element = $compile(el)(scope);
        scope.$digest();
        expect(element.find('table').html()).not.toContain('key3');
        expect(element.find('table').html()).not.toContain('val5');
    });


});
