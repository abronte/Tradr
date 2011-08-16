#!/bin/bash

if [ $# -eq 0 ]
then
	echo "server.sh start|stop|restart"
elif [ $1 == 'start' ]; then
	echo "Starting..."
	nohup node app.js > output.log &
	echo "Done."
elif [ $1 == "stop" ]; then
	echo "Stopping..."
	kill `pgrep node`
elif [ $1 == 'restart' ]; then
	echo "Stopping..."
	kill `pgrep node`
	sleep 1
	echo "Starting..."
	nohup node app.js > output.log &
	echo "Done."
fi