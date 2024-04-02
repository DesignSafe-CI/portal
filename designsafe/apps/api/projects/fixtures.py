import datetime
from dateutil.tz import tzoffset

exp_instance_meta = {
    "_links": {
        "associationIds": [],
        "owner": {"href": "https://agave.designsafe-ci.org/profiles/v2/ds_admin"},
        "permissions": {
            "href": "https://agave.designsafe-ci.org/meta/v2/data/1052668239654088215-242ac119-0001-012/pems"
        },
        "self": {
            "href": "https://agave.designsafe-ci.org/meta/v2/data/1052668239654088215-242ac119-0001-012"
        },
    },
    "associationIds": [],
    "created": datetime.datetime(
        2019, 2, 20, 7, 46, 37, 197000, tzinfo=tzoffset(None, -21600)
    ),
    "internalUsername": None,
    "lastUpdated": datetime.datetime(
        2021, 9, 24, 14, 29, 51, 383000, tzinfo=tzoffset(None, -18000)
    ),
    "name": "designsafe.project",
    "owner": "ds_admin",
    "schemaId": None,
    "uuid": "1052668239654088215-242ac119-0001-012",
    "value": {
        "associatedProjects": [
            {
                "href": "https://www.data.gov/",
                "order": 0,
                "title": "Huge Datasets for Experiments",
            }
        ],
        "awardNumber": [
            {
                "name": "Awards for Experimental Experiments",
                "number": "1234567",
                "order": 0,
            }
        ],
        "awardNumbers": [],
        "coPis": ["sgray", "keiths", "jarosenb", "sterry1", "ojamil"],
        "description": "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam pretium elit ac mauris mattis tincidunt. Quisque semper lacus magna. Vestibulum aliquet gravida lorem at varius. Nunc nec faucibus augue. Aenean tristique libero ac turpis tempor, in bibendum est facilisis. Cras imperdiet non nisi ut aliquam. Fusce vitae elit vitae magna luctus molestie sed id dui. Nunc iaculis sem vitae elit pellentesque, a vulputate tortor efficitur. Duis ac ultrices ligula. Cras a ipsum pretium, accumsan elit eget, iaculis nulla. Nullam tristique risus eu metus gravida, ac sagittis odio pharetra. Nulla fermentum dignissim vehicula. Proin finibus dignissim augue volutpat rhoncus.",
        "dois": [],
        "ef": "",
        "guestMembers": [
            {
                "email": "guest@members.com",
                "fname": "Guest",
                "inst": "Guest institution",
                "lname": "Member",
                "user": "guestGuestM0",
            }
        ],
        "keywords": "project, experiment, walk, presentations",
        "nhTypes": ["Flood"],
        "pi": "thbrown",
        "projectId": "PRJ-2224",
        "projectType": "experimental",
        "referencedData": [],
        "teamMembers": ["sal", "fnetsch"],
        "title": "Walk Experiment Demo",
    },
}


exp_instance_resp = {
    "uuid": "1052668239654088215-242ac119-0001-012",
    "schemaId": None,
    "internalUsername": None,
    "associationIds": [],
    "lastUpdated": "2021-09-24T14:29:51.383000-05:00",
    "created": "2019-02-20T07:46:37.197000-06:00",
    "owner": "ds_admin",
    "name": "designsafe.project",
    "_links": {
        "self": {
            "href": "https://agave.designsafe-ci.org/meta/v2/data/1052668239654088215-242ac119-0001-012"
        },
        "permissions": {
            "href": "https://agave.designsafe-ci.org/meta/v2/data/1052668239654088215-242ac119-0001-012/pems"
        },
        "owner": {"href": "https://agave.designsafe-ci.org/profiles/v2/ds_admin"},
        "associationIds": [],
    },
    "value": {
        "teamMembers": ["sal", "fnetsch"],
        "coPis": ["sgray", "keiths", "jarosenb", "sterry1", "ojamil"],
        "guestMembers": [
            {
                "lname": "Member",
                "inst": "Guest institution",
                "email": "guest@members.com",
                "fname": "Guest",
                "user": "guestGuestM0",
            }
        ],
        "projectType": "experimental",
        "projectId": "PRJ-2224",
        "description": "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam pretium elit ac mauris mattis tincidunt. Quisque semper lacus magna. Vestibulum aliquet gravida lorem at varius. Nunc nec faucibus augue. Aenean tristique libero ac turpis tempor, in bibendum est facilisis. Cras imperdiet non nisi ut aliquam. Fusce vitae elit vitae magna luctus molestie sed id dui. Nunc iaculis sem vitae elit pellentesque, a vulputate tortor efficitur. Duis ac ultrices ligula. Cras a ipsum pretium, accumsan elit eget, iaculis nulla. Nullam tristique risus eu metus gravida, ac sagittis odio pharetra. Nulla fermentum dignissim vehicula. Proin finibus dignissim augue volutpat rhoncus.",
        "title": "Walk Experiment Demo",
        "pi": "thbrown",
        "awardNumber": [
            {
                "number": "1234567",
                "name": "Awards for Experimental Experiments",
                "order": 0,
            }
        ],
        "awardNumbers": [],
        "associatedProjects": [
            {
                "href": "https://www.data.gov/",
                "order": 0,
                "title": "Huge Datasets for Experiments",
            }
        ],
        "referencedData": [],
        "ef": "",
        "keywords": "project, experiment, walk, presentations",
        "nhEvent": "",
        "nhEventEnd": "",
        "nhEventStart": "",
        "nhLatitude": "",
        "nhLocation": "",
        "nhLongitude": "",
        "nhTypes": ["Flood"],
        "dois": [],
        "hazmapperMaps": [],
    },
    "_ui": {"uuid": "1052668239654088215-242ac119-0001-012", "orders": []},
    "_related": {
        "filemodel_set": "designsafe.file",
        "experiment_set": "designsafe.project.experiment",
        "analysis_set": "designsafe.project.analysis",
        "modelconfig_set": "designsafe.project.model_config",
        "sensorlist_set": "designsafe.project.sensor_list",
        "event_set": "designsafe.project.event",
        "report_set": "designsafe.project.report",
    },
}


exp_entity_meta = [
    {
        "_links": {
            "associationIds": [
                {
                    "href": "https://agave.designsafe-ci.org/files/v2/media/system/project-1052668239654088215-242ac119-0001-012//lotsotestfiles",
                    "rel": "1755305162898796054-242ac112-0001-002",
                    "title": "file",
                },
                {
                    "href": "https://agave.designsafe-ci.org/files/v2/media/system/project-1052668239654088215-242ac119-0001-012//00002.jpg",
                    "rel": "1874008375186297321-242ac112-0001-002",
                    "title": "file",
                },
                {
                    "href": "https://agave.designsafe-ci.org/meta/v2/data/7091290346386681365-242ac118-0001-012",
                    "rel": "7091290346386681365-242ac118-0001-012",
                    "title": "metadata",
                },
                {
                    "href": "https://agave.designsafe-ci.org/meta/v2/data/3849330284117683735-242ac119-0001-012",
                    "rel": "3849330284117683735-242ac119-0001-012",
                    "title": "metadata",
                },
                {
                    "href": "https://agave.designsafe-ci.org/meta/v2/data/1052668239654088215-242ac119-0001-012",
                    "rel": "1052668239654088215-242ac119-0001-012",
                    "title": "metadata",
                },
            ],
            "owner": {"href": "https://agave.designsafe-ci.org/profiles/v2/ds_admin"},
            "permissions": {
                "href": "https://agave.designsafe-ci.org/meta/v2/data/3339522405406469655-242ac11a-0001-012/pems"
            },
            "self": {
                "href": "https://agave.designsafe-ci.org/meta/v2/data/3339522405406469655-242ac11a-0001-012"
            },
        },
        "associationIds": [
            "1755305162898796054-242ac112-0001-002",
            "1874008375186297321-242ac112-0001-002",
            "7091290346386681365-242ac118-0001-012",
            "3849330284117683735-242ac119-0001-012",
            "1052668239654088215-242ac119-0001-012",
        ],
        "created": "2019-09-18T14:30:49.137-05:00",
        "internalUsername": None,
        "lastUpdated": "2021-10-06T15:43:45.230-05:00",
        "name": "designsafe.project.model_config",
        "owner": "ds_admin",
        "schemaId": None,
        "uuid": "3339522405406469655-242ac11a-0001-012",
        "value": {
            "description": "Test",
            "experiments": [
                "7091290346386681365-242ac118-0001-012",
                "3849330284117683735-242ac119-0001-012",
            ],
            "fileTags": [],
            "fileObjs": [],
            "files": [
                "1755305162898796054-242ac112-0001-002",
                "1874008375186297321-242ac112-0001-002",
            ],
            "project": ["1052668239654088215-242ac119-0001-012"],
            "title": "Wave I-B",
        },
    },
    {
        "_links": {
            "associationIds": [
                {
                    "href": "https://agave.designsafe-ci.org/files/v2/media/system/project-1052668239654088215-242ac119-0001-012//Setup Documentation/00007.jpg",
                    "rel": "4352778795703407081-242ac114-0001-002",
                    "title": "file",
                },
                {
                    "href": "https://agave.designsafe-ci.org/meta/v2/data/7206731579572621801-242ac119-0001-012",
                    "rel": "7206731579572621801-242ac119-0001-012",
                    "title": "metadata",
                },
                {
                    "href": "https://agave.designsafe-ci.org/meta/v2/data/8057478701564301801-242ac119-0001-012",
                    "rel": "8057478701564301801-242ac119-0001-012",
                    "title": "metadata",
                },
                {
                    "href": "https://agave.designsafe-ci.org/files/v2/media/system/project-1052668239654088215-242ac119-0001-012//Setup Documentation/00005.jpg",
                    "rel": "4352735846030447081-242ac114-0001-002",
                    "title": "file",
                },
                {
                    "href": "https://agave.designsafe-ci.org/files/v2/media/system/project-1052668239654088215-242ac119-0001-012//Setup Documentation/00006.jpg",
                    "rel": "4360552686509167081-242ac114-0001-002",
                    "title": "file",
                },
                {
                    "href": "https://agave.designsafe-ci.org/meta/v2/data/3849330284117683735-242ac119-0001-012",
                    "rel": "3849330284117683735-242ac119-0001-012",
                    "title": "metadata",
                },
                {
                    "href": "https://agave.designsafe-ci.org/files/v2/media/system/project-1052668239654088215-242ac119-0001-012//00004.jpg",
                    "rel": "1871173696770937321-242ac112-0001-002",
                    "title": "file",
                },
                {
                    "href": "https://agave.designsafe-ci.org/files/v2/media/system/project-1052668239654088215-242ac119-0001-012//00003.jpg",
                    "rel": "1873879526167417321-242ac112-0001-002",
                    "title": "file",
                },
                {
                    "href": "https://agave.designsafe-ci.org/meta/v2/data/1052668239654088215-242ac119-0001-012",
                    "rel": "1052668239654088215-242ac119-0001-012",
                    "title": "metadata",
                },
            ],
            "owner": {"href": "https://agave.designsafe-ci.org/profiles/v2/ds_admin"},
            "permissions": {
                "href": "https://agave.designsafe-ci.org/meta/v2/data/9123280811976289815-242ac119-0001-012/pems"
            },
            "self": {
                "href": "https://agave.designsafe-ci.org/meta/v2/data/9123280811976289815-242ac119-0001-012"
            },
        },
        "associationIds": [
            "4352778795703407081-242ac114-0001-002",
            "7206731579572621801-242ac119-0001-012",
            "8057478701564301801-242ac119-0001-012",
            "4352735846030447081-242ac114-0001-002",
            "4360552686509167081-242ac114-0001-002",
            "3849330284117683735-242ac119-0001-012",
            "1871173696770937321-242ac112-0001-002",
            "1873879526167417321-242ac112-0001-002",
            "1052668239654088215-242ac119-0001-012",
        ],
        "created": "2019-03-26T15:19:49.239-05:00",
        "internalUsername": None,
        "lastUpdated": "2021-10-06T15:32:46.257-05:00",
        "name": "designsafe.project.event",
        "owner": "ds_admin",
        "schemaId": None,
        "uuid": "9123280811976289815-242ac119-0001-012",
        "value": {
            "analysis": [],
            "description": "The results from our pressure sensors showed weaknesses in the tested structure.",
            "eventType": "other",
            "experiments": ["3849330284117683735-242ac119-0001-012"],
            "fileTags": [
                {
                    "fileUuid": "2621891030438777321-242ac112-0001-002",
                    "tagName": "Aerodynamic roughness",
                },
                {
                    "fileUuid": "2621891030438777321-242ac112-0001-002",
                    "tagName": "Image",
                },
                {
                    "fileUuid": "2621891030438777321-242ac112-0001-002",
                    "tagName": "T-bar Test",
                },
                {
                    "fileUuid": "2622921826884784617-242ac112-0001-002",
                    "tagName": "Centrifuge Speed",
                },
                {
                    "fileUuid": "2622921826884784617-242ac112-0001-002",
                    "tagName": "Load",
                },
                {
                    "fileUuid": "2622921822589817321-242ac112-0001-002",
                    "path": "/pressure_readings_sensor3.csv",
                    "tagName": "Image",
                },
                {
                    "fileUuid": "1871173696770937321-242ac112-0001-002",
                    "path": "/00004.jpg",
                    "tagName": "Video",
                },
            ],
            "fileObjs": [],
            "files": [
                "4352778795703407081-242ac114-0001-002",
                "4360552686509167081-242ac114-0001-002",
                "4352735846030447081-242ac114-0001-002",
                "1871173696770937321-242ac112-0001-002",
                "1873879526167417321-242ac112-0001-002",
            ],
            "modelConfigs": ["7206731579572621801-242ac119-0001-012"],
            "project": ["1052668239654088215-242ac119-0001-012"],
            "sensorLists": ["8057478701564301801-242ac119-0001-012"],
            "title": "Erosion Reading I-A",
        },
    },
    {
        "_links": {
            "associationIds": [
                {
                    "href": "https://agave.designsafe-ci.org/meta/v2/data/1052668239654088215-242ac119-0001-012",
                    "rel": "1052668239654088215-242ac119-0001-012",
                    "title": "metadata",
                }
            ],
            "owner": {"href": "https://agave.designsafe-ci.org/profiles/v2/ds_admin"},
            "permissions": {
                "href": "https://agave.designsafe-ci.org/meta/v2/data/895971340588346900-242ac117-0001-012/pems"
            },
            "self": {
                "href": "https://agave.designsafe-ci.org/meta/v2/data/895971340588346900-242ac117-0001-012"
            },
        },
        "associationIds": ["1052668239654088215-242ac119-0001-012"],
        "created": "2021-09-11T17:16:46.141-05:00",
        "internalUsername": None,
        "lastUpdated": "2021-09-11T17:16:46.141-05:00",
        "name": "designsafe.project.report",
        "owner": "ds_admin",
        "schemaId": None,
        "uuid": "895971340588346900-242ac117-0001-012",
        "value": {
            "description": "Hello WOrld",
            "experiments": [],
            "fileTags": [],
            "fileObjs": [],
            "files": [],
            "project": ["1052668239654088215-242ac119-0001-012"],
            "title": "A new Unassociated Report",
        },
    },
    {
        "_links": {
            "associationIds": [
                {
                    "href": "https://agave.designsafe-ci.org/meta/v2/data/1052668239654088215-242ac119-0001-012",
                    "rel": "1052668239654088215-242ac119-0001-012",
                    "title": "metadata",
                },
                {
                    "href": "https://agave.designsafe-ci.org/files/v2/media/system/project-1052668239654088215-242ac119-0001-012//objects2.pyc",
                    "rel": "7120165510589246999-242ac113-0001-002",
                    "title": "file",
                },
                {
                    "href": "https://agave.designsafe-ci.org/meta/v2/data/7091290346386681365-242ac118-0001-012",
                    "rel": "7091290346386681365-242ac118-0001-012",
                    "title": "metadata",
                },
            ],
            "owner": {"href": "https://agave.designsafe-ci.org/profiles/v2/ds_admin"},
            "permissions": {
                "href": "https://agave.designsafe-ci.org/meta/v2/data/7342634922269732375-242ac11a-0001-012/pems"
            },
            "self": {
                "href": "https://agave.designsafe-ci.org/meta/v2/data/7342634922269732375-242ac11a-0001-012"
            },
        },
        "associationIds": [
            "1052668239654088215-242ac119-0001-012",
            "7120165510589246999-242ac113-0001-002",
            "7091290346386681365-242ac118-0001-012",
        ],
        "created": "2019-10-14T14:55:41.815-05:00",
        "internalUsername": None,
        "lastUpdated": "2021-09-10T13:21:07.732-05:00",
        "name": "designsafe.project.analysis",
        "owner": "ds_admin",
        "schemaId": None,
        "uuid": "7342634922269732375-242ac11a-0001-012",
        "value": {
            "analysisData": "",
            "analysisType": "other",
            "application": "",
            "description": "",
            "experiments": ["7091290346386681365-242ac118-0001-012"],
            "fileTags": [],
            "fileObjs": [],
            "files": ["7120165510589246999-242ac113-0001-002"],
            "project": ["1052668239654088215-242ac119-0001-012"],
            "refs": [None],
            "script": [],
            "title": "Tsunami Impact on Reinforced Structures",
        },
    },
    {
        "_links": {
            "associationIds": [
                {
                    "href": "https://agave.designsafe-ci.org/meta/v2/data/1052668239654088215-242ac119-0001-012",
                    "rel": "1052668239654088215-242ac119-0001-012",
                    "title": "metadata",
                }
            ],
            "owner": {"href": "https://agave.designsafe-ci.org/profiles/v2/ds_admin"},
            "permissions": {
                "href": "https://agave.designsafe-ci.org/meta/v2/data/7454266551006129685-242ac117-0001-012/pems"
            },
            "self": {
                "href": "https://agave.designsafe-ci.org/meta/v2/data/7454266551006129685-242ac117-0001-012"
            },
        },
        "associationIds": ["1052668239654088215-242ac119-0001-012"],
        "created": "2021-08-05T16:32:12.305-05:00",
        "internalUsername": None,
        "lastUpdated": "2021-08-05T16:45:45.136-05:00",
        "name": "designsafe.project.experiment",
        "owner": "ds_admin",
        "schemaId": None,
        "uuid": "7454266551006129685-242ac117-0001-012",
        "value": {
            "authors": [
                {"authorship": True, "name": "thbrown", "order": 0},
                {"authorship": False, "name": "sterry1", "order": 1},
                {"authorship": True, "name": "sgray", "order": 2},
                {"authorship": False, "name": "jarosenb", "order": 3},
                {"authorship": True, "name": "keiths", "order": 4},
                {"authorship": False, "name": "ojamil", "order": 5},
                {"authorship": False, "name": "sal", "order": 6},
                {"authorship": False, "name": "fnetsch", "order": 7},
                {
                    "authorship": False,
                    "email": "guest@members.com",
                    "fname": "Guest",
                    "guest": True,
                    "inst": "Guest institution",
                    "lname": "Member",
                    "name": "guestGuestM0",
                    "order": 8,
                },
            ],
            "description": "This is a real Description of this entity...",
            "dois": [],
            "equipmentType": "t-rex",
            "equipmentTypeOther": "None",
            "experimentType": "mobile_shaker",
            "experimentTypeOther": "",
            "experimentalFacility": "eqss-utaustin",
            "experimentalFacilityOther": "None",
            "procedureEnd": "2021-08-05T05:00:00.000Z",
            "procedureStart": "2021-08-05T05:00:00.000Z",
            "referencedData": [],
            "relatedWork": [],
            "project": ["1052668239654088215-242ac119-0001-012"],
            "title": "Permissions",
        },
    },
    {
        "_links": {
            "associationIds": [
                {
                    "href": "https://agave.designsafe-ci.org/meta/v2/data/1052668239654088215-242ac119-0001-012",
                    "rel": "1052668239654088215-242ac119-0001-012",
                    "title": "metadata",
                }
            ],
            "owner": {"href": "https://agave.designsafe-ci.org/profiles/v2/ds_admin"},
            "permissions": {
                "href": "https://agave.designsafe-ci.org/meta/v2/data/7091290346386681365-242ac118-0001-012/pems"
            },
            "self": {
                "href": "https://agave.designsafe-ci.org/meta/v2/data/7091290346386681365-242ac118-0001-012"
            },
        },
        "associationIds": ["1052668239654088215-242ac119-0001-012"],
        "created": "2021-01-06T17:33:44.015-06:00",
        "internalUsername": None,
        "lastUpdated": "2021-08-05T16:16:09.244-05:00",
        "name": "designsafe.project.experiment",
        "owner": "ds_admin",
        "schemaId": None,
        "uuid": "7091290346386681365-242ac118-0001-012",
        "value": {
            "authors": [
                {"authorship": False, "name": "thbrown", "order": 0},
                {"authorship": False, "name": "sterry1", "order": 1},
                {"authorship": False, "name": "sgray", "order": 2},
                {"authorship": False, "name": "jarosenb", "order": 3},
                {"authorship": True, "name": "keiths", "order": 4},
                {"authorship": False, "name": "ojamil", "order": 5},
                {"authorship": True, "name": "sal", "order": 6},
                {"authorship": False, "name": "fnetsch", "order": 7},
                {
                    "authorship": False,
                    "email": "guest@members.com",
                    "fname": "Guest",
                    "guest": True,
                    "inst": "Guest institution",
                    "lname": "Member",
                    "name": "guestGuestM0",
                    "order": 8,
                },
            ],
            "description": "This should be real",
            "dois": [],
            "equipmentType": "9-m_radius_dynamic_geotechnical_centrifuge",
            "equipmentTypeOther": "None",
            "experimentType": "centrifuge",
            "experimentTypeOther": "",
            "experimentalFacility": "cgm-ucdavis",
            "experimentalFacilityOther": "None",
            "procedureEnd": "2021-01-21T06:00:00.000Z",
            "procedureStart": "2021-01-06T06:00:00.000Z",
            "referencedData": [],
            "relatedWork": [],
            "project": ["1052668239654088215-242ac119-0001-012"],
            "title": "Test",
        },
    },
    {
        "_links": {
            "associationIds": [
                {
                    "href": "https://agave.designsafe-ci.org/meta/v2/data/1052668239654088215-242ac119-0001-012",
                    "rel": "1052668239654088215-242ac119-0001-012",
                    "title": "metadata",
                }
            ],
            "owner": {"href": "https://agave.designsafe-ci.org/profiles/v2/ds_admin"},
            "permissions": {
                "href": "https://agave.designsafe-ci.org/meta/v2/data/3750505007994105365-242ac117-0001-012/pems"
            },
            "self": {
                "href": "https://agave.designsafe-ci.org/meta/v2/data/3750505007994105365-242ac117-0001-012"
            },
        },
        "associationIds": ["1052668239654088215-242ac119-0001-012"],
        "created": "2021-08-05T16:05:00.553-05:00",
        "internalUsername": None,
        "lastUpdated": "2021-08-05T16:13:42.418-05:00",
        "name": "designsafe.project.sensor_list",
        "owner": "ds_admin",
        "schemaId": None,
        "uuid": "3750505007994105365-242ac117-0001-012",
        "value": {
            "description": "Truck",
            "experiments": [],
            "fileTags": [],
            "fileObjs": [],
            "files": [],
            "modelConfigs": [],
            "project": ["1052668239654088215-242ac119-0001-012"],
            "sensorListType": "other",
            "title": "Taco Bell",
        },
    },
    {
        "_links": {
            "associationIds": [
                {
                    "href": "https://agave.designsafe-ci.org/files/v2/media/system/project-1052668239654088215-242ac119-0001-012//Setup Documentation/00008.jpg",
                    "rel": "4354582681967727081-242ac114-0001-002",
                    "title": "file",
                },
                {
                    "href": "https://agave.designsafe-ci.org/meta/v2/data/3849330284117683735-242ac119-0001-012",
                    "rel": "3849330284117683735-242ac119-0001-012",
                    "title": "metadata",
                },
                {
                    "href": "https://agave.designsafe-ci.org/meta/v2/data/7091290346386681365-242ac118-0001-012",
                    "rel": "7091290346386681365-242ac118-0001-012",
                    "title": "metadata",
                },
                {
                    "href": "https://agave.designsafe-ci.org/meta/v2/data/1052668239654088215-242ac119-0001-012",
                    "rel": "1052668239654088215-242ac119-0001-012",
                    "title": "metadata",
                },
                {
                    "href": "https://agave.designsafe-ci.org/meta/v2/data/2799945664009989655-242ac11a-0001-012",
                    "rel": "2799945664009989655-242ac11a-0001-012",
                    "title": "metadata",
                },
                {
                    "href": "https://agave.designsafe-ci.org/files/v2/media/system/project-1052668239654088215-242ac119-0001-012//Setup Documentation/00009.jpg",
                    "rel": "4358448152534127081-242ac114-0001-002",
                    "title": "file",
                },
                {
                    "href": "https://agave.designsafe-ci.org/meta/v2/data/3339522405406469655-242ac11a-0001-012",
                    "rel": "3339522405406469655-242ac11a-0001-012",
                    "title": "metadata",
                },
            ],
            "owner": {"href": "https://agave.designsafe-ci.org/profiles/v2/ds_admin"},
            "permissions": {
                "href": "https://agave.designsafe-ci.org/meta/v2/data/7920466498774307306-242ac116-0001-012/pems"
            },
            "self": {
                "href": "https://agave.designsafe-ci.org/meta/v2/data/7920466498774307306-242ac116-0001-012"
            },
        },
        "associationIds": [
            "4354582681967727081-242ac114-0001-002",
            "3849330284117683735-242ac119-0001-012",
            "7091290346386681365-242ac118-0001-012",
            "1052668239654088215-242ac119-0001-012",
            "2799945664009989655-242ac11a-0001-012",
            "4358448152534127081-242ac114-0001-002",
            "3339522405406469655-242ac11a-0001-012",
        ],
        "created": "2020-09-09T14:34:08.437-05:00",
        "internalUsername": None,
        "lastUpdated": "2021-01-07T11:37:15.855-06:00",
        "name": "designsafe.project.event",
        "owner": "ds_admin",
        "schemaId": None,
        "uuid": "7920466498774307306-242ac116-0001-012",
        "value": {
            "analysis": [],
            "description": "Test",
            "eventType": "other",
            "experiments": [
                "3849330284117683735-242ac119-0001-012",
                "7091290346386681365-242ac118-0001-012",
            ],
            "fileTags": [],
            "fileObjs": [],
            "files": [
                "4354582681967727081-242ac114-0001-002",
                "4358448152534127081-242ac114-0001-002",
            ],
            "modelConfigs": ["3339522405406469655-242ac11a-0001-012"],
            "project": ["1052668239654088215-242ac119-0001-012"],
            "sensorLists": ["2799945664009989655-242ac11a-0001-012"],
            "title": "Erosion Reading I-B",
        },
    },
    {
        "_links": {
            "associationIds": [
                {
                    "href": "https://agave.designsafe-ci.org/files/v2/media/system/project-1052668239654088215-242ac119-0001-012//sensor_details.txt",
                    "rel": "2993276852523897321-242ac112-0001-002",
                    "title": "file",
                },
                {
                    "href": "https://agave.designsafe-ci.org/meta/v2/data/1052668239654088215-242ac119-0001-012",
                    "rel": "1052668239654088215-242ac119-0001-012",
                    "title": "metadata",
                },
                {
                    "href": "https://agave.designsafe-ci.org/meta/v2/data/3339522405406469655-242ac11a-0001-012",
                    "rel": "3339522405406469655-242ac11a-0001-012",
                    "title": "metadata",
                },
                {
                    "href": "https://agave.designsafe-ci.org/meta/v2/data/7091290346386681365-242ac118-0001-012",
                    "rel": "7091290346386681365-242ac118-0001-012",
                    "title": "metadata",
                },
                {
                    "href": "https://agave.designsafe-ci.org/files/v2/media/system/project-1052668239654088215-242ac119-0001-012//sensor_settings.py",
                    "rel": "7112348674405494295-242ac113-0001-002",
                    "title": "file",
                },
                {
                    "href": "https://agave.designsafe-ci.org/meta/v2/data/3849330284117683735-242ac119-0001-012",
                    "rel": "3849330284117683735-242ac119-0001-012",
                    "title": "metadata",
                },
            ],
            "owner": {"href": "https://agave.designsafe-ci.org/profiles/v2/ds_admin"},
            "permissions": {
                "href": "https://agave.designsafe-ci.org/meta/v2/data/2799945664009989655-242ac11a-0001-012/pems"
            },
            "self": {
                "href": "https://agave.designsafe-ci.org/meta/v2/data/2799945664009989655-242ac11a-0001-012"
            },
        },
        "associationIds": [
            "2993276852523897321-242ac112-0001-002",
            "1052668239654088215-242ac119-0001-012",
            "3339522405406469655-242ac11a-0001-012",
            "7091290346386681365-242ac118-0001-012",
            "7112348674405494295-242ac113-0001-002",
            "3849330284117683735-242ac119-0001-012",
        ],
        "created": "2019-09-18T14:31:01.700-05:00",
        "internalUsername": None,
        "lastUpdated": "2021-01-06T17:34:07.958-06:00",
        "name": "designsafe.project.sensor_list",
        "owner": "ds_admin",
        "schemaId": None,
        "uuid": "2799945664009989655-242ac11a-0001-012",
        "value": {
            "description": "Test",
            "experiments": [
                "3849330284117683735-242ac119-0001-012",
                "7091290346386681365-242ac118-0001-012",
            ],
            "fileTags": [],
            "fileObjs": [],
            "files": [
                "2993276852523897321-242ac112-0001-002",
                "7112348674405494295-242ac113-0001-002",
            ],
            "modelConfigs": ["3339522405406469655-242ac11a-0001-012"],
            "project": ["1052668239654088215-242ac119-0001-012"],
            "sensorListType": "other",
            "title": "Pressure Sensor I-B",
        },
    },
    {
        "_links": {
            "associationIds": [
                {
                    "href": "https://agave.designsafe-ci.org/meta/v2/data/1052668239654088215-242ac119-0001-012",
                    "rel": "1052668239654088215-242ac119-0001-012",
                    "title": "metadata",
                },
                {
                    "href": "https://agave.designsafe-ci.org/files/v2/media/system/project-1052668239654088215-242ac119-0001-012//urlstocheck.txt",
                    "rel": "7119435370443894295-242ac113-0001-002",
                    "title": "file",
                },
                {
                    "href": "https://agave.designsafe-ci.org/meta/v2/data/7091290346386681365-242ac118-0001-012",
                    "rel": "7091290346386681365-242ac118-0001-012",
                    "title": "metadata",
                },
            ],
            "owner": {"href": "https://agave.designsafe-ci.org/profiles/v2/ds_admin"},
            "permissions": {
                "href": "https://agave.designsafe-ci.org/meta/v2/data/1442706179203994091-242ac118-0001-012/pems"
            },
            "self": {
                "href": "https://agave.designsafe-ci.org/meta/v2/data/1442706179203994091-242ac118-0001-012"
            },
        },
        "associationIds": [
            "1052668239654088215-242ac119-0001-012",
            "7119435370443894295-242ac113-0001-002",
            "7091290346386681365-242ac118-0001-012",
        ],
        "created": "2021-01-04T12:02:58.682-06:00",
        "internalUsername": None,
        "lastUpdated": "2021-01-06T17:33:58.739-06:00",
        "name": "designsafe.project.report",
        "owner": "ds_admin",
        "schemaId": None,
        "uuid": "1442706179203994091-242ac118-0001-012",
        "value": {
            "description": "Test",
            "experiments": ["7091290346386681365-242ac118-0001-012"],
            "fileTags": [],
            "fileObjs": [],
            "files": ["7119435370443894295-242ac113-0001-002"],
            "project": ["1052668239654088215-242ac119-0001-012"],
            "title": "Project Report",
        },
    },
    {
        "_links": {
            "associationIds": [
                {
                    "href": "https://agave.designsafe-ci.org/meta/v2/data/1052668239654088215-242ac119-0001-012",
                    "rel": "1052668239654088215-242ac119-0001-012",
                    "title": "metadata",
                }
            ],
            "owner": {"href": "https://agave.designsafe-ci.org/profiles/v2/ds_admin"},
            "permissions": {
                "href": "https://agave.designsafe-ci.org/meta/v2/data/3200409379355487765-242ac118-0001-012/pems"
            },
            "self": {
                "href": "https://agave.designsafe-ci.org/meta/v2/data/3200409379355487765-242ac118-0001-012"
            },
        },
        "associationIds": ["1052668239654088215-242ac119-0001-012"],
        "created": "2020-12-16T09:10:26.154-06:00",
        "internalUsername": None,
        "lastUpdated": "2020-12-22T12:42:17.061-06:00",
        "name": "designsafe.project.event",
        "owner": "ds_admin",
        "schemaId": None,
        "uuid": "3200409379355487765-242ac118-0001-012",
        "value": {
            "analysis": [],
            "description": "asdf",
            "eventType": "other",
            "experiments": [],
            "fileTags": [],
            "fileObjs": [],
            "files": [],
            "modelConfigs": [],
            "project": ["1052668239654088215-242ac119-0001-012"],
            "sensorLists": [],
            "title": "test2",
        },
    },
    {
        "_links": {
            "associationIds": [
                {
                    "href": "https://agave.designsafe-ci.org/meta/v2/data/1052668239654088215-242ac119-0001-012",
                    "rel": "1052668239654088215-242ac119-0001-012",
                    "title": "metadata",
                }
            ],
            "owner": {"href": "https://agave.designsafe-ci.org/profiles/v2/ds_admin"},
            "permissions": {
                "href": "https://agave.designsafe-ci.org/meta/v2/data/3521587033750367765-242ac118-0001-012/pems"
            },
            "self": {
                "href": "https://agave.designsafe-ci.org/meta/v2/data/3521587033750367765-242ac118-0001-012"
            },
        },
        "associationIds": ["1052668239654088215-242ac119-0001-012"],
        "created": "2020-12-16T09:10:18.676-06:00",
        "internalUsername": None,
        "lastUpdated": "2020-12-22T12:42:06.949-06:00",
        "name": "designsafe.project.event",
        "owner": "ds_admin",
        "schemaId": None,
        "uuid": "3521587033750367765-242ac118-0001-012",
        "value": {
            "analysis": [],
            "description": "asdf",
            "eventType": "other",
            "experiments": [],
            "fileTags": [],
            "fileObjs": [],
            "files": [],
            "modelConfigs": [],
            "project": ["1052668239654088215-242ac119-0001-012"],
            "sensorLists": [],
            "title": "test 1",
        },
    },
    {
        "_links": {
            "associationIds": [
                {
                    "href": "https://agave.designsafe-ci.org/meta/v2/data/1052668239654088215-242ac119-0001-012",
                    "rel": "1052668239654088215-242ac119-0001-012",
                    "title": "metadata",
                }
            ],
            "owner": {"href": "https://agave.designsafe-ci.org/profiles/v2/ds_admin"},
            "permissions": {
                "href": "https://agave.designsafe-ci.org/meta/v2/data/3849330284117683735-242ac119-0001-012/pems"
            },
            "self": {
                "href": "https://agave.designsafe-ci.org/meta/v2/data/3849330284117683735-242ac119-0001-012"
            },
        },
        "associationIds": ["1052668239654088215-242ac119-0001-012"],
        "created": "2019-03-26T15:14:42.536-05:00",
        "internalUsername": None,
        "lastUpdated": "2020-11-12T11:48:00.830-06:00",
        "name": "designsafe.project.experiment",
        "owner": "ds_admin",
        "schemaId": None,
        "uuid": "3849330284117683735-242ac119-0001-012",
        "value": {
            "authors": [
                {"authorship": True, "name": "thbrown", "order": 0},
                {"authorship": True, "name": "keiths", "order": 2},
                {"authorship": True, "name": "jarosenb", "order": 1},
                {"authorship": False, "name": "sgray", "order": 3},
                {"authorship": True, "name": "ojamil", "order": 4},
                {"authorship": False, "name": "sal", "order": 5},
                {"authorship": False, "name": "prjadmin", "order": 6},
                {"authorship": False, "name": "ds_apps", "order": 7},
                {"authorship": False, "name": "fnetsch", "order": 8},
                {
                    "authorship": False,
                    "email": "guest@members.com",
                    "fname": "Guest",
                    "guest": True,
                    "inst": "Guest institution",
                    "lname": "Member",
                    "name": "guestGuestM0",
                    "order": 9,
                },
            ],
            "description": "This experiment tests the structural stability of an upgraded concrete storage tank similar to ones present along the gulf coast. This is a longer sentence. This is a Test",
            "dois": ["10.17603/ds-s9fj-gk73"],
            "equipmentType": "pla",
            "equipmentTypeOther": "None",
            "experimentType": "wave",
            "experimentTypeOther": "",
            "experimentalFacility": "ohhwrl-oregon",
            "experimentalFacilityOther": "None",
            "procedureEnd": "2020-02-19T06:00:00.000Z",
            "procedureStart": "2020-02-19T06:00:00.000Z",
            "referencedData": [],
            "relatedWork": [],
            "project": ["1052668239654088215-242ac119-0001-012"],
            "title": "Soil Erosion Experiment I",
        },
    },
    {
        "_links": {
            "associationIds": [
                {
                    "href": "https://agave.designsafe-ci.org/meta/v2/data/1052668239654088215-242ac119-0001-012",
                    "rel": "1052668239654088215-242ac119-0001-012",
                    "title": "metadata",
                },
                {
                    "href": "https://agave.designsafe-ci.org/files/v2/media/system/project-1052668239654088215-242ac119-0001-012//pressure_readings_sensor1.csv",
                    "rel": "2621891030438777321-242ac112-0001-002",
                    "title": "file",
                },
            ],
            "owner": {"href": "https://agave.designsafe-ci.org/profiles/v2/ds_admin"},
            "permissions": {
                "href": "https://agave.designsafe-ci.org/meta/v2/data/8908537048718372375-242ac11a-0001-012/pems"
            },
            "self": {
                "href": "https://agave.designsafe-ci.org/meta/v2/data/8908537048718372375-242ac11a-0001-012"
            },
        },
        "associationIds": [
            "1052668239654088215-242ac119-0001-012",
            "2621891030438777321-242ac112-0001-002",
        ],
        "created": "2019-10-14T14:55:05.356-05:00",
        "internalUsername": None,
        "lastUpdated": "2020-09-15T14:06:34.352-05:00",
        "name": "designsafe.project.report",
        "owner": "ds_admin",
        "schemaId": None,
        "uuid": "8908537048718372375-242ac11a-0001-012",
        "value": {
            "description": "This report needs a description...",
            "experiments": [],
            "fileTags": [],
            "fileObjs": [],
            "files": ["2621891030438777321-242ac112-0001-002"],
            "project": ["1052668239654088215-242ac119-0001-012"],
            "title": "Findings From Series B",
        },
    },
    {
        "_links": {
            "associationIds": [
                {
                    "href": "https://agave.designsafe-ci.org/meta/v2/data/1052668239654088215-242ac119-0001-012",
                    "rel": "1052668239654088215-242ac119-0001-012",
                    "title": "metadata",
                },
                {
                    "href": "https://agave.designsafe-ci.org/files/v2/media/system/project-1052668239654088215-242ac119-0001-012//objekt.pyc",
                    "rel": "7120337313576054295-242ac113-0001-002",
                    "title": "file",
                },
                {
                    "href": "https://agave.designsafe-ci.org/meta/v2/data/3849330284117683735-242ac119-0001-012",
                    "rel": "3849330284117683735-242ac119-0001-012",
                    "title": "metadata",
                },
            ],
            "owner": {"href": "https://agave.designsafe-ci.org/profiles/v2/ds_admin"},
            "permissions": {
                "href": "https://agave.designsafe-ci.org/meta/v2/data/7396616410269609495-242ac119-0001-012/pems"
            },
            "self": {
                "href": "https://agave.designsafe-ci.org/meta/v2/data/7396616410269609495-242ac119-0001-012"
            },
        },
        "associationIds": [
            "1052668239654088215-242ac119-0001-012",
            "7120337313576054295-242ac113-0001-002",
            "3849330284117683735-242ac119-0001-012",
        ],
        "created": "2019-04-03T07:47:11.385-05:00",
        "internalUsername": None,
        "lastUpdated": "2020-09-15T14:06:30.764-05:00",
        "name": "designsafe.project.report",
        "owner": "ds_admin",
        "schemaId": None,
        "uuid": "7396616410269609495-242ac119-0001-012",
        "value": {
            "description": "This is where the description goes. It is useful for a number of reasons, but you should always remember to speyul check your work.",
            "experiments": ["3849330284117683735-242ac119-0001-012"],
            "fileTags": [],
            "fileObjs": [],
            "files": ["7120337313576054295-242ac113-0001-002"],
            "project": ["1052668239654088215-242ac119-0001-012"],
            "title": "Findings From Series A",
        },
    },
    {
        "_links": {
            "associationIds": [
                {
                    "href": "https://agave.designsafe-ci.org/files/v2/media/system/project-1052668239654088215-242ac119-0001-012//objekt.py",
                    "rel": "7120165514884214295-242ac113-0001-002",
                    "title": "file",
                },
                {
                    "href": "https://agave.designsafe-ci.org/meta/v2/data/1052668239654088215-242ac119-0001-012",
                    "rel": "1052668239654088215-242ac119-0001-012",
                    "title": "metadata",
                },
                {
                    "href": "https://agave.designsafe-ci.org/meta/v2/data/3849330284117683735-242ac119-0001-012",
                    "rel": "3849330284117683735-242ac119-0001-012",
                    "title": "metadata",
                },
            ],
            "owner": {"href": "https://agave.designsafe-ci.org/profiles/v2/ds_admin"},
            "permissions": {
                "href": "https://agave.designsafe-ci.org/meta/v2/data/1805800103257444841-242ac119-0001-012/pems"
            },
            "self": {
                "href": "https://agave.designsafe-ci.org/meta/v2/data/1805800103257444841-242ac119-0001-012"
            },
        },
        "associationIds": [
            "7120165514884214295-242ac113-0001-002",
            "1052668239654088215-242ac119-0001-012",
            "3849330284117683735-242ac119-0001-012",
        ],
        "created": "2019-04-08T08:56:24.826-05:00",
        "internalUsername": None,
        "lastUpdated": "2020-09-15T14:06:27.767-05:00",
        "name": "designsafe.project.analysis",
        "owner": "ds_admin",
        "schemaId": None,
        "uuid": "1805800103257444841-242ac119-0001-012",
        "value": {
            "analysisData": "",
            "analysisType": "other",
            "application": "",
            "description": "This is all the data we collected from Experiment I-A",
            "experiments": ["3849330284117683735-242ac119-0001-012"],
            "fileTags": [
                {
                    "fileUuid": "1873922475840377321-242ac112-0001-002",
                    "tagName": "Visualization",
                }
            ],
            "fileObjs": [],
            "files": ["7120165514884214295-242ac113-0001-002"],
            "project": ["1052668239654088215-242ac119-0001-012"],
            "refs": [
                {
                    "reference": "Data References 1",
                    "referencedoi": "http://www.google.com",
                },
                {
                    "reference": "Data References 2",
                    "referencedoi": "http://www.data.gov",
                },
                {
                    "reference": "Data References 3",
                    "referencedoi": "https://www.precision-camera.com",
                },
            ],
            "script": [],
            "title": "Wave Impact on Reinforced Structures",
        },
    },
    {
        "_links": {
            "associationIds": [
                {
                    "href": "https://agave.designsafe-ci.org/meta/v2/data/1052668239654088215-242ac119-0001-012",
                    "rel": "1052668239654088215-242ac119-0001-012",
                    "title": "metadata",
                },
                {
                    "href": "https://agave.designsafe-ci.org/files/v2/media/system/project-1052668239654088215-242ac119-0001-012//Trash/helicoptor.mp4",
                    "rel": "7137021306710659561-242ac114-0001-002",
                    "title": "file",
                },
                {
                    "href": "https://agave.designsafe-ci.org/files/v2/media/system/project-1052668239654088215-242ac119-0001-012//Globus Folder",
                    "rel": "6923074490394022377-242ac114-0001-002",
                    "title": "file",
                },
                {
                    "href": "https://agave.designsafe-ci.org/meta/v2/data/3849330284117683735-242ac119-0001-012",
                    "rel": "3849330284117683735-242ac119-0001-012",
                    "title": "metadata",
                },
                {
                    "href": "https://agave.designsafe-ci.org/files/v2/media/system/project-1052668239654088215-242ac119-0001-012//lotsotestfiles/test98.txt",
                    "rel": "303745108476629482-242ac112-0001-002",
                    "title": "file",
                },
            ],
            "owner": {"href": "https://agave.designsafe-ci.org/profiles/v2/ds_admin"},
            "permissions": {
                "href": "https://agave.designsafe-ci.org/meta/v2/data/7206731579572621801-242ac119-0001-012/pems"
            },
            "self": {
                "href": "https://agave.designsafe-ci.org/meta/v2/data/7206731579572621801-242ac119-0001-012"
            },
        },
        "associationIds": [
            "1052668239654088215-242ac119-0001-012",
            "7137021306710659561-242ac114-0001-002",
            "6923074490394022377-242ac114-0001-002",
            "3849330284117683735-242ac119-0001-012",
            "303745108476629482-242ac112-0001-002",
        ],
        "created": "2019-03-26T15:18:59.955-05:00",
        "internalUsername": None,
        "lastUpdated": "2020-09-15T14:05:31.456-05:00",
        "name": "designsafe.project.model_config",
        "owner": "ds_admin",
        "schemaId": None,
        "uuid": "7206731579572621801-242ac119-0001-012",
        "value": {
            "description": "We are testing the stability of a structure reinforced with concrete pillars. Several waves of different sizes were tested against the structure. This is the first test for using a Large Wave Flume.",
            "experiments": ["3849330284117683735-242ac119-0001-012"],
            "fileTags": [
                {
                    "fileUuid": "4352735846030447081-242ac114-0001-002",
                    "path": "/Setup Documentation/00005.jpg",
                    "tagName": "Image",
                },
                {
                    "fileUuid": "4360552686509167081-242ac114-0001-002",
                    "path": "/Setup Documentation/00006.jpg",
                    "tagName": "Superconductive Thermal Meatloaf",
                },
                {
                    "fileUuid": "303745108476629482-242ac112-0001-002",
                    "path": "/lotsotestfiles/test98.txt",
                    "tagName": "Image",
                },
                {
                    "fileUuid": "",
                    "path": "/Setup Documentation/00005.jpg",
                    "tagName": "Flexible Shear Beam Container",
                },
                {
                    "fileUuid": "2041257155850211817-242ac113-0001-002",
                    "path": "/Setup Documentation/Dir2/test",
                    "tagName": "Clay",
                },
                {
                    "fileUuid": "1873922475840377321-242ac112-0001-002",
                    "path": "/00001.jpg",
                    "tagName": "Model Drawing",
                },
            ],
            "fileObjs": [],
            "files": [
                "7137021306710659561-242ac114-0001-002",
                "303745108476629482-242ac112-0001-002",
                "6923074490394022377-242ac114-0001-002",
            ],
            "project": ["1052668239654088215-242ac119-0001-012"],
            "title": "Wave I-A",
        },
    },
    {
        "_links": {
            "associationIds": [
                {
                    "href": "https://agave.designsafe-ci.org/meta/v2/data/1052668239654088215-242ac119-0001-012",
                    "rel": "1052668239654088215-242ac119-0001-012",
                    "title": "metadata",
                },
                {
                    "href": "https://agave.designsafe-ci.org/files/v2/media/system/project-1052668239654088215-242ac119-0001-012//pressure_readings_sensor4test.csv",
                    "rel": "2080682201469817321-242ac112-0001-002",
                    "title": "file",
                },
                {
                    "href": "https://agave.designsafe-ci.org/meta/v2/data/3849330284117683735-242ac119-0001-012",
                    "rel": "3849330284117683735-242ac119-0001-012",
                    "title": "metadata",
                },
                {
                    "href": "https://agave.designsafe-ci.org/meta/v2/data/7206731579572621801-242ac119-0001-012",
                    "rel": "7206731579572621801-242ac119-0001-012",
                    "title": "metadata",
                },
                {
                    "href": "https://agave.designsafe-ci.org/files/v2/media/system/project-1052668239654088215-242ac119-0001-012//sensor_arrangment_I-A.jpg",
                    "rel": "1874523771261817321-242ac112-0001-002",
                    "title": "file",
                },
            ],
            "owner": {"href": "https://agave.designsafe-ci.org/profiles/v2/ds_admin"},
            "permissions": {
                "href": "https://agave.designsafe-ci.org/meta/v2/data/8057478701564301801-242ac119-0001-012/pems"
            },
            "self": {
                "href": "https://agave.designsafe-ci.org/meta/v2/data/8057478701564301801-242ac119-0001-012"
            },
        },
        "associationIds": [
            "1052668239654088215-242ac119-0001-012",
            "2080682201469817321-242ac112-0001-002",
            "3849330284117683735-242ac119-0001-012",
            "7206731579572621801-242ac119-0001-012",
            "1874523771261817321-242ac112-0001-002",
        ],
        "created": "2019-03-26T15:19:19.763-05:00",
        "internalUsername": None,
        "lastUpdated": "2020-09-15T14:04:55.936-05:00",
        "name": "designsafe.project.sensor_list",
        "owner": "ds_admin",
        "schemaId": None,
        "uuid": "8057478701564301801-242ac119-0001-012",
        "value": {
            "description": "We surrounded our test structure with four sensors to take pressure readings. TEST",
            "experiments": ["3849330284117683735-242ac119-0001-012"],
            "fileTags": [],
            "fileObjs": [],
            "files": [
                "1874523771261817321-242ac112-0001-002",
                "2080682201469817321-242ac112-0001-002",
            ],
            "modelConfigs": ["7206731579572621801-242ac119-0001-012"],
            "project": ["1052668239654088215-242ac119-0001-012"],
            "sensorListType": "other",
            "title": "Pressure Sensor I-A",
        },
    },
]

exp_entity_json = [
    {
        "_links": {
            "associationIds": [
                {
                    "href": "https://agave.designsafe-ci.org/files/v2/media/system/project-1052668239654088215-242ac119-0001-012//lotsotestfiles",
                    "rel": "1755305162898796054-242ac112-0001-002",
                    "title": "file",
                },
                {
                    "href": "https://agave.designsafe-ci.org/files/v2/media/system/project-1052668239654088215-242ac119-0001-012//00002.jpg",
                    "rel": "1874008375186297321-242ac112-0001-002",
                    "title": "file",
                },
                {
                    "href": "https://agave.designsafe-ci.org/meta/v2/data/7091290346386681365-242ac118-0001-012",
                    "rel": "7091290346386681365-242ac118-0001-012",
                    "title": "metadata",
                },
                {
                    "href": "https://agave.designsafe-ci.org/meta/v2/data/3849330284117683735-242ac119-0001-012",
                    "rel": "3849330284117683735-242ac119-0001-012",
                    "title": "metadata",
                },
                {
                    "href": "https://agave.designsafe-ci.org/meta/v2/data/1052668239654088215-242ac119-0001-012",
                    "rel": "1052668239654088215-242ac119-0001-012",
                    "title": "metadata",
                },
            ],
            "owner": {"href": "https://agave.designsafe-ci.org/profiles/v2/ds_admin"},
            "permissions": {
                "href": "https://agave.designsafe-ci.org/meta/v2/data/3339522405406469655-242ac11a-0001-012/pems"
            },
            "self": {
                "href": "https://agave.designsafe-ci.org/meta/v2/data/3339522405406469655-242ac11a-0001-012"
            },
        },
        "_relatedFields": ["project", "experiments", "files"],
        "_ui": {"orders": [], "uuid": "3339522405406469655-242ac11a-0001-012"},
        "associationIds": [
            "1755305162898796054-242ac112-0001-002",
            "1874008375186297321-242ac112-0001-002",
            "7091290346386681365-242ac118-0001-012",
            "3849330284117683735-242ac119-0001-012",
            "1052668239654088215-242ac119-0001-012",
        ],
        "created": "2019-09-18T14:30:49.137-05:00",
        "internalUsername": None,
        "lastUpdated": "2021-10-06T15:43:45.230-05:00",
        "name": "designsafe.project.model_config",
        "owner": "ds_admin",
        "schemaId": None,
        "uuid": "3339522405406469655-242ac11a-0001-012",
        "value": {
            "description": "Test",
            "experiments": [
                "7091290346386681365-242ac118-0001-012",
                "3849330284117683735-242ac119-0001-012",
            ],
            "fileTags": [],
            "fileObjs": [],
            "files": [
                "1755305162898796054-242ac112-0001-002",
                "1874008375186297321-242ac112-0001-002",
            ],
            "project": ["1052668239654088215-242ac119-0001-012"],
            "title": "Wave I-B",
        },
    },
    {
        "_links": {
            "associationIds": [
                {
                    "href": "https://agave.designsafe-ci.org/files/v2/media/system/project-1052668239654088215-242ac119-0001-012//Setup Documentation/00007.jpg",
                    "rel": "4352778795703407081-242ac114-0001-002",
                    "title": "file",
                },
                {
                    "href": "https://agave.designsafe-ci.org/meta/v2/data/7206731579572621801-242ac119-0001-012",
                    "rel": "7206731579572621801-242ac119-0001-012",
                    "title": "metadata",
                },
                {
                    "href": "https://agave.designsafe-ci.org/meta/v2/data/8057478701564301801-242ac119-0001-012",
                    "rel": "8057478701564301801-242ac119-0001-012",
                    "title": "metadata",
                },
                {
                    "href": "https://agave.designsafe-ci.org/files/v2/media/system/project-1052668239654088215-242ac119-0001-012//Setup Documentation/00005.jpg",
                    "rel": "4352735846030447081-242ac114-0001-002",
                    "title": "file",
                },
                {
                    "href": "https://agave.designsafe-ci.org/files/v2/media/system/project-1052668239654088215-242ac119-0001-012//Setup Documentation/00006.jpg",
                    "rel": "4360552686509167081-242ac114-0001-002",
                    "title": "file",
                },
                {
                    "href": "https://agave.designsafe-ci.org/meta/v2/data/3849330284117683735-242ac119-0001-012",
                    "rel": "3849330284117683735-242ac119-0001-012",
                    "title": "metadata",
                },
                {
                    "href": "https://agave.designsafe-ci.org/files/v2/media/system/project-1052668239654088215-242ac119-0001-012//00004.jpg",
                    "rel": "1871173696770937321-242ac112-0001-002",
                    "title": "file",
                },
                {
                    "href": "https://agave.designsafe-ci.org/files/v2/media/system/project-1052668239654088215-242ac119-0001-012//00003.jpg",
                    "rel": "1873879526167417321-242ac112-0001-002",
                    "title": "file",
                },
                {
                    "href": "https://agave.designsafe-ci.org/meta/v2/data/1052668239654088215-242ac119-0001-012",
                    "rel": "1052668239654088215-242ac119-0001-012",
                    "title": "metadata",
                },
            ],
            "owner": {"href": "https://agave.designsafe-ci.org/profiles/v2/ds_admin"},
            "permissions": {
                "href": "https://agave.designsafe-ci.org/meta/v2/data/9123280811976289815-242ac119-0001-012/pems"
            },
            "self": {
                "href": "https://agave.designsafe-ci.org/meta/v2/data/9123280811976289815-242ac119-0001-012"
            },
        },
        "_relatedFields": [
            "analysis",
            "project",
            "experiments",
            "model_configs",
            "sensor_lists",
            "files",
        ],
        "_ui": {
            "orders": [{"parent": "8057478701564301801-242ac119-0001-012", "value": 0}],
            "uuid": "9123280811976289815-242ac119-0001-012",
        },
        "associationIds": [
            "4352778795703407081-242ac114-0001-002",
            "7206731579572621801-242ac119-0001-012",
            "8057478701564301801-242ac119-0001-012",
            "4352735846030447081-242ac114-0001-002",
            "4360552686509167081-242ac114-0001-002",
            "3849330284117683735-242ac119-0001-012",
            "1871173696770937321-242ac112-0001-002",
            "1873879526167417321-242ac112-0001-002",
            "1052668239654088215-242ac119-0001-012",
        ],
        "created": "2019-03-26T15:19:49.239-05:00",
        "internalUsername": None,
        "lastUpdated": "2021-10-06T15:32:46.257-05:00",
        "name": "designsafe.project.event",
        "owner": "ds_admin",
        "schemaId": None,
        "uuid": "9123280811976289815-242ac119-0001-012",
        "value": {
            "analysis": [],
            "description": "The results from our pressure sensors showed weaknesses in the tested structure.",
            "eventType": "other",
            "experiments": ["3849330284117683735-242ac119-0001-012"],
            "fileObjs": [],
            "fileTags": [
                {
                    "fileUuid": "2621891030438777321-242ac112-0001-002",
                    "tagName": "Aerodynamic roughness",
                },
                {
                    "fileUuid": "2621891030438777321-242ac112-0001-002",
                    "tagName": "Image",
                },
                {
                    "fileUuid": "2621891030438777321-242ac112-0001-002",
                    "tagName": "T-bar Test",
                },
                {
                    "fileUuid": "2622921826884784617-242ac112-0001-002",
                    "tagName": "Centrifuge Speed",
                },
                {
                    "fileUuid": "2622921826884784617-242ac112-0001-002",
                    "tagName": "Load",
                },
                {
                    "fileUuid": "2622921822589817321-242ac112-0001-002",
                    "path": "/pressure_readings_sensor3.csv",
                    "tagName": "Image",
                },
                {
                    "fileUuid": "1871173696770937321-242ac112-0001-002",
                    "path": "/00004.jpg",
                    "tagName": "Video",
                },
            ],
            "files": [
                "4352778795703407081-242ac114-0001-002",
                "4360552686509167081-242ac114-0001-002",
                "4352735846030447081-242ac114-0001-002",
                "1871173696770937321-242ac112-0001-002",
                "1873879526167417321-242ac112-0001-002",
            ],
            "modelConfigs": ["7206731579572621801-242ac119-0001-012"],
            "project": ["1052668239654088215-242ac119-0001-012"],
            "sensorLists": ["8057478701564301801-242ac119-0001-012"],
            "title": "Erosion Reading I-A",
        },
    },
    {
        "_links": {
            "associationIds": [
                {
                    "href": "https://agave.designsafe-ci.org/meta/v2/data/1052668239654088215-242ac119-0001-012",
                    "rel": "1052668239654088215-242ac119-0001-012",
                    "title": "metadata",
                }
            ],
            "owner": {"href": "https://agave.designsafe-ci.org/profiles/v2/ds_admin"},
            "permissions": {
                "href": "https://agave.designsafe-ci.org/meta/v2/data/895971340588346900-242ac117-0001-012/pems"
            },
            "self": {
                "href": "https://agave.designsafe-ci.org/meta/v2/data/895971340588346900-242ac117-0001-012"
            },
        },
        "_relatedFields": ["project", "experiments", "files"],
        "_ui": {"orders": [], "uuid": "895971340588346900-242ac117-0001-012"},
        "associationIds": ["1052668239654088215-242ac119-0001-012"],
        "created": "2021-09-11T17:16:46.141-05:00",
        "internalUsername": None,
        "lastUpdated": "2021-09-11T17:16:46.141-05:00",
        "name": "designsafe.project.report",
        "owner": "ds_admin",
        "schemaId": None,
        "uuid": "895971340588346900-242ac117-0001-012",
        "value": {
            "description": "Hello WOrld",
            "experiments": [],
            "fileTags": [],
            "fileObjs": [],
            "files": [],
            "project": ["1052668239654088215-242ac119-0001-012"],
            "title": "A new Unassociated Report",
        },
    },
    {
        "_links": {
            "associationIds": [
                {
                    "href": "https://agave.designsafe-ci.org/meta/v2/data/1052668239654088215-242ac119-0001-012",
                    "rel": "1052668239654088215-242ac119-0001-012",
                    "title": "metadata",
                },
                {
                    "href": "https://agave.designsafe-ci.org/files/v2/media/system/project-1052668239654088215-242ac119-0001-012//objects2.pyc",
                    "rel": "7120165510589246999-242ac113-0001-002",
                    "title": "file",
                },
                {
                    "href": "https://agave.designsafe-ci.org/meta/v2/data/7091290346386681365-242ac118-0001-012",
                    "rel": "7091290346386681365-242ac118-0001-012",
                    "title": "metadata",
                },
            ],
            "owner": {"href": "https://agave.designsafe-ci.org/profiles/v2/ds_admin"},
            "permissions": {
                "href": "https://agave.designsafe-ci.org/meta/v2/data/7342634922269732375-242ac11a-0001-012/pems"
            },
            "self": {
                "href": "https://agave.designsafe-ci.org/meta/v2/data/7342634922269732375-242ac11a-0001-012"
            },
        },
        "_relatedFields": ["script", "project", "experiments", "files"],
        "_ui": {
            "orders": [{"parent": "7091290346386681365-242ac118-0001-012", "value": 1}],
            "uuid": "7342634922269732375-242ac11a-0001-012",
        },
        "associationIds": [
            "1052668239654088215-242ac119-0001-012",
            "7120165510589246999-242ac113-0001-002",
            "7091290346386681365-242ac118-0001-012",
        ],
        "created": "2019-10-14T14:55:41.815-05:00",
        "internalUsername": None,
        "lastUpdated": "2021-09-10T13:21:07.732-05:00",
        "name": "designsafe.project.analysis",
        "owner": "ds_admin",
        "schemaId": None,
        "uuid": "7342634922269732375-242ac11a-0001-012",
        "value": {
            "analysisData": "",
            "analysisType": "other",
            "application": "",
            "description": "",
            "experiments": ["7091290346386681365-242ac118-0001-012"],
            "fileTags": [],
            "fileObjs": [],
            "files": ["7120165510589246999-242ac113-0001-002"],
            "project": ["1052668239654088215-242ac119-0001-012"],
            "refs": [None],
            "script": [],
            "title": "Tsunami Impact on Reinforced Structures",
        },
    },
    {
        "_links": {
            "associationIds": [
                {
                    "href": "https://agave.designsafe-ci.org/meta/v2/data/1052668239654088215-242ac119-0001-012",
                    "rel": "1052668239654088215-242ac119-0001-012",
                    "title": "metadata",
                }
            ],
            "owner": {"href": "https://agave.designsafe-ci.org/profiles/v2/ds_admin"},
            "permissions": {
                "href": "https://agave.designsafe-ci.org/meta/v2/data/7454266551006129685-242ac117-0001-012/pems"
            },
            "self": {
                "href": "https://agave.designsafe-ci.org/meta/v2/data/7454266551006129685-242ac117-0001-012"
            },
        },
        "_relatedFields": ["project"],
        "_ui": {"orders": [], "uuid": "7454266551006129685-242ac117-0001-012"},
        "associationIds": ["1052668239654088215-242ac119-0001-012"],
        "created": "2021-08-05T16:32:12.305-05:00",
        "internalUsername": None,
        "lastUpdated": "2021-08-05T16:45:45.136-05:00",
        "name": "designsafe.project.experiment",
        "owner": "ds_admin",
        "schemaId": None,
        "uuid": "7454266551006129685-242ac117-0001-012",
        "value": {
            "authors": [
                {"authorship": True, "name": "thbrown", "order": 0},
                {"authorship": False, "name": "sterry1", "order": 1},
                {"authorship": True, "name": "sgray", "order": 2},
                {"authorship": False, "name": "jarosenb", "order": 3},
                {"authorship": True, "name": "keiths", "order": 4},
                {"authorship": False, "name": "ojamil", "order": 5},
                {"authorship": False, "name": "sal", "order": 6},
                {"authorship": False, "name": "fnetsch", "order": 7},
                {
                    "authorship": False,
                    "email": "guest@members.com",
                    "fname": "Guest",
                    "guest": True,
                    "inst": "Guest institution",
                    "lname": "Member",
                    "name": "guestGuestM0",
                    "order": 8,
                },
            ],
            "description": "This is a real Description of this entity...",
            "dois": [],
            "equipmentType": "t-rex",
            "equipmentTypeOther": "None",
            "experimentType": "mobile_shaker",
            "experimentTypeOther": "",
            "experimentalFacility": "eqss-utaustin",
            "experimentalFacilityOther": "None",
            "procedureEnd": "2021-08-05T05:00:00.000Z",
            "procedureStart": "2021-08-05T05:00:00.000Z",
            "referencedData": [],
            "relatedWork": [],
            "project": ["1052668239654088215-242ac119-0001-012"],
            "title": "Permissions",
        },
    },
    {
        "_links": {
            "associationIds": [
                {
                    "href": "https://agave.designsafe-ci.org/meta/v2/data/1052668239654088215-242ac119-0001-012",
                    "rel": "1052668239654088215-242ac119-0001-012",
                    "title": "metadata",
                }
            ],
            "owner": {"href": "https://agave.designsafe-ci.org/profiles/v2/ds_admin"},
            "permissions": {
                "href": "https://agave.designsafe-ci.org/meta/v2/data/7091290346386681365-242ac118-0001-012/pems"
            },
            "self": {
                "href": "https://agave.designsafe-ci.org/meta/v2/data/7091290346386681365-242ac118-0001-012"
            },
        },
        "_relatedFields": ["project"],
        "_ui": {"orders": [], "uuid": "7091290346386681365-242ac118-0001-012"},
        "associationIds": ["1052668239654088215-242ac119-0001-012"],
        "created": "2021-01-06T17:33:44.015-06:00",
        "internalUsername": None,
        "lastUpdated": "2021-08-05T16:16:09.244-05:00",
        "name": "designsafe.project.experiment",
        "owner": "ds_admin",
        "schemaId": None,
        "uuid": "7091290346386681365-242ac118-0001-012",
        "value": {
            "authors": [
                {"authorship": False, "name": "thbrown", "order": 0},
                {"authorship": False, "name": "sterry1", "order": 1},
                {"authorship": False, "name": "sgray", "order": 2},
                {"authorship": False, "name": "jarosenb", "order": 3},
                {"authorship": True, "name": "keiths", "order": 4},
                {"authorship": False, "name": "ojamil", "order": 5},
                {"authorship": True, "name": "sal", "order": 6},
                {"authorship": False, "name": "fnetsch", "order": 7},
                {
                    "authorship": False,
                    "email": "guest@members.com",
                    "fname": "Guest",
                    "guest": True,
                    "inst": "Guest institution",
                    "lname": "Member",
                    "name": "guestGuestM0",
                    "order": 8,
                },
            ],
            "description": "This should be real",
            "dois": [],
            "equipmentType": "9-m_radius_dynamic_geotechnical_centrifuge",
            "equipmentTypeOther": "None",
            "experimentType": "centrifuge",
            "experimentTypeOther": "",
            "experimentalFacility": "cgm-ucdavis",
            "experimentalFacilityOther": "None",
            "procedureEnd": "2021-01-21T06:00:00.000Z",
            "procedureStart": "2021-01-06T06:00:00.000Z",
            "referencedData": [],
            "relatedWork": [],
            "project": ["1052668239654088215-242ac119-0001-012"],
            "title": "Test",
        },
    },
    {
        "_links": {
            "associationIds": [
                {
                    "href": "https://agave.designsafe-ci.org/meta/v2/data/1052668239654088215-242ac119-0001-012",
                    "rel": "1052668239654088215-242ac119-0001-012",
                    "title": "metadata",
                }
            ],
            "owner": {"href": "https://agave.designsafe-ci.org/profiles/v2/ds_admin"},
            "permissions": {
                "href": "https://agave.designsafe-ci.org/meta/v2/data/3750505007994105365-242ac117-0001-012/pems"
            },
            "self": {
                "href": "https://agave.designsafe-ci.org/meta/v2/data/3750505007994105365-242ac117-0001-012"
            },
        },
        "_relatedFields": ["project", "experiments", "model_configs", "files"],
        "_ui": {"orders": [], "uuid": "3750505007994105365-242ac117-0001-012"},
        "associationIds": ["1052668239654088215-242ac119-0001-012"],
        "created": "2021-08-05T16:05:00.553-05:00",
        "internalUsername": None,
        "lastUpdated": "2021-08-05T16:13:42.418-05:00",
        "name": "designsafe.project.sensor_list",
        "owner": "ds_admin",
        "schemaId": None,
        "uuid": "3750505007994105365-242ac117-0001-012",
        "value": {
            "description": "Truck",
            "experiments": [],
            "fileTags": [],
            "fileObjs": [],
            "files": [],
            "modelConfigs": [],
            "project": ["1052668239654088215-242ac119-0001-012"],
            "sensorListType": "other",
            "title": "Taco Bell",
        },
    },
    {
        "_links": {
            "associationIds": [
                {
                    "href": "https://agave.designsafe-ci.org/files/v2/media/system/project-1052668239654088215-242ac119-0001-012//Setup Documentation/00008.jpg",
                    "rel": "4354582681967727081-242ac114-0001-002",
                    "title": "file",
                },
                {
                    "href": "https://agave.designsafe-ci.org/meta/v2/data/3849330284117683735-242ac119-0001-012",
                    "rel": "3849330284117683735-242ac119-0001-012",
                    "title": "metadata",
                },
                {
                    "href": "https://agave.designsafe-ci.org/meta/v2/data/7091290346386681365-242ac118-0001-012",
                    "rel": "7091290346386681365-242ac118-0001-012",
                    "title": "metadata",
                },
                {
                    "href": "https://agave.designsafe-ci.org/meta/v2/data/1052668239654088215-242ac119-0001-012",
                    "rel": "1052668239654088215-242ac119-0001-012",
                    "title": "metadata",
                },
                {
                    "href": "https://agave.designsafe-ci.org/meta/v2/data/2799945664009989655-242ac11a-0001-012",
                    "rel": "2799945664009989655-242ac11a-0001-012",
                    "title": "metadata",
                },
                {
                    "href": "https://agave.designsafe-ci.org/files/v2/media/system/project-1052668239654088215-242ac119-0001-012//Setup Documentation/00009.jpg",
                    "rel": "4358448152534127081-242ac114-0001-002",
                    "title": "file",
                },
                {
                    "href": "https://agave.designsafe-ci.org/meta/v2/data/3339522405406469655-242ac11a-0001-012",
                    "rel": "3339522405406469655-242ac11a-0001-012",
                    "title": "metadata",
                },
            ],
            "owner": {"href": "https://agave.designsafe-ci.org/profiles/v2/ds_admin"},
            "permissions": {
                "href": "https://agave.designsafe-ci.org/meta/v2/data/7920466498774307306-242ac116-0001-012/pems"
            },
            "self": {
                "href": "https://agave.designsafe-ci.org/meta/v2/data/7920466498774307306-242ac116-0001-012"
            },
        },
        "_relatedFields": [
            "analysis",
            "project",
            "experiments",
            "model_configs",
            "sensor_lists",
            "files",
        ],
        "_ui": {"orders": [], "uuid": "7920466498774307306-242ac116-0001-012"},
        "associationIds": [
            "4354582681967727081-242ac114-0001-002",
            "3849330284117683735-242ac119-0001-012",
            "7091290346386681365-242ac118-0001-012",
            "1052668239654088215-242ac119-0001-012",
            "2799945664009989655-242ac11a-0001-012",
            "4358448152534127081-242ac114-0001-002",
            "3339522405406469655-242ac11a-0001-012",
        ],
        "created": "2020-09-09T14:34:08.437-05:00",
        "internalUsername": None,
        "lastUpdated": "2021-01-07T11:37:15.855-06:00",
        "name": "designsafe.project.event",
        "owner": "ds_admin",
        "schemaId": None,
        "uuid": "7920466498774307306-242ac116-0001-012",
        "value": {
            "analysis": [],
            "description": "Test",
            "eventType": "other",
            "experiments": [
                "3849330284117683735-242ac119-0001-012",
                "7091290346386681365-242ac118-0001-012",
            ],
            "fileTags": [],
            "fileObjs": [],
            "files": [
                "4354582681967727081-242ac114-0001-002",
                "4358448152534127081-242ac114-0001-002",
            ],
            "modelConfigs": ["3339522405406469655-242ac11a-0001-012"],
            "project": ["1052668239654088215-242ac119-0001-012"],
            "sensorLists": ["2799945664009989655-242ac11a-0001-012"],
            "title": "Erosion Reading I-B",
        },
    },
    {
        "_links": {
            "associationIds": [
                {
                    "href": "https://agave.designsafe-ci.org/files/v2/media/system/project-1052668239654088215-242ac119-0001-012//sensor_details.txt",
                    "rel": "2993276852523897321-242ac112-0001-002",
                    "title": "file",
                },
                {
                    "href": "https://agave.designsafe-ci.org/meta/v2/data/1052668239654088215-242ac119-0001-012",
                    "rel": "1052668239654088215-242ac119-0001-012",
                    "title": "metadata",
                },
                {
                    "href": "https://agave.designsafe-ci.org/meta/v2/data/3339522405406469655-242ac11a-0001-012",
                    "rel": "3339522405406469655-242ac11a-0001-012",
                    "title": "metadata",
                },
                {
                    "href": "https://agave.designsafe-ci.org/meta/v2/data/7091290346386681365-242ac118-0001-012",
                    "rel": "7091290346386681365-242ac118-0001-012",
                    "title": "metadata",
                },
                {
                    "href": "https://agave.designsafe-ci.org/files/v2/media/system/project-1052668239654088215-242ac119-0001-012//sensor_settings.py",
                    "rel": "7112348674405494295-242ac113-0001-002",
                    "title": "file",
                },
                {
                    "href": "https://agave.designsafe-ci.org/meta/v2/data/3849330284117683735-242ac119-0001-012",
                    "rel": "3849330284117683735-242ac119-0001-012",
                    "title": "metadata",
                },
            ],
            "owner": {"href": "https://agave.designsafe-ci.org/profiles/v2/ds_admin"},
            "permissions": {
                "href": "https://agave.designsafe-ci.org/meta/v2/data/2799945664009989655-242ac11a-0001-012/pems"
            },
            "self": {
                "href": "https://agave.designsafe-ci.org/meta/v2/data/2799945664009989655-242ac11a-0001-012"
            },
        },
        "_relatedFields": ["project", "experiments", "model_configs", "files"],
        "_ui": {"orders": [], "uuid": "2799945664009989655-242ac11a-0001-012"},
        "associationIds": [
            "2993276852523897321-242ac112-0001-002",
            "1052668239654088215-242ac119-0001-012",
            "3339522405406469655-242ac11a-0001-012",
            "7091290346386681365-242ac118-0001-012",
            "7112348674405494295-242ac113-0001-002",
            "3849330284117683735-242ac119-0001-012",
        ],
        "created": "2019-09-18T14:31:01.700-05:00",
        "internalUsername": None,
        "lastUpdated": "2021-01-06T17:34:07.958-06:00",
        "name": "designsafe.project.sensor_list",
        "owner": "ds_admin",
        "schemaId": None,
        "uuid": "2799945664009989655-242ac11a-0001-012",
        "value": {
            "description": "Test",
            "experiments": [
                "3849330284117683735-242ac119-0001-012",
                "7091290346386681365-242ac118-0001-012",
            ],
            "fileTags": [],
            "fileObjs": [],
            "files": [
                "2993276852523897321-242ac112-0001-002",
                "7112348674405494295-242ac113-0001-002",
            ],
            "modelConfigs": ["3339522405406469655-242ac11a-0001-012"],
            "project": ["1052668239654088215-242ac119-0001-012"],
            "sensorListType": "other",
            "title": "Pressure Sensor I-B",
        },
    },
    {
        "_links": {
            "associationIds": [
                {
                    "href": "https://agave.designsafe-ci.org/meta/v2/data/1052668239654088215-242ac119-0001-012",
                    "rel": "1052668239654088215-242ac119-0001-012",
                    "title": "metadata",
                },
                {
                    "href": "https://agave.designsafe-ci.org/files/v2/media/system/project-1052668239654088215-242ac119-0001-012//urlstocheck.txt",
                    "rel": "7119435370443894295-242ac113-0001-002",
                    "title": "file",
                },
                {
                    "href": "https://agave.designsafe-ci.org/meta/v2/data/7091290346386681365-242ac118-0001-012",
                    "rel": "7091290346386681365-242ac118-0001-012",
                    "title": "metadata",
                },
            ],
            "owner": {"href": "https://agave.designsafe-ci.org/profiles/v2/ds_admin"},
            "permissions": {
                "href": "https://agave.designsafe-ci.org/meta/v2/data/1442706179203994091-242ac118-0001-012/pems"
            },
            "self": {
                "href": "https://agave.designsafe-ci.org/meta/v2/data/1442706179203994091-242ac118-0001-012"
            },
        },
        "_relatedFields": ["project", "experiments", "files"],
        "_ui": {"orders": [], "uuid": "1442706179203994091-242ac118-0001-012"},
        "associationIds": [
            "1052668239654088215-242ac119-0001-012",
            "7119435370443894295-242ac113-0001-002",
            "7091290346386681365-242ac118-0001-012",
        ],
        "created": "2021-01-04T12:02:58.682-06:00",
        "internalUsername": None,
        "lastUpdated": "2021-01-06T17:33:58.739-06:00",
        "name": "designsafe.project.report",
        "owner": "ds_admin",
        "schemaId": None,
        "uuid": "1442706179203994091-242ac118-0001-012",
        "value": {
            "description": "Test",
            "experiments": ["7091290346386681365-242ac118-0001-012"],
            "fileTags": [],
            "fileObjs": [],
            "files": ["7119435370443894295-242ac113-0001-002"],
            "project": ["1052668239654088215-242ac119-0001-012"],
            "title": "Project Report",
        },
    },
    {
        "_links": {
            "associationIds": [
                {
                    "href": "https://agave.designsafe-ci.org/meta/v2/data/1052668239654088215-242ac119-0001-012",
                    "rel": "1052668239654088215-242ac119-0001-012",
                    "title": "metadata",
                }
            ],
            "owner": {"href": "https://agave.designsafe-ci.org/profiles/v2/ds_admin"},
            "permissions": {
                "href": "https://agave.designsafe-ci.org/meta/v2/data/3200409379355487765-242ac118-0001-012/pems"
            },
            "self": {
                "href": "https://agave.designsafe-ci.org/meta/v2/data/3200409379355487765-242ac118-0001-012"
            },
        },
        "_relatedFields": [
            "analysis",
            "project",
            "experiments",
            "model_configs",
            "sensor_lists",
            "files",
        ],
        "_ui": {"orders": [], "uuid": "3200409379355487765-242ac118-0001-012"},
        "associationIds": ["1052668239654088215-242ac119-0001-012"],
        "created": "2020-12-16T09:10:26.154-06:00",
        "internalUsername": None,
        "lastUpdated": "2020-12-22T12:42:17.061-06:00",
        "name": "designsafe.project.event",
        "owner": "ds_admin",
        "schemaId": None,
        "uuid": "3200409379355487765-242ac118-0001-012",
        "value": {
            "analysis": [],
            "description": "asdf",
            "eventType": "other",
            "experiments": [],
            "fileTags": [],
            "fileObjs": [],
            "files": [],
            "modelConfigs": [],
            "project": ["1052668239654088215-242ac119-0001-012"],
            "sensorLists": [],
            "title": "test2",
        },
    },
    {
        "_links": {
            "associationIds": [
                {
                    "href": "https://agave.designsafe-ci.org/meta/v2/data/1052668239654088215-242ac119-0001-012",
                    "rel": "1052668239654088215-242ac119-0001-012",
                    "title": "metadata",
                }
            ],
            "owner": {"href": "https://agave.designsafe-ci.org/profiles/v2/ds_admin"},
            "permissions": {
                "href": "https://agave.designsafe-ci.org/meta/v2/data/3521587033750367765-242ac118-0001-012/pems"
            },
            "self": {
                "href": "https://agave.designsafe-ci.org/meta/v2/data/3521587033750367765-242ac118-0001-012"
            },
        },
        "_relatedFields": [
            "analysis",
            "project",
            "experiments",
            "model_configs",
            "sensor_lists",
            "files",
        ],
        "_ui": {"orders": [], "uuid": "3521587033750367765-242ac118-0001-012"},
        "associationIds": ["1052668239654088215-242ac119-0001-012"],
        "created": "2020-12-16T09:10:18.676-06:00",
        "internalUsername": None,
        "lastUpdated": "2020-12-22T12:42:06.949-06:00",
        "name": "designsafe.project.event",
        "owner": "ds_admin",
        "schemaId": None,
        "uuid": "3521587033750367765-242ac118-0001-012",
        "value": {
            "analysis": [],
            "description": "asdf",
            "eventType": "other",
            "experiments": [],
            "fileTags": [],
            "fileObjs": [],
            "files": [],
            "modelConfigs": [],
            "project": ["1052668239654088215-242ac119-0001-012"],
            "sensorLists": [],
            "title": "test 1",
        },
    },
    {
        "_links": {
            "associationIds": [
                {
                    "href": "https://agave.designsafe-ci.org/meta/v2/data/1052668239654088215-242ac119-0001-012",
                    "rel": "1052668239654088215-242ac119-0001-012",
                    "title": "metadata",
                }
            ],
            "owner": {"href": "https://agave.designsafe-ci.org/profiles/v2/ds_admin"},
            "permissions": {
                "href": "https://agave.designsafe-ci.org/meta/v2/data/3849330284117683735-242ac119-0001-012/pems"
            },
            "self": {
                "href": "https://agave.designsafe-ci.org/meta/v2/data/3849330284117683735-242ac119-0001-012"
            },
        },
        "_relatedFields": ["project"],
        "_ui": {"orders": [], "uuid": "3849330284117683735-242ac119-0001-012"},
        "associationIds": ["1052668239654088215-242ac119-0001-012"],
        "created": "2019-03-26T15:14:42.536-05:00",
        "internalUsername": None,
        "lastUpdated": "2020-11-12T11:48:00.830-06:00",
        "name": "designsafe.project.experiment",
        "owner": "ds_admin",
        "schemaId": None,
        "uuid": "3849330284117683735-242ac119-0001-012",
        "value": {
            "authors": [
                {"authorship": True, "name": "thbrown", "order": 0},
                {"authorship": True, "name": "keiths", "order": 2},
                {"authorship": True, "name": "jarosenb", "order": 1},
                {"authorship": False, "name": "sgray", "order": 3},
                {"authorship": True, "name": "ojamil", "order": 4},
                {"authorship": False, "name": "sal", "order": 5},
                {"authorship": False, "name": "prjadmin", "order": 6},
                {"authorship": False, "name": "ds_apps", "order": 7},
                {"authorship": False, "name": "fnetsch", "order": 8},
                {
                    "authorship": False,
                    "email": "guest@members.com",
                    "fname": "Guest",
                    "guest": True,
                    "inst": "Guest institution",
                    "lname": "Member",
                    "name": "guestGuestM0",
                    "order": 9,
                },
            ],
            "description": "This experiment tests the structural stability of an upgraded concrete storage tank similar to ones present along the gulf coast. This is a longer sentence. This is a Test",
            "dois": ["10.17603/ds-s9fj-gk73"],
            "equipmentType": "pla",
            "equipmentTypeOther": "None",
            "experimentType": "wave",
            "experimentTypeOther": "",
            "experimentalFacility": "ohhwrl-oregon",
            "experimentalFacilityOther": "None",
            "procedureEnd": "2020-02-19T06:00:00.000Z",
            "procedureStart": "2020-02-19T06:00:00.000Z",
            "referencedData": [],
            "relatedWork": [],
            "project": ["1052668239654088215-242ac119-0001-012"],
            "title": "Soil Erosion Experiment I",
        },
    },
    {
        "_links": {
            "associationIds": [
                {
                    "href": "https://agave.designsafe-ci.org/meta/v2/data/1052668239654088215-242ac119-0001-012",
                    "rel": "1052668239654088215-242ac119-0001-012",
                    "title": "metadata",
                },
                {
                    "href": "https://agave.designsafe-ci.org/files/v2/media/system/project-1052668239654088215-242ac119-0001-012//pressure_readings_sensor1.csv",
                    "rel": "2621891030438777321-242ac112-0001-002",
                    "title": "file",
                },
            ],
            "owner": {"href": "https://agave.designsafe-ci.org/profiles/v2/ds_admin"},
            "permissions": {
                "href": "https://agave.designsafe-ci.org/meta/v2/data/8908537048718372375-242ac11a-0001-012/pems"
            },
            "self": {
                "href": "https://agave.designsafe-ci.org/meta/v2/data/8908537048718372375-242ac11a-0001-012"
            },
        },
        "_relatedFields": ["project", "experiments", "files"],
        "_ui": {"orders": [], "uuid": "8908537048718372375-242ac11a-0001-012"},
        "associationIds": [
            "1052668239654088215-242ac119-0001-012",
            "2621891030438777321-242ac112-0001-002",
        ],
        "created": "2019-10-14T14:55:05.356-05:00",
        "internalUsername": None,
        "lastUpdated": "2020-09-15T14:06:34.352-05:00",
        "name": "designsafe.project.report",
        "owner": "ds_admin",
        "schemaId": None,
        "uuid": "8908537048718372375-242ac11a-0001-012",
        "value": {
            "description": "This report needs a description...",
            "experiments": [],
            "fileTags": [],
            "fileObjs": [],
            "files": ["2621891030438777321-242ac112-0001-002"],
            "project": ["1052668239654088215-242ac119-0001-012"],
            "title": "Findings From Series B",
        },
    },
    {
        "_links": {
            "associationIds": [
                {
                    "href": "https://agave.designsafe-ci.org/meta/v2/data/1052668239654088215-242ac119-0001-012",
                    "rel": "1052668239654088215-242ac119-0001-012",
                    "title": "metadata",
                },
                {
                    "href": "https://agave.designsafe-ci.org/files/v2/media/system/project-1052668239654088215-242ac119-0001-012//objekt.pyc",
                    "rel": "7120337313576054295-242ac113-0001-002",
                    "title": "file",
                },
                {
                    "href": "https://agave.designsafe-ci.org/meta/v2/data/3849330284117683735-242ac119-0001-012",
                    "rel": "3849330284117683735-242ac119-0001-012",
                    "title": "metadata",
                },
            ],
            "owner": {"href": "https://agave.designsafe-ci.org/profiles/v2/ds_admin"},
            "permissions": {
                "href": "https://agave.designsafe-ci.org/meta/v2/data/7396616410269609495-242ac119-0001-012/pems"
            },
            "self": {
                "href": "https://agave.designsafe-ci.org/meta/v2/data/7396616410269609495-242ac119-0001-012"
            },
        },
        "_relatedFields": ["project", "experiments", "files"],
        "_ui": {
            "orders": [{"parent": "3849330284117683735-242ac119-0001-012", "value": 0}],
            "uuid": "7396616410269609495-242ac119-0001-012",
        },
        "associationIds": [
            "1052668239654088215-242ac119-0001-012",
            "7120337313576054295-242ac113-0001-002",
            "3849330284117683735-242ac119-0001-012",
        ],
        "created": "2019-04-03T07:47:11.385-05:00",
        "internalUsername": None,
        "lastUpdated": "2020-09-15T14:06:30.764-05:00",
        "name": "designsafe.project.report",
        "owner": "ds_admin",
        "schemaId": None,
        "uuid": "7396616410269609495-242ac119-0001-012",
        "value": {
            "description": "This is where the description goes. It is useful for a number of reasons, but you should always remember to speyul check your work.",
            "experiments": ["3849330284117683735-242ac119-0001-012"],
            "fileTags": [],
            "fileObjs": [],
            "files": ["7120337313576054295-242ac113-0001-002"],
            "project": ["1052668239654088215-242ac119-0001-012"],
            "title": "Findings From Series A",
        },
    },
    {
        "_links": {
            "associationIds": [
                {
                    "href": "https://agave.designsafe-ci.org/files/v2/media/system/project-1052668239654088215-242ac119-0001-012//objekt.py",
                    "rel": "7120165514884214295-242ac113-0001-002",
                    "title": "file",
                },
                {
                    "href": "https://agave.designsafe-ci.org/meta/v2/data/1052668239654088215-242ac119-0001-012",
                    "rel": "1052668239654088215-242ac119-0001-012",
                    "title": "metadata",
                },
                {
                    "href": "https://agave.designsafe-ci.org/meta/v2/data/3849330284117683735-242ac119-0001-012",
                    "rel": "3849330284117683735-242ac119-0001-012",
                    "title": "metadata",
                },
            ],
            "owner": {"href": "https://agave.designsafe-ci.org/profiles/v2/ds_admin"},
            "permissions": {
                "href": "https://agave.designsafe-ci.org/meta/v2/data/1805800103257444841-242ac119-0001-012/pems"
            },
            "self": {
                "href": "https://agave.designsafe-ci.org/meta/v2/data/1805800103257444841-242ac119-0001-012"
            },
        },
        "_relatedFields": ["script", "project", "experiments", "files"],
        "_ui": {"orders": [], "uuid": "1805800103257444841-242ac119-0001-012"},
        "associationIds": [
            "7120165514884214295-242ac113-0001-002",
            "1052668239654088215-242ac119-0001-012",
            "3849330284117683735-242ac119-0001-012",
        ],
        "created": "2019-04-08T08:56:24.826-05:00",
        "internalUsername": None,
        "lastUpdated": "2020-09-15T14:06:27.767-05:00",
        "name": "designsafe.project.analysis",
        "owner": "ds_admin",
        "schemaId": None,
        "uuid": "1805800103257444841-242ac119-0001-012",
        "value": {
            "analysisData": "",
            "analysisType": "other",
            "application": "",
            "description": "This is all the data we collected from Experiment I-A",
            "experiments": ["3849330284117683735-242ac119-0001-012"],
            "fileTags": [
                {
                    "fileUuid": "1873922475840377321-242ac112-0001-002",
                    "tagName": "Visualization",
                }
            ],
            "fileObjs": [],
            "files": ["7120165514884214295-242ac113-0001-002"],
            "project": ["1052668239654088215-242ac119-0001-012"],
            "refs": [
                {
                    "reference": "Data References 1",
                    "referencedoi": "http://www.google.com",
                },
                {
                    "reference": "Data References 2",
                    "referencedoi": "http://www.data.gov",
                },
                {
                    "reference": "Data References 3",
                    "referencedoi": "https://www.precision-camera.com",
                },
            ],
            "script": [],
            "title": "Wave Impact on Reinforced Structures",
        },
    },
    {
        "_links": {
            "associationIds": [
                {
                    "href": "https://agave.designsafe-ci.org/meta/v2/data/1052668239654088215-242ac119-0001-012",
                    "rel": "1052668239654088215-242ac119-0001-012",
                    "title": "metadata",
                },
                {
                    "href": "https://agave.designsafe-ci.org/files/v2/media/system/project-1052668239654088215-242ac119-0001-012//Trash/helicoptor.mp4",
                    "rel": "7137021306710659561-242ac114-0001-002",
                    "title": "file",
                },
                {
                    "href": "https://agave.designsafe-ci.org/files/v2/media/system/project-1052668239654088215-242ac119-0001-012//Globus Folder",
                    "rel": "6923074490394022377-242ac114-0001-002",
                    "title": "file",
                },
                {
                    "href": "https://agave.designsafe-ci.org/meta/v2/data/3849330284117683735-242ac119-0001-012",
                    "rel": "3849330284117683735-242ac119-0001-012",
                    "title": "metadata",
                },
                {
                    "href": "https://agave.designsafe-ci.org/files/v2/media/system/project-1052668239654088215-242ac119-0001-012//lotsotestfiles/test98.txt",
                    "rel": "303745108476629482-242ac112-0001-002",
                    "title": "file",
                },
            ],
            "owner": {"href": "https://agave.designsafe-ci.org/profiles/v2/ds_admin"},
            "permissions": {
                "href": "https://agave.designsafe-ci.org/meta/v2/data/7206731579572621801-242ac119-0001-012/pems"
            },
            "self": {
                "href": "https://agave.designsafe-ci.org/meta/v2/data/7206731579572621801-242ac119-0001-012"
            },
        },
        "_relatedFields": ["project", "experiments", "files"],
        "_ui": {
            "orders": [{"parent": "3849330284117683735-242ac119-0001-012", "value": 0}],
            "uuid": "7206731579572621801-242ac119-0001-012",
        },
        "associationIds": [
            "1052668239654088215-242ac119-0001-012",
            "7137021306710659561-242ac114-0001-002",
            "6923074490394022377-242ac114-0001-002",
            "3849330284117683735-242ac119-0001-012",
            "303745108476629482-242ac112-0001-002",
        ],
        "created": "2019-03-26T15:18:59.955-05:00",
        "internalUsername": None,
        "lastUpdated": "2020-09-15T14:05:31.456-05:00",
        "name": "designsafe.project.model_config",
        "owner": "ds_admin",
        "schemaId": None,
        "uuid": "7206731579572621801-242ac119-0001-012",
        "value": {
            "description": "We are testing the stability of a structure reinforced with concrete pillars. Several waves of different sizes were tested against the structure. This is the first test for using a Large Wave Flume.",
            "experiments": ["3849330284117683735-242ac119-0001-012"],
            "fileObjs": [],
            "fileTags": [
                {
                    "fileUuid": "4352735846030447081-242ac114-0001-002",
                    "path": "/Setup Documentation/00005.jpg",
                    "tagName": "Image",
                },
                {
                    "fileUuid": "4360552686509167081-242ac114-0001-002",
                    "path": "/Setup Documentation/00006.jpg",
                    "tagName": "Superconductive Thermal Meatloaf",
                },
                {
                    "fileUuid": "303745108476629482-242ac112-0001-002",
                    "path": "/lotsotestfiles/test98.txt",
                    "tagName": "Image",
                },
                {
                    "fileUuid": "",
                    "path": "/Setup Documentation/00005.jpg",
                    "tagName": "Flexible Shear Beam Container",
                },
                {
                    "fileUuid": "2041257155850211817-242ac113-0001-002",
                    "path": "/Setup Documentation/Dir2/test",
                    "tagName": "Clay",
                },
                {
                    "fileUuid": "1873922475840377321-242ac112-0001-002",
                    "path": "/00001.jpg",
                    "tagName": "Model Drawing",
                },
            ],
            "files": [
                "7137021306710659561-242ac114-0001-002",
                "303745108476629482-242ac112-0001-002",
                "6923074490394022377-242ac114-0001-002",
            ],
            "project": ["1052668239654088215-242ac119-0001-012"],
            "title": "Wave I-A",
        },
    },
    {
        "_links": {
            "associationIds": [
                {
                    "href": "https://agave.designsafe-ci.org/meta/v2/data/1052668239654088215-242ac119-0001-012",
                    "rel": "1052668239654088215-242ac119-0001-012",
                    "title": "metadata",
                },
                {
                    "href": "https://agave.designsafe-ci.org/files/v2/media/system/project-1052668239654088215-242ac119-0001-012//pressure_readings_sensor4test.csv",
                    "rel": "2080682201469817321-242ac112-0001-002",
                    "title": "file",
                },
                {
                    "href": "https://agave.designsafe-ci.org/meta/v2/data/3849330284117683735-242ac119-0001-012",
                    "rel": "3849330284117683735-242ac119-0001-012",
                    "title": "metadata",
                },
                {
                    "href": "https://agave.designsafe-ci.org/meta/v2/data/7206731579572621801-242ac119-0001-012",
                    "rel": "7206731579572621801-242ac119-0001-012",
                    "title": "metadata",
                },
                {
                    "href": "https://agave.designsafe-ci.org/files/v2/media/system/project-1052668239654088215-242ac119-0001-012//sensor_arrangment_I-A.jpg",
                    "rel": "1874523771261817321-242ac112-0001-002",
                    "title": "file",
                },
            ],
            "owner": {"href": "https://agave.designsafe-ci.org/profiles/v2/ds_admin"},
            "permissions": {
                "href": "https://agave.designsafe-ci.org/meta/v2/data/8057478701564301801-242ac119-0001-012/pems"
            },
            "self": {
                "href": "https://agave.designsafe-ci.org/meta/v2/data/8057478701564301801-242ac119-0001-012"
            },
        },
        "_relatedFields": ["project", "experiments", "model_configs", "files"],
        "_ui": {
            "orders": [{"parent": "7206731579572621801-242ac119-0001-012", "value": 0}],
            "uuid": "8057478701564301801-242ac119-0001-012",
        },
        "associationIds": [
            "1052668239654088215-242ac119-0001-012",
            "2080682201469817321-242ac112-0001-002",
            "3849330284117683735-242ac119-0001-012",
            "7206731579572621801-242ac119-0001-012",
            "1874523771261817321-242ac112-0001-002",
        ],
        "created": "2019-03-26T15:19:19.763-05:00",
        "internalUsername": None,
        "lastUpdated": "2020-09-15T14:04:55.936-05:00",
        "name": "designsafe.project.sensor_list",
        "owner": "ds_admin",
        "schemaId": None,
        "uuid": "8057478701564301801-242ac119-0001-012",
        "value": {
            "description": "We surrounded our test structure with four sensors to take pressure readings. TEST",
            "experiments": ["3849330284117683735-242ac119-0001-012"],
            "fileTags": [],
            "fileObjs": [],
            "files": [
                "1874523771261817321-242ac112-0001-002",
                "2080682201469817321-242ac112-0001-002",
            ],
            "modelConfigs": ["7206731579572621801-242ac119-0001-012"],
            "project": ["1052668239654088215-242ac119-0001-012"],
            "sensorListType": "other",
            "title": "Pressure Sensor I-A",
        },
    },
]
