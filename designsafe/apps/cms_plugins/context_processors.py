from menus.menu_pool import MenuPool
import logging

logger = logging.getLogger(__name__)


def cms_section(request):
    nodes = MenuPool().get_renderer(request).get_nodes()
    if nodes:
        menu_root = nodes[0]
        if 'soft_root' in menu_root.attr:
            return {'section_root': {'title': menu_root.title}}
    return {}
