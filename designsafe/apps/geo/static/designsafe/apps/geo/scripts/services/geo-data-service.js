import * as GeoUtils from '../utils/geo-utils';
import LayerGroup from '../models/layer_group';
import MapProject from '../models/map-project';


export default class GeoDataService {

  constructor ($http, $q) {
    'ngInject';
    this.$http = $http;
    this.$q = $q;
    this.image_icon = L.divIcon({
      iconSize: [40, 40],
      html: "<div style='background-color:red'></div>",
      className: 'leaflet-marker-photo'
    });

  }

  _arrayBufferToBase64( buffer ) {
    let binary = '';
    let bytes = new Uint8Array( buffer );
    let len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode( bytes[ i ] );
    }
    return btoa( binary );
}
  _from_kml(text_blob) {
    return this.$q( (res, rej) => {
      let features = [];
      let l = omnivore.kml.parse(text_blob);
      l.getLayers().forEach((d) => {
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

  _from_json (json_blob) {
    return this.$q( (res, rej) => {
      let features = [];
      L.geoJSON(json_blob).getLayers().forEach( (l) => {
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

  _from_image (file) {
    return this.$q( (res, rej) => {
      let exif = EXIF.readFromBinaryFile(file);
      console.log(exif)
      let encoded = 'data:image/jpg;base64,' + this._arrayBufferToBase64(file);
      let lat = exif.GPSLatitude;
      let lon = exif.GPSLongitude;

      //Convert coordinates to WGS84 decimal
      let latRef = exif.GPSLatitudeRef || "N";
      let lonRef = exif.GPSLongitudeRef || "W";
      lat = (lat[0] + lat[1]/60 + lat[2]/3600) * (latRef == "N" ? 1 : -1);
      lon = (lon[0] + lon[1]/60 + lon[2]/3600) * (lonRef == "W" ? -1 : 1);
      let icon = L.divIcon({
        iconSize: [40, 40],
        html: "<div class='image' style='background:url(" + encoded + ");background-size: 100% 100%'></div>",
        className: 'leaflet-marker-photo'
      });

      let marker = L.marker([lat, lon], {icon: icon})
            // .bindPopup("<div class='image' style='background:url(" + encoded + ")'>",
            //     {
  			    //       className: 'leaflet-popup-photo',
  			    //       minWidth: 200
            //     });
            .bindPopup("<img src=" + encoded + ">",
                {
  			          className: 'leaflet-popup-photo',
  			          maxWidth: "auto",
                  // maxHeight: 400
                });

      marker.image_src = encoded;
      res([marker]);
    });
  }


  _load_dsmap (json_blob) {

  }


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
        default:
          p = this._from_json(resp.data);
      }
      return p;
    });
  }

}
