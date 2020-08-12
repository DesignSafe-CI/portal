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
import { path } from 'd3';

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

export class FileOperationService {
    constructor($http, $state, $rootScope, $uibModal, $q, ProjectService, Django) {
        'ngInject';
        this.$state = $state;
        this.$uibModal = $uibModal;
        this.Django = Django;
        this.$q = $q;
        this.$rootScope = $rootScope;
        this.$http = $http;
        this.ProjectService = ProjectService;
        this.from = from; // bind rxjs method for mocking

        this.modalCloseSubject = new Subject();
        this.tests = {
            copy: false,
        };

        this.operations = {
            copy: {
                status: {},
                subscriber: takeLatestSubscriber(),
            },
            move: {
                status: {},
                subscriber: takeLatestSubscriber(),
            },
            upload: {
                status: {},
                subscriber: takeLatestSubscriber(),
            },
        };

        this.checkForEntities = this.checkForEntities.bind(this);

        // Reset tests on each state change to prevent them from carrying over
    }

    /**
     * Utility function to replace instances of 2 or more slashes in a URL with
     * a single slash.
     * @param {string} url
     */
    removeDuplicateSlashes(url) {
        return url.replace(/\/{2,}/g, '/');
    }

    getTests(files) {
        const externalDataStates = ['boxData', 'dropboxData', 'googledriveData'];
        const agaveDataStates = ['myData', 'projects.view', 'projects.curation'];
        // If files are not eplicitly passed, check selected files in the main listing.
        const tests = {
            copy: this.Django.context.authenticated && files.length > 0,
            move:
                this.Django.context.authenticated &&
                files.length > 0 &&
                agaveDataStates.includes(this.$state.current.name),
            rename:
                this.Django.context.authenticated &&
                files.length === 1 &&
                [...agaveDataStates, ...externalDataStates].includes(this.$state.current.name),
            upload: this.Django.context.authenticated && agaveDataStates.includes(this.$state.current.name),
            preview: files.length === 1 && files[0].format !== 'folder',
            previewImages: files.length > 0 && agaveDataStates.includes(this.$state.current.name),
            download:
                files.length > 0 && !files.some((f) => f.format === 'folder'),
            trash:
                this.Django.context.authenticated &&
                files.length > 0 &&
                agaveDataStates.includes(this.$state.current.name),
        };
        return tests;
    }

    /**
     * Sets this.tests to enable/disable data depot toolbars based on currently
     * selected files.
     * @param {string} section
     */
    updateTests(files) {
        this.tests = this.getTests(files);
    }

    checkForEntities(file) {
        const inProject = ['projects.view', 'projects.curation'].includes(this.$state.current.name);
        const hasEntities = file._entities && file._entities.length;
        const hasTags = file._fileTags && file._fileTags.length;
        const projectFileTags = ((this.ProjectService.current || {}).value || {}).fileTags || [];
        const hasProjectFileTags = projectFileTags.some(
            (tag) => tag.path.replace(/^\/+/, '') === file.path.replace(/^\/+/, '')
        );

        return inProject && (hasEntities || hasTags || hasProjectFileTags);
    }

    /***************************************************************************
                                    COPY MODAL
    ***************************************************************************/

    /**
     * Open the copy modal.
     */
    openCopyModal({ api, scheme, system, files }) {
        this.operations.copy.status = {};
        var modal = this.$uibModal.open({
            component: 'copyModal',
            resolve: {
                api: () => api,
                scheme: () => scheme,
                system: () => system,
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
    handleCopy({ srcApi, srcFiles, destApi, destSystem, destPath, successCallback }) {
        const copyParams = {
            srcApi,
            srcFiles,
            destApi,
            destSystem,
            destPath,
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
    mapParamsToCopy({ srcApi, destApi, destSystem, destPath, srcFiles, successCallback }) {
        // Treat Shared Data as Agave for the purpose of copying files.
        if (srcApi === 'shared') {
            srcApi = 'agave';
        }
        const copyObservables = {};
        srcFiles.forEach((f) => {
            this.operations.copy.status[f.key] = 'PROCESSING';
            let copyRequest;

            // Copying files between APIs requires the transfer endpoint.
            if (srcApi === destApi) {
                const copyUrl = this.removeDuplicateSlashes(
                    `/api/datafiles/${srcApi}/private/copy/${f.system}/${f.path}/`
                );
                copyRequest = this.$http.put(copyUrl, {
                    dest_system: destSystem,
                    dest_path: destPath,
                    filetype: f.type,
                    filename: f.name,
                });
            } else {
                const copyUrl = this.removeDuplicateSlashes(`/api/datafiles/transfer/${f.format}/`);
                copyRequest = this.$http.put(copyUrl, {
                    src_api: srcApi,
                    dest_api: destApi,
                    src_system: f.system,
                    dest_system: destSystem,
                    src_path: f.path,
                    dest_path: destPath,
                    dirname: f.name,
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
        return forkJoin(copyObservables).pipe(tap(successCallback));
    }

    /***************************************************************************
                                    MOVE MODAL
    ***************************************************************************/

    /**
     * Open the move modal.
     */
    openMoveModal({ api, scheme, system, path, files }) {
        this.operations.move.status = {};
        var modal = this.$uibModal.open({
            component: 'moveModal',
            resolve: {
                api: () => api,
                scheme: () => scheme,
                system: () => system,
                path: () => path,
                files: () => files,
            },
            size: 'lg',
        });

        modal.closed.then((_) => {
            this.modalCloseSubject.next(null);
        });
    }

    /**
     * Push parameters onto the move subject in order to trigger the operation.
     * This function is meant to be called from a controller.
     *
     * @param {string} dest Listing-formatted file corresponding to the destination dir.
     * @param {function} successCallback Callback to execute after all events have been handled.
     */
    handleMove({ srcApi, srcFiles, destApi, destSystem, destPath, successCallback }) {
        const moveParams = {
            srcApi,
            srcFiles,
            destApi,
            destSystem,
            destPath,
            successCallback,
        };

        const moveMapping = () => this.mapParamsToMove(moveParams);
        this.operations.move.subscriber.next(moveMapping);
    }

    /**
     *Maps a set of params to an observable that will resove when all specified
     * move operations have completed.
     *
     * @param {object} params Object containing params for the move operation.
     * @param {string} params.api
     * @param {string} params.destSystem
     * @param {string} params.destPath
     * @param {object} param.files Array of files in listing format. Requires system, name, and path attributes.
     */
    mapParamsToMove({ srcApi, destApi, destSystem, destPath, srcFiles, successCallback }) {
        const moveObservables = {};
        srcFiles.forEach((f) => {
            this.operations.move.status[f.key] = 'PROCESSING';
            let moveRequest;

            const moveUrl = this.removeDuplicateSlashes(
                `/api/datafiles/${srcApi}/private/move/${f.system}/${f.path}/`
            );
            moveRequest = this.$http.put(moveUrl, {
                dest_system: destSystem,
                dest_path: destPath,
            });

            const moveObservable$ = this.from(moveRequest).pipe(
                tap((_) => {
                    // Success callback for moving a single file.
                    this.operations.move.status[f.key] = 'SUCCESS';
                }),
                catchError((err) => {
                    // Callback for failure of an individual move operation.
                    this.operations.move.status[f.key] = 'ERROR';
                    return of('ERROR');
                })
            );
            moveObservables[f.key] = moveObservable$;
        });
        // Create an observable that emits only when all individual move operations
        // have succeeded or failed and call the successCallback afterwards.
        return forkJoin(moveObservables).pipe(tap(successCallback));
    }

    /***************************************************************************
                                PREVIEW MODAL
    ***************************************************************************/

    openPreviewModal({ api, scheme, file }) {
        var modal = this.$uibModal.open({
            component: 'preview',
            resolve: {
                file: () => file,
                api: () => api,
                scheme: () => scheme,
            },
            size: 'lg',
        });
    }

    getPreviewHref({ file, api, scheme }) {
        const previewUrl = this.removeDuplicateSlashes(
            `/api/datafiles/${api}/${scheme}/preview/${file.system}/${encodeURIComponent(file.path)}/`
        );
        switch (api) {
            case 'shared':
            case 'agave':
                if (file._links) {
                    return this.$http.get(previewUrl, { params: { href: file._links.self.href } });
                }
                return this.$http.get(previewUrl, { params: { href: '' } });
            case 'box':
            case 'dropbox':
            case 'googledrive':
                return this.$http.get(previewUrl);
        }
    }

    /***************************************************************************
                                UPLOAD MODAL
    ***************************************************************************/

    openUploadModal({ directory, api, scheme, system, path }) {
        var modal = this.$uibModal.open({
            component: 'uploadModal',
            resolve: {
                directory: () => directory,
                path: () => path,
                api: () => api,
                scheme: () => scheme,
                system: () => system,
            },
            size: 'lg',
        });
    }

    handleUpload({ api, scheme, system, path, files, callback }) {
        const mapping = () => this.mapParamsToUpload({ api, scheme, system, path, files, callback });
        this.operations.upload.subscriber.next(mapping);
    }

    mapParamsToUpload({ api, scheme, system, path, files, callback }) {
        let uploadObservables = {};

        files.forEach((file) => {
            this.operations.upload.status[file.key] = 'uploading';
            const uploadUrl = this.removeDuplicateSlashes(
                `/api/datafiles/${api}/${scheme}/upload/${system}/${encodeURIComponent(path)}/`
            );
            const formData = new FormData();
            formData.append('uploaded_file', file);
            formData.append('file_name', file.name);
            formData.append('webkit_relative_path', file.webkitRelativePath);

            const uploadPromise = this.$http.post(uploadUrl, formData, {
                headers: { 'Content-Type': undefined },
            });
            const uploadObservable$ = from(uploadPromise).pipe(
                tap((_) => (this.operations.upload.status[file.key] = 'success')),
                catchError((_) => (this.operations.upload.status[file.key] = 'error'))
            );
            uploadObservables[file.key] = uploadObservable$;
        });

        return forkJoin(uploadObservables).pipe(tap(callback));
    }

    getPreviewableImages({ api, scheme, system, files }) {
        const images = files.filter(({ path }) => {
            const ext = path
                .split('.')
                .pop()
                .toLowerCase();
            return ['jpg', 'jpeg', 'png', 'tiff', 'gif'].includes(ext);
        });
        const folders = files.filter(({ format }) => format === 'folder');
        // If selection contains folders, we need to perform a listing in each to find the images
        if (folders.length) {
            const folderListing = (folder) =>
                this.$http.get(
                    this.removeDuplicateSlashes(
                        `/api/datafiles/${api}/${scheme}/listing/${system}/${encodeURIComponent(folder.path)}/`
                    )
                );
            //forkJoin emits when all folder listings have completed
            return forkJoin(folders.map(folderListing)).pipe(
                // flatMap turns the array of responses from forkJoin into an observable stream
                // -[resp1,resp2,resp3]- => -resp1-resp2-resp3-
                flatMap((responses) => from(responses)),
                //tap callback pushes each image in each listing response onto the images array
                tap((res) => {
                    const output = res.data.listing.filter(({ path }) => {
                        const ext = path
                            .split('.')
                            .pop()
                            .toLowerCase();
                        return ['jpg', 'jpeg', 'png', 'tiff', 'gif'].includes(ext);
                    });
                    images.push(...output);
                }),
                //the final output of the observable is the images array
                map((_) => images)
            );
        } else {
            // If there are no folders in the selection, just emit the selected images
            return of(images);
        }
    }

    openImagePreviewModal({ api, scheme, system, files }) {
        this.getPreviewableImages({ api, scheme, system, files }).subscribe((images) => {
            var modal = this.$uibModal.open({
                component: 'ddimagepreview',
                resolve: {
                    images: () => images,
                    api: () => api,
                    scheme: () => scheme,
                },
                size: 'lg',
            });
        });
    }

    /***************************************************************************
                                UPLOAD MODAL
    ***************************************************************************/

    openMkdirModal({ api, scheme, system, path }) {
        var modal = this.$uibModal.open({
            component: 'mkdirModal',
            resolve: {
                path: () => path,
                api: () => api,
                scheme: () => scheme,
                system: () => system,
            },
            size: 'lg',
        });
    }

    handleMkdir({ api, scheme, system, path, folderName, successCallback }) {
        const mkdirUrl = `/api/datafiles/${api}/${scheme}/mkdir/${system}/${encodeURIComponent(path)}/`;
        const mkdirRequest = this.$http.put(mkdirUrl, { dir_name: folderName }).then(successCallback);
    }

    /***************************************************************************
                                RENAME MODAL
    ***************************************************************************/
    openRenameModal({ api, scheme, system, path, file }) {
        var modal = this.$uibModal.open({
            component: 'renameModal',
            resolve: {
                path: () => path,
                api: () => api,
                scheme: () => scheme,
                system: () => system,
                file: () => file,
            },
            size: 'lg',
        });
    }

    handleRename({ api, scheme, system, path, newName, successCallback }) {
        const renameUrl = `/api/datafiles/${api}/${scheme}/rename/${system}/${encodeURIComponent(path)}/`;
        const renameRequest = this.$http.put(renameUrl, { new_name: newName }).then(successCallback);
    }

    /***************************************************************************
                                    DOWNLOAD
    ***************************************************************************/

    getDownloadUrl({ api, scheme, file }) {
        const downloadUrl = this.removeDuplicateSlashes(
            `/api/datafiles/${api}/${scheme}/download/${file.system}/${encodeURIComponent(file.path)}/`
        );
        switch (api) {
            case 'shared':
            case 'agave':
                if (file._links) {
                    return this.$http.get(downloadUrl, { params: { href: file._links.self.href } });
                }
                return this.$http.get(downloadUrl, { params: { href: '' } });
            case 'box':
            case 'dropbox':
            case 'googledrive':
                return this.$http.get(downloadUrl);
        }
    }

    download({ api, scheme, files }) {
        if (!Array.isArray(files)) {
            files = [files];
        }
        const downloads = files.map((file) => {
            return this.getDownloadUrl({ api, scheme, file }).then(function(resp) {
                var link = document.createElement('a');
                link.style.display = 'none';
                link.setAttribute('href', resp.data.href);
                link.setAttribute('download', 'null');
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            });
        });

        return this.$q.all(downloads);
    }

    /***************************************************************************
                                    TRASH
    ***************************************************************************/

    mapParamsToTrash({ api, scheme, file, trashPath }) {
        const trashUrl = this.removeDuplicateSlashes(
            `/api/datafiles/${api}/${scheme}/trash/${file.system}/${encodeURIComponent(file.path)}/`
        );
        return this.from(this.$http.put(trashUrl, { trash_path: trashPath }));
    }

    trash({ api, scheme, files, trashPath }) {
        const filePromises = files.map((file) => this.mapParamsToTrash({ api, scheme, file, trashPath }));

        forkJoin(filePromises).subscribe(() => this.$state.reload());
    }
}
