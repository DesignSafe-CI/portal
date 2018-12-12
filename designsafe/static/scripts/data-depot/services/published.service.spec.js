import { PublishedService } from './published.service';
import fixture from '../fixtures/published.fixture.json';

describe('PublishedService', () => {
    let $window, PublishedService, $httpBackend, resp

    
    beforeEach(() => {
        angular.mock.module('ds-data')
    })
    
    beforeEach(() => {
        angular.module('django.context', []).constant('Django', { user: 'test_user' });
        angular.mock.inject(function (_$window_, _$httpBackend_, _PublishedService_) {
            $window = _$window_;
            $httpBackend = _$httpBackend_;
            PublishedService = _PublishedService_;
        });
    });

    it('Should handle a publication API request', () => {
        $httpBackend.whenGET(/^\/api\/projects\/publication\/PRJ-\d+/).respond(200, fixture);
        PublishedService.getPublished('PRJ-2110').then(response => resp = response);
        $httpBackend.flush();
        expect(resp.status).toBe(200)
        expect(resp.data).toEqual(fixture);
    })

    it('Should update header meta', () => {
        //We need to append these meta fields to the document in order to test code modifying them.
        ['keywords', 'description', 'citation_title', 'citation_publication_date', 
        'citation_doi', 'citation_abstract_html_url', 'author'].forEach(field => {
            var meta = $window.document.createElement("meta")
            meta.name = field
            $window.document.getElementsByTagName('head')[0].appendChild(meta)
        }) 

        const projId = 'PRJ-2110'
        const resp = fixture
        
        PublishedService.updateHeaderMetadata(projId, resp)

        expect($window.document.getElementsByName('keywords')[0].content).toBe("Hurricane, Hawaii, flooding, landslide")
        expect($window.document.getElementsByName('description')[0].content).toBe("This project records data collected during and after Hurricane Lane impacted the Hawaiian Island chain.")
        expect($window.document.getElementsByName('citation_title')[0].content).toBe("Hurricane Lane, Hawaii Islands, August 2018")
        expect($window.document.getElementsByName('citation_publication_date')[0].content).toBe("2018/10/10")
        expect($window.document.getElementsByName('citation_doi')[0].content).toBe("doi:10.17603/DS2BH7W")
        expect($window.document.getElementsByName('citation_abstract_html_url')[0].content).toBe("https://www.designsafe-ci.org/data/browser/public/designsafe.storage.published//PRJ-2110")

        expect($window.document.getElementsByName('citation_author')[0].content).toBe("Robertson, Ian")
        expect($window.document.getElementsByName('citation_author_institution')[0].content).toBe("University of Hawaii")
        expect($window.document.getElementsByName('citation_keywords')[0].content).toBe("Hurricane")
        expect($window.document.getElementsByName('citation_keywords')[1].content).toBe("Hawaii")
        expect($window.document.getElementsByName('citation_keywords')[2].content).toBe("flooding")
        expect($window.document.getElementsByName('citation_keywords')[3].content).toBe("landslide")
        
    })
    
})