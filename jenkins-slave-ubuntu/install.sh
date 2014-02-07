

apt-get -y update
apt-get install -y -q software-properties-common wget python-software-properties
add-apt-repository -y ppa:mozillateam/firefox-next
add-apt-repository -y ppa:chris-lea/node.js

apt-get -y update
wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add -
echo "deb http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google.list
apt-get update -y

# fix https://code.google.com/p/chromium/issues/detail?id=318548
mkdir -p /usr/share/desktop-directories
apt-get install -y -q firefox google-chrome-beta openjdk-7-jre-headless nodejs
apt-get install -y -q x11vnc xvfb
apt-get install -y -q xfonts-100dpi xfonts-75dpi xfonts-scalable xfonts-cyrillic
apt-get install -y git vim curl unzip

# Chromedriver

whoami
pwd
wget http://chromedriver.storage.googleapis.com/2.9/chromedriver_linux64.zip
unzip chromedriver_linux64.zip
cp chromedriver /usr/bin/chromedriver
chmod 755 /usr/bin/chromedriver

# Phantom


# cd /tmp
# wget https://bitbucket.org/ariya/phantomjs/downloads/phantomjs-1.9.7-linux-x86_64.tar.bz2
# tar -xvf phantomjs-1.9.7-linux-x86_64.tar.bz2
# cp -r phantomjs-1.9.7-linux-x86_64 /usr/lib/phantomjs
# ln -s /usr/lib/phantomjs/bin/phantomjs /usr/bin/phantomjs


# Xfvb

cat << 'EOF' > /etc/init.d/xvfb
### BEGIN INIT INFO
# Provides: Xvfb
# Required-Start: $local_fs $remote_fs
# Required-Stop:
# X-Start-Before:
# Default-Start: 2 3 4 5
# Default-Stop: 0 1 6
# Short-Description: Loads X Virtual Frame Buffer
### END INIT INFO
 
XVFB=/usr/bin/Xvfb
XVFBARGS=":99 -screen 0 1024x768x24 -ac +extension GLX +render -noreset"
PIDFILE=/var/run/xvfb.pid
case "$1" in
  start)
    echo -n "Starting virtual X frame buffer: Xvfb"
    start-stop-daemon --start --quiet --pidfile $PIDFILE --make-pidfile --background --exec $XVFB -- $XVFBARGS
    echo "."
    ;;
  stop)
    echo -n "Stopping virtual X frame buffer: Xvfb"
    start-stop-daemon --stop --quiet --pidfile $PIDFILE
    echo "."
    ;;
  restart)
    $0 stop
    $0 start
    ;;
  *)

	echo "Usage: /etc/init.d/xvfb {start|stop|restart}"
	exit 1
esac
 
exit 0
EOF

chmod +x /etc/init.d/xvfb
update-rc.d xvfb defaults
service xvfb start