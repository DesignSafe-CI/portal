import logging
import re
from haystack import indexes
from django.db.models import Q
from django.template import RequestContext
from django.utils import timezone
#rom djangocms_text_ckeditor.models import Text
#from django.utils.text import smart_split
from django.test import RequestFactory

from django.utils.html import strip_tags
from django.utils.encoding import force_unicode

from cms.models import Title, CMSPlugin, Page
# from cms.toolbar.toolbar import CMSToolbar
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
    # cmsplugin_ptr_id = indexes.IntegerField(model_attr='cmsplugin_ptr_id')
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

        # queryset = Title.objects.public().all()
        # queryset = Page.objects.published().filter(publisher_is_draft=False).distinct()
        return queryset

    def prepare(self, obj):
        #logger.info(self.prepared_data)
        page = obj.page
        rf = RequestFactory()
        request = rf.get("/")
        request.session = {}
        request.LANGUAGE_CODE = settings.LANGUAGE_CODE
        self.prepared_data = super(TextPluginIndex, self).prepare(page)
        plugins = CMSPlugin.objects.filter(placeholder__in=obj.page.placeholders.all())
        text = u''
        for base_plugin in plugins:
            instance, plugin_type = base_plugin.get_plugin_instance()
            if instance is None:
                # this is an empty plugin
                continue
            if hasattr(instance, 'search_fields'):
                text += u' '.join(force_unicode(strip_tags(getattr(instance, field, ''))) for field in instance.search_fields)
            if getattr(instance, 'search_fulltext', False) or getattr(plugin_type, 'search_fulltext', False):
                text += _strip_tags(instance.render_plugin(context=RequestContext(request))) + u' '
        text += page.get_meta_description() or u''
        text += u' '
        # text += obj.get_meta_keywords() or u''
        self.prepared_data['text'] = text
        self.prepared_data["body"] = text
        self.prepared_data["slug"] = obj.slug
        self.prepared_data["url"] = obj.path
        self.prepared_data["title"] = obj.title

        # self.prepared_data['language'] = self._language
        return self.prepared_data
    # def index_queryset(self, using=None):
    #     # get published Text objects
    #     sql = """
    #         select a.cmsplugin_ptr_id from djangocms_text_ckeditor_text as a
    #         JOIN cms_cmsplugin as b on a.cmsplugin_ptr_id = b.id
    #         JOIN cms_page_placeholders as c on b.placeholder_id = c.placeholder_id
    #         JOIN cms_title as d on c.page_id = d.page_id
    #         where d.publisher_state = 1
    #         and d.publisher_is_draft = false
    #     """
    #     texts = Text.objects.raw(sql)
    #     ids = []
    #     for text in texts:
    #         ids.append(text.cmsplugin_ptr_id)
    #     queryset = Text.objects.filter(id__in=ids)
    #     return queryset
    #
    # def prepare_body(self, obj):
    #     obj.body = strip_tags(obj.body)
    #     return obj.body
    #
    # def prepare(self, obj):
    #     # append slug, page_id and path
    #     self.prepared_data = super(TextPluginIndex, self).prepare(obj)
    #     sql = """
    #         select d.id, d.slug, d.page_id, d.path from djangocms_text_ckeditor_text as a
    #         JOIN cms_cmsplugin as b on a.cmsplugin_ptr_id = b.id
    #         JOIN cms_page_placeholders as c on b.placeholder_id = c.placeholder_id
    #         JOIN cms_title as d on c.page_id = d.page_id
    #         where d.publisher_state = 1 and a.cmsplugin_ptr_id = %s
    #     """
    #     titles = Title.objects.raw(sql, [obj.cmsplugin_ptr_id])
    #     for title in titles:
    #         logger.info(title)
    #         self.prepared_data['slug'] = title.slug
    #         self.prepared_data['page_id'] = title.page_id
    #         self.prepared_data['url'] = title.path
    #     return self.prepared_data
    #
    #
    # def get_model(self):
    #     return Text
