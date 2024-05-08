import { http, HttpResponse } from 'msw';
import appsListingJson from './fixtures/workspace/apps-tray-listing.json';
import systemsListingJson from './fixtures/workspace/systems-listing.json';

const handlers = [
  http.get('/api/workspace/tray', () => {
    return HttpResponse.json(appsListingJson);
  }),
  http.get('/api/workspace/systems', () => {
    return HttpResponse.json(systemsListingJson);
  }),
];

export default handlers;
