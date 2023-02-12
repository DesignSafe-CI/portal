from menus.menu_pool import menu_pool
import logging

logger = logging.getLogger(__name__)


def cms_section(request):
    #nodes = menu_pool.get_nodes(request)
    nodes = None
    if nodes:
        menu_root = nodes[0]
        if 'soft_root' in menu_root.attr:
            return {'section_root': {'title': menu_root.title}}
    return {}
