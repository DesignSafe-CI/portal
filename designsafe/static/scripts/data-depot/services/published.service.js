import _, { has } from 'underscore';
export class PublishedService {
    constructor($http, $q, $window, $filter) {
        'ngInject';
        this.$http = $http;
        this.$q = $q;
        this.$window = $window;
        this.$filter = $filter;
    }

    getPublished(projId) {
        return this.$http.get('/api/projects/publication/' + projId);
    }

    getNeesPublished(neesId) {
        return this.$http.get('/api/projects/nees-publication/' + neesId);
    }

    updateNeesMetatags(data) {
        const header = this.$window.document.getElementsByTagName('head')[0];
        // Project Level
        // Title
        this.$window.document.getElementsByName('citation_title')[0].content = data.project.title || '';
        this.$window.document.getElementsByName('DC.title')[0].content = data.project.title || '';

        // Description
        const descTag = this.$window.document.createElement('meta');
        descTag.name = 'citation_description';
        descTag.content = data.project.description;
        header.appendChild(descTag);
        // Authors - PI
        const prjAuthors = data.project.pis || [];
        prjAuthors.forEach((author) => {
            const authorTag = this.$window.document.createElement('meta');
            authorTag.name = 'citation_author';
            authorTag.content = `${author.lastName}, ${author.firstName}`;
            header.appendChild(authorTag);
        });


        // Experiments
        const experiments = data.experiments || [];
        experiments.forEach((exp) => {
            const titleTag = this.$window.document.createElement('meta');
            titleTag.name = 'citation_title';
            titleTag.content = exp.title || '';
            header.appendChild(titleTag);

            const descTag = this.$window.document.createElement('meta');
            descTag.name = 'citation_description';
            descTag.content = exp.description || '';
            header.appendChild(descTag);
        });

    }
    
    updateHeaderMetadata(projId, resp) {
        this.$window.document.title = resp.data.project.value.title + ' | DesignSafe-CI';
        this.$window.document.getElementsByName('keywords')[0].content = resp.data.project.value.keywords;
        this.$window.document.getElementsByName('description')[0].content = resp.data.project.value.description;

        this.$window.document.getElementsByName('citation_title')[0].content = resp.data.project.value.title;
        this.$window.document.getElementsByName('DC.title')[0].content = resp.data.project.value.title;

        this.$window.document.getElementsByName('citation_publication_date')[0].content = this.$filter('date')(resp.data.created, 'yyyy/M/d');
        this.$window.document.getElementsByName('DC.date')[0].content = this.$filter('date')(resp.data.created, 'yyyy/M/d');

        this.$window.document.getElementsByName('citation_doi')[0].content = resp.data.project.doi || '';
        this.$window.document.getElementsByName('DC.identifier')[0].content = resp.data.project.doi || '';

        this.$window.document.getElementsByName('citation_abstract_html_url')[0].content = "https://www.designsafe-ci.org/data/browser/public/designsafe.storage.published//" + projId;


        var elements = this.$window.document.getElementsByName('citation_author');
        while (elements[0]) elements[0].parentNode.removeChild(elements[0]);
        var elements = this.$window.document.getElementsByName('citation_author_institution');
        while (elements[0]) elements[0].parentNode.removeChild(elements[0]);
        var elements = this.$window.document.getElementsByName('citation_keywords');
        while (elements[0]) elements[0].parentNode.removeChild(elements[0]);

        resp.data.project.value.keywords.split(/[,\s]+/).forEach((keyword) => {
            var meta = this.$window.document.createElement("meta");
            meta.name = "citation_keywords";
            meta.content = keyword;
            this.$window.document.getElementsByTagName('head')[0].appendChild(meta);
        });

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
                return inst.name === usr.username;
            });
            var meta = this.$window.document.createElement("meta");
            meta.name = "citation_author";
            meta.content = str;
            this.$window.document.getElementsByTagName('head')[0].appendChild(meta);

            if (index < list.length - 1) {
                authors += str + ' and ';
                ieeeAuthors += str + '; ';
            } else {
                authors += str;
                ieeeAuthors += str;
            }

            if (usr_institution[0]) {
                var meta = this.$window.document.createElement("meta");
                meta.name = "citation_author_institution";
                meta.content = usr_institution[0].label;
                this.$window.document.getElementsByTagName('head')[0].appendChild(meta);

            }

        });

        if (!authors && _.has(resp.data.project.value, 'teamOrder')) {
            authors = resp.data.project.value.teamOrder.reduce((prev, curr, idx) => {
                const last = idx === resp.data.project.value.teamOrder.length - 1;
                const currentName = `${curr.lname}, ${curr.fname}`;
                if (last && idx > 0) {
                    return `${prev}, and ${currentName}`;
                }
                return `${prev} ${currentName}`;
            }, '');
        } 
        
        this.$window.document.getElementsByName('author')[0].content = authors;
        this.$window.document.getElementsByName('DC.creator')[0].content = authors;

        const entities = [];
        let isSimulation = false;
        if (has(resp.data, 'experimentsList')) {
            entities.push(...resp.data.experimentsList);
        } else if(has(resp.data, 'simulations')) {
            entities.push(...resp.data.simulations);
            isSimulation = true;
        } else if(has(resp.data, 'missions')) {
            entities.push(...resp.data.missions);
        } else if (has(resp.data, 'hybrid_simulations')) {
            entities.push(...resp.data, 'hybrid_simulations');
            isSimulation = true;
        }

        // Check for reports
        if(has(resp.data, 'reports') && !isSimulation) entities.push(...resp.data.reports);

        entities.forEach((entity) => {
            // Title
            const entTitleTag = this.$window.document.createElement('meta');
            entTitleTag.name = 'citation_title';
            entTitleTag.content = entity.value.title || '';
            this.$window.document.getElementsByTagName('head')[0].appendChild(entTitleTag);
           
            // Doi
            const entDoiTag = this.$window.document.createElement('meta');
            entDoiTag.name = 'citation_doi';
            entDoiTag.content = entity.doi || '';
            this.$window.document.getElementsByTagName('head')[0].appendChild(entDoiTag);

            // Description
            const entDescTag = this.$window.document.createElement('meta');
            entDescTag.name = 'citation_description';
            entDescTag.content = entity.value.description || '';
            this.$window.document.getElementsByTagName('head')[0].appendChild(entDescTag);

            // Authors (with Institutions)
            entity.authors
                .filter((author) => author.authorship === true)
                .forEach((author) => {
                    const authorTag = this.$window.document.createElement('meta');
                    authorTag.name = 'citation_author';
                    authorTag.content = `${author.lname} ${author.fname}`;

                    const authorInstTag = this.$window.document.createElement('meta');
                    authorInstTag.name = 'citation_author_institution';
                    authorInstTag.content = author.inst;

                    this.$window.document.getElementsByTagName('head')[0].appendChild(authorTag);
                    this.$window.document.getElementsByTagName('head')[0].appendChild(authorInstTag);
                });
        });
        
    }
}
