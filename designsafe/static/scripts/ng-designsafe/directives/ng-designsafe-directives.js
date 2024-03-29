import _ from 'underscore';
import { $q } from '@uirouter/core';

export function fileModel($parse) {
    'ngInject';

    return {
        restrict: 'A',
        link(scope, element, attrs) {
            const model = $parse(attrs.fileModel);
            const modelSetter = model.assign;
            element.bind('change', function () {
                scope.$apply(function () {
                    if (attrs.multiple) {
                        modelSetter(scope, element[0].files);
                    } else {
                        modelSetter(scope, element[0].files[0]);
                    }
                });
            });
        },
    };
}

export function iframeOnload() {
    return {
        scope: {
            callBack: '&iframeOnload',
        },
        link(scope, element, attrs) {
            element.on('load', function () {
                scope.callBack();
            });
        },
    };
}

export function spinnerOnLoad() {
    return {
        restrict: 'A',
        link(scope, element) {
            element
                .parent()
                .prepend("<div class='text-center spinner'><i class='fa fa-spinner fa-pulse fa-3x fa-fw'></i></div>");
            element.css('display', 'none');
            element.on('load', function (ev) {
                element.parent().find('.spinner').remove();
                element.css('display', 'block');
            });
        },
    };
}

export function httpSrc($http) {
    'ngInject';

    return {
        restrict: 'A',
        link(scope, element, attrs) {
            const conf = {
                responseType: 'arraybuffer',
            };

            $http.get(attrs.httpSrc, conf).then(
                function (data) {
                    const arr = new Uint8Array(data);

                    let raw = '';
                    let i;
                    let j;
                    let subArray;
                    const chunk = 5000;
                    for (i = 0, j = arr.length; i < j; i += chunk) {
                        subArray = arr.subarray(i, i + chunk);
                        raw += String.fromCharCode.apply(null, subArray);
                    }

                    const b64 = btoa(raw);
                    attrs.$set('src', `data:image/jpeg;base64,${b64}`);
                },
                function (error) {}
            );
        },
    };
}

export function accessfiles() {
    return {
        scope: {
            accessfiles: '=',
        },
        link(scope, element, attributes) {
            element.bind('change', function (event) {
                scope.$apply(function () {
                    scope.accessfiles = event.target.files;
                });
            });
        },
    };
}

export function selectOnFocus() {
    return {
        restrict: 'A',
        link(scope, element, attrs) {
            element.on('focus', function () {
                this.select();
            });
        },
    };
}

export function dsDataDraggable() {
    function dragStart(e) {
        const ele = this;
        ele.style.opacity = '0.4';
        e.dataTransfer.effectAllowed = 'copyLink';
        e.dataTransfer.setData('text/plain', ele.getAttribute('data-ds-data'));
        this.classList.add('drag');
    }

    function dragOver(e) {
        e.preventDefault();
        const ele = this;
        ele.style.opacity = '1';
    }

    function onDrop(e) {
        e.stopPropagation();
        const ele = this;
        ele.style.opacity = '1';
    }

    function dataDraggable($scope, $element) {
        const el = $element[0];
        el.draggable = true;
        el.addEventListener('dragstart', dragStart);
        el.addEventListener('dragover', dragOver);
        el.addEventListener('dragend', dragOver);
        el.addEventListener('drop', onDrop);
    }
    return dataDraggable;
}

export function dsDraggable() {
    return {
        restrict: 'A',
        scope: {
            transferData: '=dsDragTransfer',
            dragStart: '&dsDragStart',
            dragEnter: '&dsDragEnter',
            dragOver: '&dsDragOver',
            dragLeave: '&dsDragLeave',
            dragEnd: '&dsDragEnd',
            dragDrop: '&dsDragDrop',
            allowDrag: '=dsDragEnabled',
        },
        link(scope, element) {
            if (scope.allowDrag) {
                element[0].draggable = true;
            }

            element.addClass('ds-drop-target');

            element[0].addEventListener('dragstart', function (e) {
                const handler = scope.dragStart();
                if (handler) {
                    handler(e, scope.transferData);
                }
            });

            element[0].addEventListener('dragenter', function (e) {
                const handler = scope.dragEnter();
                if (handler) {
                    handler(e, scope.transferData);
                }
            });

            element[0].addEventListener('dragover', function (e) {
                const handler = scope.dragOver();
                if (handler) {
                    handler(e, scope.transferData);
                }
            });

            const dragLeaveHandler = function (e) {
                const handler = scope.dragLeave();
                if (handler) {
                    handler(e, scope.transferData);
                }
            };
            element[0].addEventListener('dragleave', dragLeaveHandler);
            element[0].addEventListener('dragexit', dragLeaveHandler);

            element[0].addEventListener('dragend', function (e) {
                const handler = scope.dragEnd();
                if (handler) {
                    handler(e, scope.transferData);
                }
            });

            element[0].addEventListener('drop', function (e) {
                const handler = scope.dragDrop();
                if (handler) {
                    handler(e, scope.transferData);
                }
            });
        },
    };
}

export function dsInfiniteScroll() {
    return {
        restrict: 'A',
        scope: {
            scrollBottom: '&',
            scrollTop: '&',
            bottomHeight: '=',
        },
        link(scope, element, attrs) {
            const el = element[0];
            el.addEventListener('scroll', function (e) {
                const pos = el.offsetHeight + el.scrollTop;
                if (pos + 1 >= el.scrollHeight - scope.bottomHeight) {
                    scope.scrollBottom(el, pos);
                    scope.$apply();
                }
                if (pos <= el.offsetHeight) {
                    if (scope.scrollTop) {
                        scope.scrollTop(el, pos);
                        scope.$apply();
                    }
                }
            });
        },
    };
}

export function dsUser(UserService) {
    'ngInject';

    return {
        restrict: 'EA',
        scope: {
            username: '=',
            format: '@',
        },
        link(scope, element) {
            scope.$watch('username', function () {
                const format = scope.format || 'name';

                UserService.get(scope.username).then((user) => {
                    switch (format) {
                        case 'hname':
                            element.text(`${user.last_name}, ${user.first_name[0]}.`);
                            break;
                        case 'lname':
                            element.text(`${user.last_name}, ${user.first_name}`);
                            break;
                        case 'name':
                            element.text(`${user.first_name} ${user.last_name}`);
                            break;
                        case 'email':
                            element.text(user.email);
                            break;
                        case 'name-email':
                            element.text(`${user.first_name} ${user.last_name} <${user.email}>`);
                            break;
                        case 'name-username':
                            element.text(`${user.first_name} ${user.last_name} (${user.username})`);
                            break;
                        case 'name-username-email':
                            element.text(`${user.first_name} ${user.last_name} (${user.username}) <${user.email}>`);
                            break;
                        default:
                            element.text(user.username);
                    }
                });
            });
        },
    };
}

export function dsUserList(UserService) {
    'ngInject';

    return {
        restrict: 'EA',
        scope: {
            usernames: '=',
            format: '@',
        },
        link(scope, element) {
            scope.$watch('usernames', function () {
                if (typeof scope.usernames === 'undefined') {
                    return;
                }
                const userReq = [];
                const guests = [];

                scope.usernames.forEach((user) => {
                    if (typeof user === 'undefined') {
                    } else if (typeof user === 'string') {
                        userReq.push(user);
                    } else if (typeof user === 'object' && !user.guest) {
                        userReq.push(user.name);
                    } else if (user.guest) {
                        guests.push(user);
                    }
                });

                let otherData;
                let formattedNames = '';

                if (scope.format === 'other') {
                    UserService.getPublic(userReq).then((res) => {
                        const { userData } = res;

                        userData.forEach((user) => {
                            const otherMember = scope.usernames.find((u) => u.name === user.username);
                            user.order = otherMember.order;
                        });
                        otherData = userData.concat(guests);
                        otherData.sort((a, b) => {
                            return a.order - b.order;
                        });

                        otherData.forEach((u, i, arr) => {
                            if (i === arr.length - 1) {
                                formattedNames += `${u.lname}, ${u.fname}`;
                            } else {
                                formattedNames += `${u.lname}, ${u.fname}; `;
                            }
                        });
                        element.text(formattedNames);
                    });
                } else {
                    UserService.getPublic(userReq).then((res) => {
                        const { userData } = res;

                        userData.forEach((u, i, arr) => {
                            if (i === arr.length - 1) {
                                formattedNames += `${u.lname}, ${u.fname}`;
                            } else {
                                formattedNames += `${u.lname}, ${u.fname}; `;
                            }
                        });
                        element.text(formattedNames);
                    });
                }
            });
        },
    };
}

export function dsAuthorList(UserService) {
    'ngInject';

    return {
        restrict: 'EA',
        scope: {
            authors: '=',
            format: '@',
        },
        link(scope, element) {
            scope.$watch('authors', function () {
                if (!scope.authors) {
                    return;
                }
                const userReq = [];
                const guests = [];

                scope.authors.forEach((user) => {
                    if (user.authorship && !user.guest) {
                        userReq.push(user.name);
                    } else if (user.authorship && user.guest) {
                        guests.push(user);
                    }
                });

                UserService.getPublic(userReq).then((res) => {
                    const { userData } = res;
                    let authorData;
                    let formattedNames = '';

                    userData.forEach((user) => {
                        const relAuthor = scope.authors.find((author) => author.name === user.username);
                        user.order = relAuthor.order;
                    });
                    authorData = userData.concat(guests);
                    authorData.sort((a, b) => {
                        return a.order - b.order;
                    });
                    if (scope.format === 'hname') {
                        authorData.forEach((u) => {
                            formattedNames += `${u.lname}, ${u.fname[0]}. `;
                        });
                        element.text(formattedNames);
                    } else if (scope.format === 'citation') {
                        authorData.forEach((u, i, arr) => {
                            if (i === 0 && arr.length - 1 === 0) {
                                formattedNames += `${u.lname}, ${u.fname[0]}. `;
                            } else if (i === 0 && arr.length - 1 > 0) {
                                formattedNames += `${u.lname}, ${u.fname[0]}., `;
                            } else if (i === arr.length - 1) {
                                formattedNames += `${u.fname[0]}. ${u.lname}. `;
                            } else {
                                formattedNames += `${u.fname[0]}. ${u.lname}, `;
                            }
                        });
                        element.text(formattedNames);
                    } else {
                        authorData.forEach((u, i, arr) => {
                            if (i === arr.length - 1) {
                                formattedNames += `${u.lname}, ${u.fname}`;
                            } else {
                                formattedNames += `${u.lname}, ${u.fname}; `;
                            }
                        });
                        element.text(formattedNames);
                    }
                });
            });
        },
    };
}

export function dsFixTop($window) {
    'ngInject';

    const $win = angular.element($window); // wrap window object as jQuery object

    return {
        restrict: 'A',
        link(scope, element, attrs) {
            const topClass = attrs.dsFixTop; // get CSS class from directive's attribute value

            const navbar = $('.navbar-ds');
            let offsetTop = 0;
            $win.on('scroll', function (e) {
                offsetTop = $('.site-banner').outerHeight() + parseInt(navbar.css('margin-bottom'));
                if ($win.scrollTop() > offsetTop) {
                    element.addClass(topClass);
                    element.css({ top: navbar.position().top + navbar.outerHeight() });
                } else {
                    element.removeClass(topClass);
                }
            });
        },
    };
}

export function yamzTerm($http) {
    'ngInject';

    return {
        restrict: 'EA',
        scope: {
            termId: '@',
            title: '=',
        },
        link(scope, element, attrs) {
            element.attr('data-toggle', 'tooltip');
            element.tooltip({
                container: 'body',
                html: true,
                title: 'Loading...',
                placement(tip, el) {
                    const $el = $(el);
                    const pos = $el.position();
                    if (pos.left > $el.width() + 10 && pos.top > $el.height() + 10) {
                        return 'left';
                    }
                    if (pos.left < $el.width() + 10 && pos.top > $el.height() + 10) {
                        return 'right';
                    }
                    if (pos.top < $el.height() + 10 && pos) {
                        return 'bottom';
                    }
                    return 'top';
                },
            });
            element.on('mouseover', function (env) {
                const title = element.attr('data-original-title');
                if (typeof title === 'undefined' || title.length === 0 || title === 'Loading...') {
                    $http.get(`/api/projects/yamz/${scope.termId}`).then(function (res) {
                        const { data } = res;
                        const content =
                            `<p> <strong>Definition: </strong>${data.definition}<br/> <br/>` +
                            `<strong>Examples: </strong>${data.examples}</p>`;
                        element.attr('title', content);
                        element.tooltip('fixTitle');
                        // element.tooltip('show');
                    });
                }
            });
            element.on('mouseleave', function () {
                // element.tooltip('hide');
            });
        },
    };
}
