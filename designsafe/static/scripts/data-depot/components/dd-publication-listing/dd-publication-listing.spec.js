describe('ddPublicationListingComponent', () => {
    let $rootScope, $compile, ctrl;

    beforeEach(() => {
        angular.mock.module('ds-data')
    })
    
    beforeEach(() => {
        angular.module('django.context', []).constant('Django', { user: 'test_user' });
        angular.mock.inject(function (_$compile_, _$rootScope_, $componentController) {
            $compile = _$compile_
            $rootScope = _$rootScope_;
       
            const mockedServices = {
            }
            const mockedBindings = {
                browser: {},
                queryString: null,
                onBrowse: () => {},
                onSelect: () => {},
                renderPath: () => {},
                renderName: () => {},
                scrollToBottom: () => {},
                scrollToTop: () => {},

            }
            ctrl = $componentController(
                'ddPublicationListingComponent',
                mockedServices,
                mockedBindings
            );
        });

    });

    it('Should define controller', () => {
        expect(ctrl).toBeDefined();
    });
    it('should compile with a row for each child in the listing', () => {
        var scope = $rootScope.$new();
        scope.renderName = () => 'PROJ_NAME'
        scope.browser = {
            listing: {
                children: [
                    {
                        system: 'nees.public',
                        path: '/path/to/file1',
                        metadata: {
                            name: "NEES-2007-XXXX",
                            path: "/NEES-2007-XXXX.groups",
                            permissions: "READ",
                            system: "nees.public",
                            systemId: "nees.public",
                            project: {
                                title: 'NEES project title'
                            }
                        }
                        
                    },
                    {
                        system: 'designsafe.storage.published',
                        path: '/path/to/file2',
                        meta: {
                            dateOfPublication: "2018-02-07T15:12:35.695644",
                            pi: "PINAME",
                            piLabel: "PI, Name",
                            projectId: "PRJ-XXXX",
                            title: "Designsafe Project Title",
                            type: "other"
                        }
                        
                    },

                ]
            }
        }
        let el = angular.element("<dd-publication-listing-component browser='browser' render-name='renderName' ></dd-publication-listing-component")
        var element = $compile(el)(scope)
        scope.$digest()
        // expect one header row plus two rows for children
        expect(element.find('tr').length).toEqual(3) 

    });
    
})