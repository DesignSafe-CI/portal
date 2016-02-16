from agavepy.agave import Agave, AgaveException
import ConfigParser
import cx_Oracle
import json
import os
from pprint import pprint
import sys
import time
import urllib

# set default encoding to utf8 for file uploads
# reload(sys)
# sys.setdefaultencoding('utf8')


def convert_rows_to_dict_list(cursor):
    columns = list()
    for column in cursor.description:
        if '_' in column[0]:
            columns.append(convert_to_camel_case(column[0].lower()))
        else :
            columns.append(column[0].lower())
    return [dict(zip(columns, row)) for row in cursor]

def convert_to_camel_case(snake_str):
    components = snake_str.split('_')
    return components[0] + "".join(x.title() for x in components[1:])


def set_metadata_public_permissions(agave, metadata_uuid, username, permission):
    body = {}
    body['username'] = username
    body['permission'] = permission
    body_json = json.dumps(body)
    metadata_permission = agave.meta.updateMetadataPermissionsForUser(uuid=metadata_uuid, username=username, body=body_json)
    print 'changed permissions for = ' + metadata_uuid
    print metadata_permission

def insert_project_metadata(root_dir, cursor, agave):

    # get project name
    project_name = os.path.basename(os.path.normpath(root_dir))

    # find project id
    project_name = project_name.split('.')[0]

    print 'project_name = ' + project_name
    cursor.execute("select projid from project where name = " + "\'" + str(project_name) + "\'")
    project_rows_dict_list = convert_rows_to_dict_list(cursor)
    project_id = project_rows_dict_list[0]['projid']

    cursor.execute("select projid, name, title, start_date, end_date, description_4k, fundorg, fundorgprojid  from project where projid = " + "\'" + str(project_id) + "\'")
    project_rows_dict_list = convert_rows_to_dict_list(cursor)
    for row_dict in project_rows_dict_list:

        # pis
        cursor.execute('select FIRST_NAME, LAST_NAME from PROJECT_GROUP a join PERSON b on a.person_id = b.id where a.projid = ' + str(row_dict['projid']));
        pis_dict_list = convert_rows_to_dict_list(cursor)
        row_dict['pis'] = pis_dict_list

        # organization
        cursor.execute('select b.name, b.state, b.country from project_organization a join organization b on a.orgid = b.orgid where a.projid = ' + str(row_dict['projid']))
        organization_dict_list = convert_rows_to_dict_list(cursor)
        row_dict['organization'] = organization_dict_list

        # add path and change name
        row_dict['path'] = '/'

        # clean dates & description
        if row_dict['startDate'] is not None:
            row_dict['startDate'] = row_dict['startDate'].strftime('%Y-%m-%d %H:%M:%S')

        if row_dict['endDate'] is not None:
            row_dict['endDate'] = row_dict['endDate'].strftime('%Y-%m-%d %H:%M:%S')

        if 'description4K' in row_dict:
            row_dict['description'] = row_dict['description4K']
            del row_dict['description4K']

        # create and insert project metadata
        project_metadata = {}
        # project_metadata['name'] = row_dict['name']
        project_metadata['name'] = 'object'
        project_metadata['value'] = {}
        project_metadata['value'] = row_dict
        project_metadata['value']['deleted'] = "false"
        project_metadata_json = json.dumps(project_metadata)
        print 'project_metadata_json:' + project_metadata_json
        # print project_metadata_json

        project_metadata = agave.meta.addMetadata(body=project_metadata_json)
        print project_metadata['uuid']

        # set public permissions
        set_metadata_public_permissions(agave, project_metadata['uuid'], 'public', 'READ')
        set_metadata_public_permissions(agave, project_metadata['uuid'], 'world', 'READ')

        return project_metadata['uuid']

def insert_experiment_metadata(root_dir, experiment_name, cursor, agave, project_metadata_uuid):

    # get project name
    project_name = os.path.basename(os.path.normpath(root_dir))

    # parse name and get id
    project_name = project_name.split('.')[0]
    print project_name

    cursor.execute("select projid from project where name = " + "\'" + str(project_name) + "\'")
    project_rows_dict_list = convert_rows_to_dict_list(cursor)
    project_id = project_rows_dict_list[0]['projid']

    print project_id
    print experiment_name

    #insert experiment metadata
    cursor.execute("select projid, name, title, start_date, end_date, description_4k from experiment where projid = " + "\'" + str(project_id) + "\'" + " and name = " + "\'" + str(experiment_name) + "\'" )
    project_rows_dict_list = convert_rows_to_dict_list(cursor)
    for row_dict in project_rows_dict_list:
        print row_dict['projid']

        # facility
        cursor.execute("select a.name, c.name, c.state, c.country from experiment a join experiment_organization b on a.expid = b.expid join organization c on b.orgid = c.orgid where a.projid = " + "\'" + str(row_dict['projid']) + "\'" + " and a.name = " + "\'" + str(experiment_name) + "\'" )
        organization_dict_list = convert_rows_to_dict_list(cursor)
        row_dict['organization'] = organization_dict_list

        # clean dates & description
        if row_dict['startDate'] is not None:
            row_dict['startDate'] = row_dict['startDate'].strftime('%Y-%m-%d %H:%M:%S')

        if row_dict['endDate'] is not None:
            row_dict['endDate'] = row_dict['endDate'].strftime('%Y-%m-%d %H:%M:%S')

        if 'description4K' in row_dict:
            row_dict['description'] = row_dict['description4K']
            del row_dict['description4K']

        # print json.dumps(row_dict)

        # create and insert experiment metadata
        experiment_metadata = {}
        # experiment_metadata['name'] = row_dict['name']
        experiment_metadata['name'] = 'object'
        experiment_metadata['associationIds'] = project_metadata_uuid
        experiment_metadata['value'] = {}
        experiment_metadata['value'] = row_dict
        experiment_metadata['value']['deleted'] = "false"
        experiment_metadata_json = json.dumps(experiment_metadata)
        print experiment_metadata_json

        experiment_metadata = agave.meta.addMetadata(body=experiment_metadata_json)
        print 'experiment_dir_metadata_uuid:'
        print experiment_metadata['uuid']

        # set public permissions
        set_metadata_public_permissions(agave, experiment_metadata['uuid'], 'public', 'READ')
        set_metadata_public_permissions(agave, experiment_metadata['uuid'], 'world', 'READ')

        return experiment_metadata['uuid']


def main(args):

    Config = ConfigParser.ConfigParser()
    Config.read('/home1/02791/mrojas/dsimport/config.properties')

    # nees db auth
    user = Config.get('nees', 'user')
    pswd=Config.get('nees', 'pswd')
    host=Config.get('nees', 'host')
    port=Config.get('nees', 'port')
    sid=Config.get('nees', 'sid')
    dsn = cx_Oracle.makedsn(host, port, sid)
    db = cx_Oracle.connect(user, pswd, dsn)
    cursor = db.cursor()

    # agave auth
    api_server = Config.get('agave', 'api_server')
    agave_system = Config.get('agave', 'system')
    agave_user = Config.get('agave', 'user')
    token=Config.get('agave', 'token')

    # start agave
    agave = Agave(api_server=api_server, token=token)

    # insert project metadata
    # project_metadata_uuid = insert_project_metadata('NEES-2005-0086.groups')
    root_dir = args[0]
    project_metadata_uuid = insert_project_metadata(root_dir, cursor, agave)

    # insert files not workin with agavepy at the moment
    # for dir_name, sub_dir_list, file_list in os.walk(root_dir):
    #
    #     # create dir
    #     print 'Found directory: ' + dir_name
    #     body = {}
    #     body['action'] = 'mkdir'
    #     body['path'] = dir_name
    #     body_json = json.dumps(body)
    #     agave_dir = agave.files.manage(systemId=agave_system, filePath=agave_user, body=body_json)
    #     print ('Created dir: %s' % agave_dir['uuid'])
    #
    #     # create files
    #     for fname in file_list:
    #         print '\t' + fname
    #         agave_base_file_path = agave_user + '/' +  dir_name
    #         print '\tagave_base_file_path = ' + agave_base_file_path
    #         file_path = dir_name + '/' + fname
    #         print '\tfile_path = ' + file_path
    #
    #         # file = io.open(file_path, 'r')
    #         with open(file_path, 'rb') as file:
    #             jpgdata = file.read()
    #             print '\tinserting file.name = ' + file.name
    #             print 'agave_system = ' + agave_system
    #             import_data_uuid = agave.files.importData(systemId=agave_system, fileToUpload=file, filePath=agave_base_file_path)
    #             print 'after inserting file import_data_uuid:'
    #             print import_data_uuid
    #         file.close()

    # insert project dir/files metadata
    for dir_name, sub_dir_list, file_list in os.walk(root_dir):
        print 'Found directory: ' + dir_name

        # get metadata uuid for dir
        # agave_dir_path = agave_user + '/' + dir_name
        agave_dir_path = urllib.quote(dir_name)
        print 'agave_system = ' + agave_system
        print 'agave_dir_path = ' + agave_dir_path
        agave_dir = agave.files.list(systemId=agave_system, filePath=agave_dir_path)
        metadata_link = agave_dir[0]['_links']['metadata']['href']
        metadata_str = metadata_link[metadata_link.rindex('=')+1:]
        metadata_json = json.loads(metadata_str)
        metadata_uuid = metadata_json['associationIds']

        # create experiment dir/files metadata
        if 'Experiment-' in dir_name:

            # if Experiment-* insert one time only experiment db metadata
            if 'Experiment-' in dir_name.split(os.path.sep)[-1]:
                # insert_experiment_metadata(root_dir, experiment_name)
                # experiment_metadata_uuid = insert_experiment_metadata('NEES-2005-0086.groups', dir_name.split(os.path.sep)[-1])
                experiment_metadata_uuid = insert_experiment_metadata(root_dir, dir_name.split(os.path.sep)[-1], cursor, agave, project_metadata_uuid)
                print 'experiment_metadata_uuid = ' + experiment_metadata_uuid

            # insert experiment dir metadata
            # for dirs grab obly the first element returned by list which is the directory
            experiment_dir_metadata = {}
            # experiment_dir_metadata['name'] = dir_name
            experiment_dir_metadata['name'] = 'object'
            experiment_dir_metadata['associationIds'] = [experiment_metadata_uuid]
            experiment_dir_metadata['value'] = {}
            experiment_dir_metadata['value']['format'] = agave_dir[0]['format']
            experiment_dir_metadata['value']['length'] = agave_dir[0]['length']
            experiment_dir_metadata['value']['mimeType'] = agave_dir[0]['mimeType']
            experiment_dir_metadata['value']['path'] = dir_name
            experiment_dir_metadata['value']['name'] = dir_name.split(os.path.sep)[-1]
            experiment_dir_metadata['value']['permissions'] = agave_dir[0]['permissions']
            # experiment_dir_metadata['value']['system'] = agave_dir[0]['system']
            experiment_dir_metadata['value']['systemId'] = agave_dir[0]['system']
            experiment_dir_metadata['value']['type'] = agave_dir[0]['type']
            experiment_dir_metadata['value']['legacy'] = "true"
            experiment_dir_metadata['value']['deleted'] = "false"

            experiment_dir_metadata_json = json.dumps(experiment_dir_metadata)
            print 'experiment_dir_metadata_json:'
            print experiment_dir_metadata_json
            experiment_dir_metadata_uuid = agave.meta.addMetadata(body=experiment_dir_metadata_json)
            print 'experiment_dir_metadata_uuid'
            print experiment_dir_metadata_uuid['uuid']

            # set public permissions
            set_metadata_public_permissions(agave, experiment_dir_metadata_uuid['uuid'], 'public', 'READ')
            set_metadata_public_permissions(agave, experiment_dir_metadata_uuid['uuid'], 'world', 'READ')

            for fname in file_list:
                print '\tInserting experiment file = ' +  fname

                # get metadata uuid for file
                print '\tagave_system = ' + agave_system
                # agave_file_path = agave_user + '/' + dir_name + '/' + fname
                # agave_file_path =  urllib.quote(dir_name + '/' + fname)
                agave_file_path =  urllib.quote(dir_name)
                print '\tagave_file_path = ' + agave_file_path
                agave_file = agave.files.list(systemId=agave_system, filePath=agave_file_path)

                metadata_link = agave_file[0]['_links']['metadata']['href']
                metadata_str = metadata_link[metadata_link.rindex('=')+1:]
                metadata_json = json.loads(metadata_str)
                metadata_uuid = metadata_json['associationIds']

                experiment_file_metadata = {}
                # experiment_file_metadata['name'] = fname
                experiment_file_metadata['name'] = 'object'
                experiment_file_metadata['associationIds'] = [experiment_metadata_uuid]
                experiment_file_metadata['value'] = {}
                experiment_file_metadata['value']['format'] = agave_file[0]['format']
                experiment_file_metadata['value']['length'] = agave_file[0]['length']
                experiment_file_metadata['value']['mimeType'] = agave_file[0]['mimeType']
                experiment_file_metadata['value']['path'] = agave_file_path
                experiment_file_metadata['value']['name'] = fname
                experiment_file_metadata['value']['permissions'] = agave_file[0]['permissions']
                # experiment_file_metadata['value']['system'] = agave_file[0]['system']
                experiment_file_metadata['value']['systemId'] = agave_file[0]['system']
                experiment_file_metadata['value']['type'] = agave_file[0]['type']
                experiment_file_metadata['value']['legacy'] = "true"
                experiment_file_metadata['value']['deleted'] = "false"

                experiment_file_metadata_json = json.dumps(experiment_file_metadata)
                print '\texperiment_file_metadata_json:'
                print experiment_file_metadata_json
                experiment_file_metadata_uuid = agave.meta.addMetadata(body=experiment_file_metadata_json)
                print '\texperiment_file_metadata_uuid:'
                print experiment_file_metadata_uuid['uuid']

                # set public permissions
                set_metadata_public_permissions(agave, experiment_file_metadata_uuid['uuid'], 'public', 'READ')
                set_metadata_public_permissions(agave, experiment_file_metadata_uuid['uuid'], 'world', 'READ')

        # create project dir/files metadata
        else:
            print '\tInserting project dir metadata = ' + dir_name

            # rel_path = os.path.abspath(os.path.join(dir_name, os.pardir))
            rel_path = (os.path.abspath(os.path.join(dir_name, os.pardir))).split(os.path.sep)[-1]
            print '\tRelative path = ' + rel_path
            # insert experiment dir metadata
            # for dirs grab obly the first element returned by list which is the directory
            project_dir_metadata = {}
            # project_dir_metadata['name'] = dir_name
            project_dir_metadata['name'] = 'object'
            project_dir_metadata['associationIds'] = [project_metadata_uuid]
            project_dir_metadata['value'] = {}
            project_dir_metadata['value']['format'] = agave_dir[0]['format']
            project_dir_metadata['value']['length'] = agave_dir[0]['length']
            project_dir_metadata['value']['mimeType'] = agave_dir[0]['mimeType']

            # If creating NEES-####-####.groups dir, rel path from projects/ to /
            if '.groups' in dir_name.split(os.path.sep)[-1]:
                project_dir_metadata['value']['path'] = '/'
            else:
                project_dir_metadata['value']['path'] = rel_path

            project_dir_metadata['value']['name'] = dir_name.split(os.path.sep)[-1]
            project_dir_metadata['value']['permissions'] = agave_dir[0]['permissions']
            # project_dir_metadata['value']['system'] = agave_dir[0]['system']
            project_dir_metadata['value']['systemId'] = agave_dir[0]['system']
            project_dir_metadata['value']['type'] = agave_dir[0]['type']
            project_dir_metadata['value']['legacy'] = "true"
            project_dir_metadata['value']['deleted'] = "false"

            project_dir_metadata_json = json.dumps(project_dir_metadata)
            print '\tproject_dir_metadata_json:'
            print project_dir_metadata_json
            project_dir_metadata_uuid = agave.meta.addMetadata(body=project_dir_metadata_json)
            print '\tproject_dir_metadata_uuid:'
            print project_dir_metadata_uuid['uuid']

            # set public permissions
            set_metadata_public_permissions(agave, project_dir_metadata_uuid['uuid'], 'public', 'READ')
            set_metadata_public_permissions(agave, project_dir_metadata_uuid['uuid'], 'world', 'READ')

            for fname in file_list:
                print '\tInserting project file metadata' + fname
                # get metadata uuid for file
                print '\tagave_system = ' + agave_system
                # agave_file_path = agave_user + '/' + dir_name + '/' + fname
                # agave_file_path = urllib.quote(dir_name + '/' + fname)
                agave_file_path = urllib.quote(dir_name)
                print '\tagave_file_path = ' + agave_file_path
                agave_file = agave.files.list(systemId=agave_system, filePath=agave_file_path)

                # create project_dir_metadata
                project_file_metadata = {}
                # project_file_metadata['name'] = fname
                project_file_metadata['name'] = 'object'
                project_file_metadata['associationIds'] = [project_metadata_uuid]
                project_file_metadata['value'] = {}
                project_file_metadata['value']['format'] = agave_file[0]['format']
                project_file_metadata['value']['length'] = agave_file[0]['length']
                project_file_metadata['value']['mimeType'] = agave_file[0]['mimeType']
                project_file_metadata['value']['path'] = agave_file_path
                project_file_metadata['value']['name'] = fname
                project_file_metadata['value']['permissions'] = agave_file[0]['permissions']
                # project_file_metadata['value']['system'] = agave_file[0]['system']
                project_file_metadata['value']['systemId'] = agave_file[0]['system']
                project_file_metadata['value']['type'] = agave_file[0]['type']
                project_file_metadata['value']['legacy'] = "true"
                project_file_metadata['value']['deleted'] = "false"

                project_file_metadata_json = json.dumps(project_file_metadata)
                print '\tproject_file_metadata_json:'
                print project_file_metadata_json
                project_file_metadata_uuid = agave.meta.addMetadata(body=project_file_metadata_json)
                print '\tproject_file_metadata_uuid:'
                print project_file_metadata_uuid['uuid']

                # set public permissions
                set_metadata_public_permissions(agave, project_file_metadata_uuid['uuid'], 'public', 'READ')
                set_metadata_public_permissions(agave, project_file_metadata_uuid['uuid'], 'world', 'READ')

if len(sys.argv) < 2:
    # TO-DO: fix this so you can feed paths instead of names
    print '$ cd to /corral-repl/tacc/NHERI/public/projects/'
    print '$ python /path/to/nees-walker.py NEES-####-####.groups'
else:
    main(sys.argv[1:])
