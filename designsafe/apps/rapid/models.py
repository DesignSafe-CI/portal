from datetime import datetime
from elasticsearch_dsl import DocType, String, Date, Nested, Boolean, GeoPoint, MetaField
from designsafe.connections import connections

class RapidNHEventType(DocType):

    class Meta:
        index = 'designsafe'
        dynamic = MetaField('false')

    name = String()
    display_name = String()


class RapidNHEvent(DocType):
    class Meta:
        index = 'designsafe'
        dynamic = MetaField('false')

    event_date = Date()
    created_date = Date()
    title = String()
    event_type = String()
    location_description = String()
    location = GeoPoint()
    main_image_uuid = String()
    datasets = Nested(
        properties={
            "id": String(),
            "title": String(),
            "doi": String(),
            "url": String(),
        })

    def save(self, **kwargs):
        self.created_date = datetime.utcnow()
        return super(RapidNHEvent, self).save(**kwargs)
