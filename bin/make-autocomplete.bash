#!/usr/bin/env bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
FILE="$DIR/../Makefile"
WORDS=`awk 'BEGIN { FS = ":.*?## " } /^[A-Za-z_\.\-%]+:/ { NF==2; print $1 }' ${FILE}`
complete -W "$WORDS" ds-mk
