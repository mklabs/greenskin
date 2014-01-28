#!/bin/sh

# Script meant to be run on a Jenkins Slave, as a kookel user.
#
# Generates a single HAR file for a single URL

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Jenkins Job Parameters
# PERF_PROXY=${PERF_PROXY:-'dc1-vt-dev-xen-01-vm-01.dev.dc1.kelkoo.net:3128'}
PERF_URL=${PERF_URL:-'http://www.kelkoo.fr'}
WORKSPACE=${WORKSPACE:-$(pwd)}

if [ -n "$PERF_PROXY" ]; then
    phantomjs --proxy="$PERF_PROXY" $DIR/netsniff.js $PERF_URL
else
    phantomjs $DIR/netsniff.js $PERF_URL
fi

