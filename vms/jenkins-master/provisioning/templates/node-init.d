#!/bin/sh
 
#
# chkconfig: 35 99 99
# description: Node.js /opt/kookel/r8_perf/app.js
#
 
. /etc/rc.d/init.d/functions
 
# XXX Change that
USER="vagrant"
 
DAEMON="/usr/bin/node"
ROOT_DIR="/opt/kookel/r8_perf"
 
SERVER="$ROOT_DIR/app.js"
LOG_FILE="$ROOT_DIR/log/app.log"
 
LOCK_FILE="/var/lock/subsys/r8_perf"
 
do_start()
{
        if [ ! -f "$LOCK_FILE" ] ; then
                echo -n $"Starting $SERVER: "
                runuser -l "$USER" -c "DEBUG=* $DAEMON $SERVER >>$LOG_FILE 2>&1 &" && echo_success || echo_failure
                RETVAL=$?
                echo
                [ $RETVAL -eq 0 ] && touch $LOCK_FILE
        else
                echo "$SERVER is locked."
                RETVAL=1
        fi
}
do_stop()
{
        echo -n $"Stopping $SERVER: "
        pid=`ps -aefw | grep "DEBUG=* $DAEMON $SERVER" | grep -v " grep " | awk '{print $2}'`
        kill -9 $pid > /dev/null 2>&1 && echo_success || echo_failure
        RETVAL=$?
        echo
        [ $RETVAL -eq 0 ] && rm -f $LOCK_FILE
}
do_status()
{
        echo -n $"Status $SERVER: "
        pid=`ps -aefw | grep "$DAEMON $SERVER" | grep -v " grep " | awk '{print $2}'`
        echo -n "PID: $pid"
        echo 
}
 
case "$1" in
        start)
                do_start
                ;;
        stop)
                do_stop
                ;;
        status)
                do_status
                ;;
        restart)
                do_stop
                do_start
                ;;
        *)
                echo "Usage: $0 {start|stop|restart}"
                RETVAL=1
esac
 
exit $RETVAL