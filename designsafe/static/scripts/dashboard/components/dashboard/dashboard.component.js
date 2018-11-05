import DashboardTemplate from './dashboard.component.html';
import DSTSBarChart from '../../charts/DSTSBarChart';
import moment from 'moment';
import _ from 'underscore';


class DashboardCtrl {
    constructor(
        Jobs,
        Apps,
        $scope,
        NotificationService,
        UserService,
        TicketsService
    ) {
        'ngInject';
        this.Jobs = Jobs;
        this.Apps = Apps;
        this.NotificationService = NotificationService;
        this.TicketsService = TicketsService;
        this.$scope = $scope;
        this.UserService = UserService;

        this.display_job_details = false;
        this.loading_tickets = false;
        this.loading_jobs = true;
        this.today = new Date();
        this.usage = { total_storage_bytes: 0 };

        this.first_jobs_date = moment().subtract(14, 'days').startOf('day').toDate();
        let chartStartDate = moment(this.first_jobs_date).subtract(1, 'days').toDate();
        this.chart = new DSTSBarChart('#ds_jobs_chart');
        this.chart.height(250);
        this.chart.xSelector(d => {
            return d.key;
        });
        this.chart.ySelector(d => {
            return d.values.length;
        });
        this.chart.startDate(chartStartDate);


        this.chart.on('barClick', (ev, toggled) => {
            (toggled) ? this.display_job_details = true : this.display_job_details = false;
            this.jobs_details = ev.values;
            this.$apply();
        });
    }

    $onInit() {
        this.NotificationService.list({ limit: 5 }).then(resp => {
            this.notifications = resp.notifs;
            this.notification_count = resp.total;
        });

        this.UserService.usage().then(resp => {
            this.usage = resp;
        });

        this.Jobs.list({ limit: 100, offset: 0 }).then(resp => {
            this.jobs = resp;
            this.jobs = _.filter(this.jobs, d => {
                return moment(d.created).isAfter(this.first_jobs_date);
            });
            this.chart_data = this.Jobs.jobsByDate(this.jobs);
            this.chart.data(this.chart_data);
            let tmp = _.groupBy(this.jobs, d => {
                return d.appId;
            });
            this.recent_apps = Object.keys(tmp);
            this.loading_jobs = false;
        });

        this.Apps.list({ $and: [{ name: 'ds_apps' }, { 'value.definition.available': true }] }).then(resp => {
            this.apps = resp.data;
        });

        this.TicketsService.get().then(resp => {
            this.my_tickets = resp;
            this.loading_tickets = false;
        }, err => {
            this.loading_tickets = false;
        });
    }
}

export const DashboardComponent = {
    controller: DashboardCtrl,
    controllerAs: '$ctrl',
    template: DashboardTemplate,
};
