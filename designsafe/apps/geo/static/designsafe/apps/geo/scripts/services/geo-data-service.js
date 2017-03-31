import * as GeoUtils from '../utils/geo-utils';
import LayerGroup from '../models/layer_group';
import MapProject from '../models/map-project';


export default class GeoDataService {

  constructor ($http, $q, UserService) {
    'ngInject';
    this.$http = $http;
    this.$q = $q;
    this.UserService = UserService;
    this.image_icon = L.divIcon({
      iconSize: [40, 40],
      html: "<div style='background-color:red'></div>",
      className: 'leaflet-marker-photo'
    });
    this.active_project = null;
  }

  current_project(project) {
    if (!(project)) {
      return this.active_project;
    }
    this.active_project = project;
  }

  _resize_image (blob, max_width=400, max_height=400) {

    let base64 = this._arrayBufferToBase64(blob);
    // Create and initialize two canvas
    var canvas = document.createElement("canvas");
    var ctx = canvas.getContext("2d");
    var canvasCopy = document.createElement("canvas");
    var copyContext = canvasCopy.getContext("2d");

    // Create original image
    var img = new Image();
    img.src = base64;

    // Determine new ratio based on max size
    var ratio = 1;
    if(img.width > max_width)
      ratio = max_width / img.width;
    else if(img.height > max_height)
      ratio = max_height / img.height;

    // Draw original image in second canvas
    canvasCopy.width = img.width;
    canvasCopy.height = img.height;
    copyContext.drawImage(img, 0, 0);

    // Copy and resize second canvas to first canvas
    canvas.width = img.width * ratio;
    canvas.height = img.height * ratio;
    ctx.drawImage(canvasCopy, 0, 0, canvasCopy.width, canvasCopy.height, 0, 0, canvas.width, canvas.height);

    return canvas.toDataURL();
  }

  _arrayBufferToBase64( buffer ) {
    let binary = '';
    let bytes = new Uint8Array( buffer );
    let len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode( bytes[ i ] );
    }
    let encoded =  btoa( binary );
    return 'data:image/jpg;base64,' + encoded;
  }

  _from_kml(text_blob) {
    return this.$q( (res, rej) => {
      let features = [];
      let l = omnivore.kml.parse(text_blob);
      l.getLayers().forEach((d) => {
        d.feature.properties = {};
        features.push(d);
      });
      res(features);
    });
  }

  _from_kmz (blob) {
    return this.$q( (res, rej) => {
      let zipper = new JSZip();
      zipper.loadAsync(blob).then( (zip) => {

        //loop over all the files in the archive
        for (let key in zip.files) {
          let ext = key.split('.').pop();
          if (ext === 'kml') {
            return zip.files[key].async('text');
          }
        }
      }).then( (txt) => {
        let features = this._from_kml(txt);
        res(features);
      });
    });
  }

  _from_json (blob) {
    return this.$q( (res, rej) => {
      let features = [];
      L.geoJSON(blob).getLayers().forEach( (l) => {
        features.push(l);
      });
      res(features);
    });
  }

  _from_gpx (blob) {
    return this.$q( (res, rej) => {
      // console.log(text_blob)
      let features = [];
      let l = omnivore.gpx.parse(blob);
      l.getLayers().forEach((d) => {
        features.push(d);
      });
      res(features);
    });
  }

  _make_image_marker (lat, lon, thumb, preview) {
    let icon = L.divIcon({
      iconSize: [40, 40],
      html: "<div class='image' style='background:url(" + thumb + ");background-size: 100% 100%'></div>",
      className: 'leaflet-marker-photo'
    });

    let marker = L.marker([lat, lon], {icon: icon})
          .bindPopup("<img src=" + preview + ">",
              {
                className: 'leaflet-popup-photo',
                maxWidth: "auto",
                // maxHeight: 400
              });

    return marker;
  }

  _from_image (file) {
    return this.$q( (res, rej) => {
      let exif = EXIF.readFromBinaryFile(file);
      let encoded = this._arrayBufferToBase64(file);
      let lat = exif.GPSLatitude;
      let lon = exif.GPSLongitude;

      //Convert coordinates to WGS84 decimal
      let latRef = exif.GPSLatitudeRef || "N";
      let lonRef = exif.GPSLongitudeRef || "W";
      lat = (lat[0] + lat[1]/60 + lat[2]/3600) * (latRef == "N" ? 1 : -1);
      lon = (lon[0] + lon[1]/60 + lon[2]/3600) * (lonRef == "W" ? -1 : 1);
      let thumb = this._resize_image(file, 100, 100);
      let preview = this._resize_image(file, 400, 400);
      // let hq = this._resize_image(file, 800, 800);
      let marker = this._make_image_marker(lat, lon, thumb, preview);
      marker.image_src = preview;
      res([marker]);
    });
  }


  _from_dsmap (json) {
    return this.$q( (res, rej) => {
      json = JSON.parse(json);
      let project = new MapProject();
      project.name = json.name;
      json.features.forEach( (d)=> {
        let lg = new LayerGroup(d.label, new L.FeatureGroup());
        let group = L.geoJSON(d);
        group.getLayers().forEach( (feat) => {
          lg.feature_group.addLayer(feat);
        });
        project.layer_groups.push(lg);
      });
      return res(project);
    });
  }

  /*
  This will return a promise that resolves to an array of features
  that can be added to a LayerGroup
  */
  load_from_local_file (file) {
    return this.$q( (res, rej) => {
      let ext = GeoUtils.get_file_extension(file.name);
      let reader = new FileReader();
      //
      if ((ext === 'kmz') || (ext === 'jpeg') || (ext === 'jpg')){
        reader.readAsArrayBuffer(file);
      } else {
        reader.readAsText(file);
      }
      reader.onload = (e) => {
        let p = null;
        switch (ext) {
          case 'kml':
            p =  this._from_kml(e.target.result);
            break;
          case 'json':
            p = this._from_json(e.target.result);
            break;
          case 'geojson':
            p = this._from_json(e.target.result);
            break;
          case 'kmz':
            p = this._from_kmz(e.target.result);
            break;
          case 'gpx':
            p = this._from_gpx(e.target.result);
            break;
          case 'jpeg':
            p = this._from_image(e.target.result);
            break;
          case 'jpg':
            p = this._from_image(e.target.result);
            break;
          case 'dsmap':
            p = this._from_dsmap(e.target.result);
            break;
          default:
            p = this._from_json(e.target.result);
        }
        return res(p);
      };
    });
  }

  //
  // @param f: a file from DataService
  // returns a promise with the LayerGroup
  load_from_data_depot(f) {
    let ext = GeoUtils.get_file_extension(f.name);
    let responseType = 'text';
    if ((ext === 'kmz') || (ext === 'jpg') || (ext === 'jpeg')) {
      responseType = 'arraybuffer';
    }
    return this.$http.get(f.agaveUrl(), {'responseType': responseType}).then((resp) => {
      console.log(resp)
      let p = null;
      switch (ext) {
        case 'kml':
          p =  this._from_kml(resp.data);
          break;
        case 'json':
          p = this._from_json(resp.data);
          break;
        case 'geojson':
          p = this._from_json(resp.data);
          break;
        case 'kmz':
          p = this._from_kmz(resp.data);
          break;
        case 'gpx':
          p = this._from_gpx(resp.data);
          break;
        case 'jpeg':
          p = this._from_image(resp.data);
          break;
        case 'jpg':
          p = this._from_image(resp.data);
          break;
        case 'dsmap':
          p = this._from_dsmap(resp.data);
          break;
        default:
          p = this._from_json(resp.data);
      }
      return p;
    });
  }

  save_locally (project) {
    let gjson = project.to_json();
    let blob = new Blob([JSON.stringify(gjson)], {type: "application/json"});
    let url  = URL.createObjectURL(blob);

    let a = document.createElement('a');
    a.download    = project.name + ".dsmap";
    a.href        = url;
    a.textContent = "Download";
    a.click();
  }

  save_to_depot (project) {
    let gjson = project.to_json();
    let blob = new Blob([JSON.stringify(gjson)], {type: "application/json"});
    console.log(blob);
    let base_file_url = 'https://agave.designsafe-ci.org/files/v2/media/system/designsafe.storage.default/' + this.UserService.currentUser().username;
    let form = new FormData();
    let file = new File([blob], project.name + '.dsmap');

    form.append('fileToUpload', file, 'test.test.test');
    return this.$http.post(base_file_url, form, {headers: {'Content-Type': undefined}});
  }

}
