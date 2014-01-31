#!/bin/sh


# Main script to run sitespeed script from a Jenkins workspace


DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
FILE_URLS=${FILE_URLS:-'data/urls-simple-measure.txt'}
WORKSPACE=${WORKSPACE:-$(pwd)}

GRAPHITE_PORT=2003
GRAPHITE_SERVER=dc1-se-prod-admin-02.prod.dc1.kelkoo.net

# TODO: Test timings with Chrome / FF on slave with XVBF
# $DIR/sitespeed.io/bin/sitespeed.io -f $FILE_URLS -c chrome -a iphone  -k true
$DIR/sitespeed.io/bin/sitespeed.io -f $FILE_URLS -a iphone -k true
