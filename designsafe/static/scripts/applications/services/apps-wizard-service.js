angular.module('schemaFormWizard', [])
.config(['schemaFormDecoratorsProvider', function (decoratorsProvider) {
    decoratorsProvider.addMapping(
        'bootstrapDecorator',
        'wizard',
        'wizard.html'
    );
}]).
service('AppsWizard', ['$q', function ($q) {

    this.clone = function (obj) {
        var copy;
        if (null == obj || "object" != typeof obj) {
            return obj;
        }
        if (obj instanceof Date) {
            copy = new Date();
            copy.setTime(obj.getTime());
            return copy;
        }
        if (obj instanceof Array) {
            copy = [];
            for (var i = 0, len = obj.length; i < len; i++) {
                copy[i] = this.clone(obj[i]);
            }
            return copy;
        }
        if (obj instanceof Object) {
            copy = {};
            for (var attr in obj) {
                if (obj.hasOwnProperty(attr)) copy[attr] = this.clone(obj[attr]);
            }
            return copy;
        }
        throw new Error("Unable to copy obj! Its type isn't supported.");
    };

    this.validateTab = function (scope, tabIndex) {
        var dumpTabs = this.clone(scope.form[0].tabs);
        var dumpModel = this.clone(scope.model);
        for (var i = 0; i < scope.form[0].tabs.length; i++) {
            if (i > tabIndex) {
                scope.form[0].tabs[i].items = [];
            }
        }
        scope.$broadcast('schemaFormValidate');
        var deferred = $q.defer();
        setTimeout(function () {
            scope.form[0].tabs = dumpTabs;
            scope.model = dumpModel;
            if (scope.myForm.$valid) {
                deferred.resolve();
            } else {
                deferred.reject();
            }
        }, 100);
        return deferred.promise;
    };

    this.activateTab = function (scope, tabIndex) {
        var total = scope.form[0].tabs.length;

        for (var i = 0; i < total; i++) {
            var tab = scope.form[0].tabs[i];
            tab.active = (i == tabIndex);
        }

        var current = tabIndex + 1;
        var $percent = (current / total) * 100;

        $('#bar').find('.progress-bar').css({
            width: $percent + '%'
        });
    };

    this.displayArrayButtons = function (form) {
        for (var k in form) {
            if (k == 'add' && form[k] === false) {
                form[k] = null;
            }
            if (k == 'remove' && form[k] === false) {
                form[k] = null;
            }
            if (typeof form[k] == "object" && form[k] !== null) {
                this.displayArrayButtons(form[k]);
            }
        }
    };

}]);

angular.module("schemaFormWizard").run(["$templateCache", function($templateCache) {
    $templateCache.put("wizard-buttons.html","<div class=\"btn-group schema-form-actions\">\n    <button type=\"button\" class=\"btn btn-default\" ng-disabled=\"currentTabIndex == 0\" ng-click=\"previousStep()\">Previous</button>\n    <button type=\"button\" class=\"btn btn-default\" ng-disabled=\"currentTabIndex == form[0].tabs.length-1\" ng-click=\"nextStep()\">Next</button>\n    <button type=\"button\" class=\"btn btn-default\" ng-disabled=\"myForm.$invalid\" ng-click=\"submit()\">Submit</button>\n</div>\n");
    $templateCache.put("wizard.html","<div ng-init=\"selected = { tab: 0 }\" class=\"schema-form-tabs {{form.htmlClass}}\">\n    <ul class=\"nav nav-pills nav-justified steps\">\n        <li ng-repeat=\"tab in form.tabs\"\n            class=\"disabled\"\n            ng-class=\"{active: tab.active}\">\n            <a class=\"disabled step\" ng-disabled=\"true\"><span class=\"number\">{{$index + 1}}</span> <span class=\"desc\">{{ tab.title }}</span> </a>\n        </li>\n    </ul>\n  <div id=\"bar\" class=\"progress progress-striped\" role=\"uib-progressbar\"> <div style=\"width: {{100/form.tabs.length}}%;\" class=\"progress-bar progress-bar-success\"> </div> </div>  <div class=\"tab-content {{form.fieldHtmlClass}}\">\n        <div class=\"tab-pane\"\n            ng-disabled\n            ng-repeat=\"tab in form.tabs\"\n            ng-show=\"tab.active\"\n            ng-class=\"{active: tab.active}\">\n            <bootstrap-decorator ng-repeat=\"item in tab.items\" form=\"item\"></bootstrap-decorator>\n        </div>\n    </div>\n</div>\n");
    0
}]);
