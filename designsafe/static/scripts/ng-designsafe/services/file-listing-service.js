import { Subject, Observable, from, of, forkJoin, race } from 'rxjs';
import { map, tap, take, catchError } from 'rxjs/operators';
import { takeLeadingSubscriber, takeLatestSubscriber } from './_rxjs-utils';
import { uuid } from 'uuidv4';

export class FileListingService {
    constructor(
        $http,
        $uibModal,
        $rootScope,
        $q,
        ProjectService,
        ProjectEntitiesService,
        FileOperationService,
        Django
    ) {
        'ngInject';
        this.count = 0;
        this.$rootScope = $rootScope;
        this.$uibModal = $uibModal;
        this.Django = Django;
        this.$q = $q;
        this.$http = $http;
        this.ProjectService = ProjectService;
        this.FileOperationService = FileOperationService;
        this.ProjectEntitiesService = ProjectEntitiesService;
        this.from = from; // bind rxjs method for mocking

        this.modalCloseSubject = new Subject();
        this.listingStartSubject = new Subject();
        this.abstractListingSubject = takeLatestSubscriber();

        this.listings = {
            main: {
                loading: false,
                loadingScroll: false,
                reachedEnd: false,
                listing: [],
                selectedFiles: [],
                selectAll: false,
                params: {
                    api: '',
                    system: '',
                    scheme: 'private',
                    path: '',
                    offset: 0,
                    limit: 100,
                },
                listingSubscriber: takeLatestSubscriber(),
                scrollSubscriber: takeLeadingSubscriber(),
                error: null,
                errorScroll: null,
                rootEntities: [],
                selectedForPublication: false,
            },
            modal: {
                loading: false,
                loadingScroll: false,
                reachedEnd: false,
                listing: [],
                selectedFiles: [],
                selectAll: false,
                params: {
                    api: '',
                    system: '',
                    scheme: 'private',
                    path: '',
                    offset: 0,
                    limit: 100,
                },
                listingSubscriber: takeLatestSubscriber(),
                scrollSubscriber: takeLeadingSubscriber(),
                error: null,
                errorScroll: null,
                selectedForPublication: false,
            },
        };

        this.selectedListing = null; //Listing of selected files in publication pipeline

        // Map legacy fileMgr values to api/scheme pair and breadcrumb settings.
        this.fileMgrMappings = {
            agave: {
                api: 'agave',
                scheme: 'private',
                breadcrumbParams: {
                    skipRoot: true,
                    customRoot: { label: 'My Data', path: this.Django.user },
                },
            },
            shared: {
                api: 'shared',
                scheme: 'private',
                breadcrumbParams: {
                    skipRoot: true,
                    customRoot: { label: 'Shared with Me', path: '' },
                },
            },

            googledrive: {
                api: 'googledrive',
                scheme: 'private',
                breadcrumbParams: {
                    skipRoot: false,
                    customRoot: { label: 'Google Drive', path: '' },
                },
            },
            box: {
                api: 'box',
                scheme: 'private',
                breadcrumbParams: {
                    skipRoot: false,
                    customRoot: { label: 'Box', path: '' },
                },
            },
            dropbox: {
                api: 'dropbox',
                scheme: 'private',
                breadcrumbParams: {
                    skipRoot: false,
                    customRoot: { label: 'Dropbox', path: '' },
                },
            },
            community: {
                api: 'agave',
                scheme: 'community',
                breadcrumbParams: {
                    skipRoot: false,
                    customRoot: { label: 'Community Data', path: '' },
                },
            },
        };

        // Make sure all files in all listings are deselected when the state changes.
        this.selectAll = this.selectAll.bind(this);
        this.$rootScope.$watch('this.$state.current', () => {
            Object.keys(this.listings).forEach((section) => this.selectAll(section, false));
        });
    }

    /**
     * Update listing parameters (api, path, offset, limit) for a section.
     * @param {string} section The section to update params for.
     * @param {object} newParams Object containing the params to update.
     */
    updateParams(section, newParams) {
        this.listings[section].params = { ...this.listings[section].params, ...newParams };
    }

    addSection(sectionName) {
        this.listings[sectionName] = this.listings[sectionName] || {
            loading: false,
            loadingScroll: false,
            reachedEnd: true, // For abstract listings we can't do infinite scroll
            listing: [],
            selectedFiles: [],
            selectAll: false,
            params: {
                section: sectionName,
                api: '',
                system: '',
                scheme: 'private',
                path: '',
                offset: 0,
                limit: 100,
            },
            listingSubscriber: takeLatestSubscriber(),
            scrollSubscriber: takeLeadingSubscriber(),
            error: null,
            errorScroll: null,
            selectedForPublication: false,
        };
    }

    /**
     * Toggles selection on a file in the listing based on its index.
     * @param {string} section
     * @param {number} idx Index to toggle selection on.
     */
    select(section, idx) {
        this.listings[section].listing[idx].selected = !this.listings[section].listing[idx].selected;
        const selectedFiles = this.listings[section].listing.filter((f) => f.selected);
        this.listings[section].selectedFiles = selectedFiles;
        /* If there are multiple listings per page (e.g. abstract listings) the 
        other listings must be considered when updating tests. */
        const allSelected = Object.keys(this.listings)
            .map((key) => this.listings[key].selectedFiles)
            .flat();
        this.FileOperationService.updateTests(allSelected);
    }

    /**
     * Select or deselect all files in a given section. 
     * @param {string} section Section ('main', 'modal') to target.
     * @param {boolean} setValue If true, select all. If false, deselect all.
     */
    selectAll(section, setValue) {
        const _setValue = typeof setValue === 'boolean' ? setValue : !this.listings[section].selectAll;
        this.listings[section].selectAll = _setValue;
        this.listings[section].listing = this.listings[section].listing.map((f) => ({ ...f, selected: _setValue }));
        this.listings[section].selectedFiles = this.listings[section].listing.filter((f) => f.selected);
        /* If there are multiple listings per page (e.g. abstract listings) the 
        other listings must be considered when updating tests. */
        const allSelected = Object.keys(this.listings)
            .map((key) => this.listings[key].selectedFiles)
            .flat();
        this.FileOperationService.updateTests(allSelected);
    }

    /**
     * Utility function for filtering the current listing for only selected files.
     * @param {string} section
     */
    getSelectedFiles(section) {
        return this.listings[section].listing.filter((f) => f.selected);
    }

    /**
     * Utility function to replace instances of 2 or more slashes in a URL with
     * a single slash.
     * @param {string} url
     */
    removeDuplicateSlashes(url) {
        return url.replace(/\/{2,}/g, '/');
    }

    createHotObservable(subject) {
        const hotObservable = new Observable((observer) => {
            subject.pipe(take(1)).subscribe((_) => {
                observer.complete();
            });
        });

        return hotObservable;
    }

    getUuid(section, api, scheme, system, path, key) {
        const listingUrl = this.removeDuplicateSlashes(`/api/datafiles/${api}/${scheme}/detail/${system}/${path}/`);
        const listingRequest = this.$http.get(listingUrl);
        const uuidPromise = this.from(listingRequest)
            .pipe(
                map((resp) => resp.data.uuid),
                map((uuid) => {
                    // lookup the file in the listing by key and append its uuid.
                    const idx = this.listings[section].listing.findIndex((f) => f.key === key);
                    const fileWithUuid = { ...this.listings[section].listing[idx], uuid };
                    this.listings[section].listing[idx] = fileWithUuid;
                    return fileWithUuid;
                })
            )
            .toPromise();

        return this.$q.when(uuidPromise);
    }

    getDetail({ api, scheme, system, path }) {
        const listingUrl = this.removeDuplicateSlashes(`/api/datafiles/${api}/${scheme}/detail/${system}/${path}/`);
        const listingRequest = this.$http.get(listingUrl);
        return listingRequest;
    }

    /***************************************************************************
                       METHODS FOR HANDLING LISTINGS
    ***************************************************************************/

    /**
     * Format a parameter object and push it to a listing subscriber to trigger
     * a listing.
     *
     * @param {object} params
     * @param {string} params.section Section in which to perform the listing ('main' or 'modal')
     * @param {string} params.api API to call to (e.g. 'agave')
     * @param {string} params.scheme Scheme (e.g. 'private') of the listing.
     * @param {string} params.system System to list in
     * @param {string} params.path Path relative to system root.
     * @param {number} params.offset Index to start listing at
     * @param {number} params.limit Number of results to return.
     * @param {string} params.query_string Optional query string for search.
     */
    browse({ section, api, scheme, system, path, offset, limit, query_string }) {
        const params = { section, api, scheme, system, path, offset: offset || 0, limit: limit || 100, query_string };
        this.updateParams(section, params);
        // Deselect any selected files and update permissions on operations.
        if (section === 'main') {
            this.selectAll(section, false);
        }

        const mappingFunction = () => this.mapParamsToListing(params);

        this.listings[section].listing = [];
        this.listings[section].loading = true;

        this.listingStartSubject.next(null);
        // The return value can be subscribed to for the latest value

        this.listings[section].listingSubscriber.next(mappingFunction);
        const listingPromise = this.listings[section].listingSubscriber.pipe(take(1)).toPromise();
        return this.$q.when(listingPromise);
    }

    /**
     * Maps a set of parameters to an observable corresponding to a file listing.
     * @param {object} params
     * @param {string} params.section Section in which to perform the listing ('main' or 'modal')
     * @param {string} params.api API to call to (e.g. 'agave')
     * @param {string} params.scheme Scheme (e.g. 'private') of the listing.
     * @param {string} params.system System to list in
     * @param {string} params.path Path relative to system root.
     * @param {number} params.offset Index to start listing at
     * @param {number} params.limit Number of results to return.
     * @param {string} params.query_string Optional query string for search.
     */
    mapParamsToListing({ section, api, scheme, system, path, offset, limit, query_string }) {
        const operation = query_string ? 'search' : 'listing';
        const listingUrl = this.removeDuplicateSlashes(
            `/api/datafiles/${api}/${scheme}/${operation}/${system}/${path}/`
        );

        const request = this.$http.get(listingUrl, {
            params: { offset, limit, query_string },
        });
        const listingObservable$ = this.from(request).pipe(
            tap(this.listingSuccessCallback(section)),
            catchError(this.listingErrorCallback(section))
        );
        return listingObservable$;
    }

    /**
     * Callback to execute on successful listing. Maps a uuid and selection bool
     * to each file and determines whether it is possible to list more files.
     * @param {string} section
     */
    listingSuccessCallback(section) {
        return (resp) => {
            this.listings[section].error = null;
            this.listings[section].listing = resp.data.listing.map((f) => ({ ...f, key: uuid(), selected: false }));
            this.listings[section].loading = false;
            resp.data.nextPageToken && this.updateParams(section, { nextPageToken: resp.data.nextPageToken });
            this.listings[section].reachedEnd =
                resp.data.reachedEnd || resp.data.listing.length < this.listings[section].params.limit;
        };
    }

    /**
     * Callback to execute on failed listing.
     * @param {string} section
     */
    listingErrorCallback(section) {
        return (error, caught) => {
            this.listings[section].listing = [];
            this.listings[section].loading = false;
            this.listings[section].error = {
                status: error.status,
                message: error.data.message,
            };
            return of(null);
        };
    }

    /***************************************************************************
                        METHODS FOR HANDLING INFINITE SCROLL
    ***************************************************************************/

    /**
     * Format a parameter object and push it to a listing subscriber to trigger
     * a scroll listing.
     *
     * @param {object} params
     * @param {string} params.section Section in which to perform the listing ('main' or 'modal')
     * @param {string} params.api API to call to (e.g. 'agave')
     * @param {string} params.scheme Scheme for the listing.
     * @param {string} params.system System to list in
     * @param {string} params.path Path relative to system root.
     * @param {number} params.offset Index to start listing at
     * @param {number} params.limit Number of results to return.
     * @param {string} params.query_string Optional query string for search.
     */
    browseScroll({ section, api, scheme, system, path }) {
        const params = {
            section,
            api,
            scheme,
            system,
            path,
            offset: this.listings[section].params.offset + this.listings[section].params.limit,
            limit: this.listings[section].params.limit,
            query_string: this.listings[section].params.query_string,
        };
        const mappingFunction = () => this.mapParamsToScroll(params);

        this.listings[section].loadingScroll = true;
        this.listings[section].scrollSubscriber.next(mappingFunction);
    }

    /**
     * Maps a set of parameters to an observable corresponding to a scroll listing.
     * @param {object} params
     * @param {string} params.section Section in which to perform the listing ('main' or 'modal')
     * @param {string} params.api API to call to (e.g. 'agave')
     * @param {string} params.scheme Scheme for the listing.
     * @param {string} params.system System to list in
     * @param {string} params.path Path relative to system root.
     * @param {number} params.offset Index to start listing at
     * @param {number} params.limit Number of results to return.
     * @param {string} params.query_string Optional query string for search.
     */
    mapParamsToScroll({ section, api, scheme, system, path, offset, limit, query_string }) {
        const operation = query_string ? 'search' : 'listing';
        const listingUrl = this.removeDuplicateSlashes(
            `/api/datafiles/${api}/${scheme}/${operation}/${system}/${path}/`
        );
        const request = this.$http.get(listingUrl, {
            params: { offset, limit, nextPageToken: this.listings[section].params.nextPageToken, query_string },
        });

        this.updateParams(section, { section, api, scheme, system, path, offset, limit });

        const requestObservable$ = this.from(request).pipe(
            tap(this.scrollSuccessCallback(section)),
            catchError(this.scrollErrorCallback(section))
        );

        // This observable will emit when a new listing starts.
        const cancelObservable$ = this.createHotObservable(this.listingStartSubject).pipe(
            tap(this.scrollCancelCallback(section))
        );

        // Cancel subscription to the scroll request if a new listing starts.
        return race(cancelObservable$, requestObservable$);
    }

    /**
     * Callback to execute on successfull scroll listing. The scroll offset in
     * the service's state is set here, so that scroll events in quick succession
     * do not cause the scroll to skip files.
     * @param {string} section
     */
    scrollSuccessCallback(section) {
        return (resp) => {
            this.listings[section].loadingScroll = false;
            this.listings[section].listing = [
                ...this.listings[section].listing,
                ...resp.data.listing.map((f) => ({ ...f, key: uuid(), selected: false })),
            ];
            resp.data.nextPageToken && this.updateParams(section, { nextPageToken: resp.data.nextPageToken });
            this.listings[section].reachedEnd =
                resp.data.reachedEnd || resp.data.listing.length < this.listings[section].params.limit;
        };
    }

    /**
     * Callback to execute if a scroll listing fails.
     * @param {string} section
     */
    scrollErrorCallback(section) {
        return (error, caught) => {
            this.listings[section].loadingScroll = false;
            this.listings[section].errorScroll = {
                status: error.status,
                message: error.data.message,
            };
            return of(null);
        };
    }

    scrollCancelCallback(section) {
        return () => {
            this.listings[section].loadingScroll = false;
        };
    }

    /***************************************************************************
                        METHODS INVOLVING PROJECT ENTITIES
    ***************************************************************************/

    /**
     * Return a list of ProjectEntityModel objects for each entity 
     * associated with a given file.
     * @param {string} path Path to the file.
     * @param {Object[]} entities Array of ProjectEntityModel objects.
     * @param {string} projectId projectId of the project containing the entities.
     */
    getEntitiesForFile(path, entities, projectId) {
        const _entities = entities.filter((entity) => {
            // yields entity._links.associationIds or an empty array.
            const associationIds = (entity._links || {}).associationIds || [];
            // Filter for entities whose associationIds contain a file path matching the provided path.
            return associationIds.some((asc) => {
                const comps = asc.href.split('project-' + projectId, 2);
                return comps.length === 2 && path.replace(/^\/+/, '') === comps[1].replace(/^\/+/, '');
            });
        });

        let _entityTags = [];
        entities.forEach((entity) => {
            entity.value.modelDrawing && _entityTags.push('Model Drawing');
            entity.value.load && _entityTags.push('Load');
            entity.value.sensorDrawing && _entityTags.push('Sensor Drawing');
            entity.value.script && entity.value.script.length && _entityTags.push('Script');
        });
        _entityTags = [...new Set(_entityTags)];

        let _fileTags = [];
        _entities.forEach((e) => {
            const tagsForPath = e.value.fileTags.filter(
                (tag) => tag.path && tag.path.replace(/^\/+/, '') === path.replace(/^\/+/, '')
            );
            _fileTags.push(...tagsForPath.map((tag) => tag.tagName));
        });

        return { _entities, _entityTags, _fileTags };
    }

    /**
     * Sets entities on files in a listing, given an array of entities.
     * @param {string} section Section to set entities in.
     * @param {Object[]} entities Entities to set.
     */
    setEntities(section, entities) {
        const projectId = this.ProjectService.resolveParams.projectId;

        const _parent_entities = this.getEntitiesForFile(this.listings[section].params.path, entities, projectId);
        this.listings[section].listing = this.listings[section].listing.map((f) => ({
            ...f,
            ...this.getEntitiesForFile(f.path, entities, projectId),
            _parent_entities: _parent_entities._entities,
        }));
    }

    /**
     * 
     * @param {Object} params
     * @param {Object} entitiesPerPath Object with file paths as keys and arrays of entities as values.
     * @param {string} system System to list in
     * @param {string} path Path to list in.
     * @param {number} offset Listing offset.
     * @param {number} limit Number of results to return.
     */
    mapParamsToAbstractListing({ entitiesPerPath, system, path, offset, limit }) {
        const listingUrl = this.removeDuplicateSlashes(`/api/datafiles/agave/private/listing/${system}/${path}/`);
        const request = this.$http.get(listingUrl, {
            params: { offset, limit },
        });

        const listingObservable$ = from(request).pipe(tap(this.abstractListingSuccessCallback(entitiesPerPath)));
        return listingObservable$;
    }

    /**
     * Callback for successful abstract listing. On success, add listed files to 
     * the abstract listing for each associated entity.
     * @param {Object} entityMapping Object with file paths as keys and arrays of entities as values. 
     */
    abstractListingSuccessCallback(entityMapping) {
        return (resp) => {
            const files = resp.data.listing;

            files
                .filter((f) => entityMapping[f.path])
                .forEach((file) => {
                    entityMapping[file.path].forEach((entity) => {
                        file._entities = entityMapping[file.path];
                        this.listings[entity.uuid].listing.push(file);
                    });
                });
        };
    }

    /**
     * Perform an abstract listing given a set of entities. This will create a 
     * new listing section for each entity and populate it with the files associated
     * to that entity.
     * @param {Object[]} entities Array of ProjectEntityModel objects. 
     * @param {string} projectId projectId of project containing the entities.
     * @param {number} offset Offset to pass to Agave.
     * @param {number} limit Limit to pass to Agave.
     */
    abstractListing(entities, projectId, offset = 0, limit = 100) {
        // Create an object that maps each path to an array of its associated entities.
        const entitiesPerPath = {};
        const abstractListingParams = { api: 'agave', scheme: 'private', system: 'project-' + projectId, path: '' };
        // Update "main" params so toolbar operations work as expected.
        this.listings.main.params = { section: 'main', ...abstractListingParams };
        entities.forEach((entity) => {
            this.addSection(entity.uuid);
            this.listings[entity.uuid].listing = [];
            this.listings[entity.uuid].params = { section: entity.uuid, ...abstractListingParams };
            entity._filePaths.forEach((path) => {
                entitiesPerPath[path] = [...(entitiesPerPath[path] || []), entity];
            });
        });
        // Concatenate all entity._filePath arrays.
        const allPaths = Object.keys(entitiesPerPath);
        // Map paths to their direct parents.
        const listingPaths = allPaths.map((path) => path.match(`.*\/`)[0]);

        let reducedPaths = { files: allPaths, directories: [...new Set(listingPaths)] };

        const abstractListings = reducedPaths.directories.map((path) =>
            this.mapParamsToAbstractListing({
                entitiesPerPath,
                system: 'project-' + projectId,
                path,
                offset,
                limit,
            })
        );
        
        // forkJoin doesn't emit when passed an empty array so we need to return
        // early if there are no listings to perform.
        if(!abstractListings.length) {
            return this.$q(resolve => resolve(null))
        }

        const abstractListingsObservable$ = forkJoin(abstractListings);

        this.abstractListingSubject.next(() => abstractListingsObservable$);
        const subscriber = this.abstractListingSubject.pipe(take(1));
        return this.$q.when(subscriber.toPromise());
    }

    /**
     * Set the selectedForPublication tag on a listing.
     * @param {string} section 
     * @param {boolean} valueToSet 
     */
    setPublicationSelection(section, valueToSet) {
        this.listings[section].selectedForPublication = valueToSet;
    }

    /**
     * Perform an abstract listing for a publication. This will create a new listing 
     * section for each entity and populate it with the files associated to that
     * entity.
     * @param {Object} publication Publication to list under.
     * @param {Object} entity Entity to perform the abstract listing for.
     */
    publishedListing(publication, entity) {
        const publicationListingParams = {
            api: 'agave',
            scheme: 'public',
            system: 'designsafe.storage.published',
            path: '',
        };
        this.listings.main.params = { section: 'main', ...publicationListingParams };
        const entityFiles = entity.fileObjs.map((f) => ({
            ...f,
            system: 'designsafe.storage.published',
            path: publication.projectId + f.path,
            format: f.type === 'dir' ? 'folder' : 'raw',
            permissions: 'READ',
            _entities: [entity],
        }));

        // Need to set entities on the main listing if one exists (for filenav/search)
        entityFiles.forEach((file) => {
            const foundFile = this.listings.main.listing.find(
                (f) => f.path.replace(/^\/+/, '') === file.path.replace(/^\/+/, '')
            );
            if (foundFile) {
                // n.b. foundFile is a reference so modifying it will update the global state.
                foundFile._entities = [...(foundFile._entities || []), entity];
            }
        });
        this.addSection(entity.uuid);
        this.updateParams(entity.uuid, publicationListingParams);

        this.listings[entity.uuid].listing = entityFiles;
    }
}
