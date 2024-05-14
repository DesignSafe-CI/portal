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
from django.utils.translation import gettext_lazy as _


gettext = lambda s: s
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SITE_DIR = os.path.dirname(os.path.abspath(__file__))

# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/1.8/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', '__CHANGE_ME_!__')

# SESSIONS
SESSION_COOKIE_DOMAIN = os.environ.get('SESSION_COOKIE_DOMAIN')
SESSION_COOKIE_SECURE = True
SESSION_EXPIRE_AT_BROWSER_CLOSE = True
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.environ.get('DJANGO_DEBUG', 'False') == 'True'
RENDER_REACT = os.environ.get('RENDER_REACT', 'False') == 'True'

ALLOWED_HOSTS = ['*']
# Application definition

INSTALLED_APPS = (

    'daphne',
    'djangocms_admin_style',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.sessions.middleware',
    'django.contrib.sites',
    'django.contrib.sitemaps',
    'django.contrib.staticfiles',

    'cmsplugin_cascade',
    'cmsplugin_cascade.extra_fields',

    'djangocms_text_ckeditor',
    'django_select2',

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
    'djangocms_snippet',
    'snowpenguin.django.recaptcha2',
    'filer',
    'easy_thumbnails',
    'bootstrap3',
    'termsandconditions',
    'impersonate',
    'captcha',

    # custom
    'designsafe.apps.auth',
    'designsafe.apps.api',
    'designsafe.apps.api.notifications',
    'designsafe.apps.api.datafiles',
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

    #haystack integration
    'haystack'
)

AUTHENTICATION_BACKENDS = (
    'designsafe.apps.auth.backends.AgaveOAuthBackend',
    'designsafe.apps.auth.backends.TASBackend',
    'django.contrib.auth.backends.ModelBackend',
)

LOGIN_REDIRECT_URL = os.environ.get('LOGIN_REDIRECT_URL', '/account/')
LOGOUT_REDIRECT_URL = os.environ.get('LOGOUT_REDIRECT_URL', '/auth/logged-out/')

CACHES = {
  'default': {
      'BACKEND': 'django.core.cache.backends.memcached.PyMemcacheCache',
      'LOCATION': 'memcached:11211',
  },
}

MIDDLEWARE = (
    'designsafe.middleware.RequestProfilingMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'designsafe.apps.token_access.middleware.TokenAuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'designsafe.apps.auth.middleware.AgaveTokenRefreshMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'django.middleware.locale.LocaleMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'cms.middleware.user.CurrentUserMiddleware',
    'cms.middleware.page.CurrentPageMiddleware',
    'cms.middleware.language.LanguageCookieMiddleware',
    'cms.middleware.toolbar.ToolbarMiddleware',
    'impersonate.middleware.ImpersonateMiddleware',
    'designsafe.middleware.DesignSafeTermsMiddleware',
    'designsafe.middleware.DesignsafeProfileUpdateMiddleware',
    'designsafe.middleware.SiteMessageMiddleware',
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
                'django.contrib.messages.context_processors.messages',
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
                'designsafe.apps.auth.context_processors.auth',
                'designsafe.apps.cms_plugins.context_processors.cms_section',
            ],
        },
    },
]

WSGI_APPLICATION = 'designsafe.wsgi.application'
ASGI_APPLICATION = 'designsafe.asgi.application'
CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {
            "hosts": [(os.environ.get('WS_BACKEND_HOST'),
                       os.environ.get('WS_BACKEND_PORT'))],
        },
    },
}


# Database
# https://docs.djangoproject.com/en/1.8/ref/settings/#databases

if os.environ.get('DATABASE_HOST'):
    # mysql connection
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
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

DEFAULT_AUTO_FIELD = 'django.db.models.AutoField'

X_FRAME_OPTIONS = "SAMEORIGIN"

HAYSTACK_ROUTERS = ['aldryn_search.router.LanguageRouter', ]
ALDRYN_SEARCH_DEFAULT_LANGUAGE = 'en'
ALDRYN_SEARCH_REGISTER_APPHOOK = True

from designsafe.settings.nees_settings import NEES_USER_DATABASE
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
    ('vendor/angular-ui-codemirror', os.path.join(BASE_DIR, 'node_modules', 'angular-ui-codemirror')),
    ('vendor/codemirror', os.path.join(BASE_DIR, 'node_modules', 'codemirror')),
    ('vendor/angular-material', os.path.join(BASE_DIR, 'node_modules', 'angular-material')),
    ('vendor/font-awesome', os.path.join(BASE_DIR, 'node_modules', 'font-awesome')),
    ('vendor/angular-toastr', os.path.join(BASE_DIR, 'node_modules', 'angular-toastr')),
    ('vendor/slick-carousel', os.path.join(BASE_DIR, 'node_modules', 'slick-carousel')),
    ('vendor/angular-xeditable', os.path.join(BASE_DIR, 'node_modules', 'angular-xeditable')),
    ('vendor/leaflet-measure', os.path.join(BASE_DIR, 'node_modules', 'leaflet-measure')),
    ('vendor/exif-js', os.path.join(BASE_DIR, 'node_modules', 'exif-js')),
    ('vendor/angular-native-dragdrop', os.path.join(BASE_DIR, 'node_modules', 'angular-native-dragdrop')),
    ('vendor/d3plus', os.path.join(BASE_DIR, 'node_modules', 'd3plus')),
]

STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": "django.contrib.staticfiles.storage.ManifestStaticFilesStorage",
    },
}
STATICFILES_FINDERS = (
    'django.contrib.staticfiles.finders.FileSystemFinder',
    'django.contrib.staticfiles.finders.AppDirectoriesFinder',
)
MEDIA_ROOT = '/srv/www/designsafe/media/'
MEDIA_URL = '/media/'

FILE_UPLOAD_PERMISSIONS = 0o644


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
    ('cms_page_for_app.html', 'Main Site App Page'),
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
        'AppCategoryListing',
        'RelatedApps',
        'AppVariants'
    )
}
CMSPLUGIN_CASCADE_PLUGINS = [
    'cmsplugin_cascade.bootstrap3',
    'cmsplugin_cascade.link',
]

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
    'allowedContent': True
}

#MIGRATION_MODULES = {
#    'djangocms_file': 'djangocms_file.migrations_django',
#    'djangocms_googlemap': 'djangocms_googlemap.migrations_django',
#    'djangocms_picture': 'djangocms_picture.migrations_django',
#    'djangocms_video': 'djangocms_video.migrations_django',
#    'djangocms_style': 'djangocms_style.migrations_django',
#}

LOGIN_URL = os.environ.get('LOGIN_URL', '/login/')

DJANGOCMS_FORMS_PLUGIN_MODULE = 'Generic'
DJANGOCMS_FORMS_PLUGIN_NAME = 'Form'
DJANGOCMS_FORMS_TEMPLATES = (
    ('djangocms_forms/form_template/default.html', 'Default'),
)
DJANGOCMS_FORMS_FORMAT_CHOICES = (
    ("csv", _("CSV")),
    ("json", _("JSON")),
    ("yaml", _("YAML")),
    ("xlsx", _("Microsoft Excel")),
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
                      ' %(message)s user=%(user)s ip=%(ip)s agent=%(agent)s sessionId=%(sessionId)s op=%(operation)s'
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
PROJECT_ADMIN_USERS = ['ds_admin', 'prjadmin']
PROJECT_ADMINS_EMAIL = ['maria@tacc.utexas.edu', 'gendlerk@tacc.utexas.edu']
DEV_PROJECT_ADMINS_EMAIL = ['tbrown@tacc.utexas.edu', 'sgray@tacc.utexas.edu', 'vgonzalez@tacc.utexas.edu']

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

# Project registration credentials
TRAM_SERVICES_URL = os.environ.get('TRAM_SERVICES_URL', None)
TRAM_SERVICES_KEY = os.environ.get('TRAM_SERVICES_KEY', None)
TRAM_PROJECT_ID = os.environ.get('TRAM_PROJECT_ID', None)

###
# Agave Integration
#
# Agave Tenant Configuration
AGAVE_TENANT_ID = os.environ.get('AGAVE_TENANT_ID')
AGAVE_TENANT_BASEURL = os.environ.get('AGAVE_TENANT_BASEURL', 'https://api.example.com')
#
# # TEST Agave Tenant Configuration
# TEST_AGAVE_SUPER_TOKEN = os.environ.get('TEST_AGAVE_SUPER_TOKEN')
# TEST_AGAVE_TENANT_BASEURL = os.environ.get('TEST_AGAVE_TENANT_BASEURL', 'https://api.example.com')
# #
# Agave Client Configuration
AGAVE_CLIENT_KEY = os.environ.get('AGAVE_CLIENT_KEY')
AGAVE_CLIENT_SECRET = os.environ.get('AGAVE_CLIENT_SECRET')
AGAVE_SUPER_TOKEN = os.environ.get('AGAVE_SUPER_TOKEN')

AGAVE_SANDBOX_CLIENT_KEY = os.environ.get('AGAVE_SANDBOX_CLIENT_KEY', '')
AGAVE_SANDBOX_CLIENT_SECRET = os.environ.get('AGAVE_SANDBOX_CLIENT_SECRET', '')
AGAVE_SANDBOX_SUPER_TOKEN = os.environ.get('AGAVE_SANDBOX_SUPER_TOKEN', '')

AGAVE_TOKEN_SESSION_ID = os.environ.get('AGAVE_TOKEN_SESSION_ID', 'agave_token')
AGAVE_STORAGE_SYSTEM = os.environ.get('AGAVE_STORAGE_SYSTEM')
AGAVE_WORKING_SYSTEM = os.environ.get('AGAVE_WORKING_SYSTEM', 'designsafe.storage.frontera.work')

AGAVE_JWT_PUBKEY = os.environ.get('AGAVE_JWT_PUBKEY')
AGAVE_JWT_ISSUER = os.environ.get('AGAVE_JWT_ISSUER')
AGAVE_JWT_HEADER = os.environ.get('AGAVE_JWT_HEADER')
AGAVE_JWT_USER_CLAIM_FIELD = os.environ.get('AGAVE_JWT_USER_CLAIM_FIELD')
AGAVE_JWT_SERVICE_ACCOUNT = os.environ.get('AGAVE_JWT_SERVICE_ACCOUNT')

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

PUBLISHED_SYSTEM = 'designsafe.storage.published'
COMMUNITY_SYSTEM = 'designsafe.storage.community'
NEES_PUBLIC_SYSTEM = 'nees.public'

# RECAPTCHA SETTINGS FOR LESS SPAMMO
DJANGOCMS_FORMS_RECAPTCHA_PUBLIC_KEY = os.environ.get('DJANGOCMS_FORMS_RECAPTCHA_PUBLIC_KEY')
DJANGOCMS_FORMS_RECAPTCHA_SECRET_KEY = os.environ.get('DJANGOCMS_FORMS_RECAPTCHA_SECRET_KEY')
RECAPTCHA_PUBLIC_KEY = os.environ.get('DJANGOCMS_FORMS_RECAPTCHA_PUBLIC_KEY')
RECAPTCHA_PRIVATE_KEY= os.environ.get('DJANGOCMS_FORMS_RECAPTCHA_SECRET_KEY')
NOCAPTCHA = True

#FOR RAPID UPLOADS
DESIGNSAFE_UPLOAD_PATH = '/corral-repl/tacc/NHERI/uploads'
DESIGNSAFE_PROJECTS_PATH = os.environ.get('DESIGNSAFE_PROJECTS_PATH', '/corral-repl/tacc/NHERI/projects/')
DESIGNSAFE_PUBLISHED_PATH = os.environ.get('DESIGNSAFE_PUBLISHED_PATH', '/corral-repl/tacc/NHERI/published/')
DATACITE_URL = os.environ.get('DATACITE_URL', 'https://doi.test.datacite.org/')
DATACITE_USER = os.environ.get('DATACITE_USER')
DATACITE_PASS = os.environ.get('DATACITE_PASS')
DATACITE_SHOULDER = os.environ.get('DATACITE_SHOULDER')

DESIGNSAFE_ENVIRONMENT = os.environ.get('DESIGNSAFE_ENVIRONMENT', 'dev').lower()
if os.environ.get('PORTAL_PROFILE') == 'True':
    PORTAL_PROFILE = True
else:
    PORTAL_PROFILE = False
try:
    from designsafe.settings.celery_settings import *
    from designsafe.settings.external_resource_settings import *
    from designsafe.settings.elasticsearch_settings import *
    from designsafe.settings.rt_settings import *
    from designsafe.settings.external_resource_secrets import *
    from designsafe.settings.nco_mongo import *
except ImportError:
    pass

PORTAL_DATA_DEPOT_MANAGERS = {
    'agave': 'designsafe.apps.api.agave.filemanager.private_data.PrivateDataFileManager',
    'shared': 'designsafe.apps.api.agave.filemanager.shared_data.SharedDataFileManager',
    'my-projects': 'designsafe.apps.api.agave.filemanager.private_data.PrivateDataFileManager',
    'public': 'designsafe.apps.api.agave.filemanager.publications.PublicationsManager',
    'public-legacy': 'designsafe.apps.api.agave.filemanager.publications_legacy.LegacyPublicationsManager',
    'published': 'designsafe.apps.api.agave.filemanager.published_files.PublishedFileManager',
    'community': 'designsafe.apps.api.agave.filemanager.community.CommunityFileManager'
}

PORTAL_DATA_DEPOT_SEARCH_MANAGERS = {
    'agave': 'designsafe.apps.api.search.searchmanager.private_data.PrivateDataSearchManager',
    'shared': 'designsafe.apps.api.search.searchmanager.shared_data.SharedDataSearchManager',
    'my-projects': 'designsafe.apps.api.search.searchmanager.private_data.PrivateDataSearchManager',
    'public': 'designsafe.apps.api.search.searchmanager.publications.PublicationsSearchManager',
    'public-legacy': 'designsafe.apps.api.search.searchmanager.publications_legacy.LegacyPublicationsSearchManager',
    'published': 'designsafe.apps.api.search.searchmanager.published_files.PublishedDataSearchManager',
    'community': 'designsafe.apps.api.search.searchmanager.community.CommunityDataSearchManager'
}

COMMUNITY_INDEX_SCHEDULE = os.environ.get('COMMUNITY_INDEX_SCHEDULE', {})


SUPPORTED_MS_WORD = [
    '.doc', '.dot', '.docx', '.docm', '.dotx', '.dotm', '.docb',
]
SUPPORTED_MS_EXCEL = [
    '.xls', '.xlt', '.xlm', '.xlsx', '.xlsm', '.xltx', '.xltm',
]
SUPPORTED_MS_POWERPOINT = [
    '.ppt', '.pot', '.pps', '.pptx', '.pptm', '.potx', '.ppsx', '.ppsm', '.sldx', '.sldm',
]

SUPPORTED_IMAGE_PREVIEW_EXTS = [
    '.png', '.gif', '.jpg', '.jpeg',
]

SUPPORTED_TEXT_PREVIEW_EXTS = [
    '.as', '.as3', '.asm', '.bat', '.c', '.cc', '.cmake', '.cpp', '.cs', '.css',
    '.csv', '.cxx', '.diff', '.groovy', '.h', '.haml', '.hh', '.htm', '.html',
    '.java', '.js', '.less', '.m', '.make', '.md', '.ml', '.mm', '.msg', '.php',
    '.pl', '.properties', '.py', '.rb', '.sass', '.scala', '.script', '.sh', '.sml',
    '.sql', '.txt', '.vi', '.vim', '.xml', '.xsd', '.xsl', '.yaml', '.yml', '.tcl',
    '.json', '.out', '.err', '.geojson', '.do', '.sas', '.hazmapper'
]

SUPPORTED_OBJECT_PREVIEW_EXTS = [
    '.pdf',
]

SUPPORTED_VIDEO_EXTS = [
    '.webm', '.ogv', '.ogg', '.mp4'
]

SUPPORTED_VIDEO_MIMETYPES = {
    '.webm': 'video/webm',
    '.ogg': 'video/ogg',
    '.mp4': 'video/mp4'
}
SUPPORTED_IPYNB_PREVIEW_EXTS = [
        '.ipynb'
    ]

SUPPORTED_MS_OFFICE = SUPPORTED_MS_WORD + SUPPORTED_MS_POWERPOINT + SUPPORTED_MS_EXCEL

SUPPORTED_PREVIEW_EXTENSIONS = (SUPPORTED_IMAGE_PREVIEW_EXTS +
                                SUPPORTED_TEXT_PREVIEW_EXTS +
                                SUPPORTED_OBJECT_PREVIEW_EXTS +
                                SUPPORTED_MS_OFFICE +
                                SUPPORTED_IPYNB_PREVIEW_EXTS)


# FEDORA REPO SETTINGS
FEDORA_URL = os.environ.get('FEDORA_URL')
FEDORA_USERNAME = os.environ.get('FEDORA_USERNAME')
FEDORA_PASSWORD = os.environ.get('FEDORA_PASSWORD')
FEDORA_CONTAINER= os.environ.get('FEDORA_CONTAINER', 'designsafe-publications-dev')
