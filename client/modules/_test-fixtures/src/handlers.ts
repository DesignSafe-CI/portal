import { http, HttpResponse } from 'msw';
import appsListingJson from './fixtures/workspace/apps-tray-listing.json';
import systemsListingJson from './fixtures/workspace/systems-listing.json';
import allocationsListingJson from './fixtures/workspace/allocations-listing.json';
import notificationsListingJSON from './fixtures/notifications/NotificationsFixture.json';

const handlers = [
  http.get('/api/workspace/tray', () => {
    return HttpResponse.json(appsListingJson);
  }),
  http.get('/api/workspace/systems', () => {
    return HttpResponse.json(systemsListingJson);
  }),
  http.get('/api/workspace/allocations', () => {
    return HttpResponse.json(allocationsListingJson);
  }),
  http.get('/api/notifications/', () => {
    return HttpResponse.json(notificationsListingJSON);
  }),
];

export default handlers;
