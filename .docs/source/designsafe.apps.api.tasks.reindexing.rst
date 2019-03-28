Reindexing 
__________

A file is reindexed when changes are made to it and the file is saved.


.. note::
    The process is carried out in Designsafe/Apps/Api/Tasks and begins at line 23 and carries until line 52
    

::
    
    @shared_task(bind=True, max_retries=None)
    def reindex_agave(self, username, file_id, full_indexing=True,
                    levels=1, pems_indexing=True, index_full_path=True):
        user = get_user_model().objects.get(username=username)
        #levels=1
        
        from designsafe.apps.api.data import AgaveFileManager
        from designsafe.apps.data.managers.indexer import AgaveIndexer as AgaveFileIndexer
        agave_fm = AgaveFileManager(user)
        
        if settings.DEBUG and username == 'ds_admin':
            service_client = get_service_account_client()
            agave_fm.agave_client = service_client
            agave_fm.indexer = AgaveFileIndexer(agave_client=service_client)

        system_id, file_user, file_path = agave_fm.parse_file_id(file_id)
        if system_id != settings.AGAVE_STORAGE_SYSTEM:
            file_id_comps = file_id.strip('/').split('/')
            system_id = file_id_comps[0]
            file_user = username
            if len(file_id_comps) > 1:
                file_path = os.path.join(*file_id_comps[1:])
            else:
                file_path = '/'

        agave_fm.indexer.index(system_id, file_path, file_user,
                            full_indexing = full_indexing,
                            pems_indexing = pems_indexing,
                            index_full_path = index_full_path,
                            levels = levels)