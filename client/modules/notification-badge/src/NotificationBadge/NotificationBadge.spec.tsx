import { render } from '@client/test-fixtures';
import { NotificationBadge } from './NotificationBadge';
import { describe, it, expect } from 'vitest';
import { fireEvent } from '@testing-library/dom';

describe('NotificationBadge Component', () => {
    const renderComponent = () => render(<NotificationBadge />);

    it('should render dropdown menu on click', () => {
        const { getByRole } = renderComponent();
        const notifBell = getByRole('button');
        fireEvent.click(notifBell);
        const notifDropdown = getByRole('menuitem');
        expect(notifDropdown).toBeTruthy();
    });
});