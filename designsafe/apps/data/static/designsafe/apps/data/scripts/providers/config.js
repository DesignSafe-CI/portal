(function(angular) {
    "use strict";
    angular.module('FileManagerApp').provider("fileManagerConfig", function() {

        var values = {
            appName: "Data Browser",
            defaultLang: "en",

            // agave endpoints
            listUrl: "/data/api/listings/",
            uploadUrl: "/data/api/upload/",
            renameUrl: "/data/api/rename/",
            moveUrl: "/data/api/move/",
            copyUrl: "/data/api/copy/",
            removeUrl: "/data/api/delete/",
            editUrl: "",
            getContentUrl: "",
            createFolderUrl: "/data/api/manage",
            downloadFileUrl: "/data/api/download",
            compressUrl: "",
            extractUrl: "",
            permissionsUrl: "/files/v2/pems/",
            metadataUrl: '/data/api/meta/',

            sidebar: false,
            breadcrumb: true,
            allowedActions: {
                rename: true,
                copy: true,
                edit: false,
                changePermissions: false,
                compress: false,
                compressChooseName: false,
                extract: true,
                download: true,
                preview: false,
                remove: true,
                metadata: true
            },

            enablePermissionsRecursive: true,
            compressAsync: true,
            extractAsync: true,

            isEditableFilePattern: /\.(txt|html?|aspx?|ini|pl|py|md|css|js|log|htaccess|htpasswd|json|sql|xml|xslt?|sh|rb|as|bat|cmd|coffee|php[3-6]?|java|c|cbl|go|h|scala|vb)$/i,
            isImageFilePattern: /\.(jpe?g|gif|bmp|png|svg|tiff?)$/i,
            isExtractableFilePattern: /\.(gz|tar|rar|g?zip)$/i,
            tplPath: '/static/designsafe/apps/data/templates/file-manager'
        };

        return {
            $get: function() {
                return values;
            },
            set: function (constants) {
                angular.extend(values, constants);
            }
        };

    });
})(angular);
