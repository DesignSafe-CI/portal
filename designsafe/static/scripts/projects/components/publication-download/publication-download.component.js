import PublicationDownloadModalTemplate from './publication-download.template.html';

class PublicationDownloadModalCtrl {

    constructor(ProjectEntitiesService, ProjectModel, $http) {
        'ngInject';
        this.ProjectEntitiesService = ProjectEntitiesService;
        this.ProjectModel = ProjectModel;
        this.$http = $http;
    }

    $onInit() {
        this.project = this.resolve.project;
        this.mediaUrl = this.resolve.mediaUrl;
        console.log(this.project);
        console.log(this.mediaUrl);
    }

    download() {
        let body = { action: 'download' };
        let projectId = this.project.value.projectId;
        let baseUrl = this.mediaUrl.split('/').filter(x =>  x != '' && x != projectId).join('/');
        
        let url = `/${baseUrl}/archives/${projectId}_archive.zip`;

        console.log(url);

        this.$http.put(url, body).then(function (resp) {
            let postit = resp.data.href;
            let link = document.createElement('a');
            link.style.display = 'none';
            link.setAttribute('href', postit);
            link.setAttribute('download', "null");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    }

    cancel() {
        this.close();
    }


}

export const PublicationDownloadModalComponent = {
    template: PublicationDownloadModalTemplate,
    controller: PublicationDownloadModalCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },
};
