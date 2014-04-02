wget -O /tmp/epel-release-6-8.noarch.rpm http://dl.fedoraproject.org/pub/epel/6/i386/epel-release-6-8.noarch.rpm
rpm -Uvh /tmp/epel-release-6-8.noarch.rpm

wget -O /etc/yum.repos.d/jenkins.repo http://pkg.jenkins-ci.org/redhat/jenkins.repo
rpm --import http://pkg.jenkins-ci.org/redhat/jenkins-ci.org.key

yum install java-1.6.0-openjdk jenkins git -y
service jenkins start
chkconfig jenkins on

# Iptables disable (Dev: required just on my boxes)
service iptables save
service iptables stop
chkconfig iptables off

# install plugins
sleep 10 # hopefully enough to let jenkins start things up
wget http://localhost:8080/jnlpJars/jenkins-cli.jar

echo "Installing Git plugin"
java -jar jenkins-cli.jar -s http://localhost:8080/ install-plugin git -restart
echo "Should be installed"
