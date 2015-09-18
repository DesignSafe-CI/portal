from django.contrib.auth.backends import ModelBackend

class CILogonBackend(ModelBackend):

    def authenticate(self, **kwargs):
        return None