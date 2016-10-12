(function(window, angular, $, _) {
  "use strict";

  var module = angular.module('ng.designsafe');

  module.factory('FileListing', ['$http', '$q', 'Logging', function($http, $q, Logging) {

    var logger = Logging.getLogger('ngDesignSafe.FileListing');

    function FileListing(json) {
      angular.extend(this, json);

      // wrap children as FileListing instances
      if (this.children && this.children instanceof Array) {
        this.children = _.map(this.children, function (child) {
          var fl = new FileListing(child);
          fl._parent = this;
          return fl;
        }, this);
      }
    }

    FileListing.prototype.fileMgr = 'agave';

    FileListing.prototype._baseUrl = '/api/agave/files';

    FileListing.prototype.listingUrl = function () {
      var urlParts = [this._baseUrl, 'listing', this.fileMgr];
      if (this.system) {
        urlParts.push(this.system);
      }
      if (this.path) {
        urlParts.push(this.path);
      }
      return urlParts.join('/');
    };

    FileListing.prototype.mediaUrl = function () {
      return [this._baseUrl, 'media', this.fileMgr, this.system, this.path].join('/');
    };

    FileListing.prototype.pemsUrl = function () {
      return [this._baseUrl, 'pems', this.fileMgr, this.system, this.path].join('/');
    };

    FileListing.prototype.agaveUri = function() {
      return 'agave://' + this.system + '/' + this.path;
    };

    /**
     * Make a copy of this FileResource.
     *
     * @param {object} options
     * @param {string} [options.path] The path to copy to
     * @param {string} [options.name] The new name for the copy
     * @returns {*}
     */
    FileListing.prototype.copy = function (options) {
      var body = {
        "action": "copy",
        "path": options.path,
        "name": options.name
      };
      return $http.put(this.mediaUrl(), body).then(function (resp) {
        return new FileListing(resp.data);
      });
    };

    FileListing.prototype.download = function () {
      var body = {
        "action": "download"
      };
      return $http.put(this.mediaUrl(), body).then(function (resp) {
        return resp.data;
      });
    };

    FileListing.prototype.fetch = function () {
      var self = this;
      return $http.get(this.listingUrl()).then(function (resp) {
        angular.extend(self, resp.data);

        // wrap children as FileListing instances
        if (self.children && self.children instanceof Array) {
          self.children = _.map(self.children, function (child) {
            var fl = new FileListing(child);
            fl._parent = self;
            return fl;
          }, self);
        }

        return self;
      });
    };

    FileListing.prototype.icon = function() {
      if (this.type === 'dir') {
        return 'fa-folder';
      }

      var icon;
      var ext = this.name.split('.').pop().toLowerCase();
      switch (ext) {
        case 'zip':
        case 'tar':
        case 'gz':
        case 'bz2':
          icon = 'fa-file-archive-o';
          break;
        case 'png':
        case 'jpg':
        case 'jpeg':
        case 'gif':
        case 'tif':
        case 'tiff':
          icon = 'fa-file-image-o';
          break;
        case 'pdf':
          icon = 'fa-file-pdf-o';
          break;
        case 'doc':
        case 'docx':
          icon = 'fa-file-word-o';
          break;
        case 'xls':
        case 'xlsx':
          icon = 'fa-file-excel-o';
          break;
        case 'ppt':
        case 'pptx':
          icon = 'fa-file-powerpoint-o';
          break;
        case 'mov':
        case 'mp4':
          icon = 'fa-file-video-o';
          break;
        case 'mp3':
        case 'wav':
          icon = 'fa-file-audio-o';
          break;
        case 'txt':
        case 'out':
        case 'err':
          icon = 'fa-file-text-o';
          break;
        case 'tcl':
        case 'sh':
        case 'json':
          icon = 'fa-file-code-o';
          break;
        default:
          icon = 'fa-file-o';
      }
      return icon;
    };

    /**
     * Make a new child directory.
     *
     * @param {object} options
     * @param {string} options.name The name for the new directory
     */
    FileListing.prototype.mkdir = function (options) {
      if (this.type !== 'dir') {
        throw new Error('FileListing.mkdir can only be called for "dir" type FileListings.');
      }

      var self = this;
      var body = {
        "action": "mkdir",
        "name": options.name
      };
      return $http.put(this.mediaUrl(), body).then(function (resp) {
        var newDir = new FileListing(resp.data);
        self.children.push(newDir);
        return newDir;
      });
    };

    /**
     * Move a file to a new location.
     *
     * @param {object} options
     * @param {string} options.path The path of the destination directory for the operation
     * @param {string} [options.name] An optional new name for the moved file
     * @returns {*}
     */
    FileListing.prototype.move = function (options) {
      var self = this;
      var body = {
        "action": "move",
        "path": options.path,
        "name": options.name
      };
      return $http.put(this.mediaUrl(), body).then(function (resp) {
        var newDir = new FileListing(resp.data);
        /* remove this file from previous parent's children */
        if (self._parent) {
          self._parent.children = _.reject(self._parent.children, function (child) {
            return child.path === self.path;
          });
          self._parent = undefined;
        }
        return newDir;
      });
    };

    /**
     * Get the permissions for this FileListing.
     *
     * @return {Promise}
     */
    FileListing.prototype.listPermissions = function() {
      if (this._permissions) {
        return $q.resolve(this._permissions);
      } else {
        var self = this;
        return $http.get(this.pemsUrl()).then(function (resp) {
          self._permissions = resp.data;
          return self._permissions;
        });
      }
    };

    /**
     * Request a preview of the file. Returns a promise that will be resolved
     * with an object with a single attribute `href` where the preview can be
     * fetched. If a preview is unavailable the promise will be rejected.
     *
     * @return {Promise}
     */
    FileListing.prototype.preview = function () {
      var body = {
        "action": "preview"
      };
      return $http.put(this.mediaUrl(), body).then(function (resp) {
        return resp.data;
      });
    };

    /**
     * Rename a file. Implicitly, this is a move operation with the same path and a new
     * name.
     *
     * @param {object} options
     * @param {string} options.name The new name for this file.
     * @returns {Promise}
     */
    FileListing.prototype.rename = function (options) {
      var self = this;
      var body = {
        "action": "rename",
        "name": options.name
      };
      return $http.put(this.mediaUrl(), body).then(function (resp) {
        /* update self */
        angular.extend(self, resp.data);
      });
    };


    /**
     * Removes the current file
     *
     * @return {Promise}
     */
    FileListing.prototype.rm = function () {
      var self = this;
      return $http.delete(this.mediaUrl()).then(function (resp) {
        /* remove from self._parent.children */
        if (self._parent) {
          self._parent.children = _.reject(self._parent.children, function (child) {
            return child.path === self.path;
          });
        }
      });
    };

    /**
     * Update sharing permissions on a file according to the given options.
     *
     * @param {object} options
     * @param {string} options.username The username of the user whose permissions to update
     * @param {string} options.permission The new permission value
     */
    FileListing.prototype.share = function (options) {
      return $http.post(this.pemsUrl(), options).then(function (resp) {
        return resp.data;
      })
    };


    /**
     * This is much like move, except with the implicit destination path of ~/.Trash.
     * This also will rename the file if a file with the same name already exists in
     * ~/.Trash.
     *
     * @returns {Promise}
     */
    FileListing.prototype.trash = function () {
      var self = this;
      var body = {
        "action": "trash"
      };
      return $http.put(this.mediaUrl(), body).then(function (resp) {
        var trashed = new FileListing(resp.data);

        /* remove this file from previous parent's children */
        if (self._parent) {
          self._parent.children = _.reject(self._parent.children, function (child) {
            return child.path === self.path;
          });
          self._parent = undefined;
        }
        if (trashed.name !== self.name) {
          // TODO notify user via Toastr
          window.alert('File was renamed to "' + trashed.name + '".');
        }
        return trashed;
      });
    };

    /**
     * Upload as a new file
     * @param {FormData} data The Multipart FormData
     */
    FileListing.prototype.upload = function (data) {
      return $http.post(this.mediaUrl(), data, {headers: {'Content-Type': undefined}})
        .then(function (result) {
          return result.data;
        });
    };


    // function FilePermission(json) {
    //   angular.extend(this, json);
    // }
    //
    //
    // FilePermission.prototype.permissionBit = function () {
    //   if (this.permission.read) {
    //     if (this.permission.write) {
    //       if (this.permission.execute) {
    //         return 'ALL';
    //       }
    //       return 'READ_WRITE';
    //     }
    //     return 'READ';
    //   } else if (this.permission.write) {
    //     if (this.permission.execute) {
    //       return 'WRITE_EXECUTE';
    //     }
    //     return 'WRITE';
    //   } else if (this.permission.execute) {
    //     return 'EXECUTE';
    //   }
    //   return 'NONE';
    // };

    /**
     *
     * @param {object} options
     * @param {string} options.system
     * @param {string} options.path
     * @returns {Promise}
     */
    function get(options) {
      var fl = new FileListing(options);
      return fl.fetch();
    }


    /**
     * Public API
     */
    return {
      get: get
    };

  }]);

})(window, angular, jQuery, _);
