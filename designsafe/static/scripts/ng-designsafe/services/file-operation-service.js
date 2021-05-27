import { Subject, from, of, forkJoin } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { takeLatestSubscriber } from './_rxjs-utils';

export class FileOperationService {
    constructor($http, $state, $rootScope, $uibModal, $q, ProjectService, Django, toastr) {
        'ngInject';
        this.$state = $state;
        this.$uibModal = $uibModal;
        this.Django = Django;
        this.$q = $q;
        this.toastr = toastr;
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
        let isHazmapper = files.length > 0
            ? files.some(e => e.name.endsWith('hazmapper'))
            : false;
        const tests = {
            copy: this.Django.context.authenticated && !isHazmapper && files.length > 0,
            move:
                this.Django.context.authenticated &&
                files.length > 0 &&
                !isHazmapper &&
                agaveDataStates.includes(this.$state.current.name),
            rename:
                this.Django.context.authenticated &&
                files.length === 1 &&
                !isHazmapper &&
                [...agaveDataStates].includes(this.$state.current.name),
            upload:
                this.Django.context.authenticated &&
                !isHazmapper &&
                agaveDataStates.includes(this.$state.current.name),
            preview:
                files.length === 1 &&
                !isHazmapper &&
                files[0].format !== 'folder',
            previewImages:
                files.length > 0 &&
                !isHazmapper &&
                !externalDataStates.includes(this.$state.current.name),
            download:
                files.length > 0 &&
                !isHazmapper &&
                !files.some((f) => f.format === 'folder') &&
                !externalDataStates.includes(this.$state.current.name),
            trash:
                this.Django.context.authenticated &&
                !isHazmapper &&
                files.length > 0 &&
                agaveDataStates.includes(this.$state.current.name),
        };
        return tests;
    }

    /**
     * Sets this.tests to enable/disable data depot toolbars based on currently
     * selected files.
     * @param {Object[]} files Array of file objects to get allowed operations for.
     */
    updateTests(files) {
        this.tests = this.getTests(files);
    }

    checkForEntities(file) {
        const inProject = ['projects.view', 'projects.curation'].includes(this.$state.current.name);
        if (!inProject) return false;
        const entities = this.ProjectService.current.getAllRelatedObjects();
        const entityFilePaths = entities.map((e) => e._filePaths).flat(1);
        const hasPathPrefix = entityFilePaths.some((entityPath) => entityPath.startsWith(file.path));
        const hasEntities = file._entities && file._entities.length;
        const hasTags = file._fileTags && file._fileTags.length;
        const projectFileTags = ((this.ProjectService.current || {}).value || {}).fileTags || [];
        const hasProjectFileTags = projectFileTags.some(
            (tag) => tag.path.replace(/^\/+/, '') === file.path.replace(/^\/+/, '')
        );

        return inProject && (hasPathPrefix || hasEntities || hasTags || hasProjectFileTags);
    }

    /***************************************************************************
                                    COPY MODAL
    ***************************************************************************/

    /**
     * Open the copy modal.
     * @param {Object} params Copy parameters.
     * @param {string} params.api API of current listing.
     * @param {string} params.scheme Scheme (private, published, community) of files to copy.
     * @param {string} params.system System to copy files from.
     * @param {Object[]} params.files Array of file objects {name, system, path} to copy.
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
     * @param {Object} params Copy parameters.
     * @param {string} params.srcApi API (agave, googledrive, box, dropbox} handling source files.
     * @param {Object[]} params.srcFiles Array of file objects {name, system, path} to copy.
     * @param {string} params.destApi API to copy to.
     * @param {string} params.destSystem System to copy to.
     * @param {string} params.destPath Path of directory to copy files into.
     * @param {function} params.successCallback Callback on successful copy of all files.
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
     * @param {string} params.srcApi API (agave, googledrive, box, dropbox} handling source files.
     * @param {string} params.destApi API to copy to.
     * @param {string} params.destSystem System to copy to.
     * @param {string} params.destPath Path of directory to copy files into.
     * @param {Object[]} params.files Array of file objects {name, system, path} to copy.
     * @param {function} params.successCallback Callback on successful copy of all files.
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
     * @param {Object} params Move parameters.
     * @param {string} params.api API of current listing.
     * @param {string} params.scheme Scheme (private, published, community) of files to move.
     * @param {string} params.system System to move files from.
     * @param {string} params.path Path to move files from.
     * @param {Object[]} params.files Array of file objects {name, system, path} to move.
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
     * @param {Object} params Move parameters.
     * @param {string} params.srcApi API (agave, googledrive, box, dropbox} handling source files.
     * @param {Object[]} params.srcFiles Array of file objects {name, system, path} to move.
     * @param {string} params.destApi API to move to.
     * @param {string} params.destSystem System to move to.
     * @param {string} params.destPath Path of directory to move files into.
     * @param {function} params.successCallback Callback on successful move of all files.
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
     * @param {object} params Object containing params for the copy operation.
     * @param {string} params.srcApi API (agave, googledrive, box, dropbox} handling source files.
     * @param {string} params.destApi API to move to.
     * @param {string} params.destSystem System to move to.
     * @param {string} params.destPath Path of directory to move files into.
     * @param {Object[]} params.srcFiles Array of file objects {name, system, path} to move.
     * @param {function} params.successCallback Callback on successful move of all files.
     */
    mapParamsToMove({ srcApi, destApi, destSystem, destPath, srcFiles, successCallback }) {
        const moveObservables = {};
        srcFiles.forEach((f) => {
            this.operations.move.status[f.key] = 'PROCESSING';
            let moveRequest;

            const moveUrl = this.removeDuplicateSlashes(`/api/datafiles/${srcApi}/private/move/${f.system}/${f.path}/`);
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

    /**
     * Open the preview modal.
     * @param {Object} params Copy parameters.
     * @param {string} params.api API of current listing.
     * @param {string} params.scheme Scheme (private, published, community) of files to preview.
     * @param {Object} params.file File object {name, system, path} to preview.
     */
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

    /**
     * Determine the correct endpoint to call to preview a file.
     * @param {Object} params Destructured parameters.
     * @param {Object} params.file File object {name, system, path} to preview.
     * @param {string} params.api API of current listing.
     * @param {string} params.scheme Scheme (private, published, community) of files to preview.
     */
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
    /**
     * Generate Jupyter Link
     * @param {Object} params
     * @param {String} params.system System where file is located
     * @param {String} params.path Path to file
     * @param {String} params.loc Specific location of notebook
     */
    openInJupyter(params) {
        const { user } = this.Django;
        const { system, path, loc } = params;
        let pathToFile = path;
        let specificLocation = loc;

        // Check Path
        if (path.includes(this.Django.user)) {
            const lengthUserName = this.Django.user.length;
            pathToFile = path.substring(lengthUserName + 2);
        }

        // Check Scheme
        if (loc === 'myData' || loc === 'communityData') {
            specificLocation = loc.charAt(0).toUpperCase() + loc.slice(1);
        } else if (loc.includes('projects')) {
            const prjNumber = this.ProjectService.current.value.projectId;
            specificLocation = 'projects/' + prjNumber;
        } else if (loc === 'publishedData.view') {
            specificLocation = 'Published';
        }

        // Check System
        if (system === 'designsafe.storage.published') specificLocation = 'NHERI-Published';

        return `http://jupyter.designsafe-ci.org/user/${user}/notebooks/${specificLocation}/${pathToFile}`;
    }

    /***************************************************************************
                                UPLOAD MODAL
    ***************************************************************************/

    /**
     * Open the file/folder upload modal
     * @param {Object} params Upload params.
     * @param {boolean} directory If true, upload a directory. If false, upload a single file.
     * @param {string} params.api API of current listing.
     * @param {string} params.scheme Scheme (private, published, community) of files to preview.
     * @param {string} params.system System to upload to.
     * @param {string} params.path Path to upload to.
     */
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

    /**
     * Push parameters onto the upload subject in order to trigger an upload operation.
     * @param {Object} params Upload params.
     * @param {boolean} directory If true, upload a directory. If false, upload a single file.
     * @param {string} params.api API of current listing.
     * @param {string} params.scheme Scheme (private, published, community) of files to preview.
     * @param {string} params.system System to upload to.
     * @param {string} params.path Path to upload to.
     * @param {File[]} params.files File objects to upload. These come from the user input.
     */
    handleUpload({ api, scheme, system, path, files, callback }) {
        const mapping = () => this.mapParamsToUpload({ api, scheme, system, path, files, callback });
        this.operations.upload.subscriber.next(mapping);
    }

    /**
     * Build an observable to handle file uploads. Uses forkJoin to trigger
     * a callback once all requests have resolved.
     * @param {Object} params Upload params.
     * @param {boolean} directory If true, upload a directory. If false, upload a single file.
     * @param {string} params.api API of current listing.
     * @param {string} params.scheme Scheme (private, published, community) of files to preview.
     * @param {string} params.system System to upload to.
     * @param {string} params.path Path to upload to.
     * @param {File[]} params.files File objects to upload. These come from the user input.
     */
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

    /***************************************************************************
                                IMAGE PREVIEW MODAL
    ***************************************************************************/
    /**
     * Filter an array of files and return only the images.
     * @param {Object[]} files Array of file objects ({name, system, path}).
     */
    filterImages(files) {
        return files.filter(({ path }) =>
            ['jpg', 'jpeg', 'png', 'tiff', 'gif'].includes(path.split('.').pop().toLowerCase())
        );
    }

    /**
     * Returns an observable of all images in an array of files. If the array
     * of files contains any folders, images in the top level of a folder are
     * returned as well.
     * @param {Object} params Destructured parameters.
     * @param {string} params.api API of current listing.
     * @param {string} params.scheme Scheme (private, published, community) of files to preview.
     * @param {string} params.system System containing files to preview.
     * @param {Object[]} params.files Array of file objects ({name, system, path}).
     */
    getPreviewableImages({ api, scheme, system, files }) {
        const images = this.filterImages(files);
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
                //tap callback pushes each image in each listing response onto the images array
                tap((responses) => {
                    responses.forEach((res) => {
                        const output = this.filterImages(res.data.listing);
                        images.push(...output);
                    });
                }),
                //the final output of the observable is the images array
                map((_) => images)
            );
        } else {
            // If there are no folders in the selection, just emit the selected images
            return of(images);
        }
    }

    /**
     * Opens the image preview modal.
     * @param {Object} params Destructured parameters.
     * @param {string} params.api API of current listing.
     * @param {string} params.scheme Scheme (private, published, community) of files to preview.
     * @param {string} params.system System containing files to preview.
     * @param {Object[]} params.files Array of file objects ({name, system, path}).
     */
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
                                MKDIR MODAL
    ***************************************************************************/

    /**
     * Opens the mkdir modal.
     * @param {Object} params Destructured parameters.
     * @param {string} params.api API of current listing.
     * @param {string} params.scheme Scheme (private, published, community) of current listing.
     * @param {string} params.system System of current listing
     * @param {string} params.path Path under which to create a folder.
     */
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

    /**
     * Perform the mkdir operation.
     * @param {Object} params Destructured parameters.
     * @param {string} params.api API of current listing.
     * @param {string} params.scheme Scheme (private, published, community) of current listing.
     * @param {string} params.system System of current listing
     * @param {string} params.path Path under which to create a folder.
     * @param {string} params.folderName Name of the folder to create.
     * @param {function} params.successCallback Callback on success.
     */
    handleMkdir({ api, scheme, system, path, folderName, successCallback }) {
        const mkdirUrl = this.removeDuplicateSlashes(
            `/api/datafiles/${api}/${scheme}/mkdir/${system}/${encodeURIComponent(path)}/`
        );
        const mkdirRequest = this.$http.put(mkdirUrl, { dir_name: folderName }).then(successCallback);
    }

    /***************************************************************************
                                RENAME MODAL
    ***************************************************************************/

    /**
     * Opens the rename modal.
     * @param {Object} params Destructured parameters.
     * @param {string} params.api API of current listing.
     * @param {string} params.scheme Scheme (private, published, community) of current listing.
     * @param {string} params.system System of current listing
     * @param {string} params.path Path to the file being renamed.
     * @param {Object} params.file File object ({name, system, path}) to rename.
     */
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

    /**
     * Rename a file.
     * @param {Object} params Destructured parameters.
     * @param {string} params.api API of current listing.
     * @param {string} params.scheme Scheme (private, published, community) of current listing.
     * @param {string} params.system System of current listing
     * @param {string} params.path Path to the file being renamed.
     * @param {string} params.newName New name for the file.
     * @param {function} params.successCallback Callback on success.
     */
    handleRename({ api, scheme, system, path, newName, successCallback }) {
        const renameUrl = this.removeDuplicateSlashes(
            `/api/datafiles/${api}/${scheme}/rename/${system}/${encodeURIComponent(path)}/`
        );
        const renameRequest = this.$http.put(renameUrl, { new_name: newName }).then(successCallback);
    }

    /***************************************************************************
                                    DOWNLOAD
    ***************************************************************************/

    /**
     * Determine the correct endpoint to call to download a file.
     * @param {Object} params Destructured parameters.
     * @param {string} params.api API of current listing.
     * @param {string} params.scheme Scheme (private, published, community) of files to preview.
     * @param {Object} params.file File object {name, system, path} to preview.
     */
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
                /* If we don't have the href, pass a blank string and the
                   backend operation will look it up. */
                return this.$http.get(downloadUrl, { params: { href: '' } });
            case 'box':
            case 'dropbox':
            case 'googledrive':
                return this.$http.get(downloadUrl);
        }
    }

    /**
     * Download a file.
     * @param {Object} params Destructured parameters.
     * @param {string} params.api API of current listing.
     * @param {string} params.scheme Scheme (private, published, community) of current listing.
     * @param {Object} params.files File objects ({name, system, path}) to download.
     */
    download({ api, scheme, files }) {
        if (!Array.isArray(files)) {
            files = [files];
        }
        const downloads = files.map((file) => {
            return this.getDownloadUrl({ api, scheme, file }).then(function (resp) {
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

    /**
     * Wraps a trash operation in an observable.
     * @param {Object} params Destructured parameters.
     * @param {string} params.api API of current listing.
     * @param {string} params.scheme Scheme (private, published, community) of current listing.
     * @param {Object} params.file File object ({name, system, path}) to trash.
     * @param {string} params.trashPath Path to the trash folder.
     */
    mapParamsToTrash({ api, scheme, file, trashPath }) {
        const trashUrl = this.removeDuplicateSlashes(
            `/api/datafiles/${api}/${scheme}/trash/${file.system}/${encodeURIComponent(file.path)}/`
        );
        return this.from(this.$http.put(trashUrl, { trash_path: trashPath }));
    }

    /**
     * Trash a set of files.
     * @param {Object} params Destructured parameters.
     * @param {string} params.api API of current listing.
     * @param {string} params.scheme Scheme (private, published, community) of current listing.
     * @param {Object} params.files File objects ({name, system, path}) to trash.
     * @param {string} params.trashPath Path to the trash folder.
     */
    trash({ api, scheme, files, trashPath }) {
        const hasEntities = files.map(this.checkForEntities).find((x) => x);
        if (hasEntities) {
            this.toastr.error('This data cannot be trashed until its associated entities have been removed');
            return;
        }
        const filePromises = files.map((file) => this.mapParamsToTrash({ api, scheme, file, trashPath }));
        forkJoin(filePromises).subscribe(() => this.$state.reload());
    }

    microsurvey({ projectId, fileName }) {
        const counterResponse = this.$http.put('/api/datafiles/microsurvey/').then((resp) => {
            if (resp.data.show) {
                var modal = this.$uibModal.open({
                    component: 'ddsurvey',
                    resolve: {
                        projectId: () => projectId,
                        fileName: () => fileName,
                    },
                    size: 'lg',
                    backdrop: 'static',
                });
            }
        });
    }
}
