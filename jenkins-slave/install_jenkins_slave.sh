wget -O /tmp/epel-release-6-8.noarch.rpm http://dl.fedoraproject.org/pub/epel/6/i386/epel-release-6-8.noarch.rpm
rpm -Uvh /tmp/epel-release-6-8.noarch.rpm
yum install java-1.6.0-openjdk vim-enhanced java-1.6.0-openjdk git nodejs npm -y