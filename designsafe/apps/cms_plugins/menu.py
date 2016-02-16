from cms.menu import NavigationNode
from cms.menu_bases import CMSAttachMenu
from menus.menu_pool import menu_pool
from django.conf import settings
from django.utils.importlib import import_module
from django.utils.translation import ugettext_lazy as _
import logging

logger = logging.getLogger(__name__)


class ResearchWorkbenchMenu(CMSAttachMenu):

    name = _('Research Workbench Menu')

    def get_nodes(self, request):
        nodes = []

        node_id = 1
        for app in settings.INSTALLED_APPS:
            try:
                mod = import_module('%s.urls' % app)
                try:
                    for item in mod.menu_items(type='research_workbench'):
                        node = NavigationNode(item['label'], item['url'], node_id)
                        nodes.append(node)
                        if 'children' in item:
                            parent_id = node_id
                            for c in item['children']:
                                node_id += 1
                                node = NavigationNode(c['label'], c['url'], node_id,
                                                      parent_id)
                                nodes.append(node)
                        node_id += 1
                except AttributeError:
                    continue
                except:
                    logger.exception('Call to module.cms_menu_nodes fail for module: '
                                     '%s' % mod.__name__)
            except:
                continue
        logger.debug(nodes)
        return nodes


menu_pool.register_menu(ResearchWorkbenchMenu)

