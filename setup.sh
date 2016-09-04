#!/bin/bash


source ./config.sh

### root:x:0:0:root:/root:/bin/bash

function setup_packages()
{
	updated=0
	packages="kmod-usb2 kmod-usb-uhci kmod-usb-ohci kmod-usb-hid usbutils   git-http bash wget ca-certificates   php5 php5-cli"
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

function setup_gpio()
{
	for i in $GPIO_LED_RED $GPIO_LED_GREEN $GPIO_LED_BLUE $GPIO_BUZ $GPIO_USB $GPIO_MAG
	do
		echo -n $i...
		echo $i  2>/dev/null > /sys/class/gpio/export
		echo out 2>/dev/null > /sys/class/gpio/gpio$i/direction
		echo 0   2>/dev/null > /sys/class/gpio/gpio$i/value
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



