describe('FileMetadataComponent', () => {
    var $rootScope, $compile, element, scope, fl, $q;

    beforeEach(angular.mock.module('ds-data'));
    beforeEach(() => {
        angular.module('django.context', []).constant('Django', { user: 'test_user' });
        angular.mock.inject(function(_$q_, _$rootScope_, _$compile_) {
            $q = _$q_;
            $rootScope = _$rootScope_;
            $compile = _$compile_;
        });
        scope = $rootScope.$new();
        
        fl = {
            system: 'test-system',
            path: 'test/test.txt',
            name: 'test.txt',
            length: 10,
            lastModified: new Date('2018-01-01T12:00:00-06:00'),
        };
    });

    it('FileMetadata component should show default metadata', () => {
        scope.fl = fl;
        let el = angular.element('<file-metadata file="fl"></file-metadata>');
        element = $compile(el)(scope);
        scope.$digest();
        expect(element.find('table').html()).toContain('test/test.txt');
    });

});
