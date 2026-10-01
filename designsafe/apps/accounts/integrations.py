import logging
from importlib import import_module

from django.conf import settings

logger = logging.getLogger(__name__)


def get_integrations():
    app_integrations = []

    for app in settings.INSTALLED_APPS:
        try:
            mod = import_module(f"{app}.integrations")
            try:
                app_integrations += mod.provide_integrations()
            except AttributeError:
                continue
            except Exception:
                logger.exception("")
                logger.warning(
                    "Call to module.provide_integrations fail for module: %s",
                    mod.__name__,
                )
        except Exception:
            logger.exception("")
            continue

    return app_integrations
