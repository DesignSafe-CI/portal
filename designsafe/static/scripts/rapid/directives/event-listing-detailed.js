import template from '../html/event-listing-detailed.html';

export default function eventListingDetailed() {
    return {
        template: template,
        scope: {
            event: '=event',
        }
    };
}
