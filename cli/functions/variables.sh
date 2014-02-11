PERFITE_JENKINS_URL=${PERFITE_JENKINS_URL:-'http://192.168.33.11:8080'}
PERFITE_JENKINS_JOB_PATTERN=${PERFITE_JENKINS_JOB_PATTERN:-'poc_perf_$name'}

GRAPHITE_SERVER=${GRAPHITE_SERVER:-'192.168.33.33'}
GRAPHITE_PORT=${GRAPHITE_PORT:-'8125'}
GRAPHITE_PREFIX=${GRAPHITE_PREFIX:-'$name'}

# Curl options with Jenkins REST calls.
#
# If your Jenkins instance is protected using basic auth, set this to:
#
#    export JENKINS_CURL_OPTIONS="--user username:password"
JENKINS_CURL_OPTIONS=${JENKINS_CURL_OPTIONS:-''}

# Git
#
# TODO: Agree on top level Gitlab group. Create and use (instead of a bare repo created on jenkins slave)
GIT_REPOSITORY_PATTERN=${GIT_REPOSITORY_PATTERN:-'vagrant@192.168.33.30:repo.git'}
