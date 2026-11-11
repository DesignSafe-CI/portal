import json
from unittest.mock import AsyncMock, patch

import pytest

# Replace with your actual signals-module path.
from channels.layers import get_channel_layer
from designsafe.apps.api.notifications.models import Notification, Broadcast


@pytest.fixture
def channel_layer():
    layer = get_channel_layer()

    with patch.object(layer, "group_send", new_callable=AsyncMock):
        yield layer


@pytest.mark.django_db
def test_notification_create_sends_signal(channel_layer):
    # This factory must save the model, e.g. Factory Boy's .create().
    notification = Notification.objects.create(
        user="testuser",
        event_type="test_event",
        status=Notification.INFO,
    )

    channel_layer.group_send.assert_awaited_once_with(
        f"ds_{notification.user}",
        {
            "type": "ds.notification",
            "message": json.dumps(notification.to_dict()),
        },
    )


@pytest.mark.django_db
def test_notification_update_does_not_send(channel_layer):
    notification = Notification.objects.create(
        user="testuser",
        event_type="test_event",
        status=Notification.INFO,
    )
    channel_layer.group_send.reset_mock()

    notification.save()

    channel_layer.group_send.assert_not_awaited()


@pytest.mark.django_db
def test_broadcast_create_sends_signal(channel_layer):
    broadcast = Broadcast.objects.create(
        event_type="test_event", status=Notification.INFO, group="ALL"
    )

    channel_layer.group_send.assert_awaited_once_with(
        "ds_broadcast",
        {
            "type": "ds.notification",
            "message": json.dumps(broadcast.to_dict()),
        },
    )


@pytest.mark.django_db
def test_broadcast_update_does_not_send(channel_layer):
    broadcast = Broadcast.objects.create(
        event_type="test_event", status=Notification.INFO, group="ALL"
    )

    channel_layer.group_send.reset_mock()

    broadcast.save()

    channel_layer.group_send.assert_not_awaited()
