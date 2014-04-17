# Cannot get ansible running (hang out, but Im on windows), Fallback on shell provisioning
# 
# yum install ansible python-setuptools -y
# echo localhost > /etc/ansible/hosts
# ansible-playbook /ansible/jenkins.yml --connection=local --verbose

# Iptables disable (Dev: should be required just on my boxes)
# service iptables save
# service iptables stop
# chkconfig iptables off

yum install wget -y

wget -O /tmp/epel-release-6-8.noarch.rpm http://dl.fedoraproject.org/pub/epel/6/i386/epel-release-6-8.noarch.rpm
rpm -Uvh /tmp/epel-release-6-8.noarch.rpm

wget -O /etc/yum.repos.d/jenkins.repo http://pkg.jenkins-ci.org/redhat/jenkins.repo
rpm --import http://pkg.jenkins-ci.org/redhat/jenkins-ci.org.key

yum install vim-enhanced java-1.6.0-openjdk httpd jenkins nodejs npm git -y

# Setup HTTP reverse proxy
cat /ansible/templates/apache.conf > /etc/httpd/conf.d/jenkins.conf
sed -i 's/JENKINS_ARGS=""/JENKINS_ARGS="--prefix=\/jenkins"/' /etc/sysconfig/jenkins
setsebool -P httpd_can_network_connect true

service jenkins start
chkconfig jenkins on

service httpd start
chkconfig httpd on

# Iptables disable (Dev: required just on my boxes)
service iptables save
service iptables stop
chkconfig iptables off

# Setup node app
cat /ansible/templates/node-init.d > /etc/init.d/r8_perf
chmod +x /etc/init.d/r8_perf

service r8_perf start
chkconfig r8_perf on

# Phantom

cd /tmp
wget https://bitbucket.org/ariya/phantomjs/downloads/phantomjs-1.9.7-linux-x86_64.tar.bz2
tar -xvf phantomjs-1.9.7-linux-x86_64.tar.bz2
cp -r phantomjs-1.9.7-linux-x86_64 /usr/lib/phantomjs
ln -s /usr/lib/phantomjs/bin/phantomjs /usr/bin/phantomjs

echo "Sleeping for 30s. TODO: Pool jenkins until ready instead. First startup can take some time."

# install plugins
sleep 30 # hopefully enough to let jenkins start things up
wget http://localhost:8080/jenkins/jnlpJars/jenkins-cli.jar

echo "Installing simple-theme plugin"
java -jar jenkins-cli.jar -s http://localhost:8080/jenkins install-plugin simple-theme-plugin jquery tap -restart
echo "Should be installed"
