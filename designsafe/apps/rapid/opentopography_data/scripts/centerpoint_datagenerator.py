"""
This script downloads GeoJSON files from a specified GitHub repository,
processes them to calculate the centroid for each geometry,
and aggregates the results into two GeoJSON files:
one with centroid points and another with original geometries.
"""
# pylint: disable=too-many-nested-blocks
# pylint: disable=import-error

import os
import json
import logging
from typing import List, Tuple, Dict, Any, Optional
import requests
import geojson
from shapely.geometry import shape, MultiPolygon, Polygon

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)

# Constants
GITHUB_API_URL = "https://api.github.com/repos/"
REPO = "OpenTopography/Data_Catalog_Spatial_Boundaries"
DIRECTORIES = {
    "OpenTopography_Raster": "opentopo_data/raster",
    "OpenTopography_Point_Cloud_Lidar": "opentopo_data/point_cloud",
}
TIMESTAMP_FILE = "last_commit.json"
OUTPUT_FILEPATH_CENTROID = "opentopo_data/center_view_data.geojson"
OUTPUT_FILEPATH_POLYGON = "opentopo_data/original_geometry_data.geojson"


def get_github_file_info(repo: str, path: str) -> List[Dict[str, Any]]:
    """
    Get information about files in a GitHub repository.

    Args:
        repo (str): The repository name.
        path (str): The path within the repository.

    Returns:
        List[Dict[str, Any]]: Information about the files.
    """
    api_url = f"{GITHUB_API_URL}{repo}/contents/{path}"
    try:
        response = requests.get(api_url, timeout=10)
        response.raise_for_status()
        return response.json()
    except requests.RequestException as error:
        logging.error(f"Error fetching file info from GitHub: {error}")
        return []


def get_latest_commit_sha(repo: str, path: str) -> Optional[str]:
    """
    Get the latest commit SHA for a specific path in a GitHub repository.

    Args:
        repo (str): The repository name.
        path (str): The path within the repository.

    Returns:
        Optional[str]: The latest commit SHA, or None if not found.
    """
    commits_url = f"{GITHUB_API_URL}{repo}/commits?path={path}&per_page=1"
    try:
        response = requests.get(commits_url, timeout=10)
        response.raise_for_status()
        commits = response.json()
        return commits[0]["sha"] if commits else None
    except requests.RequestException as error:
        logging.error(f"Error fetching latest commit SHA from GitHub: {error}")
        return None


def download_files(file_info: List[Dict[str, Any]], save_dir: str) -> None:
    """
    Download files from GitHub to a local directory.

    Args:
        file_info (List[Dict[str, Any]]): Information about the files.
        save_dir (str): The directory to save the files.
    """
    os.makedirs(save_dir, exist_ok=True)
    for item in file_info:
        if item["type"] == "file":
            try:
                response = requests.get(item["download_url"], timeout=10)
                response.raise_for_status()
                filename = os.path.join(
                    save_dir, os.path.basename(item["download_url"])
                )
                with open(filename, "wb") as file:
                    file.write(response.content)
                logging.info(f"Downloaded {filename}")
            except requests.RequestException as error:
                logging.error(f"Error downloading file {item['download_url']}: {error}")


def process_geojson_file(
    input_filepath: str, product_type: str
) -> Tuple[Optional[Dict[str, Any]], Optional[Dict[str, Any]]]:
    """
    Process a GeoJSON file to extract the centroid and original geometry.

    Args:
        input_filepath (str): The path to the GeoJSON file.
        product_type (str): The type of product (e.g., "Point Cloud Data").

    Returns:
        Tuple[Optional[Dict[str, Any]], Optional[Dict[str, Any]]]: Two GeoJSON features, one with the centroid and one with the original geometry.
    """
    try:
        with open(input_filepath, "r", encoding="utf-8") as file:
            data = geojson.load(file)
    except (FileNotFoundError, json.JSONDecodeError) as error:
        logging.error(f"Error reading GeoJSON file {input_filepath}: {error}")
        return None, None

    geometry = data["geometry"]
    geom_shape = shape(geometry)

    if not isinstance(geom_shape, (MultiPolygon, Polygon)):
        logging.warning(
            f"Skipping file with unsupported geometry type: {input_filepath}"
        )
        return None, None

    centroid = geom_shape.centroid
    properties = data["properties"]
    identifier = properties["identifier"]["value"]
    id_value = ".".join(identifier.split(".")[1:])

    new_properties = {
        "id": identifier,
        "name": properties["name"],
        "alternateName": properties["alternateName"],
        "url": f"/datasetMetadata?otCollectionID=OT.{id_value}",
        "productAvailable": product_type,
    }

    centroid_feature = {
        "type": "Feature",
        "properties": new_properties,
        "geometry": {"type": "Point", "coordinates": [centroid.x, centroid.y]},
    }

    original_feature = {
        "type": "Feature",
        "properties": new_properties,
        "geometry": data["geometry"],
    }

    return centroid_feature, original_feature


def process_and_aggregate_geojson_files(
    source_dirs: List[Tuple[str, str]]
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    """
    Process and aggregate GeoJSON files from multiple directories.

    Args:
        source_dirs (List[Tuple[str, str]]): A list of tuples containing directory paths and product types.

    Returns:
        Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]: Two lists of GeoJSON features, one with centroids and one with original geometries.
    """
    seen_files = {}
    all_features = []
    all_features_polygon = []

    for source_dir, product_type in source_dirs:
        for root, _, files in os.walk(source_dir):
            for file in files:
                if file.endswith(".geojson"):
                    src_file_path = os.path.join(root, file)

                    if file in seen_files:
                        existing_feature = seen_files[file]
                        existing_feature["properties"][
                            "productAvailable"
                        ] += f", {product_type}"
                    else:
                        new_feature, new_feature_polygon = process_geojson_file(
                            src_file_path, product_type
                        )
                        if new_feature and new_feature_polygon:
                            seen_files[file] = new_feature
                            all_features.append(new_feature)
                            all_features_polygon.append(new_feature_polygon)
                            logging.info(f"Processed {file}")

    return all_features, all_features_polygon


def save_aggregated_results(
    output_filepath: str,
    all_features: List[Dict[str, Any]],
    output_filepath_polygon: str,
    all_features_polygon: List[Dict[str, Any]],
) -> None:
    """
    Save aggregated GeoJSON features to two files.

    Args:
        output_filepath (str): The path to the output file with centroids.
        all_features (List[Dict[str, Any]]): A list of GeoJSON features with centroids.
        output_filepath_polygon (str): The path to the output file with original geometries.
        all_features_polygon (List[Dict[str, Any]]): A list of GeoJSON features with original geometries.
    """
    feature_collection = {"type": "FeatureCollection", "features": all_features}
    feature_collection_polygon = {
        "type": "FeatureCollection",
        "features": all_features_polygon,
    }

    os.makedirs(os.path.dirname(output_filepath), exist_ok=True)
    with open(output_filepath, "w", encoding="utf-8") as file:
        geojson.dump(feature_collection, file, indent=2)
    logging.info(f"Aggregated centroid results saved to: {output_filepath}")

    os.makedirs(os.path.dirname(output_filepath_polygon), exist_ok=True)
    with open(output_filepath_polygon, "w", encoding="utf-8") as file:
        geojson.dump(feature_collection_polygon, file, indent=2)
    logging.info(
        f"Aggregated original geometry results saved to: {output_filepath_polygon}"
    )


def load_last_commit(timestamp_file: str) -> Dict[str, str]:
    """
    Load the last known commit SHAs from the file.

    Args:
        timestamp_file (str): The path to the timestamp file.

    Returns:
        Dict[str, str]: A dictionary with the last known commit SHAs.
    """
    if os.path.exists(timestamp_file):
        with open(timestamp_file, "r", encoding="utf-8") as file:
            return json.load(file)
    return {}


def save_last_commit(timestamp_file: str, last_commit: Dict[str, str]) -> None:
    """
    Save the updated commit SHAs to the timestamp file.

    Args:
        timestamp_file (str): The path to the timestamp file.
        last_commit (Dict[str, str]): A dictionary with the last known commit SHAs.
    """
    with open(timestamp_file, "w", encoding="utf-8") as file:
        json.dump(last_commit, file)


def check_for_updates(
    repo: str, directories: Dict[str, str], last_commit: Dict[str, str]
) -> bool:
    """
    Check for updates in the specified directories and download new files if updates are found.

    Args:
        repo (str): The repository name.
        directories (Dict[str, str]): A dictionary with directory paths.
        last_commit (Dict[str, str]): A dictionary with the last known commit SHAs.

    Returns:
        bool: True if updates were found, False otherwise.
    """
    updates_found = False
    for path, save_dir in directories.items():
        latest_commit_sha = get_latest_commit_sha(repo, path)
        last_known_commit_sha = last_commit.get(path, "")

        if latest_commit_sha and latest_commit_sha != last_known_commit_sha:
            logging.info(
                f"Repository folder '{path}' has been updated. Downloading new files..."
            )
            file_info = get_github_file_info(repo, path)
            download_files(file_info, save_dir)
            last_commit[path] = latest_commit_sha
            updates_found = True
        else:
            logging.info(f"No updates found for '{path}'.")
    return updates_found

def fetch_otcatalog_data():
    """
    Fetch data from the OpenTopography OtCatalog API.

    Returns:
        dict: collection of all datasets from the API response.
    """
    api_url = "https://portal.opentopography.org/API/otCatalog"
    include_federated = "false"
    detail = "true"
    minx, maxx, miny, maxy = (
        -180,
        180,
        -90,
        90,
    )  # Fetching the entire world data from the API
    request_url = f"{api_url}?minx={minx}&miny={miny}&maxx={maxx}&maxy={maxy}&detail={detail}&include_federated={include_federated}"
    response = requests.get(request_url, timeout=60)
    response.raise_for_status()
    ot_data = {}
    for dataset in response.json()["Datasets"]:
        dataset_id = ".".join(dataset["Dataset"]["identifier"]["value"].split(".")[1:])
        ot_data[dataset_id] = dataset["Dataset"]
    return ot_data

def fetch_otcatalog_api_response(output_filepath):
    """
    Fetch data from the OpenTopography OtCatalog API and update the GeoJSON file.

    Args:
        output_filepath (str): The path to the GeoJSON file.
    """
    with open(output_filepath, "r", encoding="utf-8") as file:
        data = geojson.load(file)
    features = data["features"]
    ot_data = fetch_otcatalog_data()
    for feature in features:
        dataset_id = ".".join(feature["properties"]["id"].split(".")[1:])
        dataset = ot_data.get(dataset_id)
        try:
            feature["properties"]["description"] = dataset["description"]
            feature["properties"]["doiUrl"] = dataset["url"]
            feature["properties"]["host"] = (
                "OpenTopo"
                if dataset["identifier"]["propertyID"] == "opentopoID"
                else dataset["identifier"]["propertyID"]
            )
            feature["properties"]["dateCreated"] = dataset["dateCreated"]
            feature["properties"]["temporalCoverage"] = dataset["temporalCoverage"]
            feature["properties"]["keywords"] = dataset["keywords"]
        except Exception as exc:
            logging.exception(
                f"Dataset with ID {feature['properties']['id']} not found in the OpenTopography API response."
            )
            raise exc
    with open(output_filepath, "w", encoding="utf-8") as file:
        geojson.dump(data, file, indent=4)

def main() -> None:
    """
    Main function to orchestrate the downloading, processing, and aggregation of GeoJSON files.
    """
    last_commit = load_last_commit(TIMESTAMP_FILE)
    updates_found = check_for_updates(REPO, DIRECTORIES, last_commit)

    if updates_found:
        save_last_commit(TIMESTAMP_FILE, last_commit)
        source_dirs = [
            ("opentopo_data/point_cloud", "Point Cloud Data"),
            ("opentopo_data/raster", "Raster"),
        ]

        all_features, all_features_polygon = process_and_aggregate_geojson_files(
            source_dirs
        )
        save_aggregated_results(
            OUTPUT_FILEPATH_CENTROID,
            all_features,
            OUTPUT_FILEPATH_POLYGON,
            all_features_polygon,
        )
        fetch_otcatalog_api_response(output_filepath=OUTPUT_FILEPATH_CENTROID)


if __name__ == "__main__":
    main()
