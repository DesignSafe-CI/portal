"""NCO views.

.. module:: designsafe.apps.nco.views
    :synopsis: Views for NCO app.
"""
import logging
from django.views.generic.base import TemplateView
# from designsafe.libs.mongo.load_projects import MongoProjectsHelper
# from designsafe.apps.api.agave import service_account


LOG = logging.getLogger(__name__)


class NcoIndexView(TemplateView):
    """Nco Index view."""

    pass
