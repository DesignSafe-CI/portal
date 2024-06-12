import { beforeAll, afterEach, afterAll } from 'vitest';
import { server } from '@client/test-fixtures';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
