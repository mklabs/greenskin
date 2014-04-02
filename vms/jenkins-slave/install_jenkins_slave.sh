wget -O /tmp/epel-release-6-8.noarch.rpm http://dl.fedoraproject.org/pub/epel/6/i386/epel-release-6-8.noarch.rpm
rpm -Uvh /tmp/epel-release-6-8.noarch.rpm
yum install java-1.6.0-openjdk vim-enhanced java-1.6.0-openjdk git nodejs npm nc -y

# TODO: Setup X11 necessary lib to launch browsertime (https://gist.github.com/textarcana/5855427 / https://github.com/sitespeedio/sitespeed.io/issues/305)
# TODO: See docker thing http://function.fr/docker-with-chrome-and-selenium-and-firefox/
cd /tmp
wget https://bitbucket.org/ariya/phantomjs/downloads/phantomjs-1.9.7-linux-x86_64.tar.bz2
tar -xvf phantomjs-1.9.7-linux-x86_64.tar.bz2
cp -r phantomjs-1.9.7-linux-x86_64 /usr/lib/phantomjs
ln -s /usr/lib/phantomjs/bin/phantomjs /usr/bin/phantomjs

# For X11, not sure to keep it there
yum -y install firefox Xvfb libXfont Xorg
yum -y groupinstall "X Window System" "Desktop" "Fonts" "General Purpose Desktop"

cat << 'EOF' > /etc/init.d/xvfb
#!/bin/bash
#
# /etc/rc.d/init.d/xvfbd
#
# chkconfig: 345 95 28
# description: Starts/Stops X Virtual Framebuffer server
# processname: Xvfb
#

. /etc/init.d/functions

[ "${NETWORKING}" = "no" ] && exit 0

PROG="/usr/bin/Xvfb"
PROG_OPTIONS=":99 -screen 0 1280x1024x24"
PROG_OUTPUT="/tmp/Xvfb.out"

case "$1" in
    start)
        echo -n "Starting : X Virtual Frame Buffer "
        $PROG $PROG_OPTIONS>>$PROG_OUTPUT 2>&1 &
        disown -ar
        /bin/usleep 500000
        status Xvfb & >/dev/null && echo_success || echo_failure
        RETVAL=$?
        if [ $RETVAL -eq 0 ]; then
            /bin/touch /var/lock/subsys/Xvfb
            /sbin/pidof -o  %PPID -x Xvfb > /var/run/Xvfb.pid
        fi
        echo
   		;;
    stop)
        echo -n "Shutting down : X Virtual Frame Buffer"
        killproc $PROG
        RETVAL=$?
        [ $RETVAL -eq 0 ] && /bin/rm -f /var/lock/subsys/Xvfb
 /var/run/Xvfb.pid
        echo
        ;;
    restart|reload)
    	$0 stop
    	$0 start
        RETVAL=$?
      	;;
    status)
    	status Xvfb
    	RETVAL=$?
    	;;
    *)
     echo $"Usage: $0 (start|stop|restart|reload|status)"
     exit 1
esac

exit $RETVAL
EOF

# A bit of wtf ..
#
# In BrowserTime/Selenium/Webdriver: process 5239: D-Bus library appears
# to be incorrectly set up; failed to read machine uuid: Failed to open
# "/var/lib/dbus/machine-id": No such file or directory
dbus-uuidgen > /var/lib/dbus/machine-id

chmod +x /etc/init.d/xvfb
chkconfig xvfb on
