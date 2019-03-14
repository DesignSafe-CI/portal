import * as GeoUtils from '../utils/geo-utils';
import LayerGroup from '../models/layer_group';
import MapProject from '../models/map-project';
import L from 'leaflet';
import * as omnivore from 'leaflet-omnivore';
import * as EXIF from 'exif-js';
import * as JSZip from 'jszip';

export default class GeoDataService {

    constructor ($http, $q, $rootScope, UserService, GeoSettingsService) {
        'ngInject';
        this.$http = $http;
        this.$q = $q;
        this.$rootScope = $rootScope;
        this.UserService = UserService;
        this.GeoSettingsService = GeoSettingsService;
        this.active_project = null;
        this.previous_project_state = null;

        // TODO: Should this marker size be auto somehow?
        this.HazmapperDivIcon = L.divIcon({
            className: 'hm-marker',
            html: "<div> <i class='fa fa-map-marker'> </i> </div>",
            iconSize: [21, 36],
            iconAnchor: [10.5, 36]
        });
    }



    currentProject(project) {
        if (!(project)) {
            return this.active_project;
        }
        this.active_project = project;
    }

    _resizeImage (blob, max_width=400, max_height=400) {
        return this.$q( (res, rej) => {
            let base64 = this._arrayBufferToBase64(blob);
            // Create and initialize two canvas
            let canvas = document.createElement('canvas');
            let ctx = canvas.getContext('2d');
            let canvasCopy = document.createElement('canvas');
            let copyContext = canvasCopy.getContext('2d');

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
                res(canvas.toDataURL('image/jpeg', 0.8));
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

    _fromKml(text_blob) {
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

    _fromKmz (blob) {
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
                let features = this._fromKml(txt);
                res(features);
            });
        });
    }

    _fromJson (blob) {
        if (blob.ds_map) return this._fromDsmap(blob);
        return this.$q( (res, rej) => {

            try {
                let features = [];
                let options = {
                    pointToLayer: (feature, latlng)=> {
                        return L.marker(latlng, { icon: this.HazmapperDivIcon });
                    }
                };
                L.geoJSON(blob, options).getLayers().forEach( (layer) => {
                    let props = layer.feature.properties;
                    if ((layer instanceof L.Marker) && (layer.feature.properties.image_src)) {
                        let latlng = layer.getLatLng();
                        layer = this._makeImageMarker(latlng.lat, latlng.lng, props.thumb_src, props.image_src, props.href);
                    }

                    //add in the optional metadata / reserved props
                    layer.options.metadata = [];
                    for (let key in props) {

                        // if the key is not reserved for hazmapper, put it in
                        // the metadata
                        if (GeoUtils.RESERVED_KEYS.indexOf(key) === -1) {
                            layer.options.metadata.push( {
                                key: key,
                                value: props[key]
                            });
                        } else {
                            layer.options[key] = props[key];
                        }
                    }
                    features.push(layer);
                });
                res(features);
            } catch (e) {
                rej('Bad geoJSON');
            }
        });
    }

    _fromGpx (blob) {
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

    _makeImageMarker (lat, lon, thumb, preview, href=null) {
        let icon = L.divIcon({
            iconSize: [40, 40],
            html: "<div class='image' style='background:url(" + thumb + ");background-size: 100% 100%'></div>",
            className: 'leaflet-marker-photo'
        });

        let tmpl = '<img src=' + preview + '>';

        let marker = L.marker([lat, lon], { icon: icon })
            .bindPopup(tmpl,
                {
                    className: 'leaflet-popup-photo',
                    maxWidth: 'auto',
                // maxHeight: 400
                });
        marker.on('popupopen', (e)=> {
            this.$rootScope.$broadcast('image_popupopen', marker);
        });
        marker.on('popupclose', (e)=> {
            this.$rootScope.$broadcast('image_popupclose', marker);
        });
        marker.options.image_src = preview;
        marker.options.thumb_src = thumb;
        marker.options.href = href;
        return marker;
    }

    _fromImage (file, fname, agave_file=null) {
        return this.$q( (res, rej) => {
            try {
                let exif = EXIF.readFromBinaryFile(file);
                let lat = exif.GPSLatitude;
                let lon = exif.GPSLongitude;
                //Convert coordinates to WGS84 decimal
                let latRef = exif.GPSLatitudeRef || 'N';
                let lonRef = exif.GPSLongitudeRef || 'W';
                lat = (lat[0] + lat[1]/60 + lat[2]/3600) * (latRef == 'N' ? 1 : -1);
                lon = (lon[0] + lon[1]/60 + lon[2]/3600) * (lonRef == 'W' ? -1 : 1);
                if ((lat > 90) || (lat < -90) || (lon > 360) || (lon < -360)) {
                    rej('Bad EXIF GPS data');
                }
                let thumb = null;
                let preview = null;
                this._resizeImage(file, 100, 100).then( (resp)=>{
                    thumb = resp;
                }).then( ()=>{
                    return this._resizeImage(file, 400, 400);
                }).then( (resp)=>{
                    preview = resp;
                    let marker = this._makeImageMarker(lat, lon, thumb, preview, null);
                    if (agave_file) {
                        marker.options.href = agave_file._links.self.href;
                        marker.options.label = agave_file.name;
                    } else {
                        marker.options.label = fname;
                    }
                    res([marker]);
                });
            } catch (e) {
                console.log(e)
                rej(e);
            }
        });
    }


    _fromDsmap (json) {
        return this.$q( (res, rej) => {
            // if (json instanceof String) {
            let project = new MapProject();
            let options = {
                pointToLayer: (feature, latlng)=> {
                    return L.marker(latlng, { icon: this.HazmapperDivIcon });
                }
            };
            project.name = json.name;
            project.description = json.description;
            json.layer_groups.forEach( (name) => {
                project.layer_groups.push(new LayerGroup(name, new L.FeatureGroup()));
            });
            json.features.forEach( (d)=> {
                let feature = L.geoJSON(d, options);
                feature.eachLayer( (layer)=> {
                    // If there were no styles applied, it might be transparent???
                    if (!(layer.feature.properties.color)) {
                        layer.feature.properties.color = '#ff0000';
                    }
                    if (!(layer.feature.properties.fillColor)) {
                        layer.feature.properties.fillColor = '#ff0000';
                    }
                    if (!(layer.feature.properties.opacity)) {
                        layer.feature.properties.opacity = 1.0;
                    }

                    let props = layer.feature.properties;

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
                        layer = this._makeImageMarker(latlng.lat, latlng.lng, layer.feature.properties.thumb_src, layer.feature.properties.image_src, layer.feature.properties.original_src);
                        // feat.options.image_src = feat.feature.properties.image_src;
                        // feat.options.thumb_src = feat.feature.properties.thumb_src;
                    }

                    // Add in the properties that were on the feature
                    for (let key in props) {
                        layer.options[key] = props[key];
                    }

                    project.layer_groups[layer_group_index].feature_group.addLayer(layer);
                    // layer.options.label = d.properties.label;
                });

            });
            res(project);
        });
    }

    readFileAsDataUrl(file) {

        let reader = new FileReader();
        return this.$q( (res, rej) => {
            reader.readAsDataURL(file);

            reader.onload = (e) => {
                return res(reader.result);
            };
        });
    }

    /*
  This will return a promise that resolves to an array of features
  that can be added to a LayerGroup
  */
    loadFromLocalFile (file) {
        let deferred = this.$q.defer();
        let ext = GeoUtils.getFileExtension(file.name);
        let reader = new FileReader();
        //
        if ((ext === 'kmz') || (ext === 'jpeg') || (ext === 'jpg')){
            reader.readAsArrayBuffer(file);
        } else {
            reader.readAsText(file);
        }
        reader.onload = () => {
            let p = null;
            switch (ext) {
                case 'kml':
                    p =  this._fromKml(reader.result);
                    break;
                case 'json':
                    p = this._fromJson(JSON.parse(reader.result));
                    break;
                case 'geojson':
                    p = this._fromJson(JSON.parse(reader.result));
                    break;
                case 'kmz':
                    p = this._fromKmz(reader.result);
                    break;
                case 'gpx':
                    p = this._fromGpx(reader.result);
                    break;
                case 'jpeg':
                    p = this._fromImage(reader, file.name);
                    break;
                case 'jpg':
                    p = this._fromImage(reader, file.name);
                    break;
                case 'dsmap':
                    p = this._fromDsmap(JSON.parse(reader.result));
                    break;
                default:
                    p = this._fromJson(JSON.parse(reader.result));
            }
            p.then( (data)=> { return deferred.resolve(data);});
            // deffered.resolve(p)
        };
        return deferred.promise;
    }

    //
    // @param f: a file from DataService
    // returns a promise with the LayerGroup
    loadFromDataDepot(f) {
        let ext = GeoUtils.getFileExtension(f.name);
        let responseType = 'text';
        if ((ext === 'kmz') || (ext === 'jpg') || (ext === 'jpeg')) {
            responseType = 'arraybuffer';
        }
        let headers = {
            Authorization: 'Bearer ' + this.UserService.currentUser().oauth.access_token
        };
        return this.$http.get(f.agaveUrl(), { responseType: responseType, headers: headers }).then((resp) => {
            let p = null;
            switch (ext) {
                case 'kml':
                    p =  this._fromKml(resp.data);
                    break;
                case 'json':
                    p = this._fromJson(resp.data);
                    break;
                case 'geojson':
                    p = this._fromJson(resp.data);
                    break;
                case 'kmz':
                    p = this._fromKmz(resp.data);
                    break;
                case 'gpx':
                    p = this._fromGpx(resp.data);
                    break;
                case 'jpeg':
                    p = this._fromImage(resp.data, f.name, f);
                    break;
                case 'jpg':
                    p = this._fromImage(resp.data, f.name, f);
                    break;
                case 'dsmap':
                    p = this._fromDsmap(resp.data);
                    break;
                default:
                    p = this._fromJson(resp.data);
            }
            return p;
        }, (err)=>{
            return this.$q.reject(err);
        });
    }

    saveLocally (project) {
        let gjson = project.toJson();
        let blob = new Blob([JSON.stringify(gjson)], { type: 'application/json' });
        let url  = URL.createObjectURL(blob);

        let a = document.createElement('a');
        document.body.appendChild(a);
        a.download    = project.name + '.geojson';
        a.href        = url;
        a.textContent = 'Download';
        a.click();
        document.body.removeChild(a);
    }

    //TODO: Fix that hard coded URL?
    saveToDepot (project, path) {
        let form = new FormData();
        let gjson = project.toJson();
        let blob = new Blob([JSON.stringify(gjson)], { type: 'application/json' });
        let base_file_url = 'https://agave.designsafe-ci.org/files/v2/media/system/';
        let post_url = base_file_url;
        post_url = post_url + path.system;
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
        let headers = {
            'Content-Type': undefined,
            Authorization: 'Bearer ' + this.UserService.currentUser().oauth.access_token
        };
        return this.$http.post(post_url, form, { headers: headers });
    }

}
