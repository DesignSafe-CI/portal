describe('ddPublicationListingComponent', () => {
    let $rootScope, $compile, ctrl;

    beforeEach(() => {
        angular.mock.module('ds-data')
    })
    
    beforeEach(() => {
        angular.module('django.context', []).constant('Django', { user: 'test_user' });
        angular.mock.inject(function (_$compile_, _$rootScope_, $componentController, _$state_, _DataBrowserService_) {
            $compile = _$compile_
            $rootScope = _$rootScope_;
       
            const mockedServices = {
                DataBrowserService: _DataBrowserService_,
                $state: _$state_
            }
            const mockedBindings = {
            }
            ctrl = $componentController(
                'publications',
                mockedServices,
                mockedBindings
            );
            spyOn(ctrl.DataBrowserService, 'state').and.returnValue({listing: {
                system: 'pub.system',
                path: '/path/to/root',
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
                                title: 'NEES Project Title'
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
            }})
            spyOn(ctrl.$state, 'href').and.returnValue('HREF_MOCK_RETURN');
            spyOn(ctrl.DataBrowserService, 'scrollToBottom');
            spyOn(ctrl.$state, 'go');
            ctrl.$onInit()
        });

    });

    it('Should define controller and initialize correctly', () => {
        expect(ctrl).toBeDefined();
        
        expect(ctrl.resolveBreadcrumbHref).toBeDefined();
        expect(ctrl.onBrowse).toBeDefined();
        expect(ctrl.scrollToTop).toBeDefined();
        expect(ctrl.scrollToBottom).toBeDefined();
        expect(ctrl.onSelect).toBeDefined();
        expect(ctrl.renderName).toBeDefined();
        
        expect(ctrl.$state.href).toHaveBeenCalledTimes(4)
        expect(ctrl.$state.href.calls.allArgs()).toEqual([
            ['publicData', {system: 'pub.system', filePath: '/path/to/root'}],
            ['neesPublishedData', {filePath: '/path/to/file1'}],
            ['publishedData', {system: 'designsafe.storage.published', filePath: '/path/to/file2'}],
            ['publicData', { systemId: 'nees.public', filePath: '' }]

        ])
    })
    it('resolveBreadCrumbHref should call $state.href with correct args', () => {
        ctrl.resolveBreadcrumbHref({path: '/path/to/breadcrumb'})
        expect(ctrl.$state.href).toHaveBeenCalledWith('publicData', { 
            systemId: 'pub.system', 
            filePath: '/path/to/breadcrumb'
        })
    })
    it('scrollToBottom should call correct method', () => {
        ctrl.scrollToBottom();
        expect(ctrl.DataBrowserService.scrollToBottom).toHaveBeenCalledTimes(1)
    })
    it('onBrowse should go to correct states', () => {
        let dummyEvent = {
            preventDefault: () => {},
            stopPropagation: () => {}
        }
        ctrl.onBrowse(dummyEvent, ctrl.browser.listing.children[0])
        expect(ctrl.$state.go).toHaveBeenCalledWith('neesPublishedData', {
            filePath: '/path/to/file1'}
        )

        ctrl.onBrowse(dummyEvent, ctrl.browser.listing.children[1])
        expect(ctrl.$state.go).toHaveBeenCalledWith('publishedData', {
            systemId: 'designsafe.storage.published', 
            filePath: '/path/to/file2'}
        )
    })
    it('should get correct render name', () => {
        expect(ctrl.renderName(ctrl.browser.listing.children[0])).toEqual('NEES Project Title')
        expect(ctrl.renderName(ctrl.browser.listing.children[1])).toEqual('Designsafe Project Title')
    })
    
})