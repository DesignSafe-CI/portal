"""
This script downloads GeoJSON files from a specified GitHub repository,
processes them to calculate the centroid for each geometry,
and aggregates the results into a single GeoJSON file.
"""
# pylint: disable=too-many-nested-blocks

import os
import json
import logging
import requests
import geojson
from shapely.geometry import shape, MultiPolygon, Polygon

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)


def get_github_file_info(repo, path):
    """
    Get information about files in a GitHub repository.

    Args:
        repo (str): The repository name.
        path (str): The path within the repository.

    Returns:
        dict: Information about the files.
    """
    api_url = f"https://api.github.com/repos/{repo}/contents/{path}"
    response = requests.get(api_url, timeout=10)
    response.raise_for_status()
    return response.json()


def get_latest_commit_sha(repo, path):
    """
    Get the latest commit SHA for a specific path in a GitHub repository.

    Args:
        repo (str): The repository name.
        path (str): The path within the repository.

    Returns:
        str: The latest commit SHA.
    """
    commits_url = f"https://api.github.com/repos/{repo}/commits?path={path}&per_page=1"
    response = requests.get(commits_url, timeout=10)
    response.raise_for_status()
    commits = response.json()
    return commits[0]["sha"] if commits else None


def download_files(file_info, save_dir):
    """
    Download files from GitHub to a local directory.

    Args:
        file_info (dict): Information about the files.
        save_dir (str): The directory to save the files.
    """
    os.makedirs(save_dir, exist_ok=True)
    for item in file_info:
        if item["type"] == "file":
            response = requests.get(item["download_url"], timeout=10)
            response.raise_for_status()
            filename = os.path.join(save_dir, os.path.basename(item["download_url"]))
            with open(filename, "wb") as file:
                file.write(response.content)
            logging.info(f"Downloaded {filename}")


def process_geojson_file(input_filepath, product_type):
    """
    Process a GeoJSON file to extract the centroid of its geometry.

    Args:
        input_filepath (str): The path to the GeoJSON file.
        product_type (str): The type of product (e.g., "Point Cloud Data").

    Returns:
        dict: A GeoJSON feature with the centroid of the geometry.
    """
    with open(input_filepath, "r", encoding="utf-8") as file:
        data = geojson.load(file)

    # Extract the geometry
    geometry = data["geometry"]
    geom_shape = shape(geometry)

    # Check if the geometry is a MultiPolygon or Polygon
    if isinstance(geom_shape, (MultiPolygon, Polygon)):
        centroid = geom_shape.centroid
    else:
        logging.warning(
            f"Skipping file with unsupported geometry type: {input_filepath}"
        )
        return None

    properties = data["properties"]
    identifier = properties["identifier"]["value"]
    id_value = ".".join(identifier.split(".")[1:])

    new_properties = {
        "id": properties["identifier"]["value"],
        "name": properties["name"],
        "alternateName": properties["alternateName"],
        "url": f"/datasetMetadata?otCollectionID=OT.{id_value}",
        "productAvailable": product_type,
    }

    return {
        "type": "Feature",
        "properties": new_properties,
        "geometry": {"type": "Point", "coordinates": [centroid.x, centroid.y]},
    }


def process_and_aggregate_geojson_files(source_dirs):
    """
    Process and aggregate GeoJSON files from multiple directories.

    Args:
        source_dirs (list): A list of tuples containing directory paths and product types.

    Returns:
        list: A list of GeoJSON features.
    """
    seen_files = {}
    all_features = []

    for source_dir, product_type in source_dirs:
        for root, _, files in os.walk(source_dir):
            for file in files:
                if file.endswith(".geojson"):
                    src_file_path = os.path.join(root, file)

                    if file in seen_files:
                        # File already processed, update the productAvailable field
                        existing_feature = seen_files[file]
                        existing_feature["properties"][
                            "productAvailable"
                        ] += f", {product_type}"
                    else:
                        # New file, process it
                        new_feature = process_geojson_file(src_file_path, product_type)
                        if new_feature:
                            seen_files[file] = new_feature
                            all_features.append(new_feature)
                            logging.info(f"Processed {file}")

    return all_features


def save_aggregated_results(output_filepath, all_features):
    """
    Save aggregated GeoJSON features to a file.

    Args:
        output_filepath (str): The path to the output file.
        all_features (list): A list of GeoJSON features.
    """
    feature_collection = {"type": "FeatureCollection", "features": all_features}

    os.makedirs(os.path.dirname(output_filepath), exist_ok=True)
    with open(output_filepath, "w", encoding="utf-8") as file:
        geojson.dump(feature_collection, file, indent=2)
    logging.info(f"Aggregated results saved to: {output_filepath}")


def main():
    """
    Main function to orchestrate the downloading, processing, and aggregation of GeoJSON files.
    """
    repo = "OpenTopography/Data_Catalog_Spatial_Boundaries"
    directories = {
        "OpenTopography_Raster": "open_topo_data/raster",
        "OpenTopography_Point_Cloud_Lidar": "open_topo_data/point_cloud",
    }
    timestamp_file = "last_commit.json"

    # Load the last known commit SHAs from the file
    if os.path.exists(timestamp_file):
        with open(timestamp_file, "r", encoding="utf-8") as file:
            last_commit = json.load(file)
    else:
        last_commit = {}

    updates_found = False

    for path, save_dir in directories.items():
        # Fetch the latest commit SHA for the specific folder
        latest_commit_sha = get_latest_commit_sha(repo, path)

        last_known_commit_sha = last_commit.get(path, "")

        # Check if there are new commits since the last known commit
        if latest_commit_sha and latest_commit_sha != last_known_commit_sha:
            logging.info(
                f"Repository folder '{path}' has been updated. Downloading new files..."
            )
            file_info = get_github_file_info(repo, path)
            download_files(file_info, save_dir)
            # Update the commit SHA file
            last_commit[path] = latest_commit_sha
            updates_found = True
        else:
            logging.info(f"No updates found for '{path}'.")

    if updates_found:
        # Save the updated commit SHAs to the timestamp file
        with open(timestamp_file, "w", encoding="utf-8") as file:
            json.dump(last_commit, file)

        # Process and aggregate GeoJSON files
        source_dirs = [
            ("open_topo_data/point_cloud", "Point Cloud Data"),
            ("open_topo_data/raster", "Raster"),
        ]
        output_filepath = "open_topo_data/center_view_data.geojson"

        all_features = process_and_aggregate_geojson_files(source_dirs)
        save_aggregated_results(output_filepath, all_features)


if __name__ == "__main__":
    # pylint: disable=too-many-nested-blocks
    main()
