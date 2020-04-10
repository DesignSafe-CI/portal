import logging
import re
from haystack import indexes
from django.db.models import Q
from django.template import RequestContext
from django.utils import timezone
from django.test import RequestFactory

from django.utils.html import strip_tags
from django.utils.encoding import force_unicode

from cms.models import CMSPlugin, Title
from django.conf import settings

logger = logging.getLogger(__name__)


def _strip_tags(value):
    """
    Returns the given HTML with all tags stripped.
    This is a copy of django.utils.html.strip_tags, except that it adds some
    whitespace in between replaced tags to make sure words are not erroneously
    concatenated.
    """
    return re.sub(r'<[^>]*?>', ' ', force_unicode(value))


class TextPluginIndex(indexes.SearchIndex, indexes.Indexable):
    text = indexes.CharField(document=True)
    body = indexes.CharField()
    url = indexes.CharField()
    slug = indexes.CharField()
    page_id = indexes.IntegerField()
    title = indexes.CharField()

    def get_model(self):
        return Title

    def index_queryset(self, using=None):
        queryset = Title.objects.public().filter(
            Q(page__publication_date__lt=timezone.now()) | Q(page__publication_date__isnull=True),
            Q(page__publication_end_date__gte=timezone.now()) | Q(page__publication_end_date__isnull=True),
            Q(redirect__exact='') | Q(redirect__isnull=True)
        ).select_related('page').distinct()

        return queryset

    def prepare(self, obj):
        page = obj.page
        rf = RequestFactory()
        request = rf.get("/")
        request.session = {}
        request.LANGUAGE_CODE = settings.LANGUAGE_CODE
        self.prepared_data = super(TextPluginIndex, self).prepare(page)
        plugins = CMSPlugin.objects.filter(placeholder__in=obj.page.placeholders.all())
        text = ''
        for base_plugin in plugins:
            instance, plugin_type = base_plugin.get_plugin_instance()
            if instance is None:
                # this is an empty plugin
                continue
            if hasattr(instance, 'search_fields'):
                text += ' '.join(force_unicode(strip_tags(getattr(instance, field, ''))) for field in instance.search_fields)
            if getattr(instance, 'search_fulltext', False) or getattr(plugin_type, 'search_fulltext', False):
                text += _strip_tags(instance.render_plugin(context=RequestContext(request))) + ' '
        text += page.get_meta_description() or ''
        text += ' '
        self.prepared_data['text'] = text
        self.prepared_data["body"] = text
        self.prepared_data["slug"] = obj.slug
        self.prepared_data["url"] = "https://" + obj.page.site.domain + '/' + obj.path
        self.prepared_data["title"] = obj.title

        return self.prepared_data
