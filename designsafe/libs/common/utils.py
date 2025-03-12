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


def check_allow_impersonation(request):
    """Check whether a user has impersonation privileges."""
    if request.user.is_superuser:
        return True
    if check_group_membership(request.user, "Impersonator"):
        return True
    return False


def check_onboarding_admin(request):
    """Check whether a user has impersonation privileges."""
    if request.user.is_superuser:
        return True
    if check_group_membership(request.user, "Onboarding Admin"):
        return True
    return False
