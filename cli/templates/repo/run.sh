#!/bin/bash


# Main script to run sitespeed script from a Jenkins workspace

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
FILE_URLS=${FILE_URLS:-'urls.txt'}
WORKSPACE=${WORKSPACE:-$(pwd)}

GRAPHITE_PREFIX=${GRAPHITE_PREFIX:-'harsummary'}
# GRAPHITE_SERVER=${GRAPHITE_SERVER:-'dc1-se-prod-admin-02.prod.dc1.kelkoo.net'}
GRAPHITE_SERVER=${GRAPHITE_SERVER:-'192.168.33.33'}
GRAPHITE_PORT=${GRAPHITE_PORT:-'8125'}

export DISPLAY=:99.0
# TODO: Handle Xvfb deamon ?
$DIR/sitespeed.io/bin/sitespeed.io -f $FILE_URLS -a iphone -c firefox,chrome

# Hopefully enough to get latest created sitespeed-result dir
LAST=$(ls sitespeed-result/urls.txt/ | tail -n 1)
HAR_DIR=sitespeed-result/urls.txt/$LAST/data/har
RESULT_FILE=sitespeed-result/urls.txt/$LAST/data/result.xml

# Generate metrics
npm install
node $DIR/sitespeed-result-graphite.js $RESULT_FILE $GRAPHITE_PREFIX $GRAPHITE_SERVER > /tmp/metrics.txt

# Split every 10 lines, to send smaller packets
rm -rf /tmp/metrics
mkdir -p /tmp/metrics
split -l 10 /tmp/metrics.txt /tmp/metrics/
FILES=$(ls /tmp/metrics)

for file in $FILES; do
  echo "Sending /tmp/metrics/$file";
  cat /tmp/metrics/$file
  cat /tmp/metrics/$file | nc -w 1 -u $GRAPHITE_SERVER $GRAPHITE_PORT
done
