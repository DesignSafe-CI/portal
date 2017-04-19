from datetime import datetime
from elasticsearch_dsl import DocType, String, Date, Nested, Boolean, GeoPoint
from designsafe.connections import connections

class RapidNHEventType(DocType):

    class Meta:
        index = 'designsafe'

    name = String()
    display_name = String()


class RapidNHEvent(DocType):
    class Meta:
        index = 'designsafe'

    event_date = Date()
    created_date = Date()
    title = String()
    event_type = String()
    location_description = String()
    location = GeoPoint()
    main_image_url = String()
    datasets = Nested(
        properties={
            "title": String(),
            "doi": String(),
            "url": String(),
        })
