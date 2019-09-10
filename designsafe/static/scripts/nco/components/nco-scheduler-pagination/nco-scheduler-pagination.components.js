import NcoSchedulerPaginationTemplate from './nco-scheduler-pagination.component.html';
class NcoSchedulerPaginationCtrl {
    constructor() {
        'ngInject';
    }

    $onInit(){
        this.checkNextAndPrev();
    }

    checkNextAndPrev(){
        let lastItem = (this.pageNumber+1) * this.pageSize;
        if (lastItem >= this.total){
            this.next = false;
        } else {
            this.next = true;
        }
        this.prev = this.pageNumber;
    }

    nextPage(){
        this.onNextPage()
            .then( () => {
                this.checkNextAndPrev();
            });
    }

    prevPage(){
        this.onPrevPage()
            .then( () => {
                this.checkNextAndPrev();
            });
    }
}

export const NcoSchedulerPaginationComponent = {
    controller: NcoSchedulerPaginationCtrl,
    controllerAs: '$ctrl',
    template: NcoSchedulerPaginationTemplate,
    bindings: {
        onNextPage: '&',
        onPrevPage: '&',
        total: '<',
        pageNumber: '<',
        pageSize: '<',
    },
};
