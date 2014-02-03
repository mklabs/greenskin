PERFITE_JENKINS_URL=${PERFITE_JENKINS_URL:-'http://jenkins.corp.kelkoo.net:8080'}
PERFITE_JENKINS_JOB_PATTERN=${PERFITE_JENKINS_JOB_PATTERN:-'poc_perf_$name'}

# GRAPHITE_SERVER=${GRAPHITE_SERVER:-'192.168.33.33'}
GRAPHITE_SERVER=${GRAPHITE_SERVER:-'dc1-se-prod-admin-02.prod.dc1.kelkoo.net'}
GRAPHITE_PORT=${GRAPHITE_PORT:-'2003'}
GRAPHITE_PREFIX=${GRAPHITE_PREFIX:-'$name'}

# Curl options with Jenkins REST calls.
#
# If your Jenkins instance is protected using basic auth, set this to:
#
#    export JENKINS_CURL_OPTIONS="--user username:password"
JENKINS_CURL_OPTIONS=${JENKINS_CURL_OPTIONS:-''}

# Git
#
# TODO: Agree on top level Gitlab group. Create and use (instead of
# mine)
GIT_REPOSITORY_PATTERN=${GIT_REPOSITORY_PATTERN:-'git@dc1-r8-corp-gitlab-01.corp.dc1.kelkoo.net:mickael.daniel\/$name.git'}
