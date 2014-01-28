#!/bin/sh


# Main script to run
#
# 1. HAR generate to tmp file
# 2. Generates metrics via harstats graphite from HAR
# 3. Send to graphite


DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PERF_URLS=${PERF_URL:-'http://www.kelkoo.fr'}
WORKSPACE=${WORKSPACE:-$(pwd)}

GRAPHITE_PORT=2003
GRAPHITE_SERVER=dc1-se-prod-admin-02.prod.dc1.kelkoo.net

# For each URLs, generate a pair of screenshot, one for prod, one for
# testing env
for url in $PERF_URLS; do
  echo """
  Generating har for $url ...
  """;

  $DIR/har.sh > /tmp/har.json
  echo """
  Generating metrics from HAR file
  """;

  # Get domain from page ID
  domain=$(node -pe "require('url').parse('http://www.kelkoo.fr').hostname");

  # Generate metrics
  $DIR/harstatsgraphite.py -l $domain -p har.prod.homepage /tmp/har.json > /tmp/harstats.txt

  # And send to graphite
  cat /tmp/harstats.txt | nc $GRAPHITE_SERVER $GRAPHITE_PORT

done
