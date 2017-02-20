from haystack import indexes

from djangocms_text_ckeditor.models import Text
from cms.models.titlemodels import Title

class TextPluginIndex(indexes.SearchIndex, indexes.Indexable):
    text = indexes.CharField(document=True, use_template=True)
    body = indexes.CharField(model_attr='body')
    cmsplugin_ptr_id = indexes.IntegerField(model_attr='cmsplugin_ptr_id')
    slug = indexes.CharField()
    page_id = indexes.IntegerField()

    def index_queryset(self, using=None):
        # get published Text objects
        sql = """
            select a.cmsplugin_ptr_id from djangocms_text_ckeditor_text as a
            JOIN cms_cmsplugin as b on a.cmsplugin_ptr_id = b.id
            JOIN cms_page_placeholders as c on b.placeholder_id = c.placeholder_id
            JOIN cms_title as d on c.page_id = d.page_id
            where d.publisher_state = 1
        """
        texts = Text.objects.raw('')
        list = []
        for text in texts:
            list.append(text.cmsplugin_ptr_id)

        queryset = Text.objects.filter(id__in=list)
        return queryset


    def prepare(self, obj):
        # append slug, page_id and path
        self.prepared_data = super(TextPluginIndex, self).prepare(obj)
        sql = """
            select d.id, d.slug, d.page_id, d.path from djangocms_text_ckeditor_text as a
            JOIN cms_cmsplugin as b on a.cmsplugin_ptr_id = b.id
            JOIN cms_page_placeholders as c on b.placeholder_id = c.placeholder_id
            JOIN cms_title as d on c.page_id = d.page_id
            where d.publisher_state = 1 and a.cmsplugin_ptr_id = %s
        """
        titles = Title.objects.raw(sql, [obj.cmsplugin_ptr_id])
        for title in titles:
            self.prepared_data['slug'] = title.slug
            self.prepared_data['page_id'] = title.page_id
            self.prepared_data['url'] = title.path
        return self.prepared_data


    def get_model(self):
        return Text
