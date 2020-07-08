import { Subject, Observable, from, of, forkJoin, race, throwError } from 'rxjs';
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
} from 'rxjs/operators';
import { uuid } from 'uuidv4';

/**
 * Method to instantiate a subject that subscribes to the observable return
 * value of the last callback projected to it and cancels the result of any
 * previous calls. The callback must be a function that returns an observable.
 */
const takeLatestSubscriber = () => {
    const subject = new Subject();
    subject
        .pipe(
            switchMap((callback) => callback()) //
        )
        .subscribe();
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
            exhaustMap((callback) => callback()) //
        )
        .subscribe();
    return subject;
};

export class FileListingService {
    constructor($http, $uibModal, $q) {
        'ngInject';
        this.count = 0;
        this.$uibModal = $uibModal;
        this.$q = $q;
        this.$http = $http;
        this.from = from; // bind rxjs method for mocking

        this.modalCloseSubject = new Subject();
        this.listingStartSubject = new Subject();

        this.listings = {
            main: {
                loading: false,
                loadingScroll: false,
                reachedEnd: false,
                listing: [],
                params: {
                    api: '',
                    path: '',
                    offset: 0,
                    limit: 100,
                },
                listingSubscriber: takeLatestSubscriber(),
                scrollSubscriber: takeLeadingSubscriber(),
                error: null,
                errorScroll: null,
            },
            modal: {
                loading: false,
                loadingScroll: false,
                reachedEnd: false,
                listing: [],
                params: {
                    api: '',
                    path: '',
                    offset: 0,
                    limit: 100,
                },
                listingSubscriber: takeLatestSubscriber(),
                scrollSubscriber: takeLeadingSubscriber(),
                error: null,
                errorScroll: null,
            },
        };

        this.tests = {
            copy: false,
        };

        this.operations = {
            copy: {
                status: {},
                subscriber: takeLatestSubscriber(),
            },
        };
    }

    /**
     * Update listing parameters (api, path, offset, limit) for a section.
     * @param {string} section The section to update params for.
     * @param {object} newParams Object containing the params to update.
     */
    updateParams(section, newParams) {
        this.listings[section].params = { ...this.listings[section].params, ...newParams };
    }

    /**
     * Toggles selection on a file in the listing based on its index.
     * @param {string} section
     * @param {number} idx Index to toggle selection on.
     */
    select(section, idx) {
        this.listings[section].listing[idx].selected = !this.listings[section].listing[idx].selected;
        this.updateTests(section);
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

    testRace(obs1, obs2) {
        this.count = 4;
        return race(obs1, obs2).pipe(tap((_) => this.count++));
    }

    createHotObservable(subject) {
        const hotObservable = new Observable((observer) => {
            subject.pipe(take(1)).subscribe((_) => {
                observer.complete();
            });
        });

        return hotObservable;
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
    browse(
        section,
        api,
        system,
        path,
        offset = this.listings[section].params.offset,
        limit = this.listings[section].params.limit
    ) {
        const params = { section, api, system, path, offset, limit };

        const mappingFunction = () => this.mapParamsToListing(params);

        this.listings[section].listing = [];
        this.listings[section].loading = true;

        this.listingStartSubject.next(null);
        this.listings[section].listingSubscriber.next(mappingFunction);
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
    mapParamsToListing({ section, api, system, path, offset, limit }) {
        this.updateParams(section, { api, system, path, offset, limit });

        const listingUrl = this.removeDuplicateSlashes(`/api/datafiles/${api}/listing/${system}/${path}/`);
        const request = this.$http.get(listingUrl, {
            params: { offset, limit },
        });
        const requestObservable$ = this.from(request);

        return requestObservable$.pipe(
            tap(this.listingSuccessCallback(section)),
            catchError(this.listingErrorCallback(section))
        );
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
     * a scroll listing. The uuid of the previous listing is copied at the start
     * so that we know to cancel any UI effects if the user browses to a new path
     * during the scroll event.
     *
     * @param {string} section
     * @param {string} api
     * @param {string} system
     * @param {string} path
     * @param {number} offset
     * @param {number} limit
     */
    browseScroll(
        section,
        api,
        system,
        path,
        offset = this.listings[section].params.offset + this.listings[section].params.limit,
        limit = this.listings[section].params.limit
    ) {
        const params = { section, api, system, path, offset, limit };

        const mappingFunction = () => this.mapParamsToScroll(params);

        // Get a record of the browser state prior to scrolling.
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
    mapParamsToScroll({ section, api, system, path, offset, limit }) {
        const listingUrl = this.removeDuplicateSlashes(`/api/datafiles/${api}/listing/${system}/${path}/`);
        const request = this.$http.get(listingUrl, {
            params: { offset, limit, nextPageToken: this.listings[section].params.nextPageToken },
        });

        this.updateParams(section, { api, system, path, offset, limit });

        const requestObservable = this.from(request).pipe(
            tap(this.scrollSuccessCallback(section)),
            catchError(this.scrollErrorCallback(section))
        );

        // This observable will emit when a new listing starts.
        const cancelObservable = this.createHotObservable(this.listingStartSubject).pipe(
            tap(this.scrollCancelCallback(section))
        );

        // Cancel subscription to the scroll request if a new listing starts.
        return race(cancelObservable, requestObservable);
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

    /**
     * Sets this.tests to enable/disable data depot toolbars based on currently
     * selected files.
     * @param {string} section
     */
    updateTests(section) {
        const selectedFiles = this.listings[section].listing.filter((f) => f.selected);
        this.tests = {
            copy: selectedFiles.length > 0,
        };
    }

    /***************************************************************************
                       METHODS FOR HANDLING COPY OPERATIONS
    ***************************************************************************/

    /**
     * Open the copy modal.
     */
    openCopyModal() {
        this.operations.copy.status = {};
        const files = this.listings.main.listing.filter((f) => f.selected);
        var modal = this.$uibModal.open({
            component: 'copyModal',
            resolve: {
                files: () => files,
            },
            size: 'lg',
        });

        modal.closed.then((_) => {
            this.modalCloseSubject.next(null);
        });
    }

    /**
     * Push parameters onto the copy subject in order to trigger the operation.
     * This function is meant to be called from a controller.
     *
     * @param {string} dest Listing-formatted file corresponding to the destination dir.
     * @param {function} successCallback Callback to execute after all events have been handled.
     */
    handleCopy(dest, successCallback) {
        const copyParams = {
            srcApi: this.listings.main.params.api,
            destApi: this.listings.modal.params.api,
            destSystem: dest.system,
            destPath: dest.path,
            filesToCopy: this.listings.main.listing.filter((f) => f.selected),
            successCallback,
        };

        const copyMapping = () => this.mapParamsToCopy(copyParams);
        this.operations.copy.subscriber.next(copyMapping);
    }

    /**
     *Maps a set of params to an observable that will resove when all specified
     * copy operations have completed.
     *
     * @param {object} params Object containing params for the copy operation.
     * @param {string} params.api
     * @param {string} params.destSystem
     * @param {string} params.destPath
     * @param {object} param.files Array of files in listing format. Requires system, name, and path attributes.
     */
    mapParamsToCopy({ srcApi, destApi, destSystem, destPath, filesToCopy, successCallback }) {
        const copyObservables = {};
        filesToCopy.forEach((f) => {
            this.operations.copy.status[f.key] = 'PROCESSING';

            let copyRequest;

            if (srcApi === destApi) {
                const copyUrl = this.removeDuplicateSlashes(`/api/datafiles/${srcApi}/copy/${f.system}/${f.path}/`);
                copyRequest = this.$http.put(copyUrl, { dest_system: destSystem, dest_path: destPath });
            } else {
                const copyUrl = this.removeDuplicateSlashes(`/api/datafiles/transfer/${f.format}/`);
                copyRequest = this.$http.put(copyUrl, {
                    src_api: srcApi,
                    dest_api: destApi,
                    src_system: f.system,
                    dest_system: destSystem,
                    src_path: f.path,
                    dest_path: destPath,
                    dirname: f.name
                });
            }

            const copyObservable$ = this.from(copyRequest).pipe(
                tap((_) => {
                    // Success callback for copying a single file.
                    this.operations.copy.status[f.key] = 'SUCCESS';
                }),
                catchError((err) => {
                    // Callback for failure of an individual copy operation.
                    this.operations.copy.status[f.key] = 'ERROR';
                    return of('ERROR');
                })
            );
            copyObservables[f.key] = copyObservable$;
        });
        // Create an observable that emits only when all individual copy operations
        // have succeeded or failed and call the successCallback afterwards.
        const joinedObservables = forkJoin(copyObservables).pipe(tap(successCallback));

        // Hot observable that detects when the modal has been closed, for canceling UI effects.
        const modalCloseDetector = this.createHotObservable(this.modalCloseSubject);

        // If the modal is closed before all files are done copying, prevent further UI updates.
        return race(modalCloseDetector, joinedObservables);
    }

    /**
     * Returns a promise that resolves half the time and throws otherwise.
     */
    asyncResolver() {
        // perform some asynchronous operation, resolve or reject the promise when appropriate.
        return this.$q((resolve, reject) => {
            setTimeout(() => {
                const chance = Math.random() < 0.5;
                if (chance < 0.5) {
                    resolve('SUCCESS');
                } else {
                    reject('ERROR');
                }
            }, Math.random() * 5000);
        });
    }
}
