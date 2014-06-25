FROM    centos:6.4

# Enable EPEL for Node.js
RUN     wget http://dl.fedoraproject.org/pub/epel/6/x86_64/epel-release-6-8.noarch.rpm
RUN     rpm -Uvh epel-release-6*.rpm

# Install packages
RUN     yum install -y nodejs npm git
RUN     yum install -y ImageMagick GraphicsMagick

# Bundle app source
# ADD . /opt/kookel/greenskin

VOLUME ["/opt/kookel/greenskin"]

# Install app dependencies (second one should go away, by publishing to npm)
RUN cd /opt/kookel/greenskin; npm install
RUN cd /opt/kookel/greenskin/plugins/phantomas; npm install

EXPOSE  3000
EXPOSE  8125

CMD ["node", "/opt/kookel/greenskin/bin/www"]
