import { render } from '@client/test-fixtures';
import { NotificationBadge } from './NotificationBadge';
import { describe, it, expect } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/dom';

describe('NotificationBadge Component', () => {
  const renderComponent = () => render(<NotificationBadge />);
  it('should render dropdown menu on click', async () => {
    renderComponent();
    const notifBell = screen.getByRole('button');
    await waitFor(() => expect(notifBell.getAttribute('disabled')).toBeNull());
    fireEvent.click(notifBell);
    const notifDropdown = await screen.findAllByRole('menuitem');
    // 5 notifications + header/footer
    expect(notifDropdown.length).toBe(5 + 2);
  });
});
