import * as GeoUtils from '../utils/geo-utils';
import LayerGroup from '../models/layer_group';
import MapProject from '../models/map-project';


export default class GeoDataService {

  constructor ($http, $q) {
    'ngInject';
    this.$http = $http;
    this.$q = $q;
  }

  _from_kml(text_blob) {
    return this.$q( (res, rej) => {
      console.log(text_blob)
      let lg = new LayerGroup("New Group", new L.FeatureGroup());
      let l = omnivore.kml.parse(text_blob);
      l.getLayers().forEach((d) => {
        lg.feature_group.addLayer(d);
      });
      res(lg);
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
        let lg = this._from_kml(txt);
        res(lg);
      });
    });
  }

  _from_json (json_blob) {
    return this.$q( (res, rej) => {
      let lg = new LayerGroup("New Group", new L.FeatureGroup());
      L.geoJSON(json_blob).getLayers().forEach( (l) => {
        lg.feature_group.addLayer(l);
      });
      res(lg);
    });
  }

  _from_gpx (blob) {
    return this.$q( (res, rej) => {
      console.log(text_blob)
      let lg = new LayerGroup("New Group", new L.FeatureGroup());
      let l = omnivore.gpx.parse(text_blob);
      l.getLayers().forEach((d) => {
        lg.feature_group.addLayer(d);
      });
      res(lg);
    });
  }

  _load_dsmap (json_blob) {

  }


  load_from_local_file (file) {

    let ext = GeoUtils.get_file_extension(file.name);
    let reader = new FileReader();
    onload = this.$q( (res, rej) => {

    });

    reader.onload = (e) => {
      let p = null;
      switch (ext) {
        case 'kml':
          p =  this._from_kml(e.target.result).then( (lg) => {return lg;});
          break;
        case 'json':
          p = this._from_json(e.target.result).then( (lg) => {return lg;});
          break;
        case 'geojson':
          p = this._from_json(e.target.result).then( (lg) => {return lg;});
          break;
        case 'kmz':
          p = this._from_kmz(file).then( (lg) => {return lg;});
          break;
        default:
          p = this._from_json(reps.data).then( (lg) => {return lg;});
      }
      return p;
    };
  }

  //
  // @param f: a file from DataService
  // returns a promise with the LayerGroup
  load_from_data_depot(f) {
    console.log(f);
    let ext = GeoUtils.get_file_extension(f.name);
    console.log(ext)
    let responseType = 'text';
    if (ext === 'kmz') {
      responseType = 'arraybuffer';
    }
    console.log(responseType)
    return this.$http.get(f.agaveUrl(), {'responseType': responseType}).then((resp) => {
      console.log(resp)
      let p = null;
      switch (ext) {
        case 'kml':
          p =  this._from_kml(resp.data).then( (lg) => {return lg;});
          break;
        case 'json':
          p = this._from_json(resp.data).then( (lg) => {return lg;});
          break;
        case 'geojson':
          p = this._from_json(resp.data).then( (lg) => {return lg;});
          break;
        case 'kmz':
          p = this._from_kmz(resp.data).then( (lg) => {return lg;});
          break;
        default:
          p = this._from_json(reps.data).then( (lg) => {return lg;});
      }
      return p;
    });
  }

}
