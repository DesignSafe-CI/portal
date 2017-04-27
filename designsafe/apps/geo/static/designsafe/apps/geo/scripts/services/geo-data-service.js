import * as GeoUtils from '../utils/geo-utils';
import LayerGroup from '../models/layer_group';
import MapProject from '../models/map-project';


export default class GeoDataService {

  constructor ($http, $q, UserService) {
    'ngInject';
    this.$http = $http;
    this.$q = $q;
    this.UserService = UserService;
    this.active_project = null;
    this.previous_project_state = null;
  }

  current_project(project) {
    if (!(project)) {
      return this.active_project;
    }
    this.active_project = project;
  }

  _resize_image (blob, max_width=400, max_height=400) {
    return this.$q( (res, rej) => {
      let base64 = this._arrayBufferToBase64(blob);
      // Create and initialize two canvas
      let canvas = document.createElement("canvas");
      let ctx = canvas.getContext("2d");
      let canvasCopy = document.createElement("canvas");
      let copyContext = canvasCopy.getContext("2d");

      // Create original image
      let img = new Image();
      img.src = base64;
      img.onload = ()=>{
        // Determine new ratio based on max size
        let ratio = 1;
        if(img.width > max_width) {
          ratio = max_width / img.width;
        } else if(img.height > max_height) {
          ratio = max_height / img.height;
        }
        // Draw original image in second canvas
        canvasCopy.width = img.width;
        canvasCopy.height = img.height;
        copyContext.drawImage(img, 0, 0);

        // Copy and resize second canvas to first canvas
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        ctx.drawImage(canvasCopy, 0, 0, canvasCopy.width, canvasCopy.height, 0, 0, canvas.width, canvas.height);
        res(canvas.toDataURL());
      };
    });
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
        // d.feature.properties = {};
        d.options.label = d.feature.properties.name;
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
        let proms = [];
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
      if (blob.ds_map) return res(this._from_dsmap(blob));
      let features = [];
      L.geoJSON(blob).getLayers().forEach( (layer) => {
        for (let key in layer.feature.properties) {
          layer.options[key] = layer.feature.properties[key];
        }
        features.push(layer);
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

  _make_image_marker (lat, lon, thumb, preview, original) {
    let icon = L.divIcon({
      iconSize: [40, 40],
      html: "<div class='image' style='background:url(" + original + ");background-size: 100% 100%'></div>",
      className: 'leaflet-marker-photo'
    });

    let marker = L.marker([lat, lon], {icon: icon})
          .bindPopup("<img src=" + preview + "><a target=blank onclick='window.open(this.href)' href=" + original + ">full res</a>",
              {
                className: 'leaflet-popup-photo',
                maxWidth: "auto",
                // maxHeight: 400
              });
    marker.options.image_src = preview;
    marker.options.thumb_src = thumb;
    marker.options.original_src = original;
    return marker;
  }

  _from_image (file) {
    return this.$q( (res, rej) => {
      try {
        let exif = EXIF.readFromBinaryFile(file);
        let encoded = this._arrayBufferToBase64(file);
        let lat = exif.GPSLatitude;
        let lon = exif.GPSLongitude;
        //Convert coordinates to WGS84 decimal
        let latRef = exif.GPSLatitudeRef || "N";
        let lonRef = exif.GPSLongitudeRef || "W";
        lat = (lat[0] + lat[1]/60 + lat[2]/3600) * (latRef == "N" ? 1 : -1);
        lon = (lon[0] + lon[1]/60 + lon[2]/3600) * (lonRef == "W" ? -1 : 1);

        let thumb = null;
        let preview = null;
        this._resize_image(file, 100, 100).then( (resp)=>{
          thumb = resp;
        }).then( ()=>{
          return this._resize_image(file, 400, 400);
        }).then( (resp)=>{
          preview = resp;
          let marker = this._make_image_marker(lat, lon, thumb, preview, encoded);
          res([marker]);
        });
      } catch (e) {
        rej(e);
      }
    });
  }


  _from_dsmap (json) {
    return this.$q( (res, rej) => {
      // if (json instanceof String) {
      let project = new MapProject();
      project.name = json.name;
      project.description = json.description;
      json.layer_groups.forEach( (name) => {
        project.layer_groups.push(new LayerGroup(name, new L.FeatureGroup()));
      });
      json.features.forEach( (d)=> {
        let feature = L.geoJSON(d);
        feature.eachLayer( (layer)=> {
          for (let key in layer.feature.properties) {
            layer.options[key] = layer.feature.properties[key];
          }
          try {
            let styles = {
              fillColor: layer.feature.properties.fillColor,
              color: layer.feature.properties.color,
              opacity: layer.feature.properties.opacity
            };
            layer.setStyle(styles);
          } catch (e) {
            // this can get caught for marker type objects, which for some reason
            // do not have a setStyle() method
            console.log(e);
          }
          let layer_group_index = d.layer_group_index;
          if ((layer instanceof L.Marker) && (layer.feature.properties.image_src)) {
            let latlng = layer.getLatLng();
            layer = this._make_image_marker(latlng.lat, latlng.lng, layer.feature.properties.thumb_src, layer.feature.properties.image_src, layer.feature.properties.original_src);
            // feat.options.image_src = feat.feature.properties.image_src;
            // feat.options.thumb_src = feat.feature.properties.thumb_src;
          }
          project.layer_groups[layer_group_index].feature_group.addLayer(layer);
          layer.options.label = d.properties.label;
        });

      });
      res(project);
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
            p = this._from_json(JSON.parse(e.target.result));
            break;
          case 'geojson':
            p = this._from_json(JSON.parse(e.target.result));
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
            p = this._from_dsmap(JSON.parse(e.target.result));
            break;
          default:
            p = this._from_json(JSON.parse(e.target.result));
        }
        return res(p);
      };
    });
  }

  //
  // @param f: a file from DataService
  // returns a promise with the LayerGroup
  load_from_data_depot(f) {
    console.log(f)
    let ext = GeoUtils.get_file_extension(f.name);
    let responseType = 'text';
    if ((ext === 'kmz') || (ext === 'jpg') || (ext === 'jpeg')) {
      responseType = 'arraybuffer';
    }
    return this.$http.get(f.agaveUrl(), {'responseType': responseType}).then((resp) => {
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
    document.body.appendChild(a);
    a.download    = project.name + ".geojson";
    a.href        = url;
    a.textContent = "Download";
    a.click();
    document.body.removeChild(a);
  }

  save_to_depot (project, path) {
    console.log(project, path)
    let form = new FormData();
    let gjson = project.to_json();
    let blob = new Blob([JSON.stringify(gjson)], {type: "application/json"});
    let base_file_url = 'https://agave.designsafe-ci.org/files/v2/media/system/designsafe.storage.default';
    let post_url = base_file_url;
    let file = null;
    if (path.type === 'dir') {
      post_url = post_url + path.path;
      file = new File([blob], path.name);
      form.append('fileToUpload', file, path.name);
    } else {
      // A file was picked, so this WILL replace it
      post_url = post_url + path.trail[path.trail.length-2].path;
      file = new File([blob], path.name);
      form.append('fileToUpload', file, path.name);
    }
    return this.$http.post(post_url, form, {headers: {'Content-Type': undefined}});
  }

}
