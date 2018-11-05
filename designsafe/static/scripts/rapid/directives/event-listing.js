import template from "../html/event-listing.html";

export default function eventListing() {
  return {
    template: template,
    scope: {
      event: '=event',
    }
  };
}
