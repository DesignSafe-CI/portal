import logging

from django.conf import settings

from elasticsearch_dsl import (Document, Date, Nested,
                               Boolean, GeoPoint, MetaField, Text,
                               Keyword)

logger = logging.getLogger(__name__)


class RapidNHEventType(Document):
    class Index:
        name = settings.ES_INDICES['rapid_event_type']['alias']

    class Meta:
        dynamic = MetaField('strict')

    display_name = Text(fields={
        '_exact': Keyword()
    })
    name = Text(fields={
        '_exact': Keyword()
    })


class RapidNHEvent(Document):
    class Index:
        name = settings.ES_INDICES['rapid_event']['alias']

    class Meta:
        dynamic = MetaField('strict')

    event_date = Date()
    created_date = Date()
    title = Text(analyzer='english')
    event_type = Text(fields={
        '_exact': Keyword()
    })
    location_description = Text(
        analyzer='english',
        fields={
            '_exact': Keyword()
        })
    location = GeoPoint()
    main_image_url = Text(fields={
        '_exact': Keyword()
    })
    main_image_uuid = Text(fields={
        '_exact': Keyword()
    })
    datasets = Nested(
        properties={
            "id": Text(fields={
                '_exact': Keyword()
            }),
            "title": Text(fields={
                '_exact': Keyword()
            }),
            "doi": Text(fields={
                '_exact': Keyword()
            }),
            "url": Text(fields={
                '_exact': Keyword()
            }),
        })

    def save(self, **kwargs):
        # self.created_date = datetime.utcnow()
        return super(RapidNHEvent, self).save(**kwargs)
