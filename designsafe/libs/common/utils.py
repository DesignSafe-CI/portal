"""
Utility functions shared across multiple apps.
"""

from django.contrib.auth.models import Group


def check_group_membership(user, group_name: str) -> bool:
    """Check whether a user belongs to the Project Admin group"""
    try:
        user.groups.get(name=group_name)
        return True
    except Group.DoesNotExist:
        return False
