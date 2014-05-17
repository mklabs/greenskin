# DOCKER-VERSION 0.3.4
FROM    centos:6.4

RUN yum -y install wget
RUN wget -O /etc/yum.repos.d/jenkins.repo http://pkg.jenkins-ci.org/redhat/jenkins.repo
RUN rpm --import http://pkg.jenkins-ci.org/redhat/jenkins-ci.org.key
RUN yum install yum install java-1.6.0-openjdk jenkins -y

# Setup base path to /jenkins, maps our reverse proxy setup
RUN sed -i 's/JENKINS_ARGS=""/JENKINS_ARGS="--prefix=\/jenkins"/' /etc/sysconfig/jenkins

EXPOSE 8080
CMD service jenkins start

