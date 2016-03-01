###
# These settings provide additional support for handling NEEShub user migration.
#
import os


NEES_USER_DATABASE = {
    'ENGINE': 'django.db.backends.mysql',
    'NAME': os.environ.get('NEES_DATABASE_NAME'),
    'HOST': os.environ.get('NEES_DATABASE_HOST'),
    'PORT': os.environ.get('NEES_DATABASE_PORT'),
    'USER': os.environ.get('NEES_DATABASE_USER'),
    'PASSWORD': os.environ.get('NEES_DATABASE_PASSWORD'),
}

