from menus.menu_pool import menu_pool
import logging

logger = logging.getLogger(__name__)


def cms_section(request):
    nodes = menu_pool.get_nodes(request)
    menu_root = nodes[0]
    if 'soft_root' in menu_root.attr:
        logger.debug(menu_root.__dict__)
        return {
            'section_root': {
                'title': menu_root.title,
                'reverse_id': menu_root.attr['reverse_id']
            }
        }
    return {}
