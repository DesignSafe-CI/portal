/**
 * Notification Service
 * @function
 * @param {Object} $rootScope
 * @param {Object} logger
 * @param {Object} toastr
 * @param {Object} djangoUrl
 * @param {Object} $http
 * @param {Object} $mdToast
 * @return {Object} service;
 */
function NotificationService(
    $rootScope,
    logger,
    toastr,
    djangoUrl,
    $http,
    $mdToast
) {
    'ngInject';
    let processors = {};

    /**
     * renderLink
     * @function
     * @param {Object} msg
     * @return {string} url
     */
    function renderLink(msg) {
        const eventType = msg.event_type.toLowerCase();
        let url = '';
        if (typeof processors[eventType] !== 'undefined' &&
            typeof processors[eventType].renderLink !== 'undefined' &&
            typeof processors[eventType].renderLink === 'function') {
            url = processors[eventType].renderLink(msg);
        }
        if (msg.status != 'ERROR') {
            if (msg.event_type == 'job') {
                url=djangoUrl.reverse(
                    'designsafe_workspace:process_notification',
                    {pk: msg.pk}
                );
            } else if (msg.event_type == 'data_depot') {
                url=djangoUrl.reverse(
                    'designsafe_api:process_notification',
                    {pk: msg.pk}
                );
            }
        }
        return url;
    }

    /**
     * init
     * @function
     */
    function init() {
        logger.log('Connecting to local broadcast channels');
        $rootScope.$on('ds.wsBus:notify', processMessage);
        $rootScope.$on('ds.notify:default', processToastr);
    }

    /**
     * Process Message
     * @param {Object} e
     * @param {Object} msg
     */
    function processMessage(e, msg) {
        processToastr(e, msg);
        processors.notifs.process(msg);
        const eventType = msg.event_type.toLowerCase();

        if (typeof processors[eventType] !== 'undefined' &&
            typeof processors[eventType].process !== 'undefined' &&
            typeof processors[eventType].process === 'function') {
            processors[eventType].process(msg);
        } else {
            logger.warn('Process var is not a function for this event type. ', processors);
        }
    }

    /**
     * Return a list of notifications.
     * @function
     * @param {Object} opts
     * @return {Object} $http - promise object
     */
    function list(opts) {
        return $http(
            {
                url: djangoUrl.reverse('designsafe_api:index'),
                method: 'GET',
                params: opts,
            }
        ).then(resp => {
            resp.data.notifs.forEach(
                d => {
                    d.datetime = new Date(d.datetime *1000);
                }
            );
            return resp.data;
        }, err => {
            return err;
        });
    }

    /**
     * Delete a notification
     * @function
     * @param {int} pk
     * @return {Object} $http - promise
     */
    function del(pk) {
        return $http.delete(
            djangoUrl.reverse(
                'designsafe_api:delete_notification',
                {pk: encodeURIComponent(pk)}
            )
        );
    }

    /**
     * Process toastr
     * @function
     * @param {Object} e
     * @param {Object} msg
     */
    function processToastr(e, msg) {
        try {
            // msg.extra = JSON.parse(msg.extra);
            msg.extra = (typeof msg.extra === 'string') ? JSON.parse(msg.extra) : msg.extra;
        } catch (error) {
            logger.error('Message\'s extra is not JSON or JSON string. Error: ', error);
        }
        const toastLevel = msg.status.toLowerCase();
        // Convert operation name to title case.
        // Operation name might be something like 'copy_file', 'job_submission' or 'publish'
        const toastTitle = msg.operation.replace(/_/g, ' ').replace(/\w\S*/,
            s => {
                return s.charAt(0).toUpperCase() + s.substr(1).toLowerCase();
            });

        const toast = $mdToast.simple({
            template:
                '<md-toast>' +
                    '<div class="md-toast-content">' +
                        '<h4>' + toastTitle + '</h4>' +
                        '<p>' + msg.message + '</p>' +
                    '</div>' +
                '</md-toast>',
            hideDelay: 6000,
            parent: $('#toast-container'),
            toastClass: toastLevel,
        });

        const toastViewLink = renderLink(msg);
        if (typeof toastViewLink !== 'undefined') {
            toast.action('View');
            $mdToast.show(toast).then(function(response) {
                if (response == 'ok') {
                    window.location.href = toastViewLink;
                }
            });
        } else {
            $mdToast.show(toast);
        }
    }

    return {
        init: init,
        processors: processors,
        list: list,
        delete: del,
    };
}

/**
 * Notification Service Provider
 * @class
 */
export class NotificationServiceProvider {
    /* @ngInject*/
    /**
     * $get
     * @method
     * @param {Object} $rootScope
     * @param {Object} logger
     * @param {Object} toastr
     * @param {Object} djangoUrl
     * @param {Object} $http
     * @param {Object} $mdToast
     * @return {function} Notification Service
     */
    $get(
        $rootScope,
        logger,
        toastr,
        djangoUrl,
        $http,
        $mdToast
    ) {
        return new NotificationService(
            $rootScope,
            logger,
            toastr,
            djangoUrl,
            $http,
            $mdToast
        );
    }
}
