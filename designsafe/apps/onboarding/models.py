"""
.. :module:: apps.onboarding.models
   :synopsis: Onboarding models
"""

from django.db import models
from django.conf import settings
from django.core.serializers.json import DjangoJSONEncoder


class SetupEvent(models.Model):
    """Setup Events

    A log of events for setup steps
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="+",
        on_delete=models.CASCADE
    )

    # Auto increment auto add timestamp for event
    time = models.DateTimeField(auto_now_add=True)

    # Name of SetupStep class, i.e. portal.apps.onboarding.steps.access.RequestAccessStep
    step = models.CharField(max_length=300)

    # Short name for setup state, defined per SetupState class.
    # "pending", "failed", "completed" etc
    state = models.CharField(max_length=16)

    # Detailed setup message
    message = models.CharField(max_length=300)

    # JSON Data
    data = models.JSONField(null=True)

    def __str__(self):
        return '{username} {time} {step} ({state}) - {message} ({data})'.format(
            username=self.user.username,
            time=self.time,
            step=self.step,
            state=self.state,
            message=self.message,
            data=self.data
        )

    def to_dict(self):
        return {
            "step": self.step,
            "username": self.user.username,
            "state": self.state,
            "time": str(self.time),
            "message": self.message,
            "data": self.data,
        }


class SetupEventEncoder(DjangoJSONEncoder):
    def default(self, obj):  # pylint: disable=method-hidden, arguments-differ
        if (isinstance(obj, SetupEvent)):
            event = obj
            return event.to_dict()
        else:
            return super(SetupEventEncoder, self).default(obj)
