(function(window, angular, $, _) {

  var mod = angular.module('designsafe');


  mod.filter('dsFileUrl', [function() {
    return function(file, baseHref) {
      if (typeof file === 'undefined'){
        return "";
      }
      var base = $('base');

      /*
       * We want to compact the path to remove "falsy" values. This is because
       * the path could be empty or null if we are listing the root of the resource.
       */
      var components = [file.source, file.system];
      if (file.path && file.path !== '/') {
        components.push(file.path);
      }
      components.push(file.name);
      var path = _.compact(components).join('/');

      if (file.type && file.type === 'folder') {
        path += '/';
      }

      if (baseHref && base.length) {
        path = base.attr('href').slice(0, -1) + path;
      }

      return path;
    };
  }]);

  mod.filter('dsFileDisplayName', [function() {
    return function(file){
      var displayName = file.name;
      if (typeof file.metadata === 'undefined'){
        return displayName;
      }
      if (file.path == '/' && file.metadata.project.title){
        displayName = file.metadata.project.title;
      }else if (displayName.toLowerCase().startsWith('experiment') &&
            file.metadata.experiment.title){
        displayName = file.metadata.experiment.title;
      }
      return displayName;
    };
  }]);

  mod.filter('dsListingDisplayName', [function(){
    return function(item){
      if (typeof item.metadata === 'undefined'){
        return item.name;
      }
      if (item.path  === '' || item.path === '/'){
        return item.metadata.project.title;
      } else if (item.path.split('/').length == 1 &&
                 typeof item.metadata.experiments !== 'undefined' &&
                 item.name.toLowerCase().startsWith('experiment')){
        var meta = _.findWhere(item.metadata.experiments, {name: item.name});
        var title = meta.title || item.name;
        return title;
      } else {
        return item.name;
      }
    };
  }]);

  mod.filter('dsTrailDisplayName', [function(){
    return function(item){
      if (typeof item.project === 'undefined'){
        return item.name;
      }
      var pathComponents = item.path.split('/');
      if (item.path === '' || item.path == '/'){
        return item.project;
      } else if (pathComponents.length === 1){
        var title = item.experiment || item.name;
        return title;
      } else {
        return item.name;
      }
    };
  }]);

  mod.filter('dsSharedFilePath', [function(){
    return function(path, listing){
      if (typeof listing === 'undefined' ||
          !listing || listing === null){
          listing = '';
      }
      var basePath = '';
      if (listing.name.toLowerCase() !== '$share'){
        if (listing.path == '/'){
          basePath = listing.name;
        } else {
          basePath = listing.path;
        }
      } else {
        basePath = '';
      }
      var re = new RegExp('^' + basePath + '/?');
      var retPath = path.replace(re, '');
      return retPath;
    };
  }]);

})(window, angular, jQuery, _);
