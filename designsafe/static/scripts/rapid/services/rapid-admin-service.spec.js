describe('RapidAdminService', function() {
    var RapidAdminService, $httpBackend;
    beforeEach(angular.mock.module('ds.rapid'));
    beforeEach( ()=> {
        angular.module('django.context', []).constant('Django', { user: 'test_user' });
        angular.mock.inject(function(_RapidAdminService_, _$httpBackend_) {
            RapidAdminService = _RapidAdminService_;
            $httpBackend = _$httpBackend_;
        });
    });
    beforeEach( ()=> {

    });

    it('should have handled POST', ()=>{
        $httpBackend.when('POST', '/recon-portal/admin/users/permissions/', (data)=>{
            let postData = JSON.parse(data);
            expect(postData.username).toEqual('test_user');
            expect(postData.action).toEqual('grant');
            return true;
        }).respond(200, { status: 'ok' });
        let user = {
            username: 'test_user'
        };
        RapidAdminService.update_permissions(user, 'grant').then( (resp)=> {
            expect(resp).toBeTruthy();
        });
        $httpBackend.flush();

    });

});
