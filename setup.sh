#!/bin/bash


source ./config.sh

### root:x:0:0:root:/root:/bin/bash

function setup_packages()
{
	updated=0
	packages="kmod-usb2 kmod-usb-uhci kmod-usb-ohci kmod-usb-hid usbutils   git-http bash coreutils-sleep procps-ng-pkill wget ca-certificates   php5 php5-cli  lua luci-lib-jsonc"
	for package in $packages
	do
		if opkg list-installed | grep "^$package "
		then
			continue
		fi
		if [ $updated -eq 0 ]
		then
			opkg update
			updated=1
		fi
		opkg install $package
	done
}

function setup_wifi()
{
	echo TODO
}

function setup_remote_syslog()
{
	uci set system.@system[0].log_ip='192.168.2.2'
	uci set system.@system[0].log_proto='tcp'
	uci commit
}

function setup_cronjobs()
{
	echo '*/2 * * * *  logread | grep -q "disabled by hub (EMI[?])" && sleep 70 && touch /etc/banner && logger -t MAGLOCK "EMI reboot" && sleep 5 && reboot' > /etc/crontabs/root
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

	mkdir -p $CARD_PATH
	mkdir -p $USER_PATH
}


echo -n 'setting up packages ...'
setup_packages
echo


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


