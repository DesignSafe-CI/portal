export class FileMetaService {
    constructor($http, $q) {
        'ngInject';
        this.$http = $http;
        this.$q = $q;
        this.baseFileMetaPath = "/api/restheart/files/v3/"
    }

    /**
     * Get file metadata document
     * @param {Object} options
     * @param {string} options.system
     * @param {string} options.filePath
     * @returns {Promise}
     */
    get(options) {
        let path = `${this.baseFileMetaPath}${options.system}${options.filePath}`;
        return this.$http.get(path);
    }

    /**
     * Create/Update a file metadata document
     * @param {Object} options
     * @param {string} options.system
     * @param {string} options.filePath
     * @param {Object} options.body
     * @returns {Promise}
     */
    save(options) {
        let path = `${this.baseFileMetaPath}${options.system}${options.filePath}`;
        return this.$http.post(path, options.body);
    }

    /**
     * Create/Update a file metadata document
     * @param {Object} options
     * @param {string} options.docId
     * @returns {Promise}
     */
    delete(options) {
        let path = `${this.baseFileMetaPath}${options.docId}`;
        console.log(path);
        return this.$http.delete(path);
    }
}
