import requests
import os
import json
import geojson
from shapely.geometry import shape, MultiPolygon, Polygon
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def calculate_bounding_box(point):
    centerX = point[0]
    centerY = point[1]
    width = 1
    height = 1
    minX = centerX - (width / 2)
    maxX = centerX + (width / 2)
    minY = centerY - (height / 2)
    maxY = centerY + (height / 2)
    return minX, maxX, minY, maxY

def get_github_file_info(repo, path):
    api_url = f"https://api.github.com/repos/{repo}/contents/{path}"
    response = requests.get(api_url)
    response.raise_for_status()
    return response.json()

def get_latest_commit_sha(repo, path):
    commits_url = f"https://api.github.com/repos/{repo}/commits?path={path}&per_page=1"
    response = requests.get(commits_url)
    response.raise_for_status()
    commits = response.json()
    return commits[0]['sha'] if commits else None

def download_files(file_info, save_dir):
    os.makedirs(save_dir, exist_ok=True)
    for item in file_info:
        if item['type'] == 'file':
            response = requests.get(item['download_url'])
            response.raise_for_status()
            filename = os.path.join(save_dir, os.path.basename(item['download_url']))
            with open(filename, 'wb') as file:
                file.write(response.content)
            logging.info(f"Downloaded {filename}")

def process_geojson_file(input_filepath, product_type):
    with open(input_filepath, 'r') as f:
        data = geojson.load(f)

    # Extract the geometry
    geometry = data['geometry']
    geom_shape = shape(geometry)

    # Check if the geometry is a MultiPolygon or Polygon
    if isinstance(geom_shape, MultiPolygon) or isinstance(geom_shape, Polygon):
        centroid = geom_shape.centroid
    else:
        logging.warning(f"Skipping file with unsupported geometry type: {input_filepath}")
        return None

    properties = data['properties']
    identifier = properties['identifier']['value']
    id_value = ".".join(identifier.split('.')[1:])

    new_properties = {
        "id": properties['identifier']['value'],
        "name": properties["name"],
        "alternateName": properties["alternateName"],
        "url": f"/datasetMetadata?otCollectionID=OT.{id_value}",
        "productAvailable": product_type
    }

    return {
        "type": "Feature",
        "properties": new_properties,
        "geometry": {
            "type": "Point",
            "coordinates": [centroid.x, centroid.y]
        }
    }

def process_and_aggregate_geojson_files(source_dirs):
    seen_files = {}
    all_features = []

    for source_dir, product_type in source_dirs:
        for root, _, files in os.walk(source_dir):
            for file in files:
                if file.endswith('.geojson'):
                    src_file_path = os.path.join(root, file)

                    if file in seen_files:
                        # File already processed, update the productAvailable field
                        existing_feature = seen_files[file]
                        existing_feature['properties']['productAvailable'] += f", {product_type}"
                    else:
                        # New file, process it
                        new_feature = process_geojson_file(src_file_path, product_type)
                        if new_feature:
                            seen_files[file] = new_feature
                            all_features.append(new_feature)
                            logging.info(f"Processed {file}")

    return all_features

def save_aggregated_results(output_filepath, all_features):
    feature_collection = {
        "type": "FeatureCollection",
        "features": all_features
    }

    os.makedirs(os.path.dirname(output_filepath), exist_ok=True)
    with open(output_filepath, 'w') as f:
        geojson.dump(feature_collection, f, indent=2)
    logging.info(f"Aggregated results saved to: {output_filepath}")

def fetch_otcatalog_api_response(file_path):
    with open(file_path, 'r') as file1:
        data = json.load(file1)
    features = data['features']
    # Specify the API endpoint URL
    api_url="https://portal.opentopography.org/API/otCatalog"
    # Specify default API query parameters
    productFormat="PointCloud"
    include_federated="false"
    detail="true"
    for feature in features:
        center_point = feature['geometry']['coordinates']
        minx, maxx, miny, maxy = calculate_bounding_box(center_point)
        request_url=f'{api_url}?productFormat={productFormat}&minx={minx}&miny={miny}&maxx={maxx}&maxy={maxy}&detail={detail}&outputFormat=json&include_federated={include_federated}'
        response = requests.get(request_url)
        if response.status_code == 200:
            for dataset in response.json()['Datasets']:
                if dataset['Dataset']['identifier']['value'] == feature['properties']['id']:
                    feature['properties']['description'] = dataset['Dataset']['description']
                    feature['properties']['doiUrl'] = dataset['Dataset']['url']
                    feature['properties']['host']='OpenTopography'
                    feature['properties']['dateCreated'] = dataset['Dataset']['dateCreated']
                    feature['properties']['temporalCoverage'] = dataset['Dataset']['temporalCoverage']
                    feature['properties']['keywords'] = dataset['Dataset']['keywords']
                    break
    data['features'] = features
    with open(file_path, 'w') as file2:
        json.dump(data, file2, indent=4)

def main():
    repo = "OpenTopography/Data_Catalog_Spatial_Boundaries"
    directories = {
        "OpenTopography_Raster": "OpenTopo_Data/raster",
        "OpenTopography_Point_Cloud_Lidar": "OpenTopo_Data/point_cloud"
    }
    timestamp_file = "last_commit.json"

    # Load the last known commit SHAs from the file
    if os.path.exists(timestamp_file):
        with open(timestamp_file, 'r') as f:
            last_commit = json.load(f)
    else:
        last_commit = {}

    updates_found = False

    for path, save_dir in directories.items():
        # Fetch the latest commit SHA for the specific folder
        latest_commit_sha = get_latest_commit_sha(repo, path)
        
        last_known_commit_sha = last_commit.get(path, "")

        # Check if there are new commits since the last known commit
        if latest_commit_sha and latest_commit_sha != last_known_commit_sha:
            logging.info(f"Repository folder '{path}' has been updated. Downloading new files...")
            file_info = get_github_file_info(repo, path)
            download_files(file_info, save_dir)
            # Update the commit SHA file
            last_commit[path] = latest_commit_sha
            updates_found = True
        else:
            logging.info(f"No updates found for '{path}'.")

    if updates_found:
        # Save the updated commit SHAs to the timestamp file
        with open(timestamp_file, 'w') as f:
            json.dump(last_commit, f)

        # Process and aggregate GeoJSON files
        source_dirs = [("OpenTopo_Data/point_cloud", "Point Cloud Data"), 
                       ("OpenTopo_Data/raster", "Raster")]
        output_filepath = 'OpenTopo_Data/center_view_data.geojson'

        all_features = process_and_aggregate_geojson_files(source_dirs)
        save_aggregated_results(output_filepath, all_features)
        fetch_otcatalog_api_response(output_filepath)


if __name__ == "__main__":
    main()
