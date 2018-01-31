from django.conf import settings
from django.db import models
import logging

logger = logging.getLogger(__name__)

LICENSE_TYPES = [
    'MATLAB',
    'LS-DYNA'
]


def get_license_info():
    return [
        {
            'license_type': 'MATLAB',
            'class': 'designsafe.apps.licenses.MATLABLicense',
            'details_html': 'designsafe/apps/licenses/matlab_details.html',
        },
        {
            'license_type': 'LS-DYNA',
            'class': 'designsafe.apps.licenses.LSDYNALicense',
            'details_html': 'designsafe/apps/licenses/ls-dyna_details.html'
        }
    ], BaseLicense.__subclasses__()


class BaseLicense(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, related_name='%(class)s')

    class Meta:
        abstract = True

    def __str__(self):
        return unicode(self).encode('utf-8')

    def __unicode__(self):
        return u"%s: %s" % (self.license_type, self.user.username)

    def license_as_str(self):
        self.license_file_content = self.license_file_content.replace('\r\n', '\n')
        return self.license_file_content.encode('utf-8')


class MATLABLicense(BaseLicense):
    license_file_content = models.TextField(help_text='This should be entire contents of '
                                                      'the user\'s MATLAB license file. '
                                                      'Please ensure you paste the '
                                                      'license exactly as it is in the '
                                                      'license file.')

    license_type = 'MATLAB'


class LSDYNALicense(BaseLicense):
    license_file_content = models.TextField(help_text='This should be entire contents of '
                                                      'the user\'s LS-DYNA license file. '
                                                      'Please ensure you paste the '
                                                      'license exactly as it is in the '
                                                      'license file.')
                                                      
    license_type = 'LS-DYNA'
