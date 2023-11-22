from elasticsearch_dsl import Q
import logging
logger = logging.getLogger(__name__)

def experimental_facility_query(facility):
    if facility['name'] == 'Other':
        facility['name'] = 'other'

    name_query =  Q({'nested':
              {'path': 'experimentsList',
               'query':
               {'nested':
                {'path': 'experimentsList.value',
                 'query':
                 {'term':
                  {'experimentsList.value.experimentalFacility._exact': facility['name']}}}}}})

    label_query =  Q({'nested':
              {'path': 'experimentsList',
               'query':
               {'nested':
                {'path': 'experimentsList.value',
                 'query':
                 {'term':
                  {'experimentsList.value.experimentalFacility._exact': facility['label']}}}}}})

    return name_query | label_query


def experiment_type_query(experiment_type):
    return Q({'nested':
              {'path': 'experimentsList',
               'query':
               {'nested':
                {'path': 'experimentsList.value',
                 'query':
                 {'match':
                  {'experimentsList.value.experimentType': experiment_type}}}}}})
                  

def simulation_type_query(simulation_type):
    return Q({'term': {'simulations.value.simulationType.keyword': simulation_type}})


def nh_type_query(nh_type):
    NON_OTHER_NH_TYPES = [
        "Earthquake",
        "Extreme Temperatures",
        "Fire",
        "Flood",
        "Hurricane/Tropical Storm",
        "Landslide",
        "Tornado",
        "Tsunami",
        "Thunderstorm",
        "Storm Surge",
        "Pandemic",
        "Wind"
    ]
    if nh_type == "Other":
        return ~Q({'terms': {'project.value.nhTypes.keyword': NON_OTHER_NH_TYPES}})
    return Q({'term': {'project.value.nhTypes.keyword': nh_type}})


def nh_event_query(nh_event):
    return Q({'match': {'project.value.nhEvent': nh_event}})


def other_type_query(data_type):
    data_types = [
            'Benchmark Dataset',
            'Check Sheet',
            'Code',
            'Database',
            'Dataset',
            'Field Survey',
            'Image',
            'Jupyter Notebook',
            'Learning Object',
            'Model',
            'Paper',
            'Proceeding',
            'Poster',
            'Presentation',
            'Report',
            'Reseach Experience for Undergraduates',
            'SimCenter Testbed',
            'Social Sciences',
            'Survey Instrument',
            'Testbed',
            'Video',
            'White Paper',
    ]
    if data_type == 'Other':
        return ~Q({'terms': {'project.value.dataType.keyword': data_types}}) # | ~Q({'exists', {'field': 'project.value.dataType.keyword'}})
    return Q({'term': {'project.value.dataType.keyword': data_type}})


def hybrid_sim_type_query(sim_type):
    return Q({'term': {'hybrid_simulations.value.simulationType.keyword': sim_type}})


def author_query(author):
    if not author:
        return None

    aq1 = Q({"nested":
             {"path": "users",
                 "ignore_unmapped": True,
              "query": {
                  "query_string": {"fields": ["users.first_name", "users.last_name", "users.username"], "query": author}
              }

              }})

    other_author_fields = ["project.value.pi",
                           "project.value.teamOrder.fname",
                           "project.value.teamOrder.lname",
                           "project.value.teamOrder.name",
                           "authors.fname",
                           "authors.lname", ]

    aq2 = Q('query_string', query=author, fields=other_author_fields)

    return aq1 | aq2


def title_query(title):
    if not title:
        return None
    return Q({"query_string": {"fields": ["project.value.title"], "query": title}})


def fr_date_query(year): 
    if not year:
        return None
    return Q({'range': {'project.value.nhEventStart': {
        "gte": f"{year}||/y",
        "lte": f"{year}||/y", 
        'format': 'yyyy'}
    }})

def pub_date_query(year): 
    if not year:
        return None
    return Q({'range': {'created': {
        "gte": f"{year}||/y",
        "lte": f"{year}||/y", 
        'format': 'yyyy'}
    }})

def fr_type_query(fr_type):
    if not fr_type:
        return None
    return Q({'term': {'project.value.frTypes.keyword': fr_type}})


def keyword_query(keywords):
    if not keywords:
        return None
    return Q('query_string', query=keywords, fields=['project.value.keywords'])


def description_query(description):
    if not description:
        return None
    return Q('query_string', query=description, fields=['project.value.description'])


def search_string_query(search_string):
    if not search_string:
        return None
    q1 =  Q('query_string', query=f"\"{search_string}\"", fields=['project.value.description',
                                                          'project.value.keywords',
                                                          'project.value.title',
                                                          'projectId',
                                                          'project.value.projectType',
                                                          'project.value.dataType'])
    q2 = Q({'term': {'projectId._exact': search_string}})
    return q1 | q2 | author_query(f"\"{search_string}\"")
