export default class MapSidebarCtrl {

  constructor ($scope, $window, $timeout) {
    'ngInject';
    this.$scope = $scope;
    this.LGeo = $window.LGeo;
    this.$timeout = $timeout;
    angular.element('header').hide();
    angular.element('nav').hide();
    angular.element('footer').hide();
    this.map = L.map('geo_map').setView([51.505, -0.09], 13);

    //method binding for callback, sigh...
    this.local_file_selected = this.local_file_selected.bind(this);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.map);
    this.drawnItems = new L.FeatureGroup();
    this.map.addLayer(this.drawnItems);

    let drawControl = new L.Control.Draw({
     position: 'topright',
     draw: {
      circle: false,
     },
     edit: {
       featureGroup: this.drawnItems,
       remove: true
     }
    });

    this.drawnItems.on('click', (e) => {
      if (this.current_layer == e.layer) {
        this.current_layer = null;
      } else {
        this.current_layer = e.layer;
      };
      this.$scope.$apply();
    });

    this.map.addControl(drawControl);

    this.map.on('draw:created',  (e) => {
      let object = e.layer;
      object.options.color = '#ff0000';
      object.options.fillColor = '#ff0000';
      object.options.fillOpacity = 0.8;
      this.drawnItems.addLayer(object);
      this.current_layer = object;
      this.$scope.$apply();
    });


  }

  open_file_dialog () {
    this.$timeout(()=> {
      angular.element('#local_file').trigger('click');
    });
  }

  local_file_selected (ev) {
    let file = ev.target.files[0];
    let reader = new FileReader();
    reader.readAsText(file);
    reader.onload = (e) => {
      let json = JSON.parse(e.target.result);
      L.geoJSON(json).getLayers().forEach( (l) => {;
        this.drawnItems.addLayer(l);
      });
      this.map.fitBounds(this.drawnItems.getBounds());
    };
  }

  load_image (ev) {
        //Get the photo from the input form
    var input = document.getElementById('Files');
    var files = input.files;
    for (var i = 0; i < files.length; i++) {
      var file = files[0];
      var reader = new FileReader; // use HTML5 file reader to get the file

      reader.onloadend =  ()=> {
          // get EXIF data
          var exif = EXIF.readFromBinaryFile(new BinaryFile(this.result));

          var lat = exif.GPSLatitude;
          var lon = exif.GPSLongitude;

          //Convert coordinates to WGS84 decimal
          var latRef = exif.GPSLatitudeRef || "N";
          var lonRef = exif.GPSLongitudeRef || "W";
          lat = (lat[0] + lat[1]/60 + lat[2]/3600) * (latRef == "N" ? 1 : -1);
          lon = (lon[0] + lon[1]/60 + lon[2]/3600) * (lonRef == "W" ? -1 : 1);

         //Send the coordinates to your map
          Map.AddMarker(lat,lon);
      };
      reader.readAsBinaryString(file);
    }
  }

  update_color () {
    this.current_layer.setStyle({color: this.current_layer.options.color});
  }

  update_fill () {
    this.current_layer.setStyle({fillColor: this.current_layer.options.fillColor});
    this.current_layer.setStyle({color: this.current_layer.options.fillColor});
  }

  update_opacity () {
    this.current_layer.setStyle({fillOpacity: this.current_layer.options.fillOpacity});
  }

  save_project () {
    console.log(this.drawnItems);
    this.drawnItems.eachLayer(function (l) {
      console.log(l.options);
    });
    let blob = new Blob([JSON.stringify(this.drawnItems.toGeoJSON())], {type: "application/json"});
    let url  = URL.createObjectURL(blob);

    let a = document.createElement('a');
    a.download    = "backup.json";
    a.href        = url;
    a.textContent = "Download backup.json";
    a.click();
  }

}
