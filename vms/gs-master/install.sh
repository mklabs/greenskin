
yum install -y wget vim

cd /tmp

wget http://dl.fedoraproject.org/pub/epel/6/x86_64/epel-release-6-8.noarch.rpm
rpm -Uvh epel-release-6*.rpm

cd

# Install docker

yum install docker-io -y
service docker start

# Dockerized Jenkins
# docker run --name jenkins -d -p 8080:8080 aespinosa/jenkins

# Install node / npm (for running jobs on master, without slaves)

yum install nodejs npm -y

# https://github.com/crosbymichael/dockerui
# docker build -t crosbymichael/dockerui github.com/crosbymichael/dockerui
# docker run -d -p 9000:9000 -v /var/run/docker.sock:/docker.sock crosbymichael/dockerui -e /docker.sock


# # Dockerized nodeapp
# docker build --rm -t greenskin/nodeapp /opt/kookel/greenskin
# docker run -v /opt/kookel/greenskin:/opt/kookel/greenskin \
#   --name nodeapp -d -p 3000:3000 -p 8125:8125 greenskin/nodeapp

# Setup base path to /jenkins, maps our reverse proxy setup
#
# yum install httpd java-1.6.0-openjdk jenkins docker-io -y
# sed -i 's/JENKINS_ARGS=""/JENKINS_ARGS="--prefix=\/jenkins"/' /etc/sysconfig/jenkins

# greenskin ci (jenkins)
#
# docker build -t gs/gs-ci /opt/kookel/provisioning/jenkins
# docker run -name="gs-ci" -d -p 8080:8080 gs/gs-ci
# cat /opt/kookel/provisioning/templates/apache.conf > /etc/httpd/conf.d/greenskin.conf
