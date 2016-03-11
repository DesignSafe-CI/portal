from django.conf import settings
from django.db import models


LICENSE_TYPES = (
    ('MATLAB', 'MATLAB'),
)


def get_license_info():
    return [
        {
            'license_type': 'MATLAB',
            'class': 'designsafe.apps.licenses.MATLABLicense',
            'details_html': 'designsafe/apps/licenses/matlab_details.html',
        }
    ]


class BaseLicense(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='licenses')
    license_type = models.CharField(max_length=255, choices=LICENSE_TYPES)

    class Meta:
        abstract = True

    def license_as_str(self):
        return ''


class MATLABLicense(BaseLicense):
    license_file_content = models.TextField(help_text='This should be entire contents of'
                                                      'the user\'s MATLAB license file. '
                                                      'Please ensure you paste the '
                                                      'license exactly as it is in the '
                                                      'license file.')

    def __str__(self):
        return unicode(self).encode('utf-8')

    def __unicode__(self):
        return u"%s: %s" % (self.license_type, self.user.username)

    def license_as_str(self):
        return self.license_file_content.encode('utf-8')
