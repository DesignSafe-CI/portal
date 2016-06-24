#!/usr/bin/env bash

VERSION=$1

if [ -z "$VERSION" ]
then
    echo "Usage: opbeat_release.sh <version>"
    exit 1
fi

curl https://intake.opbeat.com/api/v1/organizations/$OPBEAT_ORGANIZATION/apps/$OPBEAT_APP/releases/ \
    -H "Authorization: Bearer $OPBEAT_TOKEN" \
    -d rev=`git log -n 1 --pretty=format:%H` \
    -d branch=$VERSION \
    -d status=completed
