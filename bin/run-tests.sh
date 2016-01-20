#!/bin/bash

###
# Run front-end tests
###

# Start Xvfb
test -e /tmp/.X99-lock
/usr/bin/Xvfb :99 &
xvfb=$!

export DISPLAY=:99.0

/portal/node_modules/.bin/karma start /portal/karma.conf.js --single-run

kill -TERM $xvfb
wait $xvfb
