import _ from 'underscore';
export class PublishedService {
    constructor($http, $q, $window, $filter) {
        'ngInject';
        this.$http = $http;
        this.$q = $q;
        this.$window = $window;
        this.$filter = $filter;
    }

    getPublished(projId) {
        return this.$http.get('/api/projects/publication/' + projId)
    }

    getNeesPublished(neesId) {
        return this.$http.get('/api/projects/nees-publication/' + neesId)
    }

    updateHeaderMetadata(projId, resp) {
        this.$window.document.title = resp.data.project.value.title + " | DesignSafe-CI"
        this.$window.document.getElementsByName('keywords')[0].content = resp.data.project.value.keywords
        this.$window.document.getElementsByName('description')[0].content = resp.data.project.value.description
        this.$window.document.getElementsByName('citation_title')[0].content = resp.data.project.value.title
        this.$window.document.getElementsByName('citation_publication_date')[0].content = this.$filter('date')(resp.data.created, 'yyyy/M/d')
        this.$window.document.getElementsByName('citation_doi')[0].content = resp.data.project.doi
        this.$window.document.getElementsByName('citation_abstract_html_url')[0].content = "https://www.designsafe-ci.org/data/browser/public/designsafe.storage.published//" + projId


        var elements = this.$window.document.getElementsByName('citation_author')
        while (elements[0]) elements[0].parentNode.removeChild(elements[0])
        var elements = this.$window.document.getElementsByName('citation_author_institution')
        while (elements[0]) elements[0].parentNode.removeChild(elements[0])
        var elements = this.$window.document.getElementsByName('citation_keywords')
        while (elements[0]) elements[0].parentNode.removeChild(elements[0])

        resp.data.project.value.keywords.split(/[,\s]+/).forEach((keyword) => {
            var meta = this.$window.document.createElement("meta")
            meta.name = "citation_keywords"
            meta.content = keyword
            this.$window.document.getElementsByTagName('head')[0].appendChild(meta)
        })

        var authors = '';
        var ieeeAuthors = '';

        var publishers = _.filter(resp.data.users, (usr) => {
            if (resp.data.project.name === 'designsafe.project' || prj.name === 'designsafe.project.analysis') {
                return _.contains(resp.data.project.value.coPis, usr.username) ||
                    usr.username === resp.data.project.value.pi;
            } else {
                return _.contains(resp.data.project.value.authors, usr.username);
            }
        });
        if (typeof resp.data.project.value.projectType !== 'undefined' && resp.data.project.value.projectType === 'other') {
            publishers = resp.data.users;
        }
        publishers = _.sortBy(publishers, (p) => {
            if (typeof p._ui[resp.data.project.uuid] !== 'undefined') {
                return p._ui[resp.data.project.uuid];
            } else {
                return p._ui.order;
            }
        });
        _.each(publishers, (usr, index, list) => {
            var str = usr.last_name + ', ' + usr.first_name;
            var usr_institution = _.filter(resp.data.institutions, (inst) => {
                return inst.name === usr.username
            })
            var meta = this.$window.document.createElement("meta")
            meta.name = "citation_author"
            meta.content = str
            this.$window.document.getElementsByTagName('head')[0].appendChild(meta)

            if (index < list.length - 1) {
                authors += str + ' and ';
                ieeeAuthors += str + '; ';
            } else {
                authors += str;
                ieeeAuthors += str;
            }

            if (usr_institution[0]) {
                var meta = this.$window.document.createElement("meta")
                meta.name = "citation_author_institution"
                meta.content = usr_institution[0].label
                this.$window.document.getElementsByTagName('head')[0].appendChild(meta)

            }

        })
        this.$window.document.getElementsByName('author')[0].content = authors

    }
}