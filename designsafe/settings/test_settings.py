"""
Django settings for designsafe project.

Generated by 'django-admin startproject' using Django 1.8.3.

For more information on this file, see
https://docs.djangoproject.com/en/1.8/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/1.8/ref/settings/
"""
# -*- coding: utf-8 -*-

# Build paths inside the project like this: os.path.join(BASE_DIR, ...)
import os
import json
from django.urls import reverse_lazy
from django.utils.text import format_lazy


gettext = lambda s: s
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SITE_DIR = os.path.dirname(os.path.abspath(__file__))

SITE_ID = 1

# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/1.8/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', '__CHANGE_ME_!__')

# SESSIONS
SESSION_COOKIE_DOMAIN = os.environ.get('SESSION_COOKIE_DOMAIN')
SESSION_EXPIRE_AT_BROWSER_CLOSE = True
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = False
RENDER_REACT = False
TEST = True

ALLOWED_HOSTS = ['*']
# Application definition

INSTALLED_APPS = (


    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.sessions.middleware',
    'django.contrib.sites',
    'django.contrib.sitemaps',
    'django.contrib.staticfiles',
    'djangocms_admin_style',
    'djangocms_text_ckeditor',
    'django_select2',
    'cmsplugin_cascade',
    'cmsplugin_cascade.extra_fields',

    'cms',
    'treebeard',
    'menus',
    'sekizai',
    'djangocms_style',
    'djangocms_file',
    'djangocms_googlemap',
    'djangocms_picture',
    'djangocms_video',
    'djangocms_forms',

    #django recaptcha
    'snowpenguin.django.recaptcha2',

    'filer',
    'easy_thumbnails',
    'bootstrap3',
    'termsandconditions',
    'impersonate',

    # custom
    'designsafe.apps.auth',
    'designsafe.apps.api',
    'designsafe.apps.api.notifications',
    'designsafe.apps.api.projects_v2',
    'designsafe.apps.api.publications_v2',
    'designsafe.apps.api.filemeta',
    'designsafe.apps.accounts',
    'designsafe.apps.cms_plugins',
    'designsafe.apps.box_integration',
    'designsafe.apps.dropbox_integration',
    'designsafe.apps.googledrive_integration',
    'designsafe.apps.licenses',
    'designsafe.apps.dashboard',
    'designsafe.apps.api.datafiles',

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

    #haystack integration
    # 'haystack'
)
AUTHENTICATION_BACKENDS = ('django.contrib.auth.backends.ModelBackend',)

LOGIN_REDIRECT_URL = os.environ.get('LOGIN_REDIRECT_URL', '/account/')

#CACHES = {
#  'default': {
#      'BACKEND': 'django.core.cache.backends.memcached.MemcachedCache',
#      'LOCATION': 'memcached:11211',
#  },
#}

MIDDLEWARE = (
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'designsafe.apps.token_access.middleware.TokenAuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'designsafe.apps.auth.middleware.TapisTokenRefreshMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'django.middleware.locale.LocaleMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'cms.middleware.user.CurrentUserMiddleware',
    'cms.middleware.page.CurrentPageMiddleware',
    'cms.middleware.toolbar.ToolbarMiddleware',
    'cms.middleware.language.LanguageCookieMiddleware',
    'impersonate.middleware.ImpersonateMiddleware',
    'designsafe.middleware.DesignSafeTermsMiddleware',
)

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
                'sekizai.context_processors.sekizai',
                'cms.context_processors.cms_settings',
                'designsafe.context_processors.analytics',
                'designsafe.context_processors.site_verification',
                'designsafe.context_processors.debug',
                'designsafe.context_processors.messages',
                'designsafe.apps.cms_plugins.context_processors.cms_section',
            ],
        },
    },
]

WSGI_APPLICATION = 'designsafe.wsgi.application'


# Database
# https://docs.djangoproject.com/en/1.8/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': os.path.join(BASE_DIR, 'db.sqlite3'),
    }
}

DEFAULT_AUTO_FIELD = 'django.db.models.AutoField'

X_FRAME_OPTIONS = "SAMEORIGIN"


HAYSTACK_ROUTERS = ['aldryn_search.router.LanguageRouter', ]
ALDRYN_SEARCH_DEFAULT_LANGUAGE = 'en'
ALDRYN_SEARCH_REGISTER_APPHOOK = True

NEES_USER_DATABASE = {
    'ENGINE': 'django.db.backends.mysql',
    'NAME': os.environ.get('NEES_DATABASE_NAME'),
    'HOST': os.environ.get('NEES_DATABASE_HOST'),
    'PORT': os.environ.get('NEES_DATABASE_PORT'),
    'USER': os.environ.get('NEES_DATABASE_USER'),
    'PASSWORD': os.environ.get('NEES_DATABASE_PASSWORD'),
}
#if NEES_USER_DATABASE['NAME']:
#    DATABASES['nees_users'] = NEES_USER_DATABASE


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
STATICFILES_DIRS = [
    os.path.join(BASE_DIR, 'designsafe', 'static'),
    ('vendor', os.path.join(BASE_DIR, 'node_modules'))
]

STATICFILES_FINDERS = (
    'django.contrib.staticfiles.finders.FileSystemFinder',
    'django.contrib.staticfiles.finders.AppDirectoriesFinder',
)
MEDIA_ROOT = '/srv/www/designsafe/media/'
MEDIA_URL = '/media/'

FIXTURE_DIRS = [
    os.path.join(BASE_DIR, 'designsafe', 'fixtures'),
]


#####
#
# CMS Settings
#
#####
DJANGOCMS_PICTURE_TEMPLATES = [
    ('non_responsive', 'Non-Responsive Image'),
    ('responsive', 'Responsive Image'),
]

CMS_PERMISSION = True
CMS_TEMPLATES = (
    ('cms_homepage.html', 'Homepage Navigation'),
    ('ef_cms_page.html', 'EF Site Page'),
    ('cms_page.html', 'Main Site Page'),
    ('cms_page_no_footer.html', 'Footerless Page'),
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
    # 'cmsplugin_cascade.bootstrap3',
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
    #'easy_thumbnails.processors.scale_and_crop',
    'filer.thumbnail_processors.scale_and_crop_with_subject_location',
    'easy_thumbnails.processors.filters',
)

CKEDITOR_SETTINGS = {
'language': '{{ language }}',
'skin': 'moono-lisa',
'toolbar': 'CMS',
'stylesSet': format_lazy('default:{}', reverse_lazy('admin:cascade_texteditor_config')),
}

MIGRATION_MODULES = {
    'djangocms_file': None,
    'djangocms_googlemap': None,
    'djangocms_picture': None,
    'djangocms_video': None,
    'djangocms_style': None
}

LOGIN_URL = os.environ.get('LOGIN_URL', '/login/')

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

DJANGOCMS_FORMS_FORMAT_CHOICES = ()

#####
#
# Bootstrap3 Settings
#
#####
BOOTSTRAP3 = {
    'required_css_class': 'required',
}


#####
#
# Django Impersonate
#
#####
IMPERSONATE = {
    'REQUIRE_SUPERUSER': True
}


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
            'format': '[METRICS] %(levelname)s %(module)s %(name)s.%(funcName)s:%(lineno)s:'
                      ' %(message)s user=%(user)s sessionId=%(sessionId)s op=%(operation)s'
                      ' info=%(info)s'
        },
    },
    'handlers': {
        'console': {
            'level': 'DEBUG',
            'class': 'logging.StreamHandler',
            'formatter': 'default',
        },
        'metrics': {
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
            'propagate': True
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
NEW_ACCOUNT_ALERT_EMAILS = os.environ.get('NEW_ACCOUNT_ALERT_EMAILS', 'no-reply@designsafe-ci.org,')

###
# Terms and Conditions
#
DEFAULT_TERMS_SLUG = 'terms'

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
AGAVE_TOKEN_SESSION_ID = os.environ.get('AGAVE_TOKEN_SESSION_ID', 'agave_token')
AGAVE_SUPER_TOKEN = os.environ.get('AGAVE_SUPER_TOKEN')
AGAVE_STORAGE_SYSTEM = os.environ.get('AGAVE_STORAGE_SYSTEM')
AGAVE_WORKING_SYSTEM = os.environ.get('AGAVE_WORKING_SYSTEM')

AGAVE_JWT_PUBKEY = os.environ.get('AGAVE_JWT_PUBKEY')
AGAVE_JWT_ISSUER = os.environ.get('AGAVE_JWT_ISSUER')
AGAVE_JWT_HEADER = os.environ.get('AGAVE_JWT_HEADER')
AGAVE_JWT_USER_CLAIM_FIELD = os.environ.get('AGAVE_JWT_USER_CLAIM_FIELD')

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
        'port': 2222,
        'homeDir': '/',
        'protocol': 'SFTP',
        'host': 'cloud.corral.tacc.utexas.edu',
        'publicAppsDir': None,
        'proxy': None,
        'rootDir': '/corral-repl/projects/NHERI/projects/{}',
        'auth': json.loads(os.environ.get('PROJECT_SYSTEM_STORAGE_CREDENTIALS', '{}'))
    }
}
PROJECT_ADMIN_USERS = ["test_prjadmin"]

PUBLISHED_SYSTEM = 'designsafe.storage.published'

# RECAPTCHA SETTINGS FOR LESS SPAMMO
DJANGOCMS_FORMS_RECAPTCHA_PUBLIC_KEY = os.environ.get('DJANGOCMS_FORMS_RECAPTCHA_PUBLIC_KEY')
DJANGOCMS_FORMS_RECAPTCHA_SECRET_KEY = os.environ.get('DJANGOCMS_FORMS_RECAPTCHA_SECRET_KEY')
RECAPTCHA_PUBLIC_KEY = os.environ.get('DJANGOCMS_FORMS_RECAPTCHA_PUBLIC_KEY', '')
RECAPTCHA_PRIVATE_KEY= os.environ.get('DJANGOCMS_FORMS_RECAPTCHA_SECRET_KEY', '')
NOCAPTCHA = True

#FOR RAPID UPLOADS
DESIGNSAFE_UPLOAD_PATH = '/corral-repl/tacc/NHERI/uploads'
DESIGNSAFE_PROJECTS_PATH = '/corral-repl/tacc/NHERI/projects/'
DESIGNSAFE_PUBLISHED_PATH = '/corral-repl/tacc/NHERI/published/'
DATACITE_USER = os.environ.get('DATACITE_USER')
DATACITE_PASS = os.environ.get('DATACITE_PASS')
DATACITE_SHOULDER = os.environ.get('DATACITE_SHOULDER', '')
DATACITE_URL = os.environ.get('DATACITE_URL', '')

DESIGNSAFE_ENVIRONMENT = os.environ.get('DESIGNSAFE_ENVIRONMENT', 'dev').lower()
if os.environ.get('PORTAL_PROFILE') == 'True':
    PORTAL_PROFILE = True
else:
    PORTAL_PROFILE = False


GOOGLE_OAUTH2_CLIENT_SECRET = "CHANGE_ME"
GOOGLE_OAUTH2_CLIENT_ID = "CHANGE_ME"

WEBHOOK_POST_URL = "http://8cb9afb3.ngrok.io"

# Box sync
BOX_APP_CLIENT_ID = 'boxappclientid'
BOX_APP_CLIENT_SECRET = 'boxappclientsecret'
BOX_SYNC_AGAVE_SYSTEM = 'storage.example.com'

DROPBOX_APP_KEY = 'dropbox_app_key'
DROPBOX_APP_SECRET = 'dropbox_app_secret'

GOOGLE_OAUTH2_SCOPES = ('https://www.googleapis.com/auth/drive',)
GOOGLE_OAUTH2_REQUEST_ATTRIBUTE = 'google_oauth'
GOOGLE_OAUTH2_STORAGE_MODEL = {
    'model': 'designsafe.apps.googledrive_integration.models.GoogleDriveUserToken',
    'user_property': 'user_id',
    'credentials_property': 'credential'
}

# Reconfigure Celery for testing
CELERY_EAGER_PROPAGATES_EXCEPTIONS = True
CELERY_ALWAYS_EAGER = True
BROKER_BACKEND = 'memory'

# No token refreshes during testing
MIDDLEWARE= [c for c in MIDDLEWARE if c !=
                      'designsafe.apps.auth.middleware.TapisTokenRefreshMiddleware']

STATIC_ROOT = os.path.join(BASE_DIR, 'static')
MEDIA_ROOT = os.path.join(BASE_DIR, '.media')

# Agave
AGAVE_TENANT_ID = 'example.com'
AGAVE_TENANT_BASEURL = 'https://api.example.com'
AGAVE_CLIENT_KEY = 'example_com_client_key'
AGAVE_CLIENT_SECRET = 'example_com_client_secret'
AGAVE_SUPER_TOKEN = 'example_com_client_token'
AGAVE_STORAGE_SYSTEM = 'storage.example.com'
AGAVE_WORKING_SYSTEM = 'storage.example.work'

TAPIS_SYSTEMS_TO_CONFIGURE = [
    {"system_id": AGAVE_STORAGE_SYSTEM, "path": "{username}", "create_path": True},
    {"system_id": AGAVE_WORKING_SYSTEM, "path": "{username}", "create_path": True},
    {"system_id": "cloud.data", "path": "/ ", "create_path": False},
]

# Tapis Client Configuration
PORTAL_ADMIN_USERNAME = ''
TAPIS_TENANT_BASEURL = 'https://designsafe.tapis.io'
TAPIS_CLIENT_ID = 'client_id'
TAPIS_CLIENT_KEY = 'client_key'
TAPIS_ADMIN_JWT = 'admin_jwt'
TAPIS_TG458981_JWT = 'tg_jwt'

KEY_SERVICE_TOKEN = ''

MIGRATION_MODULES = {
    'data': None,
    'designsafe_data': None,
    'rapid': None,
    'djangocms_file.File': None,
    'djangocms_file.Folder': None,
    'djangocms_googlemap.GoogleMapMarker': None,
    'djangocms_googlemap.GoogleMapRoute': None,
    'djangocms_googlemap.GoogleMap': None,
    'djangocms_picture.Picture': None,
    'djangocms_video.VideoTrack': None,
    'djangocms_video.VideoPlayer': None,
    'djangocms_video.VideoSource': None,
    'djangocms_style.Style': None,

}

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
            'format': '[METRICS] %(message)s user=%(user)s op=%(operation)s info=%(info)s'
        },
    },
    'handlers': {
        'console': {
            'level': 'DEBUG',
            'class': 'logging.StreamHandler',
            'formatter': 'default',
        },
        'metrics': {
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
            'level': 'DEBUG',
        },
    },
}

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

COMMUNITY_INDEX_SCHEDULE = {}

ES_INDEX_PREFIX = 'designsafe-dev-{}'
ES_AUTH = 'username:password'

ES_CONNECTIONS = {
    'default': {
        'hosts': [
            'https://wma-es-client.tacc.utexas.edu:9200',
        ],
    },
    'staging': { #dev/qa
        'hosts':  [
            'https://wma-es-client.tacc.utexas.edu:9200',
        ]
    },
    'dev': {
        'hosts': [
            'elasticsearch:9200'
        ]
    },
    'localhost': {
        'hosts': [
            'localhost'
        ]
    }
}

ES_INDICES = {
    'files': {
        'alias': ES_INDEX_PREFIX.format('files'),
        'document': 'designsafe.apps.data.models.elasticsearch.IndexedFile',
        'kwargs': {'number_of_shards': 3}
    },
    'files_legacy': {
        'alias': ES_INDEX_PREFIX.format('files-legacy'),
        'document': 'designsafe.apps.data.models.elasticsearch.IndexedFileLegacy',
        'kwargs': {'number_of_shards': 3}
    },
    'publications': {
        'alias': ES_INDEX_PREFIX.format('publications'),
        'document': 'designsafe.apps.data.models.elasticsearch.IndexedPublication',
        'kwargs': {'index.mapping.total_fields.limit': 3000}
    },
        'publications_v2': {
        'alias': ES_INDEX_PREFIX.format('publications_v2'),
        'document': 'designsafe.apps.api.publications_v2.elasticsearch.IndexedPublication',
        'kwargs': {}
    },
    'web_content': {
        'alias': ES_INDEX_PREFIX.format('web-content'),
        'document': 'designsafe.apps.data.models.elasticsearch.IndexedCMSPage',
        'kwargs': {}
    },
    'publications_legacy': {
        'alias': ES_INDEX_PREFIX.format('publications-legacy'),
        'document': 'designsafe.apps.data.models.elasticsearch.IndexedPublicationLegacy',
        'kwargs': {}
    },
    'rapid_event': {
        'alias': ES_INDEX_PREFIX.format('rapid-events'),
        'document': 'designsafe.apps.rapid.models.RapidNHEvent',
        'kwargs': {}
    },
    'rapid_event_type': {
        'alias': ES_INDEX_PREFIX.format('rapid-event-types'),
        'document': 'designsafe.apps.rapid.models.RapidNHEventType',
        'kwargs': {}
    },
    'projects': {
        'alias': ES_INDEX_PREFIX.format('projects'),
        'document': 'designsafe.apps.projects.models.elasticsearch.IndexedProject',
        'kwargs': {}
    },
    'project_entities': {
        'alias': ES_INDEX_PREFIX.format('project-entities'),
        'document': 'designsafe.apps.projects.models.elasticsearch.IndexedEntity',
        'kwargs': {}

    },
    #'apps': {
    #    'name': 'des-apps_a',
    #    'alias': ['des-apps'],
    #    'documents': [{'name': 'app',
    #                   'class': 'designsafe.apps.workspace.models.elasticsearch.IndexedApp'}]
    #},
    #'jobs': {
    #    'name': 'des-jobs_a',
    #    'alias': ['des-jobs'],
    #    'documents': [{'name': 'job',
    #                   'class': 'designsafe.apps.workspace.models.elasticsearch.IndexedJob'}]
    #}
}

HAYSTACK_CONNECTIONS = {
    'default': {
        'ENGINE': 'haystack.backends.elasticsearch_backend.ElasticsearchSearchEngine',
        # 'URL': 'des_elasticsearch:9200/',
        'URL': ES_CONNECTIONS['dev']['hosts'][0],
        'INDEX_NAME': ES_INDEX_PREFIX.format('cms'),
        'KWARGS': {'http_auth': ES_AUTH}
    }
}

DJANGO_RT = {
    'RT_HOST': os.environ.get('RT_HOST', 'https://rt.example.com/REST/1.0'),
    'RT_UN': os.environ.get('RT_USERNAME', 'username'),
    'RT_PW': os.environ.get('RT_PASSWORD', 'password'),
    'RT_QUEUE': os.environ.get('RT_DEFAULT_QUEUE', 'Support'),
}

TICKET_CATEGORIES = (
    ('DATA_CURATION_PUBLICATION', 'Data Curation & Publication'),
    ('DATA_DEPOT', 'Data Depot'),
    ('DISCOVERY_WORKSPACE', 'Discovery Workspace'),
    ('LOGIN', 'Login/Registration'),
    ('OTHER', 'Other'),
)
