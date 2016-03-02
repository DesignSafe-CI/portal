#!/usr/bin/env bash

python /portal/manage.py dumpdata \
    --natural-foreign --natural-primary \
    --exclude=cmsplugin_cascade.Segmentation \
    --exclude=admin.logentry \
    --exclude=cms.pageusergroup \
    --exclude=reversion > /datadump/datadump-`date +%Y%m%d`.json
