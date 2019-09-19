#!/bin/bash
exec nginx -g "daemon off;" | gawk -f /tmp/colorize_logs.awk --
