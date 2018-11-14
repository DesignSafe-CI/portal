import _ from 'underscore';
import CommunityTemplate from './community.component.html';

class CommunityDataCtrl {
  

  constructor($scope, $state, Django, DataBrowserService) {
    'ngInject';
    this.$scope = $scope;
    this.$state = $state;
    this.Django = Django;
    this.DataBrowserService = DataBrowserService;

    this.resolveBreadcrumbHref = this.resolveBreadcrumbHref.bind(this);
    this.scrollToTop = this.scrollToTop.bind(this)
    this.scrollToBottom = this.scrollToBottom.bind(this)
    this.onBrowse = this.onBrowse.bind(this)
    this.onSelect = this.onSelect.bind(this)
    this.onDetail = this.onDetail.bind(this)
    this.showFullPath = this.showFullPath.bind(this)
    this.renderName = this.renderName.bind(this)
  }
  
  $onInit() {
    this.browser = this.DataBrowserService.state();
    this.state = {
      loadingMore: false,
      reachedEnd: false,
      page: 0
    };

    if (!this.browser.error) {
      this.browser.listing.href = this.$state.href('communityData', {
        system: this.browser.listing.system,
        filePath: this.browser.listing.path
      });
      _.each(this.browser.listing.children, (child) => {
        child.href = this.$state.href('communityData', { system: child.system, filePath: child.path });
      });
    }

    this.data = {
      customRoot: {
        name: 'Community Data',
        href: this.$state.href('communityData', {
          systemId: this.browser.listing.system,
          filePath: '/'
        })
      }
    };

  }


  resolveBreadcrumbHref(trailItem) {
    return this.$state.href('communityData', { systemId: this.browser.listing.system, filePath: trailItem.path });
  };

  scrollToTop() {
    return;
  };
  scrollToBottom() {
    this.DataBrowserService.scrollToBottom();
  };

  onBrowse($event, file) {
    $event.preventDefault();
    $event.stopPropagation();

    var systemId = file.system || file.systemId;
    var filePath;
    if (file.path == '/') {
      filePath = file.path + file.name;
    } else {
      filePath = file.path;
    }
    if (typeof (file.type) !== 'undefined' && file.type !== 'dir' && file.type !== 'folder') {
      this.DataBrowserService.preview(file, this.browser.listing);
    } else {
      this.$state.go('communityData', { systemId: file.system, filePath: file.path }, { reload: true });
    }
  };

  onSelect($event, file) {
    $event.preventDefault();
    $event.stopPropagation();

    if ($event.ctrlKey || $event.metaKey) {
      var selectedIndex = this.browser.selected.indexOf(file);
      if (selectedIndex > -1) {
        this.DataBrowserService.deselect([file]);
      } else {
        this.DataBrowserService.select([file]);
      }
    } else if ($event.shiftKey && this.browser.selected.length > 0) {
      var lastFile = this.browser.selected[this.browser.selected.length - 1];
      var lastIndex = this.browser.listing.children.indexOf(lastFile);
      var fileIndex = this.browser.listing.children.indexOf(file);
      var min = Math.min(lastIndex, fileIndex);
      var max = Math.max(lastIndex, fileIndex);
      this.DataBrowserService.select($scope.browser.listing.children.slice(min, max + 1));
    } else if (typeof file._ui !== 'undefined' &&
      file._ui.selected) {
      this.DataBrowserService.deselect([file]);
    } else {
      this.DataBrowserService.select([file], true);
    }
  };

  showFullPath(item) {
    if (this.browser.listing.path != '$PUBLIC' &&
      item.parentPath() != this.browser.listing.path &&
      item.parentPath() != '/') {
      return true;
    } else {
      return false;
    }
  };

  onDetail($event, file) {
    $event.stopPropagation();
    this.DataBrowserService.preview(file, this.browser.listing);
  };

  renderName(file) {
    if (typeof file.metadata === 'undefined' ||
      file.metadata === null ||
      _.isEmpty(file.metadata)) {
      return file.name;
    }
    var pathComps = file.path.split('/');
    var experiment_re = /^experiment/;
    if (file.path[0] === '/' && pathComps.length === 2) {
      return file.metadata.project.title;
    }
    else if (file.path[0] !== '/' &&
      pathComps.length === 2 &&
      experiment_re.test(file.name.toLowerCase())) {
      return file.metadata.experiments[0].title;
    }
    return file.name;
  };

}

export const CommunityComponent = {
  controller: CommunityDataCtrl,
  controllerAs: '$ctrl',
  template: CommunityTemplate
}