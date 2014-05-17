rpm -Uvh http://download.fedoraproject.org/pub/epel/6/i386/epel-release-6-8.noarch.rpm

# TODO
#
# - Replace Apache reverse proxy by hipache
# - figure out config management (port, bind adress etc.)

# cat /opt/kookel/provisioning/templates/upstart.conf > /etc/init/hipache.conf
# cat /opt/kookel/provisioning/templates/hipache-config.json > /opt/kookel/hipache-config.json
yum install httpd java-1.6.0-openjdk jenkins docker-io -y

# Setup base path to /jenkins, maps our reverse proxy setup
sed -i 's/JENKINS_ARGS=""/JENKINS_ARGS="--prefix=\/jenkins"/' /etc/sysconfig/jenkins

service docker start
chkconfig docker on

service httpd start
chkconfig httpd on

service jenkins start
chkconfig jenkins on

# https://github.com/crosbymichael/dockerui
docker build -t crosbymichael/dockerui github.com/crosbymichael/dockerui
docker run -d -p 9000:9000 -v /var/run/docker.sock:/docker.sock crosbymichael/dockerui -e /docker.sock

# greenskin node
docker build -t gs/gs-node /opt/kookel/greenskin
docker run --name="gs-node" -d -p 3000:3000 -p 8125:8125 gs/gs-node

# greenskin ci (jenkins)
#
# TODO: Mine not working :( Cannot get container running, jenkins starts
# but doesnt start
#
# docker build -t gs/gs-ci /opt/kookel/provisioning/jenkins
# docker run -name="gs-ci" -d -p 8080:8080 gs/gs-ci

# Setup HTTP reverse proxy (to replace by hipache, we need websocket
# support and its the best tool for proxying over docker containers)
cat /opt/kookel/provisioning/templates/apache.conf > /etc/httpd/conf.d/greenskin.conf
