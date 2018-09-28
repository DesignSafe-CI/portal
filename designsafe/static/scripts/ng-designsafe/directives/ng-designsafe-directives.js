
export function fileModel($parse) {
    return {
      restrict: 'A',
      link: function(scope, element, attrs) {
        var model = $parse(attrs.fileModel);
        var modelSetter = model.assign;
        element.bind('change', function(){
          scope.$apply(function(){
            if (attrs.multiple) {
              modelSetter(scope, element[0].files);
            }
            else {
              modelSetter(scope, element[0].files[0]);
            }
          });
        });
      }
    };
  };

  export function spinnerOnLoad() {
    return {
      restrict: 'A',
      link: function (scope, element) {
        element.parent().prepend("<div class='text-center spinner'><i class='fa fa-spinner fa-pulse fa-3x fa-fw'></i></div>");
        element.css('display', 'none');
        element.on('load', function (ev) {
          element.parent().find(".spinner").remove();
          element.css('display', 'block');
        });

      }
    };

  }

export function httpSrc($http) {
   return {
      restrict: 'A',
      link: function (scope, element, attrs) {
        var conf = {
            responseType: 'arraybuffer',
        };

        $http.get(attrs.httpSrc, conf)
          .success(function(data) {
            var arr = new Uint8Array(data);

            var raw = '';
            var i, j, subArray, chunk = 5000;
            for (i = 0, j = arr.length; i < j; i += chunk) {
                subArray = arr.subarray(i, i + chunk);
                raw += String.fromCharCode.apply(null, subArray);
            }

            var b64 = btoa(raw);
            attrs.$set('src', "data:image/jpeg;base64," + b64);
          })
          .error(function (error) {
            console.log(error);
          });
      }
    };
  }

 export function accessfiles() {
    return {
      scope: {
        accessfiles: '='
      },
      link: function(scope, element, attributes) {

        element.bind('change', function(event) {
          scope.$apply(function() {
            scope.accessfiles = event.target.files;
          });
        });
      }
    };
  }

  export function selectOnFocus() {
    return {
      restrict: 'A',
      link: function(scope, element, attrs) {
        element.on('focus', function() {
          this.select();
        });
      }
    };
  }

export function dsDataDraggable() {
    function dragStart(e) {
      var ele = this;
      ele.style.opacity = '0.4';
      e.dataTransfer.effectAllowed = 'copyLink';
      e.dataTransfer.setData('text/plain', ele.getAttribute('data-ds-data'));
      this.classList.add('drag');
    }

    function dragOver(e) {
      e.preventDefault();
      var ele = this;
      ele.style.opacity = '1';
    }

    function onDrop(e) {
      e.stopPropagation();
      var ele = this;
      ele.style.opacity = '1';
    }

    function dataDraggable($scope, $element) {
      var el = $element[0];
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
        allowDrag: '=dsDragEnabled'
      },
      link: function(scope, element) {
        if (scope.allowDrag) {
          element[0].draggable = true;
        }

        element.addClass('ds-drop-target');

        element[0].addEventListener('dragstart', function (e) {
          var handler = scope.dragStart();
          if (handler) {
            handler(e, scope.transferData);
          }
        });

        element[0].addEventListener('dragenter', function (e) {
          var handler = scope.dragEnter();
          if (handler) {
            handler(e, scope.transferData);
          }
        });

        element[0].addEventListener('dragover', function (e) {
          var handler = scope.dragOver();
          if (handler) {
            handler(e, scope.transferData);
          }
        });

        var dragLeaveHandler = function(e) {
          var handler = scope.dragLeave();
          if (handler) {
            handler(e, scope.transferData);
          }
        };
        element[0].addEventListener('dragleave', dragLeaveHandler);
        element[0].addEventListener('dragexit', dragLeaveHandler);

        element[0].addEventListener('dragend', function (e) {
          var handler = scope.dragEnd();
          if (handler) {
            handler(e, scope.transferData);
          }
        });

        element[0].addEventListener('drop', function (e) {
          var handler = scope.dragDrop();
          if (handler) {
            handler(e, scope.transferData);
          }
        });
      }
    };
  }

export function dsInfiniteScroll(){
    return {
      restrict: 'A',
      scope: {
        scrollBottom: '&',
        scrollTop: '&',
        bottomHeight: '='
      },
      link: function(scope, element, attrs){
        var el = element[0];
        el.addEventListener('scroll', function(e){
          var pos = el.offsetHeight + el.scrollTop;
          if (pos >= el.scrollHeight - scope.bottomHeight){
            scope.scrollBottom(el, pos);
          }
          if (pos <= el.offsetHeight){
            if (scope.scrollTop){
              scope.scrollTop(el, pos);
            }
          }
        });
      }
    };
  }

  export function dsUser(UserService) {
    return {
      restrict: 'EA',
      scope: {
        username: '=',
        format: '@'
      },
      link: function(scope, element) {
        var format = scope.format || 'name';

        UserService.get(scope.username).then(function (user) {
          switch (format) {
            case 'lname':
              element.text(user.last_name + ', ' + user.first_name + ';');
              break;
            case 'name':
              element.text(user.first_name + ' ' + user.last_name);
              break;
            case 'email':
              element.text(user.email);
              break;
            case 'name-email':
              element.text(user.first_name + ' ' + user.last_name + ' <' + user.email + '>');
              break;
            case 'name-username':
              element.text(user.first_name + ' ' + user.last_name + ' (' + user.username + ')');
              break;
            case 'name-username-email':
              element.text(user.first_name + ' ' + user.last_name + ' (' + user.username + ') <' + user.email + '>');
              break;
            default:
              element.text(user.username);
          }
        });
      }
    };
  }

 export function dsFixTop($window) {
    var $win = angular.element($window); // wrap window object as jQuery object

    return {
      restrict: 'A',
      link: function (scope, element, attrs) {
        var topClass = attrs.dsFixTop; // get CSS class from directive's attribute value

        var navbar = $('.navbar-ds');
		var offsetTop = 0;
        $win.on('scroll', function (e) {
            offsetTop = $('.site-banner').outerHeight() + parseInt(navbar.css('margin-bottom'));
           if ($win.scrollTop() > offsetTop) {
            element.addClass(topClass);
			element.css({top: navbar.position().top + navbar.outerHeight()});
          } else {
            element.removeClass(topClass);
          }
        });
      }
    };
  }

  export function yamzTerm($http){
    return {
        restrict: 'EA',
        scope: {
            termId: '@',
            title: '='
        },
        link: function(scope, element, attrs){
          element.attr('data-toggle', 'tooltip');
          element.tooltip({container: 'body',
                           html: true,
                           title:'Loading...',
                           placement: function(tip, el){
                               var $el = $(el);
                               var pos = $el.position();
                               if (pos.left > $el.width() + 10 && pos.top > $el.height() + 10){
                                   return "left";
                               } else if (pos.left < $el.width() + 10 && pos.top > $el.height() + 10){
                                   return "right";
                               }else if (pos.top < $el.height() + 10 && pos){
                                   return "bottom";
                               } else {
                                   return "top";
                               }
                           }});
          element.on('mouseover', function(env){
              var title = element.attr('data-original-title');
              if (typeof title === 'undefined' || title.length === 0 || title === 'Loading...'){
                $http.get('/api/projects/yamz/' + scope.termId)
                  .then(function(res){
                      var data = res.data;
                      var content = '<p> <strong>Definition: </strong>' + data.definition +
                                    '<br/> <br/>' +
                                    '<strong>Examples: </strong>' + data.examples + '</p>';
                      element.attr('title', content);
                      element.tooltip('fixTitle');
                      //element.tooltip('show');
                  });
              }
          });
          element.on('mouseleave', function(){
            //element.tooltip('hide');
          });
        }
    };
  }
