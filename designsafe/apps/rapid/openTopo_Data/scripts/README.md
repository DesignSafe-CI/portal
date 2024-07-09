# OpenTopo Data Centerpoint Generator

This script downloads GeoJSON files from a specified GitHub repository, processes them to calculate the centroid for each geometry, and aggregates the results into a single GeoJSON file.

## Run

To install and run in a virtual environment:

1. Create a virtual environment:
   ```bash
   python -m venv venv
2. Activate the virtual environment:
    source venv/bin/activate
3. Install the required packages:
    pip install -r centerpoint_Requirements.txt
4. Run the script:
    python centerpoint_datagenerator.py

# Directory Structure

centerpoint_Requirements.txt: Contains the list of dependencies required by the script.
centerpoint_datagenerator.py: The main script that processes GeoJSON files.

# Description

The centerpoint_datagenerator.py script performs the following steps:

    1. Fetches the latest commit SHA for specified folders in a GitHub repository.
    2. Downloads the GeoJSON files from the repository if there are updates.
    3. Processes each GeoJSON file to calculate the centroid of the geometry.
    4. Aggregates the processed data into a single GeoJSON file.

# Notes

Make sure you have an active internet connection as the script fetches data from GitHub.
The script updates the last_commit.json file with the latest commit SHAs to avoid redundant downloads in subsequent runs.
