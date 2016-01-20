#!/bin/bash

###
# Run front-end tests
###

# Start Xvfb
test -e /tmp/.X99-lock
/usr/bin/Xvfb :99 &
xvfb=$!

export DISPLAY=:99.0

/portal/designsafe/apps/workspace/node_modules/.bin/karma start /portal/designsafe/apps/workspace/karma.conf.js --single-run

kill -TERM $xvfb
wait $xvfb
