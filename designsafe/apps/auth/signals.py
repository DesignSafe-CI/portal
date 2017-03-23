from django.contrib.auth.signals import user_logged_in
from django.dispatch import receiver
from .tasks import check_or_create_agave_home_dir


@receiver(user_logged_in)
def on_user_logged_in(sender, user, request, **kwargs):
    check_or_create_agave_home_dir.apply_async(args=(user.username,), queue='files')
