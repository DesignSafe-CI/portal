import { http, HttpResponse } from 'msw';
import appsListingJson from './fixtures/workspace/apps-tray-listing.json';

const handlers = [
  http.get('/api/workspace/tray', () => {
    return HttpResponse.json(appsListingJson);
  }),
];

export default handlers;
