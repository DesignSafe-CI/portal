from designsafe.apps.api.projects_v2.migration_utils.pub_symlink_operations import (
    construct_symlink_mapping,
)
from designsafe.apps.api.publications_v2.models import Publication


def symlink_mapping_integration_test():
    """Generate symlink mappings for all publications to ensure that there are no errors
    and some basic invariants are satisfied."""

    for pub in Publication.objects.all():
        max_len = 0
        print(pub.project_id)
        mapping = construct_symlink_mapping(pub.project_id)
        for value in mapping.values():
            for path in value:
                if len(path) > max_len:
                    max_len = len(path)

    print(max_len)
