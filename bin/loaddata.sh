#!/usr/bin/env bash

DATE=`date +%Y%m%d`
echo "Flushing current database..."
python /portal/manage.py flush --no-initial-data
echo "Loading data from file datadump-`date +%Y%m%d`.json..."
python /portal/manage.py loaddata /datadump/datadump-${DATE}.json
echo "Copying db.sqlite3 out of container..."
cp db.sqlite3 /datadump/db-${DATE}.sqlite3
echo "Done!"
