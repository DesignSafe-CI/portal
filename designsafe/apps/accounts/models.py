from django.conf import settings
from django.db import models
from django.db import connections, DatabaseError
from django.utils.translation import ugettext_lazy as _
from django.core.mail import send_mail
import logging
import six

logger = logging.getLogger(__name__)


class NEESUser(object):

    def __init__(self, **kwargs):
        for k, v in six.iteritems(kwargs):
            setattr(self, k, v)

    _lookup_sql = "SELECT u.username, u.email, p.givenName, p.middleName, p.surname, " \
                  "p.organization, p.countryresident, p.countryorigin, p.phone, " \
                  "a.address1, a.address2, a.addressCity, a.addressRegion, " \
                  "a.addressPosstal, a.addressCountry " \
                  "FROM jos_users u JOIN jos_xprofiles p ON p.uidNumber = u.id " \
                  "LEFT JOIN jos_xprofiles_address a ON a.uidNumber = u.id " \
                  "WHERE u.email = %s"

    @classmethod
    def lookup_user(cls, email):
        if 'nees_users' in connections:
            cursor = connections['nees_users'].cursor()
            try:
                cursor.execute(cls._lookup_sql, [email])
                columns = [col[0] for col in cursor.description]
                return [
                    cls(**dict(zip(columns, row)))
                    for row in cursor.fetchall()
                ]
            finally:
                cursor.close()
        else:
            logger.error('Database connection for `nees_users` is not defined')
            raise DatabaseError('The NEES users database connection is unavailable.')


class DesignSafeProfileNHInterests(models.Model):
    description = models.CharField(max_length=300)

    def __unicode__(self):
        return self.description


class DesignSafeProfileResearchActivities(models.Model):
    description = models.CharField(max_length=300)

    def __unicode__(self):
        return self.description


class DesignSafeProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, related_name='profile')
    ethnicity = models.CharField(max_length=255)
    gender = models.CharField(max_length=255)
    bio = models.CharField(max_length=4096, default=None, null=True, blank=True)
    website = models.CharField(max_length=256, default=None, null=True, blank=True)
    orcid_id = models.CharField(max_length=256, default=None, null=True, blank=True)
    nh_interests = models.ManyToManyField(DesignSafeProfileNHInterests)
    professional_level = models.CharField(max_length=256, default=None, null=True)
    research_activities = models.ManyToManyField(DesignSafeProfileResearchActivities)

    def send_mail(self, subject, body=None):
        send_mail(subject,
                  body,
                  settings.DEFAULT_FROM_EMAIL,
                  [self.user.email],
                  html_message=body)

class NotificationPreferences(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL,
                                related_name='notification_preferences')
    announcements = models.BooleanField(
        default=True,
        verbose_name=_('Announcements: to communicate EF Workshops, NHERI Newsletter, Student Opportunities, etc.'))

    tutorials = models.BooleanField(
        default=True,
        verbose_name=_('Tutorials: to communicate DesignSafe training opportunities.'))

    designsafe = models.BooleanField(
        default=True,
        verbose_name=_('DesignSafe: to communicate new features, planned outages.'))

    class Meta:
        permissions = (
            ('view_notification_subscribers', 'Can view list of users subscribed to a '
                                              'notification type'),
        )
