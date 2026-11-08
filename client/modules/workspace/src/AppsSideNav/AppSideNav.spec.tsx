import { render, appsListingJson } from '@client/test-fixtures';
import { act, screen } from '@testing-library/react';

import { AppsSideNav } from './AppsSideNav';
import type { TAppCategory } from '@client/hooks';

const categories: TAppCategory[] = appsListingJson.categories.map(
  (category) => ({
    ...category,
    apps: category.apps.map((app) => ({
      ...app,
      bundle_category: category.title,
      bundle_href: '',
      priority: 0,
    })),
  })
);

describe('AppsSideNav', () => {
  beforeEach(async () => {
    // Ant Design's menu registers item paths in a microtask after rendering.
    await act(async () => {
      render(<AppsSideNav categories={categories} />);
    });
  });

  it('should render successfully', () => {
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('should have nav text', () => {
    expect(screen.getByText('Applications:')).toBeInTheDocument();
  });
});
