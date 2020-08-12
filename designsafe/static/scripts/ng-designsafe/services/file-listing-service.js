import { Subject, ReplaySubject, BehaviorSubject, Observable, from, of, forkJoin, race, throwError } from 'rxjs';
import {
    map,
    tap,
    switchMap,
    exhaustMap,
    flatMap,
    take,
    catchError,
    delay,
    takeWhile,
    combineAll,
    shareReplay,
    share,
} from 'rxjs/operators';
import { uuid } from 'uuidv4';

/**
 * Method to instantiate a subject that subscribes to the observable return
 * value of the last callback projected to it and cancels the result of any
 * previous calls. The callback must be a function that returns an observable.
 */
const takeLatestSubscriber = () => {
    let subject = new Subject();
    subject = subject.pipe(
        switchMap((callback) => callback()),
        share() // Allow subscription to in-flight http requests.
    );
    subject.subscribe();
    return subject;
};

/**
 * Method to instantiate a subject that subscribes to the observable return
 * value of the first callback passed to it and ignores anything new projected
 * to it until that observable resolves. The callback must be a function that
 * returns an observable.
 */
const takeLeadingSubscriber = () => {
    const subject = new Subject();
    subject
        .pipe(
            exhaustMap((callback) => callback()),
            share() // Allow subscription to in-flight http requests.
        )
        .subscribe();
    return subject;
};

export class FileListingService {
    constructor($http, $uibModal, $rootScope, $q, ProjectService, ProjectEntitiesService, FileOperationService, Django) {
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
        this.selectAll = this.selectAll.bind(this)
        this.$rootScope.$watch('this.$state.current', () => {
            Object.keys(this.listings).forEach(section => this.selectAll(section, false))
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
        const allSelected = Object.keys(this.listings).map(key => this.listings[key].selectedFiles).flat()
        this.FileOperationService.updateTests(allSelected);
    }

    selectAll(section, setValue) {

        const _setValue = setValue == null ? !this.listings[section].selectAll : setValue;
        this.listings[section].listing = this.listings[section].listing.map((f) => ({ ...f, selected: _setValue }));
        this.listings[section].selectedFiles = this.listings[section].listing.filter(f => f.selected);
        const allSelected = Object.keys(this.listings).map(key => this.listings[key].selectedFiles).flat()
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
        return this.from(listingRequest).pipe(
            map((resp) => resp.data.uuid),
            map((uuid) => {
                // lookup the file in the listing by key and append its uuid.
                const idx = this.listings[section].listing.findIndex((f) => f.key === key);
                const fileWithUuid = { ...this.listings[section].listing[idx], uuid };
                this.listings[section].listing[idx] = fileWithUuid;
                return fileWithUuid;
            })
        );
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
     * @param {string} section
     * @param {string} api
     * @param {string} system
     * @param {string} path
     * @param {number} offset
     * @param {number} limit
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
        return this.listings[section].listingSubscriber.pipe(take(1));
    }

    /**
     * Maps a set of parameters to an observable corresponding to a file listing.
     * @param {string} section Section in which to perform the listing ('main' or 'modal')
     * @param {object} params
     * @param {string} params.api API to call to (e.g. 'agave')
     * @param {string} params.system System to list in
     * @param {string} params.path Path relative to system root.
     * @param {number} params.offset Index to start listing at
     * @param {number} params.limit Number of results to return.
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
                        METHODS INVOLVING PROJECT ENTITIES
     **************************************************************************/
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
            entity.value.script && _entityTags.push('Script');
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

    setEntities(section, entities) {
        const projectId = this.ProjectService.resolveParams.projectId;

        const _parent_entities = this.getEntitiesForFile(this.listings[section].params.path, entities, projectId);
        this.listings[section].listing = this.listings[section].listing.map((f) => ({
            ...f,
            ...this.getEntitiesForFile(f.path, entities, projectId),
            _parent_entities: _parent_entities._entities,
        }));
    }

    mapParamsToAbstractListing({ entitiesPerPath, system, path, offset, limit }) {
        const listingUrl = this.removeDuplicateSlashes(`/api/datafiles/agave/private/listing/${system}/${path}/`);
        const request = this.$http.get(listingUrl, {
            params: { offset, limit },
        });

        const listingObservable$ = from(request).pipe(tap(this.abstractListingSuccessCallback(entitiesPerPath)));
        return listingObservable$;
    }

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

    abstractListing(entities, projectId, offset = 0, limit = 100) {
        // Create an object that maps each path to an array of its associated entities.
        const entitiesPerPath = {};
        const abstractListingParams = {api: 'agave', scheme: 'private', system: 'project-' + projectId, path: ''}
        // Update "main" params so toolbar operations work as expected.
        this.listings.main.params = {section: 'main', ...abstractListingParams};
        entities.forEach((entity) => {
            this.addSection(entity.uuid);
            this.listings[entity.uuid].listing = []
            this.listings[entity.uuid].params = {section: entity.uuid, ...abstractListingParams};
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

        const abstractListingsObservable$ = forkJoin(abstractListings);

        this.abstractListingSubject.next(() => abstractListingsObservable$);
        const subscriber = this.abstractListingSubject.pipe(take(1));
        return subscriber;
    }

    setPublicationSelection(section, valueToSet) {
        this.listings[section].selectedForPublication = valueToSet;
    }

    publishedListing(publication, entity) {
        const publicationListingParams = {api: 'agave', scheme: 'public', system: 'designsafe.storage.published', path: ''}
        this.listings.main.params = {section: 'main', ...publicationListingParams};
        const entityFiles = entity.fileObjs.map((f) => ({
            ...f,
            system: 'designsafe.storage.published',
            path: publication.projectId + f.path,
            format: f.type === 'dir' ? 'folder' : 'raw',
            permissions: 'READ',
            _entities: [entity],
        }));

        // Need to set entities on the main listing if one exists (for filenav/search)
        entityFiles.forEach(file => {
            const foundFile = this.listings.main.listing.find(f => f.path.replace(/^\/+/, '') === file.path.replace(/^\/+/, ''))
            if (foundFile) {
                // n.b. foundFile is a reference so modifying it will update the global state.
                foundFile._entities = [...(foundFile._entities || []), entity]
            }
        })
        this.addSection(entity.uuid);
        this.updateParams(entity.uuid, publicationListingParams);

        this.listings[entity.uuid].listing = entityFiles;
    }

    /***************************************************************************
                        METHODS FOR HANDLING INFINITE SCROLL
    ***************************************************************************/

    /**
     * Format a parameter object and push it to a listing subscriber to trigger
     * a scroll listing.
     *
     * @param {string} section
     * @param {string} api
     * @param {string} system
     * @param {string} path
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
     * @param {string} params.api API to call to (e.g. 'agave')
     * @param {string} params.system System to list in
     * @param {string} params.path Path relative to system root.
     * @param {number} params.offset Index to start listing at
     * @param {number} params.limit Number of results to return.
     */
    mapParamsToScroll({ section, api, scheme, system, path, offset, limit, query_string }) {
        const operation = query_string ? 'search' : 'listing';
        const listingUrl = this.removeDuplicateSlashes(`/api/datafiles/${api}/${scheme}/${operation}/${system}/${path}/`);
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
}
