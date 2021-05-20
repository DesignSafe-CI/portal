import PublicationMetricsTemplate from './publication-metrics.template.html';
class PublicationMetricsCtrl {
    constructor(PublicationService) {
        'ngInject';
        this.PublicationService = PublicationService;
    }

    $onInit() {
        this.years = [];
        this.selectedYear = '';
        this.loading = true;
        this.error = false;
        this.PublicationService.getMetrics(this.resolve.publication.projectId)
            .then((resp) => {
                this.data = resp.data;
                this.lastUpdated = Date.parse(resp.data.lastUpdated);
                this.yearsSet = new Set();
                resp.data.value.forEach((v) => {
                    v.metrics.forEach((m) => {
                        this.yearsSet.add(m.Year);
                    });
                });

                this.years = Array.from(this.yearsSet);
                this.selectedYear = Math.max(...this.years);

                this.qMetrics = this.quarterlyMetrics(resp.data, this.selectedYear);
                this.cumMetrics = this.cumulativeMetrics(resp.data);
                this.error = false;
                this.loading = false;
            })
            .catch((e) => (this.error = true));
    }

    onYearSelect() {
        this.qMetrics = this.quarterlyMetrics(this.data, this.selectedYear);
    }

    cumulativeMetrics(meta) {
        let projectDownloads = 0;
        const archiveMetrics = meta.value.find((v) => v.doi === 'archive') || [];
        archiveMetrics.metrics.forEach((m) => (projectDownloads += m.Downloads));
        let fileDownloads = 0;
        let filePreviews = 0;
        meta.value
            .filter((v) => v.doi !== 'archive')
            .forEach((v) => {
                v.metrics.forEach((m) => {
                    fileDownloads += m.Downloads || 0;
                    filePreviews += m.Previews || 0;
                });
            });
        return {
            projectDownloads,
            fileDownloads,
            filePreviews,
            fileViews: fileDownloads + filePreviews,
            total: projectDownloads + fileDownloads + filePreviews,
        };
    }

    quarterlyMetrics(meta, year) {
        let qMetrics = [0, 0, 0, 0];
        meta.value.forEach((val) => {
            val.metrics
                .filter((m) => m.Year === year)
                .forEach((m) => {
                    const downloads = m.Downloads || 0;
                    const previews = m.Previews || 0;
                    switch (m.Month) {
                        case 1:
                        case 2:
                        case 3:
                            qMetrics[0] += downloads + previews;
                            break;
                        case 4:
                        case 5:
                        case 6:
                            qMetrics[1] += downloads + previews;
                            break;
                        case 7:
                        case 8:
                        case 9:
                            qMetrics[2] += downloads + previews;
                            break;
                        case 10:
                        case 11:
                        case 12:
                            qMetrics[3] += downloads + previews;
                            break;
                    }
                });
        });
        return qMetrics;
    }
}

export const PublicationMetricsComponent = {
    template: PublicationMetricsTemplate,
    controller: PublicationMetricsCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&',
    },
};
