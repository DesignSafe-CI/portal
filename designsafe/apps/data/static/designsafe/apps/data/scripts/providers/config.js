(function(angular) {
    "use strict";
    angular.module('FileManagerApp').provider("fileManagerConfig", function() {

        var values = {
            appName: "Data Browser",
            defaultLang: "en",
            baseUrl: "/data/api/",
            // agave endpoints
            listUrl: "listings/",
            uploadUrl: "upload/",
            renameUrl: "rename/",
            moveUrl: "move/",
            copyUrl: "copy/",
            removeUrl: "delete/",
            shareUrl: "share/",
            editUrl: "",
            getContentUrl: "",
            createFolderUrl: "mkdir/",
            downloadFileUrl: "download",
            compressUrl: "",
            extractUrl: "",
            permissionsUrl: "pems/",
            metadataUrl: 'meta/',

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
                preview: true,
                remove: true,
                metadata: true,
                share: true
            },

            enablePermissionsRecursive: true,
            compressAsync: true,
            extractAsync: true,

            isEditableFilePattern: /\.(txt|html?|aspx?|ini|pl|py|md|css|js|log|htaccess|htpasswd|json|sql|xml|xslt?|sh|rb|as|bat|cmd|coffee|php[3-6]?|java|c|cbl|go|h|scala|vb)$/i,
            isPreviewableFilePattern: /\.(txt|jpe?g|gif|bmp|png|svg|tiff?|tcl|pdf)$/i,
            isImageFilePattern: /\.(jpe?g|gif|bmp|png|svg|tiff?)$/i,
            isExtractableFilePattern: /\.(gz|tar|rar|g?zip)$/i,
            isPdfFilePattern: /\.pdf$/i,
            isTextFilePattern: /\.(json|err|out|m|tex|sh|log|txt|tcl)$/i,
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
