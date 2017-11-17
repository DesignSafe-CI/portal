from django.conf import settings
from datetime import datetime
from elasticsearch_dsl import (DocType, String, Date, Nested,
                               Boolean, GeoPoint, MetaField, Text,
                               Keyword)
from designsafe.connections import connections

class RapidNHEventType(DocType):
    class Meta:
        index = settings.ES_INDICES['rapid']['name']
        dynamic = MetaField('false')

    display_name = String(fields={
        '_exact': Keyword()
    })
    name = String(fields={
        '_exact': Keyword()
    })


class RapidNHEvent(DocType):
    class Meta:
        index = settings.ES_INDICES['rapid']['name']
        dynamic = MetaField('false')

    event_date = Date()
    created_date = Date()
    title = Text(analyzer='english')
    event_type = String(fields={
                '_exact': Keyword()
            })
    location_description = Text(
        analyzer='english',
        fields={
            '_exact': Keyword()
        })
    location = GeoPoint()
    main_image_url = String(fields={
        '_exact': Keyword()
    })
    main_image_uuid = String(fields={
        '_exact': Keyword()
    })
    datasets = Nested(
        properties={
            "id": String(fields={
                '_exact': Keyword()
            }),
            "title": String(fields={
                '_exact': Keyword()
            }),
            "doi": String(fields={
                '_exact': Keyword()
            }),
            "url": String(fields={
                '_exact': Keyword()
            }),
        })

    def save(self, **kwargs):
        # self.created_date = datetime.utcnow()
        return super(RapidNHEvent, self).save(**kwargs)
