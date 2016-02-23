from cms.menu import NavigationNode
from cms.menu_bases import CMSAttachMenu
from menus.menu_pool import menu_pool
from django.conf import settings
from django.utils.importlib import import_module
from django.utils.translation import ugettext_lazy as _
import logging

logger = logging.getLogger(__name__)


def _menu_nodes_for_apps(menu_type):
    nodes = []
    node_id = 1
    for app in settings.INSTALLED_APPS:
        try:
            mod = import_module('%s.urls' % app)
            try:
                items = mod.menu_items(type=menu_type)
                if items is not None:
                    for item in items:
                        node = NavigationNode(item['label'], item['url'], node_id,
                                              visible=item.get('visible', True))
                        nodes.append(node)
                        if 'children' in item:
                            parent_id = node_id
                            for c in item['children']:
                                node_id += 1
                                node = NavigationNode(c['label'], c['url'],
                                                      node_id, parent_id,
                                                      visible=c.get('visible', True))
                                nodes.append(node)
                        node_id += 1
            except AttributeError:
                continue
            except TypeError:
                logger.warning('Call to %s.cms_menu_nodes should return an iterable!')
            except:
                logger.exception('Call to %s.cms_menu_nodes failed!' % mod.__name__)
        except:
            continue
    return nodes


class ResearchWorkbenchMenu(CMSAttachMenu):

    name = _('Research Workbench Menu')

    def get_nodes(self, request):
        return _menu_nodes_for_apps('research_workbench')


class AccountMenu(CMSAttachMenu):
    name = _('Account Menu')

    def get_nodes(self, request):
        return _menu_nodes_for_apps('account')


menu_pool.register_menu(ResearchWorkbenchMenu)
menu_pool.register_menu(AccountMenu)
