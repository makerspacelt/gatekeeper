#!/bin/bash


source ./config.sh

### root:x:0:0:root:/root:/bin/bash

function setup_remote_syslog()
{
	uci set system.@system[0].log_ip='192.168.1.254'
	uci set system.@system[0].log_proto='tcp'
	uci commit
}

function setup_cronjobs()
{
	echo > /etc/crontabs/root
	echo '*/2 * * * *  logread | grep -q "disabled by hub (EMI[?])" && sleep 70 && touch /etc/banner && logger -t MAGLOCK "EMI reboot" && sleep 5 && reboot' >> /etc/crontabs/root
	echo "*/5 * * * *  cd $ETC && export GIT_SSH_COMMAND='ssh -i /root/.ssh/id_rsa' && if [ -f db.json ]; then git pull; else git clone $DB_REPO .; fi && logger -t MAGLOCK space-db updated || logger -t MAGLOCK space-db update failed" >> /etc/crontabs/root
	echo >> /etc/crontabs/root

	/etc/init.d/cron enable
	/etc/init.d/cron start
}

function setup_gpio()
{
	for i in $GPIO_LED_RED $GPIO_LED_GREEN $GPIO_LED_BLUE $GPIO_BUZ $GPIO_USB $GPIO_MAG
	do
		echo -n $i:out...
		echo $i  2>/dev/null > /sys/class/gpio/export
		echo out 2>/dev/null > /sys/class/gpio/gpio$i/direction
		echo 0   2>/dev/null > /sys/class/gpio/gpio$i/value
	done
	for i in $GPIO_BTN
	do
		echo -n $i:in...
		echo $i 2>/dev/null > /sys/class/gpio/export
		echo in 2>/dev/null > /sys/class/gpio/gpio$i/direction
	done 
}

function setup_paths()
{
	rm -f $FIFO_FILE
	mkfifo $FIFO_FILE
}


echo -n 'setting up GPIO ...'
setup_gpio
echo


echo -n 'setting up paths ...'
setup_paths
echo


echo -n 'setting up remote logging ...'
setup_remote_syslog
echo


echo -n 'resetting usb ...'
echo -n 1 >/sys/class/gpio/gpio${GPIO_USB}/value
sleep 1
echo -n 0 >/sys/class/gpio/gpio${GPIO_USB}/value
sleep 3
echo


echo -n 'setting up cronjobs ...'
setup_cronjobs
echo


