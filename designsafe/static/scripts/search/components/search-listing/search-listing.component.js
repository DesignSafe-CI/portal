import searchListingTemplate from './search-listing.component.html';

class SearchListingCtrl {
    constructor(UserService) {
        'ngInject';
        this.UserService = UserService;
    }
    $onInit() {
        if (!this.data.authors && ((this.data.project || {}).value || {}).teamOrder) {
            const users = this.data.project.value.teamOrder.map((u) => u.name);
            this.UserService.getPublic(users).then((res)=>  {
                this.author = `${res.userData[0].lname}, ${res.userData[0].fname}`;
            });
        }
    }
}

export const SearchListingComponent = {
    template: searchListingTemplate,
    controller: SearchListingCtrl,
    bindings: {
        data: '='
    }
};
