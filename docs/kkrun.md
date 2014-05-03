
## ssh kkspeed01

First install

TODO: Ansible playbook

```
ssh kkspeed01
sudo su - kookel
git clone git@gitlab.corp.kelkoo.net:mickael.daniel/perfite.git /opt/kookel/r8_perf

# TODO: Relies on tag instead of dev-branch
cd /opt/kookel/r8_perf
git checkout -b dev-server origin/dev-server

# Install node deps
cd /opt/kookel/r8_perf
npm i

# Setup HTTP reverse proxy
cat provisioning/templates/apache.conf > /etc/httpd/conf.d/jenkins.conf
sed -i 's/JENKINS_ARGS=""/JENKINS_ARGS="--prefix=\/jenkins"/' /etc/sysconfig/jenkins
setsebool -P httpd_can_network_connect true

# Make sure the init.d script is Okay. Change user="" namely
cat provisioning/templates/node-init.d > /etc/init.d/r8_perf
chmod +x /etc/init.d/r8_perf

service r8_perf start
chkconfig r8_perf on

service jenkins start
chkconfig jenkins on

service httpd start
chkconfig httpd on

# Phantom

cd /tmp
wget https://bitbucket.org/ariya/phantomjs/downloads/phantomjs-1.9.7-linux-x86_64.tar.bz2
tar -xvf phantomjs-1.9.7-linux-x86_64.tar.bz2
cp -r phantomjs-1.9.7-linux-x86_64 /usr/lib/phantomjs
ln -s /usr/lib/phantomjs/bin/phantomjs /usr/bin/phantomjs

```

Wait for Jenkins to startup, and install plugins:

```
cd /tmp
wget http://localhost:8080/jenkins/jnlpJars/jenkins-cli.jar

echo "Installing simple-theme plugin"
java -jar jenkins-cli.jar -s http://localhost:8080/jenkins install-plugin simple-theme-plugin jquery tap -restart
echo "Should be installed"
```

