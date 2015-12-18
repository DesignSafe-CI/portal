(function(angular) {
    "use strict";
    angular.module('FileManagerApp').provider("fileManagerConfig", function() {

        var values = {
            appName: "Data Browser",
            defaultLang: "en",

            /*// edit these for now
            tenantUrl: "https://agave.iplantc.org",
            user: "mrojas",
            token: "b0e1b18d4f49de96d6990bf15e333ab",
            systemUrl: "data.iplantcollaborative.org",
            */

            // agave endpoints
            listUrl: "/data/api/listings/",
            uploadUrl: "/data/api/upload/",
            renameUrl: "",
            copyUrl: "",
            removeUrl: "/data/api/",
            editUrl: "",
            getContentUrl: "",
            createFolderUrl: "",
            downloadFileUrl: "/data/api/download",
            compressUrl: "",
            extractUrl: "",
            permissionsUrl: "/files/v2/pems/",

            sidebar: true,
            breadcrumb: true,
            allowedActions: {
                rename: false,
                copy: false,
                edit: false,
                changePermissions: true,
                compress: false,
                compressChooseName: false,
                extract: true,
                download: true,
                preview: false,
                remove: true
            },

            enablePermissionsRecursive: true,
            compressAsync: true,
            extractAsync: true,

            isEditableFilePattern: /\.(txt|html?|aspx?|ini|pl|py|md|css|js|log|htaccess|htpasswd|json|sql|xml|xslt?|sh|rb|as|bat|cmd|coffee|php[3-6]?|java|c|cbl|go|h|scala|vb)$/i,
            isImageFilePattern: /\.(jpe?g|gif|bmp|png|svg|tiff?)$/i,
            isExtractableFilePattern: /\.(gz|tar|rar|g?zip)$/i,
            tplPath: '/data/template/file-manager'
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
