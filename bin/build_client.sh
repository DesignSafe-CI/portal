#!/bin/bash -x
if [ "$1" == false ] ; then
    cd /srv/www/designsafe
    npm ci && npm run build
fi
