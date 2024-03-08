import { http, HttpResponse } from 'msw';
import appsListingJson from './fixtures/workspace/apps-tray-listing.json';

const handlers = [
  http.get('/applications/api/meta', () => {
    return HttpResponse.json(appsListingJson);
  }),
];

export default handlers;
