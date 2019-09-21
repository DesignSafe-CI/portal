"""
Django settings for designsafe project.

For more information on this file, see
https://docs.djangoproject.com/en/2.2/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/2.2/ref/settings/
"""
# -*- coding: utf-8 -*-

import os
import json
# pylint: disable=unused-wildcard-import, wildcard-import, unused-import
from .nco_mongo import *  # noqa:F403, F401
from .external_resource_secrets import *  # noqa:F403, F401
from .rt_settings import *  # noqa:F403, F401
from .elasticsearch_settings import *  # noqa:F403, F401
from .external_resource_settings import *  # noqa:F403, F401
from .celery_settings import *  # noqa:F403, F401
from .nees_settings import NEES_USER_DATABASE  # noqa:F401


BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SITE_DIR = os.path.dirname(os.path.abspath(__file__))

# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/1.8/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', '__CHANGE_ME_!__')

# SESSIONS
SESSION_COOKIE_DOMAIN = os.environ.get('SESSION_COOKIE_DOMAIN')
# SESSION_ENGINE = 'redis_sessions.session'
# SESSION_REDIS_HOST = 'redis'
SESSION_EXPIRE_AT_BROWSER_CLOSE = True
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.environ.get('DJANGO_DEBUG', 'False') == 'True'
DS_CMS = os.environ.get('DS_CMS')

ALLOWED_HOSTS = ['*']
# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.sessions.middleware',
    'django.contrib.sites',
    'django.contrib.sitemaps',
    'django.contrib.staticfiles',

    'sekizai',
    'snowpenguin.django.recaptcha2',
    'reversion',
    'termsandconditions',
    'impersonate',
    'ws4redis',
    'haystack',
    'channels',
]

if DS_CMS:  # If DS_CMS is set
    INSTALLED_APPS += [
        'cms',
        'treebeard',
        'menus',
        'djangocms_admin_style',
        'djangocms_text_ckeditor',
        'cmsplugin_cascade',
        'cmsplugin_cascade.extra_fields',
        'djangocms_style',
        'djangocms_file',
        'djangocms_flash',
        'djangocms_googlemap',
        'djangocms_picture',
        'djangocms_video',
        'djangocms_forms',
        'filer',
        'easy_thumbnails',
        'bootstrap3',
    ]
else:
    INSTALLED_APPS += [
        # custom
        'designsafe.apps.auth',
        'designsafe.apps.api',
        'designsafe.apps.api.notifications',
        'designsafe.apps.accounts',
        'designsafe.apps.box_integration',
        'designsafe.apps.dropbox_integration',
        'designsafe.apps.googledrive_integration',
        'designsafe.apps.licenses',
        'designsafe.apps.dashboard',
        'designsafe.apps.nco',

        # signals
        'designsafe.apps.signals',

        # Designsafe apps
        'designsafe.apps.applications',
        'designsafe.apps.data',
        'designsafe.apps.projects',
        'designsafe.apps.djangoRT',
        'designsafe.apps.notifications',
        'designsafe.apps.workspace',
        'designsafe.apps.token_access',
        'designsafe.apps.search',
        'designsafe.apps.geo',
        'designsafe.apps.rapid',

    ]

MIDDLEWARE = [
    'designsafe.middleware.RequestProfilingMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'designsafe.apps.token_access.middleware.TokenAuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'designsafe.apps.auth.middleware.AgaveTokenRefreshMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'django.middleware.locale.LocaleMiddleware',
    'impersonate.middleware.ImpersonateMiddleware',
    'designsafe.middleware.DesignSafeTermsMiddleware',
]

ROOT_URLCONF = 'designsafe.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [
            os.path.join(BASE_DIR, 'designsafe', 'templates'),
        ],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.contrib.auth.context_processors.auth',
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.template.context_processors.i18n',
                'django.template.context_processors.media',
                'django.template.context_processors.static',
                'django.template.context_processors.tz',
                'django.contrib.messages.context_processors.messages',
                'sekizai.context_processors.sekizai',
                'ws4redis.context_processors.default',
                'designsafe.context_processors.analytics',
                'designsafe.context_processors.site_verification',
                'designsafe.context_processors.debug',
                'designsafe.apps.auth.context_processors.auth',
            ],
        },
    },
]

WSGI_APPLICATION = 'designsafe.wsgi.application'

ASGI_APPLICATION = 'designsafe.routing.application'

CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {
            "hosts": [("redis", 6379)],
        }
    }
}

AUTHENTICATION_BACKENDS = [
    'designsafe.apps.auth.backends.AgaveOAuthBackend',
    'designsafe.apps.auth.backends.TASBackend',
    'django.contrib.auth.backends.ModelBackend',
]

LOGIN_REDIRECT_URL = os.environ.get('LOGIN_REDIRECT_URL', '/account/')

CACHES = {
    'default': {
        'BACKEND': 'redis_cache.RedisCache',
        'LOCATION': 'redis:6379',
        'OPTIONS': {
            'DB': 3,
        }
    },
}

# Database

if os.environ.get('DATABASE_HOST'):
    # mysql connection
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.mysql',
            'NAME': os.environ.get('DATABASE_NAME'),
            'HOST': os.environ.get('DATABASE_HOST'),
            'PORT': os.environ.get('DATABASE_PORT'),
            'USER': os.environ.get('DATABASE_USER'),
            'PASSWORD': os.environ.get('DATABASE_PASSWORD'),
        },
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': os.path.join(BASE_DIR, 'db.sqlite3'),
        }
    }


HAYSTACK_ROUTERS = ['aldryn_search.router.LanguageRouter', ]
ALDRYN_SEARCH_DEFAULT_LANGUAGE = 'en'
ALDRYN_SEARCH_REGISTER_APPHOOK = True


# Internationalization
# https://docs.djangoproject.com/en/1.8/topics/i18n/
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_L10N = True
USE_TZ = True
LANGUAGES = [
    ('en-us', 'English'),
]


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/1.8/howto/static-files/
STATIC_URL = '/static/'
STATIC_ROOT = '/srv/www/designsafe/static/'
STATICFILES_DIRS = [
    os.path.join(BASE_DIR, 'designsafe', 'static'),
    ('vendor/modernizr', os.path.join(BASE_DIR, 'node_modules', 'modernizr')),
    ('vendor/jquery', os.path.join(BASE_DIR, 'node_modules', 'jquery')),
    ('vendor/bootstrap-datepicker', os.path.join(BASE_DIR, 'node_modules', 'bootstrap-datepicker')),
    ('vendor/d3', os.path.join(BASE_DIR, 'node_modules', 'd3')),
    ('vendor/angular', os.path.join(BASE_DIR, 'node_modules', 'angular')),
    ('vendor/prismjs', os.path.join(BASE_DIR, 'node_modules', 'prismjs')),
    ('vendor/marked', os.path.join(BASE_DIR, 'node_modules', 'marked')),
    ('vendor/tv4', os.path.join(BASE_DIR, 'node_modules', 'tv4')),
    ('vendor/objectpath', os.path.join(BASE_DIR, 'node_modules', 'objectpath')),
    ('vendor/angular-schema-form', os.path.join(BASE_DIR, 'node_modules', 'angular-schema-form')),
    ('vendor/angular-ui-bootstrap', os.path.join(BASE_DIR, 'node_modules', 'angular-ui-bootstrap')),
    ('vendor/filesaver', os.path.join(BASE_DIR, 'node_modules', 'filesaver')),
    ('vendor/angular-ui-codemirror', os.path.join(BASE_DIR, 'node_modules', 'angular-ui-codemirror')),
    ('vendor/codemirror', os.path.join(BASE_DIR, 'node_modules', 'codemirror')),
    ('vendor/angular-material', os.path.join(BASE_DIR, 'node_modules', 'angular-material')),
    ('vendor/font-awesome', os.path.join(BASE_DIR, 'node_modules', 'font-awesome')),
    ('vendor/angular-toastr', os.path.join(BASE_DIR, 'node_modules', 'angular-toastr')),
    ('vendor/slick-carousel', os.path.join(BASE_DIR, 'node_modules', 'slick-carousel')),
    ('vendor/angular-drag-and-drop-lists', os.path.join(BASE_DIR, 'node_modules', 'angular-drag-and-drop-lists')),
    ('vendor/angular-xeditable', os.path.join(BASE_DIR, 'node_modules', 'angular-xeditable')),
    ('vendor/leaflet-measure', os.path.join(BASE_DIR, 'node_modules', 'leaflet-measure')),
    ('vendor/exif-js', os.path.join(BASE_DIR, 'node_modules', 'exif-js')),
    ('vendor/angular-native-dragdrop', os.path.join(BASE_DIR, 'node_modules', 'angular-native-dragdrop')),
    ('vendor/d3plus', os.path.join(BASE_DIR, 'node_modules', 'd3plus')),
]

STATICFILES_FINDERS = (
    'django.contrib.staticfiles.finders.FileSystemFinder',
    'django.contrib.staticfiles.finders.AppDirectoriesFinder',
)

MEDIA_ROOT = '/srv/www/designsafe/media/'
MEDIA_URL = '/media/'

LOGIN_URL = os.environ.get('LOGIN_URL', '/login/')

#####
#
# Django Impersonate
#
#####
IMPERSONATE_REQUIRE_SUPERUSER = True


#####
#
# Logger config
#
#####
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'default': {
            'format': '[DJANGO] %(levelname)s %(asctime)s %(module)s '
                      '%(name)s.%(funcName)s:%(lineno)s: %(message)s'
        },
        'agave': {
            'format': '[AGAVE] %(levelname)s %(asctime)s %(module)s '
                      '%(name)s.%(funcName)s:%(lineno)s: %(message)s'
        },
        'metrics': {
            'format': '[METRICS] %(levelname)s $(asctime) %(module)s'
                      '%(name)s.%(funcName)s:%(lineno)s: %(message)s'
                      'user=%(user)s sessionId=%(sessionId)s op=%(operation)s '
                      'info=%(info)s'
        },
    },
    'handlers': {
        'console': {
            'level': 'DEBUG',
            'class': 'logging.StreamHandler',
            'formatter': 'default',
        }, 'metrics': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'metrics',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': True,
        },
        'designsafe': {
            'handlers': ['console'],
            'level': 'DEBUG',
        },
        'celery': {
            'handlers': ['console'],
            'level': 'DEBUG',
        },
        'metrics': {
            'handlers': ['metrics'],
            'level': 'INFO',
        },
    },
}


EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = os.environ.get('SMTP_HOST', 'localhost')
EMAIL_PORT = os.environ.get('SMTP_PORT', 25)
EMAIL_HOST_USER = os.environ.get('SMTP_USER', '')
EMAIL_HOST_PASSWORD = os.environ.get('SMTP_PASSWORD', '')
DEFAULT_FROM_EMAIL = os.environ.get('DEFAULT_FROM_EMAIL', 'no-reply@designsafe-ci.org')
MEETING_REQUEST_EMAIL = os.environ.get('MEETING_REQUEST_EMAIL', 'info@designsafe-ci.org')
NEW_ACCOUNT_ALERT_EMAIL = os.environ.get('NEW_ACCOUNT_ALERT_EMAIL', 'no-reply@designsafe-ci.org')

###
# Terms and Conditions
#
DEFAULT_TERMS_SLUG = 'terms'

##
# django-websockets-redis
#
# WSGI_APPLICATION = 'ws4redis.django_runserver.application'
WEBSOCKET_URL = '/ws/'
WS4REDIS_CONNECTION = {
    'host': os.environ.get('WS_BACKEND_HOST'),
    'port': os.environ.get('WS_BACKEND_PORT'),
    'db': os.environ.get('WS_BACKEND_DB'),
}
WS4REDIS_EXPIRE = 0

# Analytics
#
GOOGLE_ANALYTICS_PROPERTY_ID = os.environ.get('GOOGLE_ANALYTICS_PROPERTY_ID', False)

# Google Site Verification
#
GOOGLE_SITE_VERIFICATION_ID = os.environ.get('GOOGLE_SITE_VERIFICATION_ID', False)

# RAMP Verification
#
RAMP_VERIFICATION_ID = os.environ.get('RAMP_VERIFICATION_ID', False)

###
# Agave Integration
#
# Agave Tenant Configuration
AGAVE_TENANT_ID = os.environ.get('AGAVE_TENANT_ID')
AGAVE_TENANT_BASEURL = os.environ.get('AGAVE_TENANT_BASEURL', 'https://api.example.com')
#
# Agave Client Configuration
AGAVE_CLIENT_KEY = os.environ.get('AGAVE_CLIENT_KEY')
AGAVE_CLIENT_SECRET = os.environ.get('AGAVE_CLIENT_SECRET')
AGAVE_SUPER_TOKEN = os.environ.get('AGAVE_SUPER_TOKEN')

AGAVE_SANDBOX_CLIENT_KEY = os.environ.get('AGAVE_SANDBOX_CLIENT_KEY', '')
AGAVE_SANDBOX_CLIENT_SECRET = os.environ.get('AGAVE_SANDBOX_CLIENT_SECRET', '')
AGAVE_SANDBOX_SUPER_TOKEN = os.environ.get('AGAVE_SANDBOX_SUPER_TOKEN', '')

AGAVE_TOKEN_SESSION_ID = os.environ.get('AGAVE_TOKEN_SESSION_ID', 'agave_token')
AGAVE_STORAGE_SYSTEM = os.environ.get('AGAVE_STORAGE_SYSTEM')

AGAVE_JWT_PUBKEY = os.environ.get('AGAVE_JWT_PUBKEY')
AGAVE_JWT_ISSUER = os.environ.get('AGAVE_JWT_ISSUER')
AGAVE_JWT_HEADER = os.environ.get('AGAVE_JWT_HEADER')
AGAVE_JWT_USER_CLAIM_FIELD = os.environ.get('AGAVE_JWT_USER_CLAIM_FIELD')

AGAVE_USER_STORE_ID = os.environ.get('AGAVE_USER_STORE_ID', 'TACC')
AGAVE_USE_SANDBOX = os.environ.get('AGAVE_USE_SANDBOX', 'False').lower() == 'true'

DS_ADMIN_USERNAME = os.environ.get('DS_ADMIN_USERNAME')
DS_ADMIN_PASSWORD = os.environ.get('DS_ADMIN_PASSWORD')

PROJECT_STORAGE_SYSTEM_TEMPLATE = {
    'id': 'project-{}',
    'site': 'tacc.utexas.edu',
    'default': False,
    'status': 'UP',
    'description': '{}',
    'name': '{}',
    'globalDefault': False,
    'available': True,
    'public': False,
    'type': 'STORAGE',
    'storage': {
        'mirror': False,
        'port': 22,
        'homeDir': '/',
        'protocol': 'SFTP',
        'host': 'dtn01.prod.agaveapi.co',
        'publicAppsDir': None,
        'proxy': None,
        'rootDir': '/corral-repl/tacc/NHERI/projects/{}',
        'auth': json.loads(os.environ.get('PROJECT_SYSTEM_STORAGE_CREDENTIALS', '{}'))
    }
}

PUBLISHED_SYSTEM = 'designsafe.storage.published'

# FOR RAPID UPLOADS
DESIGNSAFE_UPLOAD_PATH = '/corral-repl/tacc/NHERI/uploads'
DATACITE_URI = os.environ.get('DATACITE_URI', 'https://ez.test.datacite.org')
DATACITE_USER = os.environ.get('DATACITE_USER')
DATACITE_PASS = os.environ.get('DATACITE_PASS')
DATACITE_SHOULDER = os.environ.get('DATACITE_SHOULDER')

DESIGNSAFE_ENVIRONMENT = os.environ.get('DESIGNSAFE_ENVIRONMENT', 'dev').lower()
PORTAL_PROFILE = bool(os.environ.get('PORTAL_PROFILE') == 'True')

PORTAL_DATA_DEPOT_MANAGERS = {
    'agave': 'designsafe.apps.api.agave.filemanager.private_data.PrivateDataFileManager',
    'shared': 'designsafe.apps.api.agave.filemanager.shared_data.SharedDataFileManager',
    'my-projects': 'designsafe.apps.api.agave.filemanager.private_data.PrivateDataFileManager',
    'public': 'designsafe.apps.api.agave.filemanager.publications.PublicationsManager',
    'published': 'designsafe.apps.api.agave.filemanager.published_files.PublishedFileManager',
    'community': 'designsafe.apps.api.agave.filemanager.community.CommunityFileManager'
}

PORTAL_DATA_DEPOT_SEARCH_MANAGERS = {
    'agave': 'designsafe.apps.api.search.searchmanager.private_data.PrivateDataSearchManager',
    'shared': 'designsafe.apps.api.search.searchmanager.shared_data.SharedDataSearchManager',
    'my-projects': 'designsafe.apps.api.search.searchmanager.private_data.PrivateDataSearchManager',
    'public': 'designsafe.apps.api.search.searchmanager.publications.PublicationsSearchManager',
    'published': 'designsafe.apps.api.search.searchmanager.published_files.PublishedDataSearchManager',
    'community': 'designsafe.apps.api.search.searchmanager.community.CommunityDataSearchManager'
}

COMMUNITY_INDEX_SCHEDULE = os.environ.get('COMMUNITY_INDEX_SCHEDULE', {})


###
# CMS specific config
###
if DS_CMS:
    DJANGOCMS_PICTURE_TEMPLATES = [
        ('non_responsive', 'Non-Responsive Image'),
        ('responsive', 'Responsive Image'),
    ]

    CMS_PERMISSION = True
    CMS_TEMPLATES = (
        ('cms_homepage.html', 'Homepage Navigation'),
        ('ef_cms_page.html', 'EF Site Page'),
        ('cms_page.html', 'Main Site Page'),
    )
    CMSPLUGIN_CASCADE = {
        'alien_plugins': (
            'TextPlugin',
            'StylePlugin',
            'FilerImagePlugin',
            'FormPlugin',
            'MeetingFormPlugin',
            'ResponsiveEmbedPlugin',
        )
    }
    CMSPLUGIN_CASCADE_PLUGINS = (
        'cmsplugin_cascade.bootstrap3',
        'cmsplugin_cascade.link',
    )
    CMSPLUGIN_CASCADE_ALIEN_PLUGINS = (
        'TextPlugin',
        'StylePlugin',
        'FilerImagePlugin',
        'FormPlugin',
        'MeetingFormPlugin',
        'ResponsiveEmbedPlugin',
    )

    # These settings enable iFrames in the CMS cktext-editor.
    TEXT_ADDITIONAL_TAGS = ('iframe',)
    TEXT_ADDITIONAL_ATTRIBUTES = ('scrolling', 'allowfullscreen', 'frameborder', 'src', 'height', 'width')

    THUMBNAIL_PROCESSORS = (
        'easy_thumbnails.processors.colorspace',
        'easy_thumbnails.processors.autocrop',
        'filer.thumbnail_processors.scale_and_crop_with_subject_location',
        'easy_thumbnails.processors.filters',
    )

    CKEDITOR_SETTINGS = {
        'allowedContent': True
    }

    DJANGOCMS_FORMS_PLUGIN_MODULE = 'Generic'
    DJANGOCMS_FORMS_PLUGIN_NAME = 'Form'
    DJANGOCMS_FORMS_TEMPLATES = (
        ('djangocms_forms/form_template/default.html', 'Default'),
    )
    DJANGOCMS_FORMS_USE_HTML5_REQUIRED = False
    DJANGOCMS_FORMS_WIDGET_CSS_CLASSES = {
        'text': ('form-control', ),
        'textarea': ('form-control', ),
        'email': ('form-control', ),
        'number': ('form-control', ),
        'phone': ('form-control', ),
        'url': ('form-control', ),
        'select': ('form-control', ),
        'file': ('form-control', ),
        'date': ('form-control', ),
        'time': ('form-control', ),
        'password': ('form-control', ),
    }
    DJANGOCMS_FORMS_DATETIME_FORMAT = '%d-%b-%Y %H:%M'

    #####
    #
    # Bootstrap3 Settings
    #
    #####
    BOOTSTRAP3 = {
        'required_css_class': 'required',
    }
