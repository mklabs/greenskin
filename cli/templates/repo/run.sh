#!/bin/sh


# Main script to run sitespeed script from a Jenkins workspace


DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
FILE_URLS=${FILE_URLS:-'urls.txt'}
WORKSPACE=${WORKSPACE:-$(pwd)}

GRAPHITE_PREFIX=${GRAPHITE_PREFIX:-'harsummary'}
GRAPHITE_SERVER=${GRAPHITE_SERVER:-'dc1-se-prod-admin-02.prod.dc1.kelkoo.net'}
GRAPHITE_PORT=${GRAPHITE_PORT:-'dc1-se-prod-admin-02.prod.dc1.kelkoo.net'}

# **Note**: Due to sitespeed.io generating XML instead of JSON for browsertime
# timings, we launch browsertime manually right after sitespeed.io while
# omitting the "-c <browser>" option.
# $DIR/sitespeed.io/bin/sitespeed.io -f $FILE_URLS -c chrome -a iphone  -k true
sh $DIR/sitespeed.io/bin/sitespeed.io -f $FILE_URLS -a iphone -k true

# Hopefully enough to get latest created sitespeed-result dir
LAST=$(ls sitespeed-result/urls.txt/ | tail -n 1)
HAR_DIR=sitespeed-result/urls.txt/$LAST/data/har
RESULT_FILE=sitespeed-result/urls.txt/$LAST/data/result.xml
HARS=$(ls $HAR_DIR)

for file in $HARS; do
  cp $HAR_DIR/$file /tmp/$file.json
  url=$(node -pe "require('/tmp/$file.json').log.pages[0].id");
  domain=$(node -pe "require('url').parse('$url').hostname");
  protocol=$(node -pe "require('url').parse('$url').protocol");
  filename=$(echo $file | sed 's/\.har$//')
  pathname=$(node -pe "require('url').parse('$url').pathname");

  if [[ $pathname == "/" ]]; then
    pathname="slash"
  fi

  # From HAR
  # python $DIR/harstatsgraphite.py -l $domain -p $GRAPHITE_PREFIX.har.$filename.$pathname /tmp/$file.json > /tmp/harstats.txt
  # cat /tmp/harstats.txt | nc $GRAPHITE_SERVER $GRAPHITE_PORT

  # From browsertime timings:

  # From sitespeed.io XML scores:
done

# Generate metrics
npm install
node $DIR/sitespeed-result-graphite.js $RESULT_FILE $GRAPHITE_PREFIX

